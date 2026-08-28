// lib/mestroo-icons.tsx
// SVG icons customizados para a Mestroo.
// Todos usam stroke (não fill), strokeWidth=1.5, strokeLinecap/join=round
// viewBox 24×24 — mesma grade que o Lucide.

import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Props que vão para o <svg> — sem propriedades CSS inline
const svgProps = (size: number, color: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color,
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg",
});

// ─────────────────────────────────────────────
//  LIMPEZA
// ─────────────────────────────────────────────

export const IconLimpeza = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <line x1="16" y1="3" x2="9" y2="20" />
    <path d="M7 17 Q9 20 11 17 Q13 14 11 13 Q9 12 7 14 Z" />
    <path d="M16 11 h5 l-1.5 7 a1 1 0 0 1-1 .9 h-2 a1 1 0 0 1-1-.9 Z" />
    <path d="M16 11 q.5-2 2.5-2 t2.5 2" />
  </svg>
);

export const IconLimpezaDomestica = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M8 18 V9 a2 2 0 0 1 2-2 h2 V5 h-3 a1 1 0 0 0-1 1 v1" />
    <rect x="8" y="14" width="5" height="5" rx="1" />
    <line x1="13" y1="9" x2="18" y2="9" />
    <line x1="18" y1="9" x2="18" y2="12" />
    <circle cx="20" cy="10" r=".6" fill={color} stroke="none" />
    <circle cx="21" cy="12" r=".6" fill={color} stroke="none" />
    <circle cx="20" cy="14" r=".6" fill={color} stroke="none" />
  </svg>
);

export const IconLimpezaPosObra = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M5 20 L10 15" />
    <path d="M10 15 L14 11 L18 7" />
    <path d="M18 7 L20 5" />
    <path d="M8 17 L13 17 L13 13 L8 13 Z" />
    <circle cx="17" cy="15" r=".8" fill={color} stroke="none" />
    <circle cx="20" cy="17" r=".8" fill={color} stroke="none" />
    <circle cx="15" cy="18" r=".6" fill={color} stroke="none" />
  </svg>
);

export const IconLimpezaEscritorios = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="2" y="10" width="20" height="4" rx="1" />
    <line x1="6" y1="14" x2="6" y2="20" />
    <line x1="18" y1="14" x2="18" y2="20" />
    <rect x="8" y="4" width="8" height="6" rx="1" />
    <line x1="16" y1="18" x2="18" y2="16" />
    <line x1="17" y1="20" x2="19" y2="18" />
  </svg>
);

export const IconLimpezaVidros = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <line x1="6" y1="21" x2="15" y2="6" />
    <rect x="13" y="3" width="8" height="5" rx="1" transform="rotate(15 13 3)" />
    <line x1="5" y1="12" x2="3" y2="16" />
    <line x1="8" y1="14" x2="6" y2="18" />
  </svg>
);

export const IconLimpezaEstofos = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M3 13 Q3 10 6 10 h12 q3 0 3 3 v4 H3 Z" />
    <path d="M3 17 v2" />
    <path d="M21 17 v2" />
    <line x1="15" y1="10" x2="20" y2="5" />
    <circle cx="20" cy="5" r="1.5" />
  </svg>
);

export const IconLimpezaCondominios = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="3" y="4" width="11" height="17" rx="1" />
    <line x1="7" y1="8" x2="9" y2="8" />
    <line x1="7" y1="12" x2="9" y2="12" />
    <line x1="7" y1="16" x2="9" y2="16" />
    <line x1="17" y1="5" x2="17" y2="18" />
    <path d="M14 18 Q17 20 20 18" />
  </svg>
);

// ─────────────────────────────────────────────
//  CLIMATIZAÇÃO
// ─────────────────────────────────────────────

export const IconClimatizacao = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="2" y="4" width="20" height="8" rx="2" />
    <line x1="2" y1="9" x2="22" y2="9" />
    <line x1="5" y1="12" x2="5" y2="16" />
    <line x1="8.5" y1="12" x2="8.5" y2="17" />
    <line x1="12" y1="12" x2="12" y2="17" />
    <line x1="15.5" y1="12" x2="15.5" y2="17" />
    <line x1="19" y1="12" x2="19" y2="16" />
    <circle cx="19" cy="6.5" r="1" fill={color} stroke="none" />
  </svg>
);

export const IconRecargaGas = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M8 6 h8 a1 1 0 0 1 1 1 v13 a1 1 0 0 1-1 1 H8 a1 1 0 0 1-1-1 V7 a1 1 0 0 1 1-1 Z" />
    <path d="M10 6 V4 h4 v2" />
    <path d="M12 4 V2" />
    <rect x="10" y="2" width="4" height="2" rx=".5" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
);

export const IconVentilacao = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 12 Q14 8 18 9 Q16 13 12 12 Z" />
    <path d="M12 12 Q8 14 7 18 Q11 16 12 12 Z" />
    <path d="M12 12 Q10 8 6 9 Q8 13 12 12 Z" />
    <path d="M12 12 Q16 14 17 18 Q13 16 12 12 Z" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// ─────────────────────────────────────────────
//  CANALIZAÇÃO
// ─────────────────────────────────────────────

export const IconCanalizacao = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M5 10 h7 v4 H5 Z" />
    <path d="M12 12 h4 a2 2 0 0 0 0-4 H12" />
    <line x1="8" y1="14" x2="8" y2="17" />
    <line x1="5" y1="10" x2="5" y2="8" />
    <line x1="5" y1="8" x2="3" y2="8" />
    <path d="M8 18 Q8 21 10 21 Q12 21 12 19 Q12 17 10 16 Q8 17 8 18 Z" />
  </svg>
);

export const IconDesentupimentos = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <line x1="12" y1="3" x2="12" y2="13" />
    <path d="M6 13 Q6 18 12 18 Q18 18 18 13 Z" />
    <line x1="4" y1="21" x2="20" y2="21" />
    <line x1="9" y1="21" x2="9" y2="19" />
    <line x1="12" y1="21" x2="12" y2="18" />
    <line x1="15" y1="21" x2="15" y2="19" />
  </svg>
);

export const IconBombaAgua = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="6" y="10" width="12" height="8" rx="2" />
    <path d="M6 14 H3 a1 1 0 0 1-1-1 v-2 a1 1 0 0 1 1-1 h3" />
    <path d="M18 12 h3 v-6 h-6 v6" />
    <circle cx="12" cy="14" r="3" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
);

// ─────────────────────────────────────────────
//  ELETRICIDADE
// ─────────────────────────────────────────────

export const IconEletricidade = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M13 2 L4 14 h7 l-3 8 L20 10 h-7 Z" />
  </svg>
);

export const IconTomadas = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <circle cx="9" cy="10" r="1.2" />
    <circle cx="15" cy="10" r="1.2" />
    <line x1="12" y1="14" x2="12" y2="17" />
  </svg>
);

export const IconQuadroEletrico = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="7" y="7" width="3" height="5" rx="1" />
    <rect x="11" y="7" width="3" height="5" rx="1" />
    <rect x="15" y="7" width="3" height="5" rx="1" />
    <line x1="7" y1="15" x2="17" y2="15" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </svg>
);

export const IconEnergiaSolar = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="2" y="8" width="20" height="12" rx="1" />
    <line x1="2" y1="14" x2="22" y2="14" />
    <line x1="9" y1="8" x2="9" y2="20" />
    <line x1="15" y1="8" x2="15" y2="20" />
    <circle cx="12" cy="4" r="2" />
    <line x1="12" y1="1" x2="12" y2="2" />
    <line x1="15" y1="2" x2="14.3" y2="2.7" />
    <line x1="9" y1="2" x2="9.7" y2="2.7" />
  </svg>
);

// ─────────────────────────────────────────────
//  TI & REDES
// ─────────────────────────────────────────────

export const IconTIRedes = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <path d="M9 8 L9 14 L11 12 L13 15 L14 14.5 L12 11.5 L14.5 11.5 Z" fill={color} stroke="none" />
  </svg>
);

export const IconWebsites = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <line x1="2" y1="8" x2="22" y2="8" />
    <circle cx="5.5" cy="5.5" r="1" fill={color} stroke="none" />
    <circle cx="8.5" cy="5.5" r="1" fill={color} stroke="none" />
    <rect x="11" y="4.5" width="8" height="2" rx="1" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="6" y1="15" x2="15" y2="15" />
    <line x1="6" y1="18" x2="12" y2="18" />
  </svg>
);

export const IconAppMoveis = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <circle cx="12" cy="5" r="1" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <line x1="8" y1="14" x2="13" y2="14" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

export const IconReparacaoComputadores = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="2" y="4" width="16" height="12" rx="2" />
    <path d="M1 18 h22" />
    <line x1="18" y1="2" x2="22" y2="6" />
    <line x1="20" y1="2" x2="22" y2="4" />
    <path d="M18 6 L14 10" />
    <rect x="12" y="10" width="3" height="3" rx=".5" transform="rotate(45 13.5 11.5)" />
  </svg>
);

export const IconReparacaoTelemoveis = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <path d="M11 5 L13 9 L10 11 L13 18" />
  </svg>
);

export const IconWifi = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M2 8 Q12 2 22 8" />
    <path d="M5 12 Q12 7 19 12" />
    <path d="M8 16 Q12 13 16 16" />
    <circle cx="12" cy="20" r="1.5" fill={color} stroke="none" />
  </svg>
);

export const IconDesignGrafico = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M12 2 C6.48 2 2 6.48 2 12 c0 5.52 4.48 10 10 10 a3 3 0 0 0 3-3 c0-.78-.3-1.5-.8-2 c-.46-.5-.24-1.2.4-1.2 H17 a5 5 0 0 0 5-5 C22 6.48 17.52 2 12 2 Z" />
    <circle cx="8" cy="10" r="1.2" fill={color} stroke="none" />
    <circle cx="12" cy="8" r="1.2" fill={color} stroke="none" />
    <circle cx="16" cy="10" r="1.2" fill={color} stroke="none" />
    <circle cx="7" cy="14" r="1.2" fill={color} stroke="none" />
  </svg>
);

// ─────────────────────────────────────────────
//  JARDINAGEM
// ─────────────────────────────────────────────

export const IconJardinagem = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M6 3 C6 3 16 10 18 12" />
    <path d="M6 3 a2 2 0 1 0 3 3 L18 12" />
    <path d="M6 21 C6 21 16 14 18 12" />
    <path d="M6 21 a2 2 0 1 1 3-3 L18 12" />
    <circle cx="18" cy="12" r="1.5" />
  </svg>
);

export const IconCorteRelva = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="3" y="10" width="18" height="6" rx="2" />
    <path d="M15 10 L18 4" />
    <line x1="18" y1="4" x2="21" y2="4" />
    <circle cx="7" cy="16" r="2" />
    <circle cx="17" cy="16" r="2" />
    <line x1="6" y1="13" x2="18" y2="13" />
  </svg>
);

export const IconSistemasRega = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <line x1="12" y1="20" x2="12" y2="12" />
    <path d="M8 20 h8" />
    <circle cx="12" cy="11" r="2" />
    <path d="M12 9 Q7 5 4 6" />
    <path d="M12 9 Q14 4 17 4" />
    <path d="M12 9 Q17 7 20 9" />
    <circle cx="4" cy="6" r=".7" fill={color} stroke="none" />
    <circle cx="17" cy="4" r=".7" fill={color} stroke="none" />
    <circle cx="20" cy="9" r=".7" fill={color} stroke="none" />
  </svg>
);

export const IconManutencaoJardim = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <line x1="12" y1="8" x2="12" y2="22" />
    <line x1="5" y1="8" x2="19" y2="8" />
    <line x1="7" y1="8" x2="6" y2="13" />
    <line x1="10" y1="8" x2="9.5" y2="13" />
    <line x1="12" y1="8" x2="12" y2="13" />
    <line x1="14" y1="8" x2="14.5" y2="13" />
    <line x1="17" y1="8" x2="18" y2="13" />
    <path d="M5 13 Q12 15 19 13" />
  </svg>
);

// ─────────────────────────────────────────────
//  MUDANÇAS
// ─────────────────────────────────────────────

export const IconMudancas = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M3 9 h18 v11 a1 1 0 0 1-1 1 H4 a1 1 0 0 1-1-1 Z" />
    <path d="M3 9 l2-5 h14 l2 5" />
    <line x1="12" y1="9" x2="12" y2="21" />
    <line x1="7" y1="9" x2="7" y2="4" />
    <line x1="17" y1="9" x2="17" y2="4" />
    <path d="M15 14 l3 2 l-3 2" />
    <line x1="9" y1="16" x2="18" y2="16" />
  </svg>
);

export const IconTransporteMoveis = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="1" y="7" width="14" height="11" rx="1" />
    <path d="M15 10 h5 l2 4 v4 H15 Z" />
    <circle cx="5" cy="18" r="2" />
    <circle cx="12" cy="18" r="2" />
    <circle cx="20" cy="18" r="2" />
    <path d="M16 11 h3 l1.5 3 H16 Z" />
  </svg>
);

// ─────────────────────────────────────────────
//  BELEZA
// ─────────────────────────────────────────────

export const IconBeleza = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M20 4 L8.5 15.5" />
    <circle cx="6" cy="17.5" r="2.5" />
    <path d="M20 20 L8.5 8.5" />
    <circle cx="6" cy="6.5" r="2.5" />
    <circle cx="14" cy="12" r="1" fill={color} stroke="none" />
  </svg>
);

export const IconBarbeiro = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M4 20 L11 13" />
    <rect x="3" y="18" width="3" height="4" rx="1" transform="rotate(-45 4.5 20)" />
    <path d="M11 13 L20 5 a1.5 1.5 0 0 0-2-2 L11 11" />
    <path d="M11 13 L13 11 L20 4" />
    <circle cx="6.5" cy="19.5" r="1" fill={color} stroke="none" />
  </svg>
);

export const IconCabeleireiro = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M5 10 a7 7 0 0 1 14 0 v2 a7 4 0 0 1-14 0 Z" />
    <path d="M12 12 v8 a1 1 0 0 1-2 0 v-4 H7" />
    <path d="M19 11 h3 a1 1 0 0 0 0-2 H19" />
    <line x1="21" y1="7" x2="22" y2="5" />
    <line x1="22" y1="9" x2="23" y2="9" />
    <line x1="21" y1="13" x2="22" y2="15" />
  </svg>
);

export const IconTrancas = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M8 3 Q10 7 8 11 Q6 15 8 21" />
    <path d="M12 3 Q14 7 12 11 Q10 15 12 21" />
    <path d="M16 3 Q14 7 16 11 Q18 15 16 21" />
    <line x1="8" y1="7" x2="12" y2="7" />
    <line x1="12" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="12" y2="15" />
    <line x1="12" y1="19" x2="16" y2="19" />
  </svg>
);

export const IconManicure = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="3" y="10" width="18" height="5" rx="2.5" />
    <line x1="7" y1="11" x2="7" y2="14" />
    <line x1="10" y1="11" x2="10" y2="14" />
    <line x1="13" y1="11" x2="13" y2="14" />
    <line x1="16" y1="11" x2="16" y2="14" />
    <path d="M8 10 Q10 7 12 10" />
    <path d="M13 10 Q15 7 17 10" />
  </svg>
);

export const IconMaquilhagem = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="9" y="14" width="6" height="7" rx="1" />
    <path d="M9 14 V8 h6 v6" />
    <path d="M10 8 Q12 4 14 8" />
    <line x1="16" y1="6" x2="18" y2="4" />
    <line x1="17" y1="8" x2="20" y2="8" />
    <line x1="16" y1="10" x2="18" y2="12" />
  </svg>
);

export const IconLimpezaFacial = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <circle cx="10" cy="12" r="7" />
    <circle cx="8" cy="11" r=".8" fill={color} stroke="none" />
    <circle cx="12" cy="11" r=".8" fill={color} stroke="none" />
    <path d="M8 14 Q10 16 12 14" />
    <path d="M18 4 Q18 8 20 8 Q22 8 22 6 Q22 4 20 3 Q18 2 18 4 Z" />
  </svg>
);

// ─────────────────────────────────────────────
//  AUTOMÓVEL
// ─────────────────────────────────────────────

export const IconAutomovel = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M3 13 l2-5 h14 l2 5 v4 H3 Z" />
    <path d="M5 13 l1.5-3 h11 l1.5 3" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M7 13 l1-2 h8 l1 2 Z" />
  </svg>
);

export const IconMecanicaGeral = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="8" y="2" width="8" height="12" rx="1" />
    <rect x="10" y="4" width="4" height="6" rx=".5" />
    <line x1="12" y1="14" x2="12" y2="18" />
    <path d="M8 18 h3 l2 3 l2-3 h3" />
    <circle cx="9" cy="3" r=".7" fill={color} stroke="none" />
    <circle cx="15" cy="3" r=".7" fill={color} stroke="none" />
  </svg>
);

export const IconEletricidadeAuto = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M2 14 l1.5-4 h13 l1.5 4 v3 H2 Z" />
    <circle cx="6" cy="17" r="1.5" />
    <circle cx="14" cy="17" r="1.5" />
    <path d="M18 8 L15 13 h3 L16 18" />
  </svg>
);

export const IconDiagnostico = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="6" y="2" width="12" height="16" rx="2" />
    <rect x="8" y="4" width="8" height="6" rx="1" />
    <path d="M8 7 l1.5-2 l1.5 4 l1.5-2 l1.5 2" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="15" x2="13" y2="15" />
    <path d="M10 18 v3 h4 v-3" />
    <line x1="11" y1="21" x2="11" y2="22" />
    <line x1="13" y1="21" x2="13" y2="22" />
  </svg>
);

export const IconPneus = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="15.5" y1="9.5" x2="19" y2="6" />
    <line x1="15.5" y1="14.5" x2="19" y2="18" />
    <line x1="12" y1="16" x2="12" y2="21" />
    <line x1="8.5" y1="14.5" x2="5" y2="18" />
    <line x1="8.5" y1="9.5" x2="5" y2="6" />
  </svg>
);

export const IconLavagemAuto = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M2 15 l1.5-4 h13 l1.5 4 v2 H2 Z" />
    <circle cx="6" cy="17" r="1.5" />
    <circle cx="14" cy="17" r="1.5" />
    <path d="M8 10 Q8 8 9 7 Q10 6 10 8" />
    <path d="M12 10 Q12 7 13 6 Q14 5 14 8" />
    <path d="M16 10 Q16 8 17 7 Q18 6 18 8" />
  </svg>
);

export const IconVendaPecas = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <circle cx="10" cy="10" r="3" />
    <path d="M10 5 v-2 M10 17 v-2 M5 10 H3 M17 10 H15 M6.7 6.7 L5.3 5.3 M14.7 14.7 L13.3 13.3 M6.7 13.3 L5.3 14.7 M14.7 6.7 L13.3 5.3" />
    <path d="M16 14 h4 a1 1 0 0 1 1 1 v5 a1 1 0 0 1-1 1 H16 a1 1 0 0 1-1-1 V15 a1 1 0 0 1 1-1 Z" />
    <rect x="18" y="12" width="2" height="2" rx=".3" />
  </svg>
);

// ─────────────────────────────────────────────
//  PINTURA
// ─────────────────────────────────────────────

export const IconPintura = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M6 5 h12 a1 1 0 0 1 1 1 v5 a1 1 0 0 1-1 1 H6 a1 1 0 0 1-1-1 V6 a1 1 0 0 1 1-1 Z" />
    <rect x="7" y="6" width="10" height="4" rx="2" />
    <path d="M12 12 v3 h-4 v6" />
    <line x1="8" y1="18" x2="8" y2="21" />
    <path d="M6 21 h4" />
  </svg>
);

export const IconPinturaInterior = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="14" y="2" width="6" height="20" rx="1" />
    <path d="M3 8 h8 a1 1 0 0 1 1 1 v4 a1 1 0 0 1-1 1 H3 a1 1 0 0 1-1-1 V9 a1 1 0 0 1 1-1 Z" />
    <rect x="4" y="9" width="7" height="3" rx="1.5" />
    <line x1="12" y1="11" x2="14" y2="11" />
    <line x1="17" y1="5" x2="17" y2="19" />
  </svg>
);

export const IconPinturaExterior = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M6 8 h12 v12 a1 1 0 0 1-1 1 H7 a1 1 0 0 1-1-1 Z" />
    <path d="M5 6 h14 a1 1 0 0 1 1 1 v1 H5 V7 a1 1 0 0 1 1-1 Z" />
    <path d="M9 6 Q9 3 12 3 Q15 3 15 6" />
    <line x1="6" y1="14" x2="18" y2="14" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

export const IconPinturaDecorativa = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <line x1="7" y1="4" x2="14" y2="11" />
    <line x1="14" y1="11" x2="15" y2="10" />
    <line x1="13" y1="12" x2="14" y2="11" />
    <path d="M14 11 Q17 14 16 17 Q13 18 10 14 Z" />
    <path d="M10 14 Q13 17 12 19" />
    <line x1="18" y1="5" x2="18" y2="8" />
    <line x1="16.5" y1="6.5" x2="19.5" y2="6.5" />
    <line x1="3" y1="16" x2="3" y2="19" />
    <line x1="1.5" y1="17.5" x2="4.5" y2="17.5" />
  </svg>
);

export const IconGrafite = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="8" y="6" width="8" height="14" rx="2" />
    <path d="M10 6 V4 h4 v2" />
    <circle cx="12" cy="4" r="1" />
    <line x1="12" y1="3" x2="12" y2="2" />
    <path d="M16 8 Q18 5 20 5" />
    <path d="M16 10 Q19 9 20 8" />
    <path d="M16 12 Q19 13 20 12" />
    <circle cx="20" cy="5" r=".5" fill={color} stroke="none" />
    <circle cx="20.5" cy="8" r=".5" fill={color} stroke="none" />
    <circle cx="20" cy="12" r=".5" fill={color} stroke="none" />
  </svg>
);

export const IconQuadros = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="3" y="3" width="14" height="14" rx="1" />
    <rect x="5" y="5" width="10" height="10" rx="1" />
    <path d="M7 12 Q10 8 13 12" />
    <circle cx="10" cy="9" r="1.5" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <path d="M21 18 Q23 20 21 22 Q19 22 19 20 Z" />
  </svg>
);

// ─────────────────────────────────────────────
//  CONSTRUÇÃO
// ─────────────────────────────────────────────

export const IconConstrucao = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M3 14 h18 v2 a1 1 0 0 1-1 1 H4 a1 1 0 0 1-1-1 Z" />
    <path d="M3 14 Q3 7 12 7 Q21 7 21 14" />
    <path d="M1 14 h4" />
    <path d="M5 17 Q5 20 12 20 Q19 20 19 17" />
  </svg>
);

export const IconPedreiro = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M4 20 L10 14" />
    <path d="M10 14 Q13 11 15 9 L19 5 L15 9 Q13 11 10 14 Z" />
    <rect x="12" y="15" width="9" height="3" rx=".5" />
    <rect x="10" y="18" width="9" height="3" rx=".5" />
    <line x1="10" y1="18" x2="21" y2="18" />
  </svg>
);

export const IconCarpinteiro = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="3" y="9" width="18" height="8" rx="2" />
    <path d="M8 9 V7" />
    <path d="M8 7 h5 v2" />
    <path d="M15 9 Q17 6 19 9" />
    <path d="M6 9 Q7 5 9 4 Q11 3 10 7" />
    <path d="M10 9 Q11 6 13 5 Q15 4 14 7" />
  </svg>
);

export const IconSerralheiro = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="3" y="2" width="13" height="20" rx="1" />
    <rect x="5" y="4" width="4" height="5" rx=".5" />
    <rect x="5" y="12" width="4" height="5" rx=".5" />
    <rect x="10" y="4" width="4" height="5" rx=".5" />
    <rect x="10" y="12" width="4" height="5" rx=".5" />
    <circle cx="20" cy="8" r="3" />
    <line x1="20" y1="11" x2="20" y2="16" />
    <line x1="20" y1="13" x2="22" y2="13" />
    <line x1="20" y1="15" x2="22" y2="15" />
  </svg>
);

export const IconGesseiro = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="9" y="2" width="6" height="14" rx="1" />
    <path d="M10 16 Q10 20 12 20 Q14 20 14 16" />
    <line x1="9" y1="6" x2="15" y2="6" />
    <line x1="9" y1="9" x2="15" y2="9" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <circle cx="5" cy="8" r=".7" fill={color} stroke="none" />
    <circle cx="6" cy="12" r=".7" fill={color} stroke="none" />
    <circle cx="19" cy="10" r=".7" fill={color} stroke="none" />
    <circle cx="18" cy="14" r=".7" fill={color} stroke="none" />
  </svg>
);

export const IconRemodelaçao = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M3 11 L12 3 L21 11" />
    <path d="M5 10 v11 h5 v-6 h4 v6 h5 V10" />
    <rect x="13" y="14" width="8" height="4" rx="1" />
    <line x1="16" y1="14" x2="13" y2="10" />
  </svg>
);

// ─────────────────────────────────────────────
//  SEGURANÇA
// ─────────────────────────────────────────────

export const IconSeguranca = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <line x1="3" y1="5" x2="3" y2="14" />
    <line x1="3" y1="9" x2="7" y2="9" />
    <rect x="7" y="6" width="12" height="7" rx="2" />
    <circle cx="17" cy="9.5" r="2" />
    <circle cx="9" cy="9.5" r="1" fill={color} stroke="none" />
    <line x1="3" y1="14" x2="3" y2="20" />
    <path d="M19 5 Q21 7 21 9.5 Q21 12 19 14" />
  </svg>
);

export const IconSegurancaResidencial = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M3 11 L12 3 L21 11" />
    <path d="M5 10 v11 h5 v-5 h4 v5 h5 V10" />
    <rect x="10" y="13" width="4" height="4" rx="1" />
    <path d="M10.5 13 v-1.5 a1.5 1.5 0 0 1 3 0 V13" />
    <circle cx="12" cy="15" r=".6" fill={color} stroke="none" />
  </svg>
);

export const IconSegurancaEmpresarial = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="2" y="4" width="12" height="17" rx="1" />
    <line x1="6" y1="8" x2="8" y2="8" />
    <line x1="6" y1="12" x2="8" y2="12" />
    <line x1="6" y1="16" x2="8" y2="16" />
    <path d="M16 7 l5 2 v5 a5 5 0 0 1-5 5 a5 5 0 0 1-5-5 V9 Z" />
    <path d="M14 13 l1.5 1.5 l3-3" />
  </svg>
);

export const IconSegurancaEventos = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <circle cx="10" cy="6" r="3" />
    <path d="M4 20 Q4 14 10 14 Q16 14 16 20" />
    <rect x="15" y="10" width="8" height="10" rx="1" />
    <line x1="17" y1="13" x2="21" y2="13" />
    <line x1="17" y1="15" x2="21" y2="15" />
    <line x1="17" y1="17" x2="19" y2="17" />
    <rect x="17" y="11" width="2" height="1" rx=".3" />
  </svg>
);

export const IconAlarmes = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <path d="M7 14 Q7 8 12 8 Q17 8 17 14 v2 H7 Z" />
    <line x1="5" y1="16" x2="19" y2="16" />
    <line x1="12" y1="6" x2="12" y2="4" />
    <circle cx="12" cy="3" r="1.5" />
    <path d="M4 11 Q2 13 2 16" />
    <path d="M20 11 Q22 13 22 16" />
    <line x1="12" y1="16" x2="12" y2="19" />
    <path d="M10 19 h4" />
  </svg>
);

export const IconControloAcessos = ({ size = 24, color = "currentColor", style, className }: IconProps) => (
  <svg {...svgProps(size, color)} style={style} className={className}>
    <rect x="6" y="3" width="12" height="18" rx="2" />
    <rect x="8" y="5" width="8" height="5" rx="1" />
    <circle cx="9.5" cy="13" r=".8" fill={color} stroke="none" />
    <circle cx="12" cy="13" r=".8" fill={color} stroke="none" />
    <circle cx="14.5" cy="13" r=".8" fill={color} stroke="none" />
    <circle cx="9.5" cy="16" r=".8" fill={color} stroke="none" />
    <circle cx="12" cy="16" r=".8" fill={color} stroke="none" />
    <circle cx="14.5" cy="16" r=".8" fill={color} stroke="none" />
    <circle cx="12" cy="19" r=".8" fill={color} stroke="none" />
  </svg>
);

// re-exporta ícones Lucide usados nas subcategorias
export { Wrench, Lightbulb, Sprout, Trees, Home, Building2, Store } from "lucide-react";