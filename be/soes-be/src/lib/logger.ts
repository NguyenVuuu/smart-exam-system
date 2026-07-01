type LogLevel = 'info' | 'warn' | 'error'

function log(level: LogLevel, message: string, meta?: object): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta && { meta }),
  }
  process.stdout.write(JSON.stringify(entry) + '\n')
}

export const logger = {
  info: (message: string, meta?: object) => log('info', message, meta),
  warn: (message: string, meta?: object) => log('warn', message, meta),
  error: (message: string, meta?: object) => log('error', message, meta),
}
