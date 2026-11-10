import type { QuestionAnswer, TakeExamLanguage } from '../../../types/take-exam.types'

const STARTERS: Record<TakeExamLanguage, string> = {
  C: `#include <stdio.h>

int main(void) {
    // Viết code tại đây

    return 0;
}
`,
  CPP: `#include <iostream>
using namespace std;

int main() {
    // Viết code tại đây

    return 0;
}
`,
  JAVA: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Viết code tại đây
    }
}
`,
}

export function getProgrammingSource(
  language: TakeExamLanguage,
  currentAnswer: QuestionAnswer | undefined,
  savedAnswer: QuestionAnswer | undefined,
): string {
  if (typeof currentAnswer === 'string') return currentAnswer
  if (typeof savedAnswer === 'string') return savedAnswer
  return STARTERS[language]
}
