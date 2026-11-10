import type { Monaco } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import type { TakeExamLanguage } from '../../../types/take-exam.types'
import { PROGRAMMING_LIBRARY, type LibraryFunction } from './programming-library'

export const MONACO_LANGUAGE_IDS: Record<TakeExamLanguage, string> = {
  C: 'c',
  CPP: 'cpp',
  JAVA: 'java',
}

interface CompletionCandidate extends LibraryFunction {
  isScope?: boolean
}

export function getLibraryCandidates(language: TakeExamLanguage, beforeWord: string): CompletionCandidate[] {
  const groups = PROGRAMMING_LIBRARY[language]
  const separator = language === 'CPP' ? '::' : '.'
  const qualifiedGroup = groups.find(({ scope }) => scope && beforeWord.endsWith(`${scope}${separator}`))
  if (qualifiedGroup) return [...qualifiedGroup.functions]
  if (/[.:]$/.test(beforeWord)) return []

  const unqualified = language === 'JAVA' ? [] : groups.flatMap(({ functions }) => functions)
  const scopes = groups.filter(({ scope }) => scope).map(({ scope }) => ({
    name: scope,
    signature: language === 'CPP' ? 'Không gian tên chuẩn C++' : 'Lớp thư viện chuẩn Java',
    snippet: scope,
    isScope: true,
  }))
  return [...unqualified, ...scopes]
}

export function registerProgrammingCompletions(monacoApi: Monaco): () => void {
  const registrations = (Object.keys(MONACO_LANGUAGE_IDS) as TakeExamLanguage[]).map((language) =>
    monacoApi.languages.registerCompletionItemProvider(MONACO_LANGUAGE_IDS[language], {
      triggerCharacters: ['.', ':'],
      provideCompletionItems(model: monaco.editor.ITextModel, position: monaco.Position) {
        const word = model.getWordUntilPosition(position)
        const beforeWord = model.getLineContent(position.lineNumber).slice(0, word.startColumn - 1)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: position.column,
        }
        const suggestions: monaco.languages.CompletionItem[] = getLibraryCandidates(language, beforeWord).map((candidate) => ({
          label: candidate.name,
          kind: candidate.isScope
            ? monacoApi.languages.CompletionItemKind.Class
            : monacoApi.languages.CompletionItemKind.Function,
          detail: candidate.signature,
          documentation: candidate.header ? `Cần thêm #include ${candidate.header}` : undefined,
          insertText: candidate.snippet,
          insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        }))
        return { suggestions }
      },
    }),
  )

  return () => registrations.forEach((registration) => registration.dispose())
}
