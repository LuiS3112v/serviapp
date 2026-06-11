"use client";
import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminStats, AdminUser, AdminKyc } from "@/lib/api/admin";

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [pendingKyc, setPendingKyc] = useState<AdminKyc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, u, k] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRecentUsers(),
        adminApi.getPendingKyc(),
      ]);
      setStats(s);
      setRecentUsers(u);
      setPendingKyc(k);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [fetch]);

  const approveKyc = async (id: string) => {
    await adminApi.approveKyc(id);
    setPendingKyc(prev => prev.filter(k => k.id !== id));
    if (stats) setStats({ ...stats, pendingKyc: Math.max(0, stats.pendingKyc - 1) });
  };

  const rejectKyc = async (id: string) => {
    await adminApi.rejectKyc(id);
    setPendingKyc(prev => prev.filter(k => k.id !== id));
    if (stats) setStats({ ...stats, pendingKyc: Math.max(0, stats.pendingKyc - 1) });
  };

  return { stats, recentUsers, pendingKyc, loading, error, refresh: fetch, approveKyc, rejectKyc };
}