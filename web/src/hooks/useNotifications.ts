"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi, AppNotification } from '@/lib/notifications.api';
import { requestPushPermission, onForegroundMessage } from '@/lib/firebase';
import { getToken } from '@/lib/auth.api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false); // guarda contra chamadas concorrentes de load()

  const load = useCallback(async (reset = false) => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    if (loadingRef.current) return; // já existe um load em andamento — ignora
    loadingRef.current = true;
    setLoading(true);
    try {
      const p = reset ? 1 : page;
      const data = await notificationsApi.getAll(p, 20);
      setNotifications(prev => {
        const merged = reset ? data.notifications : [...prev, ...data.notifications];
        // dedupe defensivo por id, mantendo a primeira ocorrência
        return Array.from(new Map(merged.map(n => [n.id, n])).values());
      });
      setUnread(data.unread);
      setHasMore(data.notifications.length === 20);
      if (!reset) setPage(p + 1);
      else setPage(2); // próxima página após reset é a 2
    } catch {
      if (reset) setNotifications([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
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
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: payload.data?.type ?? 'system',
          title: payload.notification?.title ?? '',
          body: payload.notification?.body ?? '',
          status: 'unread',
          priority: 'medium',
          createdAt: new Date().toISOString(),
        };
        setNotifications(prev => {
          const merged = [n, ...prev];
          return Array.from(new Map(merged.map(x => [x.id, x])).values());
        });
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