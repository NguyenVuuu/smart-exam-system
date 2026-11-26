export interface ProbeResult { ready: boolean; checks: Record<string, boolean> }

export function createReadinessProbe(dependencies: Record<string, () => Promise<unknown>>, timeoutMs = 1_000) {
  let draining = false
  let inFlight: Promise<ProbeResult> | undefined
  let cached: { result: ProbeResult; until: number } | undefined

  async function inspect(): Promise<ProbeResult> {
    const checks = Object.fromEntries(await Promise.all(Object.entries(dependencies).map(async ([name, probe]) => {
      try { await probe(); return [name, true] as const }
      catch { return [name, false] as const }
    })))
    return { ready: Object.values(checks).every(Boolean), checks }
  }

  return {
    drain() { draining = true },
    async check(): Promise<ProbeResult> {
      if (draining) return { ready: false, checks: { draining: true } }
      if (cached && cached.until > Date.now()) return cached.result
      inFlight ??= inspect().then(result => {
        cached = { result, until: Date.now() + 1_000 }
        return result
      }).finally(() => { inFlight = undefined })
      let timer: NodeJS.Timeout | undefined
      try {
        const result = await Promise.race([
          inFlight,
          new Promise<ProbeResult>(resolve => {
            timer = setTimeout(() => resolve({ ready: false, checks: { timeout: true } }), timeoutMs)
          }),
        ])
        return draining ? { ready: false, checks: { draining: true } } : result
      } finally { clearTimeout(timer) }
    },
  }
}
