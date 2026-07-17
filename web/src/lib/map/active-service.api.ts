import { api } from '@/lib/api';

export interface ActiveServiceSummary {
  serviceId: string;
  status: string;
  title: string;
  providerId: string;
  providerName: string | null;
  providerAvatarUrl: string | null;
}

export interface ServiceLocationSnapshotResponse {
  serviceId: string;
  providerId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export const activeServiceApi = {
  // Chamado pelo map/page.tsx do cliente ao carregar, para descobrir
  // automaticamente se existe um serviço em curso que deva colocar o
  // mapa em Modo Serviço Ativo. Devolve null quando não existe nenhum,
  // mantendo o mapa em Modo Descoberta.
  getMyActiveService: () =>
    api.get<ActiveServiceSummary | null>('/active-service-location/mine'),

  getSnapshot: (serviceId: string) =>
    api.get<ServiceLocationSnapshotResponse | null>(
      `/active-service-location/${serviceId}/snapshot`,
    ),
};