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

export const examConfig = {
  /**
   * How long (in milliseconds) since the last heartbeat before a student
   * session is considered offline. Used by Get Attempt Status (API 5).
   * Env var: HEARTBEAT_TIMEOUT (value in ms)
   * Default: 15000 (15 seconds)
   */
  get heartbeatTimeoutMs(): number {
    return parseInt(process.env.HEARTBEAT_TIMEOUT ?? '15000', 10)
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
} as const
