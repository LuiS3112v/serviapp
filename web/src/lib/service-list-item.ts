import { Service } from "./services.api";
import { SubcategoryServiceData } from "./subcategory-services.api";

// ══════════════════════════════════════════════════════════════════════
// ServiceListItem — o único formato que a UI conhece.
//
// A Service Page nunca sabe se um item veio da tabela 'services' ou da
// tabela 'subcategory_services'. Ela só vê ServiceListItem. Isto é o
// que elimina a duplicação de listas/estados/renderização apontada nos
// dois prompts: existe UMA colecção, UM tipo de dados, UM componente de
// card — a origem fica só no campo sourceType, usado apenas para saber
// que acção disparar (aceitar/propor um Service normal vs. propor/
// recusar um pedido rápido) e que rota abrir.
// ══════════════════════════════════════════════════════════════════════

export type ServiceListItemSourceType = "normal" | "quick";

// Estado unificado — os SubcategoryServices, antes de serem convertidos,
// mapeiam para "requested" (equivalente a "Aguardando resposta"), o que
// os faz cair naturalmente na mesma tab "Pendente" que já existe para
// serviços normais, sem precisar de nenhuma tab nova.
export interface ServiceListItem {
  id: string;
  sourceType: ServiceListItemSourceType;

  title: string;
  category: string;
  subcategory?: string;
  address: string;
  province?: string;

  status: string;
  budget: number;
  agreedPrice?: number;
  proposedPrice?: number;

  clientId: string;
  clientName?: string;
  providerId?: string;
  providerName?: string;

  createdAt: string;
  scheduledAt?: string;
  description?: string;

  // Só relevante para sourceType==="quick": propostas recebidas, usado
  // pelo ServiceCard do cliente para mostrar Aceitar/Recusar por
  // proposta em vez de um único preço.
  quickProposals?: {
    id: string;
    providerId: string;
    providerName?: string;
    proposedPrice: number;
  }[];

  // Só relevante para sourceType==="quick": se true, este prestador já
  // propôs valor ou já recusou este pedido — usado para esconder os
  // botões de acção no card do prestador.
  quickAlreadyActed?: boolean;
}

export function mapNormalService(s: Service): ServiceListItem {
  return {
    id: s.id,
    sourceType: "normal",
    title: s.title,
    category: s.category,
    address: s.address,
    province: s.province,
    status: s.status,
    budget: Number(s.budget),
    agreedPrice: s.agreedPrice != null ? Number(s.agreedPrice) : undefined,
    proposedPrice: s.proposedPrice != null ? Number(s.proposedPrice) : undefined,
    clientId: s.clientId,
    clientName: s.client?.fullName,
    providerId: s.providerId,
    providerName: s.provider?.fullName,
    createdAt: s.createdAt,
    scheduledAt: s.scheduledAt,
    description: s.description,
  };
}

// SubcategoryServiceStatus → status equivalente do Service, para caber
// nas mesmas tabs/filtros já existentes sem inventar nenhuma nova.
// broadcasting/client_reviewing (ainda sem prestador atribuído) mapeiam
// para "requested", que já é reconhecido por TAB_STATUSES.pending em
// ambas as páginas.
function mapQuickStatus(status: SubcategoryServiceData["status"]): string {
  switch (status) {
    case "broadcasting":
    case "client_reviewing":
      return "requested";
    case "cancelled":
      return "cancelled";
    case "converted":
      // Não deveria aparecer na listagem — ver filtro em buildUnifiedList.
      return "requested";
    default:
      return "requested";
  }
}

export function mapQuickService(q: SubcategoryServiceData): ServiceListItem {
  return {
    id: q.id,
    sourceType: "quick",
    title: q.subcategory,
    category: q.category,
    subcategory: q.subcategory,
    address: q.address,
    status: mapQuickStatus(q.status),
    budget: q.proposals?.[0]?.proposedPrice ?? 0,
    clientId: q.clientId,
    clientName: q.client?.fullName,
    createdAt: q.createdAt,
    quickProposals: q.proposals?.map((p) => ({
      id: p.id,
      providerId: p.providerId,
      providerName: p.provider?.fullName,
      proposedPrice: Number(p.proposedPrice),
    })),
  };
}

export function mapQuickServiceForProvider(
  q: SubcategoryServiceData,
  currentProviderId: string,
): ServiceListItem {
  const item = mapQuickService(q);
  item.quickAlreadyActed = (q.proposals ?? []).some((p) => p.providerId === currentProviderId);
  return item;
}

// Junta as duas fontes numa única colecção ordenada por data — nunca
// duas ordenações separadas. SubcategoryServices já convertidos nunca
// entram aqui: assim que aceites, passam a existir só como Service
// normal (o próprio backend já faz esta transição), por isso filtrar
// status==="converted" evita qualquer duplicado visual do mesmo pedido.
export function buildUnifiedList(
  normalServices: Service[],
  quickServices: SubcategoryServiceData[],
  options?: { forProviderId?: string },
): ServiceListItem[] {
  const normalItems = normalServices.map(mapNormalService);

  const activeQuick = quickServices.filter((q) => q.status !== "converted");
  const quickItems = options?.forProviderId
    ? activeQuick.map((q) => mapQuickServiceForProvider(q, options.forProviderId!))
    : activeQuick.map(mapQuickService);

  return [...normalItems, ...quickItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}