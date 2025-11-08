import { skillTemplates } from '@/lib/templates/skill-templates'
import { successResponse } from '@/lib/api/response'

export async function GET() {
  return successResponse(skillTemplates)
}
