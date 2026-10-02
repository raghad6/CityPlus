import { Prisma, ProjectStatus } from '@prisma/client';
import { AuthUser } from '../common/decorators';

/** Business rules about projects that several modules share (projects, reports, dashboard). */

/** Once a project reaches one of these it is no longer "open", so it can't be overdue. */
export const CLOSED_STATUSES: ProjectStatus[] = ['COMPLETED', 'CANCELLED'];

/** Statuses for which "reasons for non-execution" is mandatory in a progress report. */
export const REASON_REQUIRED_STATUSES: ProjectStatus[] = ['NOT_STARTED', 'PARTIAL', 'POSTPONED', 'STOPPED', 'CANCELLED'];

/** Projects a user may see: the whole municipality for admins, only assigned projects for staff. */
export function visibleProjects(user: AuthUser): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = { tenantId: user.tenantId! };
  if (user.role === 'STAFF') where.assignments = { some: { userId: user.id } };
  return where;
}
