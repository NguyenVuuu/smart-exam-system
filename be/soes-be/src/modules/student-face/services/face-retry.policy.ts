export function nextFaceRetryState(
  previousFailures: number,
  now: Date,
  policy: { failuresPerCycle: number; maxFailuresBeforeManualReview: number; cooldownSeconds: number },
) {
  const failedAttemptsSinceSuccess = previousFailures + 1
  const requiresManualReview = failedAttemptsSinceSuccess >= policy.maxFailuresBeforeManualReview
  const cooldownUntil = !requiresManualReview && failedAttemptsSinceSuccess % policy.failuresPerCycle === 0
    ? new Date(now.getTime() + policy.cooldownSeconds * 1000)
    : null
  return { failedAttemptsSinceSuccess, cooldownUntil, requiresManualReview }
}
