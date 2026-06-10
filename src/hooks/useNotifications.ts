"use client";

import { useState, useEffect, useCallback } from 'react';
import { notificationsApi, AppNotification } from '@/lib/notifications.api';
import { requestPushPermission, onForegroundMessage } from '@/lib/firebase';
import { getToken } from '@/lib/auth.api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (reset = false) => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const p = reset ? 1 : page;
      const data = await notificationsApi.getAll(p, 20);
      setNotifications(prev => reset ? data.notifications : [...prev, ...data.notifications]);
      setUnread(data.unread);
      setHasMore(data.notifications.length === 20);
      if (!reset) setPage(p + 1);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(true); }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let unsubscribe: (() => void) | null = null;

    requestPushPermission().then(async fcmToken => {
      if (fcmToken) {
        await notificationsApi.registerToken(fcmToken).catch(() => {});
      }
      unsubscribe = await onForegroundMessage((payload) => {
        const n: AppNotification = {
          id: Date.now().toString(),
          type: payload.data?.type ?? 'system',
          title: payload.notification?.title ?? '',
          body: payload.notification?.body ?? '',
          status: 'unread',
          priority: 'medium',
          createdAt: new Date().toISOString(),
        };
        setNotifications(prev => [n, ...prev]);
        setUnread(c => c + 1);
      });
    });

    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const markAsRead = async (id: string) => {
    await notificationsApi.markAsRead(id).catch(() => {});
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, status: 'read' as const } : n)
    );
    setUnread(c => Math.max(0, c - 1));
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllAsRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));
    setUnread(0);
  };

  const deleteNotification = async (id: string) => {
    await notificationsApi.delete(id).catch(() => {});
    const n = notifications.find(x => x.id === id);
    setNotifications(prev => prev.filter(x => x.id !== id));
    if (n?.status === 'unread') setUnread(c => Math.max(0, c - 1));
  };

  const loadMore = () => { if (hasMore && !loading) load(false); };

  return {
    notifications, unread, loading, hasMore,
    markAsRead, markAllAsRead, deleteNotification, loadMore,
    refresh: () => load(true),
  };
}