import { AppError } from '../errors/AppError'

export class WorkLimiter {
  private active = 0
  private readonly waiting: Array<() => void> = []

  constructor(private readonly capacity: number, private readonly maxWaiting: number) {
    if (!Number.isInteger(capacity) || capacity < 1 || !Number.isInteger(maxWaiting) || maxWaiting < 0) {
      throw new Error('Invalid work limiter capacity')
    }
  }

  async run<T>(work: () => Promise<T>, timeoutMs = 30_000): Promise<T> {
    if (this.active >= this.capacity) {
      if (this.waiting.length >= this.maxWaiting) throw new AppError(503, 'Processing capacity is exhausted')
      await new Promise<void>((resolve, reject) => {
        const admitted = () => { clearTimeout(timer); resolve() }
        const timer = setTimeout(() => {
          const index = this.waiting.indexOf(admitted)
          if (index >= 0) this.waiting.splice(index, 1)
          reject(new AppError(503, 'Processing queue timed out'))
        }, timeoutMs)
        this.waiting.push(admitted)
      })
    } else {
      this.active += 1
    }
    try { return await work() }
    finally {
      const next = this.waiting.shift()
      if (next) next()
      else this.active -= 1
    }
  }
}
