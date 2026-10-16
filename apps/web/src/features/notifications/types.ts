export type NotificationType = 'PROJECT_STARTED' | 'PROJECT_DUE' | 'PROJECT_COMPLETED' | 'SUMMARY_READY';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  titleEn: string;
  body: string | null;
  bodyEn: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}
