import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationInput {
  type: NotificationType;
  title: string;
  titleEn: string;
  body?: string;
  bodyEn?: string;
  /** Web path; `{area}` is replaced with "admin" or "portal" for each recipient. */
  link?: string;
}

/**
 * In-app notifications. Every notification goes through `send`, so an email channel can be added
 * here later without touching the features that notify.
 */
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /** The people to tell about a project: the municipality's admins plus the staff assigned to it. */
  async projectRecipients(tenantId: string, projectId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        OR: [{ role: 'ADMIN' }, { assignments: { some: { projectId } } }],
      },
      select: { id: true, role: true },
    });
  }

  async admins(tenantId: string) {
    return this.prisma.user.findMany({ where: { tenantId, status: 'ACTIVE', role: 'ADMIN' }, select: { id: true, role: true } });
  }

  async send(tenantId: string, recipients: { id: string; role: string }[], n: NotificationInput) {
    if (!recipients.length) return;
    await this.prisma.notification.createMany({
      data: recipients.map((u) => ({
        tenantId,
        userId: u.id,
        type: n.type,
        title: n.title,
        titleEn: n.titleEn,
        body: n.body,
        bodyEn: n.bodyEn,
        link: n.link?.replace('{area}', u.role === 'ADMIN' ? 'admin' : 'portal'),
      })),
    });
  }

  list(userId: string, unreadOnly: boolean) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async unreadCount(userId: string) {
    return { count: await this.prisma.notification.count({ where: { userId, readAt: null } }) };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }
}
