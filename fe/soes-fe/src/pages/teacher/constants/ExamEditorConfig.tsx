import { Clock, Eye, FileText, Layers, ListChecks } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ExamType, ResultReleaseMode } from '../types/teacher-exam.types'
import type { QuestionType } from '../types/teacher-question-bank.types'

export type WizardStepId = 'INFO' | 'SECTIONS' | 'QUESTIONS' | 'CONFIG' | 'PREVIEW'

export const WIZARD_STEPS: Array<{ id: WizardStepId; title: string; icon: ReactNode }> = [
  { id: 'INFO', title: 'Thông tin', icon: <FileText size={15} /> },
  { id: 'SECTIONS', title: 'Phần thi & điểm', icon: <Layers size={15} /> },
  { id: 'QUESTIONS', title: 'Câu hỏi', icon: <ListChecks size={15} /> },
  { id: 'CONFIG', title: 'Cấu hình', icon: <Clock size={15} /> },
  { id: 'PREVIEW', title: 'Preview', icon: <Eye size={15} /> },
]

export const examTypeLabel: Record<ExamType, string> = {
  MULTIPLE_CHOICE: 'Đề trắc nghiệm',
  PROGRAMMING: 'Đề lập trình',
  MIXED: 'Đề hỗn hợp',
}

export const examTypeDescription: Record<ExamType, string> = {
  MULTIPLE_CHOICE: '1 đáp án, nhiều đáp án và đúng/sai. Chấm tự động là chính.',
  PROGRAMMING: 'Câu code console có test case, giới hạn thời gian và bộ nhớ.',
  MIXED: 'Gồm phần trắc nghiệm và phần lập trình trong cùng một bài thi.',
}

export const examTypeBadge: Record<ExamType, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm',
  PROGRAMMING: 'Bài thi Code',
  MIXED: 'Trắc nghiệm + Code',
}

export const questionTypeLabel: Record<QuestionType, string> = {
  SINGLE_CHOICE: '1 đáp án',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  PROGRAMMING: 'Lập trình',
}

export const releaseLabel: Record<ResultReleaseMode, string> = {
  IMMEDIATE: 'Hiện điểm ngay sau khi nộp',
  MANUAL: 'Giảng viên công bố sau',
  SCHEDULED: 'Tự động công bố theo thời gian',
}
