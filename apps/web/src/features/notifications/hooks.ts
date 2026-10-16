'use client';

import { useQuery } from '@tanstack/react-query';
import { useAction } from '@/lib/query';
import { notificationsApi } from './api';

export const notificationKeys = { all: ['notifications'] as const, count: ['notifications', 'count'] as const, list: ['notifications', 'list'] as const };

/** Unread count, refreshed every minute so new notifications appear without reloading. */
export function useUnreadCount() {
  return useQuery({ queryKey: notificationKeys.count, queryFn: notificationsApi.count, refetchInterval: 60_000 });
}

export function useNotifications(enabled: boolean) {
  return useQuery({ queryKey: notificationKeys.list, queryFn: notificationsApi.list, enabled });
}

export function useReadNotification() {
  return useAction(notificationsApi.read, { invalidate: [notificationKeys.all] });
}

export function useReadAllNotifications() {
  return useAction(() => notificationsApi.readAll(), { invalidate: [notificationKeys.all] });
}
