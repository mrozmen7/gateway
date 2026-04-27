import type {
  INotificationService,
  Notification,
} from '../ports/notification.port';
import type { Result } from '@shared/lib/result';
import { ok } from '@shared/lib/result';
import { db } from './_fixtures';
import { delay } from './_latency';

export class FakeNotificationService implements INotificationService {
  async list(params?: { unreadOnly?: boolean }): Promise<Result<readonly Notification[]>> {
    await delay();
    const items = params?.unreadOnly
      ? db.notifications.filter((n) => n.readAt === null)
      : db.notifications;
    return ok(items);
  }

  async markRead(id: string): Promise<Result<void>> {
    await delay(60, 120);
    const i = db.notifications.findIndex((n) => n.id === id);
    if (i >= 0) {
      const existing = db.notifications[i];
      if (existing) db.notifications[i] = { ...existing, readAt: new Date().toISOString() };
    }
    return ok(undefined);
  }

  async markAllRead(): Promise<Result<void>> {
    await delay();
    const ts = new Date().toISOString();
    for (let i = 0; i < db.notifications.length; i += 1) {
      const n = db.notifications[i];
      if (n && n.readAt === null) db.notifications[i] = { ...n, readAt: ts };
    }
    return ok(undefined);
  }
}
