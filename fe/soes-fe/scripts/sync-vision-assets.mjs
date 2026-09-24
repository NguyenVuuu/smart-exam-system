import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const source = dirname(require.resolve('@mediapipe/tasks-vision'))
const destination = fileURLToPath(new URL('../public/mediapipe/', import.meta.url))
await mkdir(join(destination, 'wasm'), { recursive: true })
async function syncAsset(from, to) {
  const incoming = await readFile(from)
  const existing = await readFile(to).catch((error) => {
    if (error.code === 'ENOENT') return null
    throw error
  })
  if (existing && (incoming.equals(existing) || (to.endsWith('.js') &&
    incoming.toString().replace(/\r\n/g, '\n') === existing.toString().replace(/\r\n/g, '\n')))) return
  await copyFile(from, to)
}
await syncAsset(join(source, 'vision_bundle.js'), join(destination, 'vision_bundle.js'))
for (const name of ['vision_wasm_internal', 'vision_wasm_nosimd_internal']) {
  for (const extension of ['js', 'wasm']) {
    await syncAsset(join(source, 'wasm', `${name}.${extension}`), join(destination, 'wasm', `${name}.${extension}`))
  }
}
