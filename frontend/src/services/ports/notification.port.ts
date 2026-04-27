import type { Result } from '@shared/lib/result';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface Notification {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly severity: NotificationSeverity;
  readonly channel: NotificationChannel;
  readonly createdAt: string;
  readonly readAt: string | null;
  readonly actionHref?: string;
}

export interface INotificationService {
  list(params?: { unreadOnly?: boolean }): Promise<Result<readonly Notification[]>>;
  markRead(id: string): Promise<Result<void>>;
  markAllRead(): Promise<Result<void>>;
}
