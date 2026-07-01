import { NextFunction, Request, Response } from 'express'
import { ZodError, ZodIssue } from 'zod'
import { AppError } from '../errors/AppError'
import { logger } from '../lib/logger'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((e: ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    })
    return
  }

  logger.error('Unexpected error', { error: String(err) })

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  })
}
