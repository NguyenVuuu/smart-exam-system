import { createClient } from '@supabase/supabase-js'
import { ValidationError } from '../errors/AppError'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseBuckets = {
  courseMaterials: process.env.SUPABASE_COURSE_MATERIAL_BUCKET || 'course-materials',
  aiSourceFiles: process.env.SUPABASE_AI_SOURCE_BUCKET || 'ai-source-files',
  questionImages: process.env.SUPABASE_QUESTION_IMAGE_BUCKET || 'question-images',
}

export const supabase = (() => {
  if (!supabaseUrl || !serviceRoleKey) return null
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
})()

export function requireSupabase() {
  if (!supabase) throw new ValidationError('Supabase storage is not configured')
  return supabase
}