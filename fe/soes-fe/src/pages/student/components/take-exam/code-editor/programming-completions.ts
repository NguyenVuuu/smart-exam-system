import type { Monaco } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import type { TakeExamLanguage } from '../../../types/take-exam.types'
import { PROGRAMMING_LIBRARY, type LibraryFunction } from './programming-library'
import { getProgrammingTypeCandidates } from './programming-types'

export const MONACO_LANGUAGE_IDS: Record<TakeExamLanguage, string> = {
  C: 'c',
  CPP: 'cpp',
  JAVA: 'java',
}

interface CompletionCandidate extends LibraryFunction {
  isScope?: boolean
}

function requiredImportEdit(monacoApi: Monaco, model: monaco.editor.ITextModel, language: TakeExamLanguage,
  candidate: { header?: string; importPath?: string }) {
  const required = language === 'JAVA'
    ? candidate.importPath && `import ${candidate.importPath};`
    : candidate.header && `#include ${candidate.header}`
  if (!required) return undefined
  const current = model.getValue()
  if (current.includes(required) || (language === 'JAVA' && current.includes('import java.util.*;')
      && candidate.importPath?.startsWith('java.util.'))) return undefined
  if (language === 'JAVA') {
    const classIndex = current.search(/\bclass\s+\w+/)
    const position = model.getPositionAt(classIndex < 0 ? 0 : classIndex)
    return [{ range: new monacoApi.Range(position.lineNumber, 1, position.lineNumber, 1), text: `${required}\n` }]
  }
  return [{ range: new monacoApi.Range(1, 1, 1, 1), text: `${required}\n` }]
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
        const librarySuggestions: monaco.languages.CompletionItem[] = getLibraryCandidates(language, beforeWord).map((candidate) => ({
          label: candidate.name,
          kind: candidate.isScope
            ? monacoApi.languages.CompletionItemKind.Class
            : monacoApi.languages.CompletionItemKind.Function,
          detail: candidate.signature,
          documentation: candidate.header ? `Cần thêm #include ${candidate.header}`
            : candidate.importPath ? `Tự thêm import ${candidate.importPath};` : undefined,
          insertText: candidate.snippet,
          insertTextRules: monacoApi.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          additionalTextEdits: requiredImportEdit(monacoApi, model, language, candidate),
          range,
        }))
        const typeSuggestions: monaco.languages.CompletionItem[] = getProgrammingTypeCandidates(language, beforeWord).map((candidate) => ({
          label: candidate.name,
          kind: candidate.isClass
            ? monacoApi.languages.CompletionItemKind.Class
            : monacoApi.languages.CompletionItemKind.Keyword,
          detail: candidate.isClass ? 'Kiểu thư viện chuẩn' : 'Kiểu dữ liệu',
          documentation: candidate.header
            ? `Cần thêm #include ${candidate.header}`
            : candidate.importPath ? `Cần thêm import ${candidate.importPath};` : undefined,
          insertText: candidate.name,
          additionalTextEdits: requiredImportEdit(monacoApi, model, language, candidate),
          range,
        }))
        return { suggestions: [...librarySuggestions, ...typeSuggestions] }
      },
    }),
  )

  return () => registrations.forEach((registration) => registration.dispose())
}
