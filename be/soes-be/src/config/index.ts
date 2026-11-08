/**
 * Centralised application configuration.
 *
 * Values are read lazily (inside getters / functions) so that dotenv has
 * already loaded by the time any config property is first accessed.
 * Reading env vars at module scope would capture `undefined` because
 * ES imports are hoisted above the `import 'dotenv/config'` side-effect
 * in server.ts — the same reason jwt.ts uses lazy getters.
 */

export const appConfig = {
  get nodeEnv(): string {
    return process.env.NODE_ENV ?? 'development'
  },

  get port(): number {
    return parseInt(process.env.PORT ?? '3000', 10)
  },
} as const

export const corsConfig = {
  get allowedOrigins(): string[] {
    return (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',')
  },
} as const

export const proxyConfig = {
  get trustProxy(): string | number {
    const configuredProxy = process.env.TRUST_PROXY?.trim()
    if (!configuredProxy) return 'loopback'

    const proxyHops = Number(configuredProxy)
    return Number.isInteger(proxyHops) && proxyHops >= 0 ? proxyHops : configuredProxy
  },
} as const

const HEARTBEAT_TIMEOUT_MIN_SECONDS = 10
const HEARTBEAT_TIMEOUT_MAX_SECONDS = 300
let configuredHeartbeatTimeoutMs: number | null = null

function getEnvironmentHeartbeatTimeoutMs(): number {
  const timeout = Number.parseInt(process.env.HEARTBEAT_TIMEOUT ?? '15000', 10)
  return Number.isFinite(timeout) && timeout > 0 ? timeout : 15000
}

export const examConfig = {
  /**
   * How long (in milliseconds) since the last heartbeat before a student
   * session is considered offline. The system setting takes precedence over
   * HEARTBEAT_TIMEOUT (value in ms), which remains the startup fallback.
   * Default: 15000 (15 seconds)
   */
  get heartbeatTimeoutMs(): number {
    return configuredHeartbeatTimeoutMs ?? getEnvironmentHeartbeatTimeoutMs()
  },

  get defaultHeartbeatTimeoutMs(): number {
    return getEnvironmentHeartbeatTimeoutMs()
  },

  setHeartbeatTimeoutSeconds(seconds: unknown): void {
    if (
      typeof seconds !== 'number'
      || !Number.isInteger(seconds)
      || seconds < HEARTBEAT_TIMEOUT_MIN_SECONDS
      || seconds > HEARTBEAT_TIMEOUT_MAX_SECONDS
    ) {
      configuredHeartbeatTimeoutMs = null
      return
    }

    configuredHeartbeatTimeoutMs = seconds * 1000
  },
} as const

export const judge0Config = {
  get baseUrl(): string {
    return process.env.JUDGE0_BASE_URL ?? 'http://127.0.0.1:2358'
  },
  
  get apiKey(): string | null {
    return process.env.JUDGE0_API_KEY ?? null
  },
  
  get defaultTimeoutMs(): number {
    return parseInt(process.env.JUDGE0_DEFAULT_TIMEOUT_MS ?? '5000', 10)
  },
  
  get maxSubmissionsPerRequest(): number {
    return parseInt(process.env.JUDGE0_MAX_SUBMISSIONS_PER_REQUEST ?? '20', 10)
  },
} as const

export const minioConfig = {
  get endPoint(): string {
    return process.env.MINIO_ENDPOINT ?? 'localhost'
  },

  get port(): number {
    return parseInt(process.env.MINIO_PORT ?? '9000', 10)
  },

  get useSSL(): boolean {
    return process.env.MINIO_USE_SSL === 'true'
  },

  get accessKey(): string {
    return process.env.MINIO_ACCESS_KEY ?? 'soes_minio_admin'
  },

  get secretKey(): string {
    return process.env.MINIO_SECRET_KEY ?? 'soes_minio_password'
  },

  get evidenceBucket(): string {
    return process.env.MINIO_EVIDENCE_BUCKET ?? 'soes-evidence'
  },

  get evidenceUrlExpirySeconds(): number {
    return parseInt(process.env.MINIO_EVIDENCE_URL_EXPIRY_SECONDS ?? '300', 10)
  },

  get requireEvidenceStorage(): boolean {
    return process.env.MINIO_REQUIRE_EVIDENCE_STORAGE === 'true' || appConfig.nodeEnv === 'production'
  },
} as const

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback
}

function boundedPercentage(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : fallback
}

export const faceVerificationConfig = {
  get enabled(): boolean {
    return process.env.FACE_VERIFICATION_ENABLED === 'true'
  },

  get provider(): 'aws' | 'mock' {
    return process.env.FACE_VERIFICATION_PROVIDER === 'mock' ? 'mock' : 'aws'
  },

  get region(): string {
    return process.env.AWS_FACE_REGION?.trim() ?? ''
  },

  get collectionId(): string {
    return process.env.AWS_FACE_COLLECTION_ID?.trim() ?? ''
  },

  get livenessThreshold(): number {
    return boundedPercentage(process.env.FACE_LIVENESS_THRESHOLD, 90)
  },

  get enrollmentLivenessThreshold(): number {
    return boundedPercentage(process.env.FACE_ENROLLMENT_LIVENESS_THRESHOLD, 80)
  },

  get similarityThreshold(): number {
    return boundedPercentage(process.env.FACE_SIMILARITY_THRESHOLD, 90)
  },

  get sessionTtlSeconds(): number {
    return boundedInteger(process.env.FACE_SESSION_TTL_SECONDS, 180, 60, 300)
  },

  get grantTtlSeconds(): number {
    return boundedInteger(process.env.FACE_GRANT_TTL_SECONDS, 300, 60, 600)
  },

  get cooldownSeconds(): number {
    return boundedInteger(process.env.FACE_COOLDOWN_SECONDS, 120, 30, 900)
  },

  get failuresPerCycle(): number {
    return boundedInteger(process.env.FACE_FAILURES_PER_CYCLE, 3, 1, 5)
  },

  get maxFailuresBeforeManualReview(): number {
    return boundedInteger(process.env.FACE_MAX_FAILURES_BEFORE_MANUAL_REVIEW, 6, 2, 10)
  },
} as const

export function assertFaceVerificationConfigured(): void {
  if (!faceVerificationConfig.enabled) return

  if (faceVerificationConfig.provider === 'mock') {
    if (appConfig.nodeEnv === 'production') {
      throw new Error('FACE_VERIFICATION_PROVIDER=mock is forbidden in production')
    }
    return
  }

  if (!faceVerificationConfig.region || !faceVerificationConfig.collectionId) {
    throw new Error(
      'Face verification is enabled but AWS_FACE_REGION or AWS_FACE_COLLECTION_ID is missing',
    )
  }
}
