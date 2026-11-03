export type IntegrityStatus = 'VALID' | 'TAMPERED' | 'NOT_ANCHORED' | 'BLOCKCHAIN_UNAVAILABLE'

export function classifyExamIntegrity(
  currentHash: string,
  localHash: string,
  anchorKnown: boolean,
  onChainHash: string | null,
): IntegrityStatus {
  if (currentHash !== localHash) return 'TAMPERED'
  if (!anchorKnown) return 'NOT_ANCHORED'
  if (onChainHash === null) return 'BLOCKCHAIN_UNAVAILABLE'
  return onChainHash.length > 0 && onChainHash === currentHash ? 'VALID' : 'TAMPERED'
}
