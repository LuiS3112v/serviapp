import { useEffect, useRef } from 'react';
import { activeServiceLocationSocket } from '@/lib/map/active-service-location.socket';

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

// Emite a posição do prestador via socket update_provider_location
// enquanto isActive for true — usado dentro do ProviderServiceDetailPage,
// condicionado a service.status === "in_progress". Segue a mesma
// cadência de custo do broadcast de descoberta (6s em movimento, 30s
// parado), mas envia para o gateway /service-location em vez do
// endpoint REST /geolocation/location, já que esta emissão é privada
// a um único serviço, não à descoberta pública.
export function useProviderActiveServiceLocationBroadcast(
  serviceId: string,
  isActive: boolean,
): void {
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isActive || !navigator.geolocation) {
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
          activeServiceLocationSocket.updateProviderLocation(serviceId, { latitude, longitude });
          lastSentRef.current = { latitude, longitude, timestamp: Date.now() };
        }, 300);
      },
      () => {
        // Erro pontual de GPS não interrompe o watch — a próxima
        // atualização de posição tenta novamente.
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, [isActive, serviceId]);
}