import {
  IconLimpeza,
  IconClimatizacao,
  IconCanalizacao,
  IconEletricidade,
  IconTIRedes,
  IconJardinagem,
  IconMudancas,
  IconBeleza,
  IconAutomovel,
  IconPintura,
  IconConstrucao,
  IconSeguranca,
} from './mestroo-icons';
import type { LucideIcon } from 'lucide-react';

export interface CategoryMeta {
  name: string;
  Icon: any;
  color: string;
  desc: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { name: 'Limpeza',      Icon: IconLimpeza,       color: '#0E7A5F', desc: 'Limpeza residencial e comercial' },
  { name: 'Climatização', Icon: IconClimatizacao,  color: '#0284C7', desc: 'Instalação e manutenção de AC' },
  { name: 'Canalização',  Icon: IconCanalizacao,   color: '#0D9488', desc: 'Fugas, instalações e reparações' },
  { name: 'Eletricidade', Icon: IconEletricidade,  color: '#B45309', desc: 'Instalações eléctricas e reparações' },
  { name: 'TI & Redes',   Icon: IconTIRedes,       color: '#4F46E5', desc: 'Suporte técnico e redes' },
  { name: 'Jardinagem',   Icon: IconJardinagem,    color: '#65A30D', desc: 'Poda, manutenção e paisagismo' },
  { name: 'Mudanças',     Icon: IconMudancas,      color: '#0891B2', desc: 'Transporte e mudanças de casa' },
  { name: 'Beleza',       Icon: IconBeleza,        color: '#E11D48', desc: 'Cabeleireiro, manicure e estética' },
  { name: 'Automóvel',    Icon: IconAutomovel,     color: '#2563EB', desc: 'Mecânica e manutenção auto' },
  { name: 'Pintura',      Icon: IconPintura,       color: '#7C3AED', desc: 'Pintura de interiores e exteriores' },
  { name: 'Construção',   Icon: IconConstrucao,    color: '#C2410C', desc: 'Obras, remodelações e acabamentos' },
  { name: 'Segurança',    Icon: IconSeguranca,     color: '#475569', desc: 'Vigilância e sistemas de segurança' },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export type CategoryName = typeof CATEGORY_NAMES[number];

export const CATEGORY_BY_NAME: Record<string, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c]),
);

export const DEFAULT_CATEGORY_ICON: { Icon: any; color: string } = {
  Icon: IconConstrucao,
  color: '#64748b',
};