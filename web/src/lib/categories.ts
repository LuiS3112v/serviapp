import {
  Sparkles, Wind, Wrench, Zap, Monitor, Leaf,
  Package, Scissors, Car, Paintbrush, HardHat, Lock,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryMeta {
  name: string;
  Icon: LucideIcon;
  color: string;
  desc: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { name: 'Limpeza',      Icon: Sparkles,   color: '#0E7A5F', desc: 'Limpeza residencial e comercial' },
  { name: 'Climatização', Icon: Wind,       color: '#0284C7', desc: 'Instalação e manutenção de AC' },
  { name: 'Canalização',  Icon: Wrench,     color: '#0D9488', desc: 'Fugas, instalações e reparações' },
  { name: 'Eletricidade', Icon: Zap,        color: '#B45309', desc: 'Instalações eléctricas e reparações' },
  { name: 'TI & Redes',   Icon: Monitor,    color: '#4F46E5', desc: 'Suporte técnico e redes' },
  { name: 'Jardinagem',   Icon: Leaf,       color: '#65A30D', desc: 'Poda, manutenção e paisagismo' },
  { name: 'Mudanças',     Icon: Package,    color: '#0891B2', desc: 'Transporte e mudanças de casa' },
  { name: 'Beleza',       Icon: Scissors,   color: '#E11D48', desc: 'Cabeleireiro, manicure e estética' },
  { name: 'Automóvel',    Icon: Car,        color: '#2563EB', desc: 'Mecânica e manutenção auto' },
  { name: 'Pintura',      Icon: Paintbrush, color: '#7C3AED', desc: 'Pintura de interiores e exteriores' },
  { name: 'Construção',   Icon: HardHat,    color: '#C2410C', desc: 'Obras, remodelações e acabamentos' },
  { name: 'Segurança',    Icon: Lock,       color: '#475569', desc: 'Vigilância e sistemas de segurança' },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export type CategoryName = typeof CATEGORY_NAMES[number];

export const CATEGORY_BY_NAME: Record<string, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c]),
);

export const DEFAULT_CATEGORY_ICON: { Icon: LucideIcon; color: string } = {
  Icon: Wrench,
  color: '#64748b',
};