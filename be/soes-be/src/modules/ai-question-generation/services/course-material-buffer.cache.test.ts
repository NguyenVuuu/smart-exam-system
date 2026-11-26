import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadCourseMaterialBuffer } from './course-material-buffer.cache'

test('reuses an unchanged course material and reloads it after its checksum changes', async () => {
  let downloads = 0
  const download = async () => Buffer.from(`version-${++downloads}`)
  const path = 'course-materials/cache-test.pdf'

  assert.equal((await loadCourseMaterialBuffer(path, 'checksum-a', download)).toString(), 'version-1')
  assert.equal((await loadCourseMaterialBuffer(path, 'checksum-a', download)).toString(), 'version-1')
  assert.equal((await loadCourseMaterialBuffer(path, 'checksum-b', download)).toString(), 'version-2')
  assert.equal(downloads, 2)
})

test('materials without a checksum are downloaded each time', async () => {
  let downloads = 0
  const download = async () => Buffer.from(`version-${++downloads}`)
  const path = 'course-materials/no-checksum-test.pdf'

  await loadCourseMaterialBuffer(path, null, download)
  await loadCourseMaterialBuffer(path, null, download)
  assert.equal(downloads, 2)
})

test('concurrent cache misses share one download and a failed download can be retried', async () => {
  let downloads = 0
  const path = 'course-materials/concurrent.pdf'
  const download = async () => {
    downloads += 1
    await new Promise(resolve => setTimeout(resolve, 20))
    return Buffer.from('shared')
  }
  const buffers = await Promise.all(Array.from({ length: 20 }, () => loadCourseMaterialBuffer(path, 'one', download)))
  assert.equal(downloads, 1)
  assert.ok(buffers.every(buffer => buffer === buffers[0]))
  await assert.rejects(loadCourseMaterialBuffer(path, 'two', async () => { throw new Error('download failed') }))
  assert.equal((await loadCourseMaterialBuffer(path, 'two', download)).toString(), 'shared')
  assert.equal(downloads, 2)
})
