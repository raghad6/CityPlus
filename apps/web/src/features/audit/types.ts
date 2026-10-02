/** One line of the activity log. `action` is a key like "report.approve" (translated as action.<key>). */
export interface AuditLog {
  id: string; action: string; entityType: string; summary?: string | null; createdAt: string;
  user?: { id: string; name: string } | null;
}
