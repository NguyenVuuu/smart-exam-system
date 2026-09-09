import { judge0Config, minioConfig } from '../../../config'
import prisma from '../../../lib/prisma'
import redis from '../../../lib/redis'
import type { IntegrationStatusDto } from '../dtos/admin-system-settings.dto'

const isConfigured = (value?: string) => Boolean(value?.trim())

const canReachDatabase = () => prisma.$queryRaw`SELECT 1`
  .then(() => true)
  .catch(() => false)

const canReachRedis = () => redis.ping()
  .then(() => true)
  .catch(() => false)

async function canReachJudge0(): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 1500)

  try {
    const baseUrl = judge0Config.baseUrl.replace(/\/+$/, '')
    return (await fetch(`${baseUrl}/about`, { signal: controller.signal })).ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export async function getIntegrationStatuses(aiModel: string): Promise<IntegrationStatusDto[]> {
  const [databaseConnected, redisConnected, judgeConnected] = await Promise.all([
    canReachDatabase(),
    canReachRedis(),
    canReachJudge0(),
  ])
  const geminiConfigured = isConfigured(process.env.GEMINI_API_KEY)
  const supabaseConfigured = isConfigured(process.env.SUPABASE_URL)
    && isConfigured(process.env.SUPABASE_SERVICE_ROLE_KEY)

  return [
    {
      id: 'DATABASE',
      name: 'PostgreSQL',
      state: databaseConnected ? 'CONNECTED' : 'UNAVAILABLE',
      detail: databaseConnected ? 'Cơ sở dữ liệu đang hoạt động ổn định.' : 'Không thể kết nối cơ sở dữ liệu.',
    },
    {
      id: 'REDIS',
      name: 'Redis',
      state: redisConnected ? 'CONNECTED' : 'UNAVAILABLE',
      detail: redisConnected ? 'Bộ đệm phiên đăng nhập và realtime đang hoạt động.' : 'Không thể kết nối Redis.',
    },
    {
      id: 'GEMINI',
      name: 'Google Gemini AI',
      state: geminiConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
      detail: geminiConfigured ? `Mô hình AI ${aiModel} đã được cấu hình.` : 'Chưa cấu hình Gemini API.',
    },
    {
      id: 'JUDGE0',
      name: 'Judge0 CE',
      state: judgeConnected ? 'CONNECTED' : 'UNAVAILABLE',
      detail: judgeConnected ? 'Hệ thống chấm code tự động đang phản hồi.' : 'Dịch vụ chấm code chưa phản hồi.',
    },
    {
      id: 'COURSE_STORAGE',
      name: 'Supabase Storage',
      state: supabaseConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
      detail: supabaseConfigured ? 'Kho tài liệu và hình ảnh đã được cấu hình.' : 'Thiếu cấu hình Supabase Storage.',
    },
    {
      id: 'EVIDENCE_STORAGE',
      name: 'MinIO Evidence',
      state: 'CONFIGURED',
      detail: minioConfig.requireEvidenceStorage
        ? 'Bằng chứng bắt buộc lưu trên MinIO.'
        : 'Cho phép lưu cục bộ dự phòng trong môi trường phát triển.',
    },
  ]
}
