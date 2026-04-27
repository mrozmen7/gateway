import type {
  INotificationService,
  Notification,
} from '../ports/notification.port';
import type { Result } from '@shared/lib/result';
import { ok } from '@shared/lib/result';
import { http } from './_client';

interface NotificationDto {
  readonly notificationId: string;
  readonly notificationType: string;
  readonly title: string;
  readonly message: string;
  readonly status: string;
  readonly correlationId: string;
  readonly createdAt: string;
}

export class HttpNotificationService implements INotificationService {
  async list(params?: { unreadOnly?: boolean }): Promise<Result<readonly Notification[]>> {
    const response = await http<readonly NotificationDto[]>('/api/v1/notifications/me');
    if (!response.ok) return response;

    const mapped = response.value.map((item) => ({
      id: item.notificationId,
      title: item.title,
      body: item.message,
      severity: 'info' as const,
      channel: 'in_app' as const,
      createdAt: item.createdAt,
      readAt: item.status === 'READ' ? item.createdAt : null,
      actionHref: `/ops/inspector?q=${item.correlationId}`,
    }));

    return ok(params?.unreadOnly ? mapped.filter((item) => item.readAt === null) : mapped);
  }

  markRead(_id: string): Promise<Result<void>> {
    return Promise.resolve(ok(undefined));
  }

  markAllRead(): Promise<Result<void>> {
    return Promise.resolve(ok(undefined));
  }
}
