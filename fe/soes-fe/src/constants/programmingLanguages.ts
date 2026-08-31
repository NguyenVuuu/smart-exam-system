export const PROGRAMMING_LANGUAGE_LABELS = {
  C: 'C (GCC 9.2.0)',
  CPP: 'C++ (GCC 9.2.0)',
  JAVA: 'Java (OpenJDK 13.0.1)',
} as const

export type ProgrammingLanguage = keyof typeof PROGRAMMING_LANGUAGE_LABELS
