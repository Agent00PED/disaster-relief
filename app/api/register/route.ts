import { createClient } from '@supabase/supabase-js'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { isValidBirthDate } from '@/lib/birth-date'

const maxPhotoSize = 3 * 1024 * 1024
const fail = (error: string, status = 400) => Response.json({ error }, { status })

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return fail('invalid', 403)
  if (Number(request.headers.get('content-length')) > maxPhotoSize + 64 * 1024) return fail('photo', 413)

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return fail('configuration', 503)
  const storageClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  let uploadedPath: string | null = null
  let registered = false
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
      || !/^\+?[0-9]{9,15}$/.test(phone)
      || !isValidBirthDate(birthDate)
      || !username || username.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || password.length < 6 || !/^[0-9a-f-]{36}$/i.test(centerId)) return fail('invalid')

    const photo = form.get('identity_photo')
    if (!(photo instanceof File) || !photo.size || photo.size > maxPhotoSize) return fail('photo')
    const bytes = Buffer.from(await photo.arrayBuffer())
    const type = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? 'image/jpeg'
      : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'image/png'
        : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp' : null
    if (!type || photo.type !== type) return fail('photo')

    const supabase = await createSessionClient()
    const { data: center } = await supabase.from('centers').select('id').eq('id', centerId).eq('is_active', true).maybeSingle()
    if (!center) return fail('invalid')
    const path = `${crypto.randomUUID()}.${type === 'image/jpeg' ? 'jpg' : type.split('/')[1]}`
    const { error: uploadError } = await storageClient.storage.from('identity-photos').upload(path, bytes, { contentType: type })
    if (uploadError) return fail('upload', 503)
    uploadedPath = path

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: {
        first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`,
        phone, birth_date: birthDate, birth_year: Number(birthDate.slice(0, 4)) + 543, identity_photo_path: path,
        username, role: 'volunteer', center_id: centerId,
      } },
    })
    if (error) {
      return fail(error.message.includes('already registered') ? 'alreadyRegistered'
        : /duplicate|unique/.test(error.message) ? 'usernameTaken' : 'registration')
    }
    // Supabase can return an obfuscated user for an existing confirmed account.
    registered = Boolean(data.user && data.user.identities?.length)
    return Response.json({ success: true })
  } catch {
    return fail('registration', 500)
  } finally {
    if (uploadedPath && !registered) {
      await storageClient.storage.from('identity-photos').remove([uploadedPath]).catch(() => {})
    }
  }
}
