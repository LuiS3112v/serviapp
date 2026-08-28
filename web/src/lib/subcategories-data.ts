import {
  IconLimpezaDomestica,
  IconLimpezaPosObra,
  IconLimpezaEscritorios,
  IconLimpezaVidros,
  IconLimpezaEstofos,
  IconLimpezaCondominios,
  // Climatização
  IconRecargaGas,
  IconVentilacao,
  IconClimatizacao,
  // Canalização
  IconDesentupimentos,
  IconBombaAgua,
  IconCanalizacao,
  // Eletricidade
  IconTomadas,
  IconQuadroEletrico,
  IconEnergiaSolar,
  IconEletricidade,
  // TI & Redes
  IconWebsites,
  IconAppMoveis,
  IconReparacaoComputadores,
  IconReparacaoTelemoveis,
  IconWifi,
  IconDesignGrafico,
  // Jardinagem
  IconCorteRelva,
  IconSistemasRega,
  IconManutencaoJardim,
  IconJardinagem,
  // Mudanças
  IconTransporteMoveis,
  IconMudancas,
  // Beleza
  IconBarbeiro,
  IconCabeleireiro,
  IconTrancas,
  IconManicure,
  IconMaquilhagem,
  IconLimpezaFacial,
  // Automóvel
  IconMecanicaGeral,
  IconEletricidadeAuto,
  IconDiagnostico,
  IconPneus,
  IconLavagemAuto,
  IconVendaPecas,
  // Pintura
  IconPinturaInterior,
  IconPinturaExterior,
  IconPinturaDecorativa,
  IconGrafite,
  IconQuadros,
  IconPintura,
  // Construção
  IconPedreiro,
  IconCarpinteiro,
  IconSerralheiro,
  IconGesseiro,
  IconRemodelaçao,
  IconConstrucao,
  // Segurança
  IconSegurancaResidencial,
  IconSegurancaEmpresarial,
  IconSegurancaEventos,
  IconSeguranca,
  IconAlarmes,
  IconControloAcessos,
} from './mestroo-icons';

import { Lightbulb, Wrench, Droplet, Sprout, Trees, Scissors, Home, Building2, Store, Boxes, Truck } from 'lucide-react';
import type { CategoryName } from './categories';

export interface SubcategoryItem {
  name: string;
  icon: any;
}

export const SUBCATEGORIES: Record<CategoryName, SubcategoryItem[]> = {
  'Limpeza': [
    { name: 'Limpeza doméstica',      icon: IconLimpezaDomestica },
    { name: 'Limpeza pós-obra',       icon: IconLimpezaPosObra },
    { name: 'Limpeza de escritórios', icon: IconLimpezaEscritorios },
    { name: 'Limpeza de vidros',      icon: IconLimpezaVidros },
    { name: 'Limpeza de estofos',     icon: IconLimpezaEstofos },
    { name: 'Limpeza de condomínios', icon: IconLimpezaCondominios },
  ],
  'Climatização': [
    { name: 'Instalação',     icon: Wrench },
    { name: 'Manutenção',     icon: IconClimatizacao },
    { name: 'Reparação',      icon: IconClimatizacao },
    { name: 'Limpeza',        icon: IconLimpezaVidros },
    { name: 'Recarga de gás', icon: IconRecargaGas },
    { name: 'Ventilação',     icon: IconVentilacao },
  ],
  'Canalização': [
    { name: 'Reparação de fugas', icon: IconCanalizacao },
    { name: 'Instalação',         icon: Wrench },
    { name: 'Desentupimentos',    icon: IconDesentupimentos },
    { name: 'Torneiras',          icon: IconCanalizacao },
    { name: 'Sanitas',            icon: IconDesentupimentos },
    { name: 'Bombas de água',     icon: IconBombaAgua },
  ],
  'Eletricidade': [
    { name: 'Instalação elétrica', icon: Wrench },
    { name: 'Reparação elétrica',  icon: IconEletricidade },
    { name: 'Iluminação',          icon: Lightbulb },
    { name: 'Tomadas',             icon: IconTomadas },
    { name: 'Quadros elétricos',   icon: IconQuadroEletrico },
    { name: 'Energia solar',       icon: IconEnergiaSolar },
  ],
  'TI & Redes': [
    { name: 'Websites',                  icon: IconWebsites },
    { name: 'Aplicações móveis',          icon: IconAppMoveis },
    { name: 'Reparação de computadores',  icon: IconReparacaoComputadores },
    { name: 'Reparação de telemóveis',    icon: IconReparacaoTelemoveis },
    { name: 'Redes Wi-Fi',                icon: IconWifi },
    { name: 'Design gráfico',             icon: IconDesignGrafico },
  ],
  'Jardinagem': [
    { name: 'Corte de relva',   icon: IconCorteRelva },
    { name: 'Paisagismo',       icon: Trees },
    { name: 'Poda',             icon: IconJardinagem },
    { name: 'Plantação',        icon: Sprout },
    { name: 'Sistemas de rega', icon: IconSistemasRega },
    { name: 'Manutenção',       icon: IconManutencaoJardim },
  ],
  'Mudanças': [
    { name: 'Casas',                     icon: Home },
    { name: 'Apartamentos',              icon: Building2 },
    { name: 'Escritórios',               icon: Building2 },
    { name: 'Lojas',                     icon: Store },
    { name: 'Transporte de móveis',      icon: IconTransporteMoveis },
    { name: 'Transporte de mercadorias', icon: IconMudancas },
  ],
  'Beleza': [
    { name: 'Barbeiro',            icon: IconBarbeiro },
    { name: 'Cabeleireiro',        icon: IconCabeleireiro },
    { name: 'Tranças',             icon: IconTrancas },
    { name: 'Manicure & Pedicure', icon: IconManicure },
    { name: 'Maquilhagem',         icon: IconMaquilhagem },
    { name: 'Limpeza facial',      icon: IconLimpezaFacial },
  ],
  'Automóvel': [
    { name: 'Mecânica geral',    icon: IconMecanicaGeral },
    { name: 'Eletricidade Auto', icon: IconEletricidadeAuto },
    { name: 'Diagnóstico',       icon: IconDiagnostico },
    { name: 'Pneus',             icon: IconPneus },
    { name: 'Lavagem',           icon: IconLavagemAuto },
    { name: 'Venda de peças',    icon: IconVendaPecas },
  ],
  'Pintura': [
    { name: 'Pintura interior',       icon: IconPinturaInterior },
    { name: 'Pintura exterior',       icon: IconPinturaExterior },
    { name: 'Pintura decorativa',     icon: IconPinturaDecorativa },
    { name: 'Murais',                 icon: IconGrafite },
    { name: 'Grafite autorizado',     icon: IconGrafite },
    { name: 'Quadros personalizados', icon: IconQuadros },
  ],
  'Construção': [
    { name: 'Pedreiro',    icon: IconPedreiro },
    { name: 'Carpinteiro', icon: IconCarpinteiro },
    { name: 'Serralheiro', icon: IconSerralheiro },
    { name: 'Pintor',      icon: IconPintura },
    { name: 'Gesseiro',    icon: IconGesseiro },
    { name: 'Remodelação', icon: IconRemodelaçao },
  ],
  'Segurança': [
    { name: 'Segurança residencial',  icon: IconSegurancaResidencial },
    { name: 'Segurança empresarial',  icon: IconSegurancaEmpresarial },
    { name: 'Segurança para eventos', icon: IconSegurancaEventos },
    { name: 'CCTV',                   icon: IconSeguranca },
    { name: 'Alarmes',                icon: IconAlarmes },
    { name: 'Controlo de acessos',    icon: IconControloAcessos },
  ],
};