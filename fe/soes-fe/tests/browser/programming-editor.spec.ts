import { expect, test } from '@playwright/test'
import type { Monaco } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { getLibraryCandidates, registerProgrammingCompletions } from '../../src/pages/student/components/take-exam/code-editor/programming-completions'
import { getProgrammingSource } from '../../src/pages/student/components/take-exam/code-editor/programming-starters'

test('shows a valid program until the student has written or saved source', () => {
  expect(getProgrammingSource('CPP', undefined, undefined)).toContain('int main()')
  expect(getProgrammingSource('C', undefined, undefined)).toContain('int main(void)')
  expect(getProgrammingSource('JAVA', undefined, undefined)).toContain('public class Main')
  expect(getProgrammingSource('JAVA', undefined, 'saved draft')).toBe('saved draft')
  expect(getProgrammingSource('JAVA', 'current edit', 'saved draft')).toBe('current edit')
  expect(getProgrammingSource('JAVA', '', 'saved draft')).toBe('')
})

test('offers Java library methods only after the matching class', () => {
  const math = getLibraryCandidates('JAVA', 'Math.')
  expect(math.find(({ name }) => name === 'max')).toMatchObject({
    signature: 'Math.max(left, right)',
    snippet: 'max(${1:left}, ${2:right})',
  })
  expect(math.some(({ name }) => name === 'sort')).toBe(false)
  expect(getLibraryCandidates('JAVA', '').map(({ name }) => name)).toContain('Math')
  expect(getLibraryCandidates('JAVA', 'other.')).toEqual([])
})

test('keeps C and C++ suggestions in their respective languages', () => {
  expect(getLibraryCandidates('C', '').map(({ name }) => name)).toContain('printf')
  expect(getLibraryCandidates('C', '').map(({ name }) => name)).not.toContain('sort')
  expect(getLibraryCandidates('CPP', 'std::').map(({ name }) => name)).toContain('sort')
  expect(getLibraryCandidates('CPP', 'std::').map(({ name }) => name)).not.toContain('printf')
})

test('registers Java completions with the typed range and cleans up providers', async () => {
  const providers = new Map<string, monaco.languages.CompletionItemProvider>()
  const monacoApi = {
    languages: {
      CompletionItemKind: { Class: 1, Function: 2 },
      CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
      registerCompletionItemProvider(language: string, provider: monaco.languages.CompletionItemProvider) {
        providers.set(language, provider)
        return { dispose: () => { providers.delete(language) } }
      },
    },
  } as unknown as Monaco

  const dispose = registerProgrammingCompletions(monacoApi)
  const model = {
    getLineContent: () => 'Math.ma',
    getWordUntilPosition: () => ({ word: 'ma', startColumn: 6, endColumn: 8 }),
  } as unknown as monaco.editor.ITextModel
  const completionList = await Promise.resolve(providers.get('java')!.provideCompletionItems(
    model,
    { lineNumber: 1, column: 8 } as monaco.Position,
    {} as monaco.languages.CompletionContext,
    {} as monaco.CancellationToken,
  ))

  expect(completionList?.suggestions.find(({ label }) => label === 'max')).toMatchObject({
    insertText: 'max(${1:left}, ${2:right})',
    range: { startColumn: 6, endColumn: 8 },
  })
  dispose()
  expect(providers.size).toBe(0)
})
