type ExistingTopic = { code: string; name: string }

export function normalizeTopicName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd').toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim()
}

export function isDistinctProposedTopic(code: string, name: string, existing: ExistingTopic[]) {
  const normalized = normalizeTopicName(name)
  if (!/^[A-Z0-9_-]{2,32}$/.test(code) || normalized.length < 3) return false
  if (/^(?:chuong|muc|phan|bai)\s*\d+\b/.test(normalized)) return false
  return !existing.some((topic) => topic.code.toUpperCase() === code
    || normalizeTopicName(topic.name) === normalized)
}
