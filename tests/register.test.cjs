const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function setup(options = {}) {
  const calls = []
  const query = {
    select() { return this }, eq() { return this },
    async maybeSingle() { return { data: { id: 'center' } } },
    update(value) { calls.push(['profile', value]); return this },
    async single() { return options.profileError ? { error: {} } : { data: { id: 'user-id' } } },
  }
  const client = {
    from: () => query,
    auth: { async signUp(value) {
      calls.push(['signup', value])
      return { data: { user: { id: 'user-id', identities: options.duplicate ? [] : [{}] } }, error: options.signupError ? { message: 'failure' } : null }
    } },
    storage: { from(bucket) {
      assert.equal(bucket, 'volunteer-ids')
      return {
        async upload(path) { calls.push(['upload', path]); return { error: options.uploadError ? {} : null } },
        async remove(paths) { calls.push(['remove', paths]); return { error: null } },
      }
    } },
  }
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/register/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, require(name) {
      if (name === '@/lib/birth-date') return { isValidBirthDate: () => true }
      return { createClient: () => client }
    },
    Request, Response, File, Buffer, URL, crypto: globalThis.crypto, console,
    process: { env: options.noKey ? {} : { SUPABASE_SERVICE_ROLE_KEY: 'test-only' } },
  })
  return { calls, async run(photo) {
    const form = new FormData()
    for (const [key, value] of Object.entries({ first_name: 'A', last_name: 'B', phone: '0812345678', birth_date: '2000-01-01', username: 'test', email: 'test@example.com', password: 'secret', center_id: '11111111-1111-1111-1111-111111111111' })) form.set(key, value)
    if (photo) form.set('identity_photo', photo)
    const response = await exports.POST(new Request('http://localhost/api/register', { method: 'POST', headers: { origin: 'http://localhost' }, body: form }))
    return { status: response.status, body: await response.json() }
  } }
}
const jpg = () => new File([new Uint8Array([255, 216, 255, 0])], 'photo.jpg', { type: 'image/jpeg' })
test('no photo or empty browser file can register without service key', async () => {
  for (const photo of [undefined, new File([], '')]) {
    const s = setup({ noKey: true }); assert.equal((await s.run(photo)).status, 200)
    assert.deepEqual(s.calls.map(c => c[0]), ['signup'])
    assert.equal(s.calls[0][1].options.data.role, 'volunteer')
    assert.equal(s.calls[0][1].options.data.birth_year, 2543)
  }
})
test('photo goes under user ID and profile uses shared column', async () => {
  const s = setup(); assert.deepEqual((await s.run(jpg())).body, { success: true })
  assert.deepEqual(s.calls.map(c => c[0]), ['signup', 'upload', 'profile'])
  assert.match(s.calls[1][1], /^user-id\/.+\.jpg$/)
  assert.equal(s.calls[2][1].id_photo_path, s.calls[1][1])
})
test('PDF and spoofed MIME fail before signup', async () => {
  for (const type of ['application/pdf', 'image/jpeg']) {
    const s = setup(); assert.equal((await s.run(new File(['%PDF-1.7'], 'bad.jpg', { type }))).status, 400)
    assert.equal(s.calls.length, 0)
  }
})
test('photo configuration failure happens before signup', async () => {
  const s = setup({ noKey: true }); assert.equal((await s.run(jpg())).status, 503); assert.equal(s.calls.length, 0)
})
test('duplicate and rejected signup never touch storage', async () => {
  for (const options of [{ duplicate: true }, { signupError: true }]) {
    const s = setup(options); await s.run(jpg()); assert.deepEqual(s.calls.map(c => c[0]), ['signup'])
  }
})
test('upload failure explains recovery without deleting an account or existing photo', async () => {
  const s = setup({ uploadError: true }); assert.equal((await s.run(jpg())).body.photoUploadFailed, true)
  assert.deepEqual(s.calls.map(c => c[0]), ['signup', 'upload'])
})
test('failed profile write cleans up its upload and explains recovery', async () => {
  const s = setup({ profileError: true }); assert.equal((await s.run(jpg())).body.photoUploadFailed, true)
  assert.deepEqual(s.calls.map(c => c[0]), ['signup', 'upload', 'profile', 'remove'])
  assert.equal(s.calls[3][1][0], s.calls[1][1])
})
