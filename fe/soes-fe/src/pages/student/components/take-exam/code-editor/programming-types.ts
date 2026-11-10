import type { TakeExamLanguage } from '../../../types/take-exam.types'

export interface ProgrammingTypeCandidate {
  name: string
  header?: string
  importPath?: string
  isClass?: boolean
}

function keywords(names: readonly string[]): ProgrammingTypeCandidate[] {
  return names.map((name) => ({ name }))
}

const cppLibraryTypes: ProgrammingTypeCandidate[] = [
  { name: 'size_t', header: '<cstddef>' },
  ...['int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t']
    .map((name) => ({ name, header: '<cstdint>' })),
  { name: 'string', header: '<string>', isClass: true },
  { name: 'vector', header: '<vector>', isClass: true },
  { name: 'array', header: '<array>', isClass: true },
  { name: 'pair', header: '<utility>', isClass: true },
  { name: 'map', header: '<map>', isClass: true },
  { name: 'unordered_map', header: '<unordered_map>', isClass: true },
  { name: 'set', header: '<set>', isClass: true },
  { name: 'unordered_set', header: '<unordered_set>', isClass: true },
  { name: 'queue', header: '<queue>', isClass: true },
  { name: 'stack', header: '<stack>', isClass: true },
  { name: 'deque', header: '<deque>', isClass: true },
  { name: 'priority_queue', header: '<queue>', isClass: true },
]

const javaLibraryTypes: ProgrammingTypeCandidate[] = [
  ...keywords(['String', 'Object', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Character', 'Byte', 'Short'])
    .map((candidate) => ({ ...candidate, isClass: true })),
  { name: 'StringBuilder', isClass: true },
  { name: 'List', importPath: 'java.util.List', isClass: true },
  { name: 'ArrayList', importPath: 'java.util.ArrayList', isClass: true },
  { name: 'Map', importPath: 'java.util.Map', isClass: true },
  { name: 'HashMap', importPath: 'java.util.HashMap', isClass: true },
  { name: 'Set', importPath: 'java.util.Set', isClass: true },
  { name: 'HashSet', importPath: 'java.util.HashSet', isClass: true },
  { name: 'Queue', importPath: 'java.util.Queue', isClass: true },
  { name: 'Deque', importPath: 'java.util.Deque', isClass: true },
  { name: 'ArrayDeque', importPath: 'java.util.ArrayDeque', isClass: true },
  { name: 'Scanner', importPath: 'java.util.Scanner', isClass: true },
  { name: 'BigInteger', importPath: 'java.math.BigInteger', isClass: true },
]

const types: Record<TakeExamLanguage, readonly ProgrammingTypeCandidate[]> = {
  C: [
    ...keywords(['char', 'signed char', 'unsigned char', 'short', 'unsigned short', 'int', 'unsigned int', 'long', 'unsigned long', 'long long', 'unsigned long long', 'float', 'double', 'long double', '_Bool']),
    { name: 'bool', header: '<stdbool.h>' },
    { name: 'size_t', header: '<stddef.h>' },
    ...['int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t']
      .map((name) => ({ name, header: '<stdint.h>' })),
  ],
  CPP: [
    ...keywords(['bool', 'char', 'signed char', 'unsigned char', 'wchar_t', 'char16_t', 'char32_t', 'short', 'unsigned short', 'int', 'unsigned int', 'long', 'unsigned long', 'long long', 'unsigned long long', 'float', 'double', 'long double', 'auto']),
    ...cppLibraryTypes,
  ],
  JAVA: [
    ...keywords(['boolean', 'byte', 'char', 'short', 'int', 'long', 'float', 'double', 'var']),
    ...javaLibraryTypes,
  ],
}

export function getProgrammingTypeCandidates(language: TakeExamLanguage, beforeWord: string): readonly ProgrammingTypeCandidate[] {
  if (language === 'CPP' && beforeWord.endsWith('std::')) return cppLibraryTypes
  if (/[.:]$/.test(beforeWord)) return []
  return types[language]
}
