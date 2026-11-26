import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const env = {
  ...process.env,
  DATABASE_URL: 'postgresql://unused:unused@127.0.0.1:1/unused',
  TEST_DATABASE_URL: '',
  REDIS_URL: 'redis://127.0.0.1:1',
}
delete env.FACE_INTEGRATION_TEST

const files = readdirSync('src', { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.test.ts') && !entry.name.endsWith('.postgres.test.ts'))
  .map(entry => join(entry.parentPath, entry.name))
if (!files.length) throw new Error('No backend unit tests found')

const execution = spawnSync(process.execPath, [
  '--require', 'ts-node/register/transpile-only', '--test', '--test-concurrency=2', ...files,
], { env, stdio: 'inherit' })
if (execution.error) throw execution.error
process.exitCode = execution.status ?? 1
