import { useEffect, useRef } from 'react';
import { activateLocation } from '@/lib/geolocation.api';

const MOVEMENT_INTERVAL_MS = 6000;
const IDLE_INTERVAL_MS = 30000;
const SIGNIFICANT_MOVEMENT_METERS = 15;

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Emite a posição do prestador para o backend enquanto a partilha
// estiver ativa. Reduz a frequência de envio quando não há movimento
// significativo, seguindo a estratégia de custo descrita no prompt
// mestre: 5-8s em deslocação, 30s quando parado.
export function useProviderLocationBroadcast(isSharingEnabled: boolean): void {
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSharingEnabled || !navigator.geolocation) {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const last = lastSentRef.current;

        const hasMovedSignificantly =
          !last || distanceMeters(last.latitude, last.longitude, latitude, longitude) > SIGNIFICANT_MOVEMENT_METERS;

        const intervalSinceLastSend = last ? Date.now() - last.timestamp : Infinity;
        const requiredInterval = hasMovedSignificantly ? MOVEMENT_INTERVAL_MS : IDLE_INTERVAL_MS;

        if (intervalSinceLastSend < requiredInterval) {
          return;
        }

        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
        }

        throttleTimerRef.current = setTimeout(() => {
          activateLocation(latitude, longitude).catch(() => {
            // Falhas de rede pontuais não devem interromper o watch —
            // a próxima atualização de posição tenta novamente.
          });
          lastSentRef.current = { latitude, longitude, timestamp: Date.now() };
        }, 300);
      },
      () => {
        // Erro silencioso: se o GPS falhar temporariamente, o watch
        // mantém-se ativo e tenta novamente na próxima atualização.
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, [isSharingEnabled]);
}