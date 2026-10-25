import { NotFoundError } from '../../../errors/AppError'
import * as repo from '../repositories/backoffice-review-group.repository'

export const list = () => repo.listGroups()
export const listDepartments = () => repo.listDepartments()

export async function get(id: string) {
  const group = await repo.findGroup(id)
  if (!group) throw new NotFoundError('Review group not found')
  return group
}
