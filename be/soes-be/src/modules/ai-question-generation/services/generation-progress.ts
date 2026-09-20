export type GenerationStage = 'PREPARING' | 'GENERATING' | 'CORRECTING' | 'VALIDATING' | 'COMPLETED' | 'FAILED'
export interface GenerationProgress { stage: GenerationStage; completedCount?: number; requestedCount?: number }
export type ReportGenerationProgress = (progress: GenerationProgress) => void
