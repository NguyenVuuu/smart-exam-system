export type InvigilationStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED'

export interface InvigilationAssignment {
  id: string
  scheduleId: string
  title: string
  startTime: string
  endTime: string
  status: InvigilationStatus
  source: 'ASSIGNED' | 'CREATED'
  courseOffering: { id: string; code: string; subjectName: string }
}

export interface InvigilationPage {
  items: InvigilationAssignment[]
  pagination: { totalPages: number; totalItems: number }
}
