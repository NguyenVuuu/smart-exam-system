export type IntegrityStatus = 'VALID' | 'TAMPERED' | 'NOT_ANCHORED' | 'BLOCKCHAIN_UNAVAILABLE'

export function classifyExamIntegrity(
  currentHash: string,
  localHash: string,
  anchorKnown: boolean,
  onChainHash: string | null,
): IntegrityStatus {
  if (currentHash !== localHash) return 'TAMPERED'
  if (onChainHash === null) return anchorKnown ? 'BLOCKCHAIN_UNAVAILABLE' : 'NOT_ANCHORED'
  if (!onChainHash) return anchorKnown ? 'TAMPERED' : 'NOT_ANCHORED'
  return onChainHash === currentHash ? 'VALID' : 'TAMPERED'
}
