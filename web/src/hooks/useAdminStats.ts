"use client";
import { useEffect, useState, useCallback } from "react";
import { adminApi, AdminStats, AdminUser, AdminKyc } from "@/lib/api/admin";

export function useAdminStats() {
  const [stats, setStats]           = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [pendingKyc, setPendingKyc]   = useState<AdminKyc[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Carrega KYC individual e empresarial em paralelo e junta numa lista
      const [s, u, kyc, companyKyc] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRecentUsers(),
        adminApi.getPendingKyc(),
        adminApi.getPendingCompanyKyc().catch(() => [] as AdminKyc[]),
      ]);
      setStats(s);
      setRecentUsers(u);
      // Junta os dois tipos numa lista só — o frontend mostra badge "Empresa" vs "Individual"
      setPendingKyc([...kyc, ...companyKyc]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const approveKyc = async (item: AdminKyc) => {
    if (item.type === 'company') {
      await adminApi.approveCompanyKyc(item.id);
    } else {
      await adminApi.approveKyc(item.id);
    }
    setPendingKyc(prev => prev.filter(k => k.id !== item.id));
    if (stats) setStats({ ...stats, pendingKyc: Math.max(0, stats.pendingKyc - 1) });
  };

  const rejectKyc = async (item: AdminKyc, reason = 'Rejeitado pelo administrador') => {
    if (item.type === 'company') {
      await adminApi.rejectCompanyKyc(item.id, reason);
    } else {
      await adminApi.rejectKyc(item.id);
    }
    setPendingKyc(prev => prev.filter(k => k.id !== item.id));
    if (stats) setStats({ ...stats, pendingKyc: Math.max(0, stats.pendingKyc - 1) });
  };

  return { stats, recentUsers, pendingKyc, loading, error, refresh: fetchAll, approveKyc, rejectKyc };
}