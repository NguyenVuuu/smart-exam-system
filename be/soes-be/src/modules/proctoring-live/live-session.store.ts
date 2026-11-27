import redis from '../../lib/redis'
import { ConflictError } from '../../errors/AppError'

export type LiveStreamType = 'WEBCAM' | 'SCREEN'
type Signal = Record<string, unknown>
export interface LiveSession {
  id: string
  attemptId: string
  scheduleId: string
  teacherId: string
  streamType: LiveStreamType
  createdAt: number
  updatedAt: number
  status: 'REQUESTED' | 'OFFERED' | 'CONNECTED' | 'ENDED'
  offer: Signal | null
  answer: Signal | null
  studentCandidates: Signal[]
  teacherCandidates: Signal[]
}

const SESSION_PREFIX = 'proctoring:live:session:'
const ATTEMPT_PREFIX = 'proctoring:live:attempt:'
export const attemptKey = (attemptId: string, scheduleId: string, streamType: LiveStreamType) =>
  `${ATTEMPT_PREFIX}${scheduleId}:${attemptId}:${streamType}`

const createScript = `
local previousId = redis.call('GET', KEYS[2])
if previousId then
  local raw = redis.call('GET', ARGV[2] .. previousId)
  if raw then
    local previous = cjson.decode(raw)
    if previous.status ~= 'ENDED' then
      if previous.teacherId ~= ARGV[3] then return 'CONFLICT' end
      if previous.status == 'REQUESTED' then
        redis.call('EXPIRE', ARGV[2] .. previousId, 30)
        redis.call('EXPIRE', KEYS[2], 30)
        return raw
      end
      previous.status = 'ENDED'
      previous.updatedAt = tonumber(ARGV[4])
      redis.call('SET', ARGV[2] .. previousId, cjson.encode(previous), 'EX', 10)
    end
  end
end
redis.call('SET', KEYS[1], ARGV[1], 'EX', 30)
redis.call('SET', KEYS[2], ARGV[5], 'EX', 30)
return ARGV[1]
`

const changeScript = `
local raw = redis.call('GET', KEYS[1])
if not raw then return false end
local state = cjson.decode(raw)
local actor = cjson.decode(ARGV[1])
for key, value in pairs(actor) do if state[key] ~= value then return false end end
local action = ARGV[2]
local pointer = ARGV[5] .. state.scheduleId .. ':' .. state.attemptId .. ':' .. state.streamType
if action ~= 'END' and (state.status == 'ENDED' or redis.call('GET', pointer) ~= state.id) then return false end
if action == 'TOUCH' then
  local ttl = state.status == 'REQUESTED' and 30 or 600
  redis.call('EXPIRE', KEYS[1], ttl)
  redis.call('EXPIRE', pointer, ttl)
  return raw
elseif action == 'OFFER' then
  if state.status ~= 'REQUESTED' then return false end
  state.offer = cjson.decode(ARGV[3])
  state.status = 'OFFERED'
elseif action == 'ANSWER' then
  if state.status ~= 'OFFERED' then return false end
  state.answer = cjson.decode(ARGV[3])
  state.status = 'CONNECTED'
elseif action == 'STUDENT_CANDIDATE' or action == 'TEACHER_CANDIDATE' then
  local candidates = action == 'STUDENT_CANDIDATE' and state.studentCandidates or state.teacherCandidates
  local candidate = cjson.decode(ARGV[3])
  local serialized = cjson.encode(candidate)
  local duplicate = false
  for _, existing in ipairs(candidates) do
    if cjson.encode(existing) == serialized then duplicate = true; break end
  end
  if not duplicate then
    if #candidates >= 256 then return 'CANDIDATE_LIMIT' end
    table.insert(candidates, candidate)
  end
elseif action == 'END' then
  state.status = 'ENDED'
end
state.updatedAt = tonumber(ARGV[4])
local ttl = state.status == 'REQUESTED' and 30 or 600
if state.status == 'ENDED' then ttl = 10 end
local result = cjson.encode(state)
redis.call('SET', KEYS[1], result, 'EX', ttl)
if state.status == 'ENDED' then
  if redis.call('GET', pointer) == state.id then redis.call('DEL', pointer) end
elseif redis.call('GET', pointer) == state.id then
  redis.call('EXPIRE', pointer, ttl)
end
return result
`

function parseSession(raw: unknown): LiveSession | null {
  if (raw === 'CONFLICT') throw new ConflictError('Another proctor is already viewing this stream')
  if (raw === 'CANDIDATE_LIMIT') throw new ConflictError('Live stream candidate limit reached; reconnect the stream')
  if (typeof raw !== 'string') return null
  const session = JSON.parse(raw) as LiveSession
  session.studentCandidates = Array.isArray(session.studentCandidates) ? session.studentCandidates : []
  session.teacherCandidates = Array.isArray(session.teacherCandidates) ? session.teacherCandidates : []
  return session
}

export async function createLiveSession(session: LiveSession): Promise<LiveSession> {
  const created = parseSession(await redis.eval(createScript, 2, `${SESSION_PREFIX}${session.id}`,
    attemptKey(session.attemptId, session.scheduleId, session.streamType), JSON.stringify(session),
    SESSION_PREFIX, session.teacherId, session.updatedAt, session.id))
  if (!created) throw new ConflictError('Live stream could not be created')
  return created
}

type Actor = { teacherId: string } | { attemptId: string; scheduleId: string }
type Action = 'TOUCH' | 'OFFER' | 'ANSWER' | 'STUDENT_CANDIDATE' | 'TEACHER_CANDIDATE' | 'END'

export async function changeLiveSession(sessionId: string, actor: Actor, action: Action, signal?: Signal) {
  return parseSession(await redis.eval(changeScript, 1, `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify(actor), action, JSON.stringify(signal ?? null), Date.now(), ATTEMPT_PREFIX))
}

export async function pendingSessionId(attemptId: string, scheduleId: string, type: LiveStreamType) {
  return redis.get(attemptKey(attemptId, scheduleId, type))
}
