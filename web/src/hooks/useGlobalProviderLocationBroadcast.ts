import { useEffect, useRef, useCallback } from 'react';
import { activeServiceLocationSocket } from '@/lib/map/active-service-location.socket';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth.api';

// Intervalo de envio de posição quando o provider está em movimento
const MOVEMENT_INTERVAL_MS = 6000;
// Intervalo de envio de posição quando o provider está parado
const IDLE_INTERVAL_MS = 30000;
// Deslocamento mínimo (metros) para ser considerado movimento real
const SIGNIFICANT_MOVEMENT_METERS = 15;
// Com que frequência verificamos se existe um serviço activo (30s)
const POLL_ACTIVE_SERVICE_MS = 30000;

// Estados do serviço em que o provider deve transmitir a sua localização.
// Inclui ACCEPTED e PAYMENT_HELD (provider a caminho) e IN_PROGRESS
// (serviço em execução — o cliente pode continuar a ver a localização).
const BROADCAST_STATUSES = ['accepted', 'payment_held', 'in_progress'];

function distanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Hook montado no ProviderChrome (layout persistente do provider).
// Transmite a localização do provider via WebSocket para o gateway
// /service-location SEMPRE que existe um serviço activo, independente-
// mente da página em que o provider se encontra.
//
// Fluxo:
//   1. Polling a cada 30s a GET /services/provider/my para encontrar
//      um serviço em ACCEPTED / PAYMENT_HELD / IN_PROGRESS.
//   2. Se existir → liga watchPosition e emite update_provider_location.
//   3. Se o serviço terminar ou passar a outro estado → para o watch.
//   4. O cliente (ServiceMap) recebe provider_location em tempo real
//      independentemente da página onde o provider navega.
export function useGlobalProviderLocationBroadcast(): void {
  const activeServiceIdRef   = useRef<string | null>(null);
  const watchIdRef           = useRef<number | null>(null);
  const lastSentRef          = useRef<{ lat: number; lng: number; ts: number } | null>(null);
  const throttleTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef         = useRef(true);

  // Para e limpa o watchPosition actual
  const stopWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    lastSentRef.current = null;
  }, []);

  // Inicia o watchPosition para um serviceId concreto
  const startWatch = useCallback((serviceId: string) => {
    if (!navigator.geolocation) return;
    if (watchIdRef.current != null) return; // já está activo

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (!isMountedRef.current) return;

        const { latitude: lat, longitude: lng } = position.coords;
        const last = lastSentRef.current;

        const moved = !last ||
          distanceMeters(last.lat, last.lng, lat, lng) > SIGNIFICANT_MOVEMENT_METERS;

        const elapsed = last ? Date.now() - last.ts : Infinity;
        const required = moved ? MOVEMENT_INTERVAL_MS : IDLE_INTERVAL_MS;

        if (elapsed < required) return;

        if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);

        throttleTimerRef.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          activeServiceLocationSocket.updateProviderLocation(serviceId, { latitude: lat, longitude: lng });
          lastSentRef.current = { lat, lng, ts: Date.now() };
        }, 300);
      },
      () => {
        // Erro pontual de GPS — o watch continua, próxima posição tenta de novo
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
  }, []);

  // Verifica se existe um serviço activo para este provider
  const checkActiveService = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Sem token (logout) → para tudo
    if (!getToken()) {
      stopWatch();
      activeServiceIdRef.current = null;
      return;
    }

    try {
      // Busca todos os serviços do provider e filtra pelos estados activos.
      // Usa o endpoint existente — não cria nenhum novo endpoint no backend.
      const services = await api.get<{ id: string; status: string }[]>(
        '/services/provider/my',
      );

      if (!isMountedRef.current) return;

      const active = services.find((s) => BROADCAST_STATUSES.includes(s.status));

      if (active) {
        if (activeServiceIdRef.current !== active.id) {
          // Serviço novo (ou primeiro) — reinicia o watch para o novo id
          stopWatch();
          activeServiceIdRef.current = active.id;
          startWatch(active.id);
        }
        // Se já é o mesmo serviço, o watch continua sem interrupção
      } else {
        // Sem serviço activo → para o broadcast
        if (activeServiceIdRef.current) {
          stopWatch();
          activeServiceIdRef.current = null;
        }
      }
    } catch {
      // Falha de rede — mantém o estado actual sem crashar
    }
  }, [startWatch, stopWatch]);

  useEffect(() => {
    isMountedRef.current = true;

    // Verifica imediatamente ao montar
    checkActiveService();

    // Polling periódico para detectar mudanças de estado do serviço
    pollTimerRef.current = setInterval(checkActiveService, POLL_ACTIVE_SERVICE_MS);

    return () => {
      isMountedRef.current = false;
      stopWatch();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [checkActiveService, stopWatch]);
}