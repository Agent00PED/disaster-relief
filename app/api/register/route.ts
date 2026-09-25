import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { isValidBirthDate } from '@/lib/birth-date'

const maxPhotoSize = 3 * 1024 * 1024
const fail = (error: string, status = 400) => Response.json({ error }, { status })

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return fail('invalid', 403)
  if (Number(request.headers.get('content-length')) > maxPhotoSize + 64 * 1024) return fail('photo', 413)

  let uploadedPath: string | null = null
  let photoSaved = false
  let storageClient: SupabaseClient | null = null
  let accountCreated = false
  try {
    const form = await request.formData()
    const value = (key: string) => String(form.get(key) ?? '').trim()
    const firstName = value('first_name')
    const lastName = value('last_name')
    const phone = value('phone').replace(/[\s()-]/g, '')
    const birthDate = value('birth_date')
    const username = value('username')
    const email = value('email')
    const password = String(form.get('password') ?? '')
    const centerId = value('center_id')
    if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100
      || !/^[0-9]{10}$/.test(phone)
      || !isValidBirthDate(birthDate)
      || !username || username.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || password.length < 6 || !/^[0-9a-f-]{36}$/i.test(centerId)) return fail('invalid')

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const photo = form.get('identity_photo')
    if (photo !== null && photo !== '' && !(photo instanceof File)) return fail('photo')
    const hasPhoto = photo instanceof File && (photo.size > 0 || photo.name !== '')
    let bytes: Buffer | null = null
    let type: string | null = null
    if (hasPhoto) {
      if (!photo.size || photo.size > maxPhotoSize) return fail('photo')
      bytes = Buffer.from(await photo.arrayBuffer())
      type = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? 'image/jpeg'
        : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'image/png'
          : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp' : null
      if (!type || photo.type !== type) return fail('photo')
      if (!serviceKey) return fail('configuration', 503)
      storageClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    }

    const supabase = await createSessionClient()
    const { data: center } = await supabase.from('centers').select('id').eq('id', centerId).eq('is_active', true).maybeSingle()
    if (!center) return fail('invalid')

    if (typeof supabase.rpc === 'function') {
      const { data: existingEmail } = await supabase.rpc('get_email_by_username', { p_username: username })
      if (existingEmail) return fail('usernameTaken')
    }

    let { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: {
        first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`,
        phone, birth_date: birthDate, birth_year: Number(birthDate.slice(0, 4)) + 543,
        username, role: 'volunteer', center_id: centerId,
      } },
    })

    if (error && (error.message?.includes('rate limit') || (error as { code?: string }).code === 'over_email_send_rate_limit') && serviceKey) {
      const adminClient = storageClient ?? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      storageClient = adminClient
      const adminRes = await adminClient.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: {
          first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`,
          phone, birth_date: birthDate, birth_year: Number(birthDate.slice(0, 4)) + 543,
          username, role: 'volunteer', center_id: centerId,
        }
      })
      if (!adminRes.error && adminRes.data?.user) {
        data = { user: adminRes.data.user, session: null }
        error = null
      } else if (adminRes.error) {
        error = adminRes.error
      }
    }

    if (error) {
      return fail(error.message.includes('already registered') || /already.*registered/i.test(error.message) ? 'alreadyRegistered'
        : /duplicate|unique/.test(error.message) || error.message.includes('Database error') ? 'usernameTaken' : 'registration')
    }
    // Supabase can return an obfuscated user for an existing confirmed account.
    if (!data.user || !data.user.identities?.length) return Response.json({ success: true })
    accountCreated = true
    if (storageClient && bytes && type) {
      const path = `${data.user.id}/${crypto.randomUUID()}.${type === 'image/jpeg' ? 'jpg' : type.split('/')[1]}`
      uploadedPath = path
      const { error: uploadError } = await storageClient.storage.from('volunteer-ids')
        .upload(path, bytes, { contentType: type })
      if (uploadError) {
        // A conflict may be an existing account's photo. Never delete it.
        uploadedPath = null
        return Response.json({ success: true, photoUploadFailed: true })
      }
      const { data: profile, error: profileError } = await storageClient.from('profiles')
        .update({ id_photo_path: path }).eq('id', data.user.id).select('id').single()
      if (profileError || !profile) return Response.json({ success: true, photoUploadFailed: true })
      photoSaved = true
    }
    return Response.json({ success: true })
  } catch {
    // Photo upload is optional: keep a successfully created account and explain recovery.
    return accountCreated ? Response.json({ success: true, photoUploadFailed: true })
      : fail('registration', 500)
  } finally {
    if (uploadedPath && !photoSaved && storageClient) {
      try {
        const { error } = await storageClient.storage.from('volunteer-ids').remove([uploadedPath])
        if (error) console.error('Registration photo cleanup failed')
      } catch {
        console.error('Registration photo cleanup failed')
      }
    }
  }
}
