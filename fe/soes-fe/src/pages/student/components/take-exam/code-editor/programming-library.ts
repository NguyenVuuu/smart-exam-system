import type { TakeExamLanguage } from '../../../types/take-exam.types'

export interface LibraryFunction {
  name: string
  signature: string
  snippet: string
  header?: string
}

export interface LibraryGroup {
  scope: string
  functions: readonly LibraryFunction[]
}

export const PROGRAMMING_LIBRARY: Record<TakeExamLanguage, readonly LibraryGroup[]> = {
  C: [{
    scope: '',
    functions: [
      { name: 'printf', signature: 'int printf(const char *format, ...)', snippet: 'printf(${1:format})', header: '<stdio.h>' },
      { name: 'scanf', signature: 'int scanf(const char *format, ...)', snippet: 'scanf(${1:format})', header: '<stdio.h>' },
      { name: 'getchar', signature: 'int getchar(void)', snippet: 'getchar()', header: '<stdio.h>' },
      { name: 'putchar', signature: 'int putchar(int character)', snippet: 'putchar(${1:character})', header: '<stdio.h>' },
      { name: 'strlen', signature: 'size_t strlen(const char *text)', snippet: 'strlen(${1:text})', header: '<string.h>' },
      { name: 'strcmp', signature: 'int strcmp(const char *left, const char *right)', snippet: 'strcmp(${1:left}, ${2:right})', header: '<string.h>' },
      { name: 'strcpy', signature: 'char *strcpy(char *destination, const char *source)', snippet: 'strcpy(${1:destination}, ${2:source})', header: '<string.h>' },
      { name: 'memset', signature: 'void *memset(void *destination, int value, size_t count)', snippet: 'memset(${1:destination}, ${2:value}, ${3:count})', header: '<string.h>' },
      { name: 'malloc', signature: 'void *malloc(size_t size)', snippet: 'malloc(${1:size})', header: '<stdlib.h>' },
      { name: 'free', signature: 'void free(void *pointer)', snippet: 'free(${1:pointer})', header: '<stdlib.h>' },
      { name: 'abs', signature: 'int abs(int number)', snippet: 'abs(${1:number})', header: '<stdlib.h>' },
      { name: 'sqrt', signature: 'double sqrt(double number)', snippet: 'sqrt(${1:number})', header: '<math.h>' },
      { name: 'pow', signature: 'double pow(double base, double exponent)', snippet: 'pow(${1:base}, ${2:exponent})', header: '<math.h>' },
    ],
  }],
  CPP: [{
    scope: 'std',
    functions: [
      { name: 'sort', signature: 'std::sort(first, last)', snippet: 'sort(${1:first}, ${2:last})', header: '<algorithm>' },
      { name: 'reverse', signature: 'std::reverse(first, last)', snippet: 'reverse(${1:first}, ${2:last})', header: '<algorithm>' },
      { name: 'min', signature: 'std::min(left, right)', snippet: 'min(${1:left}, ${2:right})', header: '<algorithm>' },
      { name: 'max', signature: 'std::max(left, right)', snippet: 'max(${1:left}, ${2:right})', header: '<algorithm>' },
      { name: 'swap', signature: 'std::swap(left, right)', snippet: 'swap(${1:left}, ${2:right})', header: '<utility>' },
      { name: 'find', signature: 'std::find(first, last, value)', snippet: 'find(${1:first}, ${2:last}, ${3:value})', header: '<algorithm>' },
      { name: 'count', signature: 'std::count(first, last, value)', snippet: 'count(${1:first}, ${2:last}, ${3:value})', header: '<algorithm>' },
      { name: 'lower_bound', signature: 'std::lower_bound(first, last, value)', snippet: 'lower_bound(${1:first}, ${2:last}, ${3:value})', header: '<algorithm>' },
      { name: 'upper_bound', signature: 'std::upper_bound(first, last, value)', snippet: 'upper_bound(${1:first}, ${2:last}, ${3:value})', header: '<algorithm>' },
      { name: 'accumulate', signature: 'std::accumulate(first, last, initial)', snippet: 'accumulate(${1:first}, ${2:last}, ${3:initial})', header: '<numeric>' },
      { name: 'getline', signature: 'std::getline(stream, text)', snippet: 'getline(${1:stream}, ${2:text})', header: '<string>' },
      { name: 'to_string', signature: 'std::to_string(value)', snippet: 'to_string(${1:value})', header: '<string>' },
      { name: 'abs', signature: 'std::abs(number)', snippet: 'abs(${1:number})', header: '<cmath>' },
      { name: 'sqrt', signature: 'std::sqrt(number)', snippet: 'sqrt(${1:number})', header: '<cmath>' },
      { name: 'pow', signature: 'std::pow(base, exponent)', snippet: 'pow(${1:base}, ${2:exponent})', header: '<cmath>' },
    ],
  }],
  JAVA: [
    {
      scope: 'Math',
      functions: [
        { name: 'abs', signature: 'Math.abs(number)', snippet: 'abs(${1:number})' },
        { name: 'min', signature: 'Math.min(left, right)', snippet: 'min(${1:left}, ${2:right})' },
        { name: 'max', signature: 'Math.max(left, right)', snippet: 'max(${1:left}, ${2:right})' },
        { name: 'sqrt', signature: 'Math.sqrt(number)', snippet: 'sqrt(${1:number})' },
        { name: 'pow', signature: 'Math.pow(base, exponent)', snippet: 'pow(${1:base}, ${2:exponent})' },
        { name: 'round', signature: 'Math.round(number)', snippet: 'round(${1:number})' },
        { name: 'ceil', signature: 'Math.ceil(number)', snippet: 'ceil(${1:number})' },
        { name: 'floor', signature: 'Math.floor(number)', snippet: 'floor(${1:number})' },
      ],
    },
    {
      scope: 'Arrays',
      functions: [
        { name: 'sort', signature: 'Arrays.sort(array)', snippet: 'sort(${1:array})' },
        { name: 'fill', signature: 'Arrays.fill(array, value)', snippet: 'fill(${1:array}, ${2:value})' },
        { name: 'binarySearch', signature: 'Arrays.binarySearch(array, key)', snippet: 'binarySearch(${1:array}, ${2:key})' },
        { name: 'copyOf', signature: 'Arrays.copyOf(array, length)', snippet: 'copyOf(${1:array}, ${2:length})' },
        { name: 'toString', signature: 'Arrays.toString(array)', snippet: 'toString(${1:array})' },
      ],
    },
    {
      scope: 'Collections',
      functions: [
        { name: 'sort', signature: 'Collections.sort(list)', snippet: 'sort(${1:list})' },
        { name: 'reverse', signature: 'Collections.reverse(list)', snippet: 'reverse(${1:list})' },
        { name: 'min', signature: 'Collections.min(collection)', snippet: 'min(${1:collection})' },
        { name: 'max', signature: 'Collections.max(collection)', snippet: 'max(${1:collection})' },
        { name: 'frequency', signature: 'Collections.frequency(collection, value)', snippet: 'frequency(${1:collection}, ${2:value})' },
      ],
    },
  ],
}
