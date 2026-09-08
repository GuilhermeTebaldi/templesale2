import React, { useId } from 'react';

interface TempleSaleLikeIconProps {
  liked?: boolean;
  className?: string;
  size?: number | string;
}

/**
 * Ícone oficial de curtida do TempleSale:
 * Substitui o coração pelo logotipo dos 3 quadradinhos inclinados.
 * - Não curtido (liked=false): Linhas de contorno minimalistas em cor neutra.
 * - Curtido (liked=true): Cores originais vívidas com gradientes dourado, âmbar e verde esmeralda com brilho 3D.
 */
export const TempleSaleLikeIcon: React.FC<TempleSaleLikeIconProps> = ({
  liked = false,
  className = 'w-6 h-6',
}) => {
  const id = useId().replace(/:/g, '_');

  const yellowBase = `ts-like-y-base-${id}`;
  const yellowInner = `ts-like-y-inner-${id}`;
  const amberBase = `ts-like-a-base-${id}`;
  const greenBase = `ts-like-g-base-${id}`;
  const greenInner = `ts-like-g-inner-${id}`;
  const glossGrad = `ts-like-gloss-${id}`;

  if (!liked) {
    // Estado NÃO curtido: contornos limpos em estilo wireframe / outline
    return (
      <svg
        viewBox="95 90 320 285"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        {/* 1. Top Tile (Inclinado +14deg) */}
        <g transform="translate(290, 160) rotate(14) translate(-46, -46)">
          <rect
            x="5"
            y="5"
            width="82"
            height="82"
            rx="16"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* 2. Main Large Tile (Inclinado -11deg) */}
        <g transform="translate(200, 270) rotate(-11) translate(-75, -75)">
          <rect
            x="8"
            y="8"
            width="134"
            height="134"
            rx="22"
            stroke="currentColor"
            strokeWidth="22"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* 3. Right Tile (Inclinado -10deg) */}
        <g transform="translate(345, 235) rotate(-10) translate(-46, -46)">
          <rect
            x="5"
            y="5"
            width="82"
            height="82"
            rx="16"
            stroke="currentColor"
            strokeWidth="18"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>
    );
  }

  // Estado CURTIDO: Cores originais completas do TempleSale
  return (
    <svg
      viewBox="95 90 320 285"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Large Yellow Tile Gradients */}
        <linearGradient id={yellowBase} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="18%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#facc15" />
          <stop offset="85%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>

        <linearGradient id={yellowInner} x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="40%" stopColor="#fde047" />
          <stop offset="80%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Top Amber Tile Gradient */}
        <linearGradient id={amberBase} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="25%" stopColor="#fef08a" />
          <stop offset="65%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Green Tile Gradients */}
        <linearGradient id={greenBase} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dcfce7" />
          <stop offset="20%" stopColor="#bbf7d0" />
          <stop offset="55%" stopColor="#4ade80" />
          <stop offset="85%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>

        <linearGradient id={greenInner} x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>

        {/* White Gloss Gradient */}
        <linearGradient id={glossGrad} x1="0%" y1="0%" x2="70%" y2="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* 1. TOP AMBER TILE */}
      <g transform="translate(290, 160) rotate(14) translate(-46, -46)">
        <rect
          x="0"
          y="0"
          width="92"
          height="92"
          rx="18"
          fill={`url(#${amberBase})`}
          stroke="#9a3412"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <rect
          x="6"
          y="6"
          width="80"
          height="80"
          rx="14"
          fill={`url(#${amberBase})`}
        />
        <path
          d="M 20 86.5 L 72 86.5 A 14 14 0 0 0 86.5 72 L 86.5 35 Z"
          fill="#b45309"
          opacity="0.35"
        />
        <path
          d="M 8 30 A 14 14 0 0 1 30 8 L 55 8 C 30 20 18 36 8 62 Z"
          fill={`url(#${glossGrad})`}
        />
        <path
          d="M 16 11 Q 46 8 76 11"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>

      {/* 2. MAIN LARGE GOLDEN YELLOW TILE */}
      <g transform="translate(200, 270) rotate(-11) translate(-75, -75)">
        <rect
          x="0"
          y="0"
          width="150"
          height="150"
          rx="26"
          fill={`url(#${yellowBase})`}
          stroke="#c2410c"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <rect
          x="8"
          y="8"
          width="134"
          height="134"
          rx="20"
          fill={`url(#${yellowInner})`}
        />
        <path
          d="M 35 142 L 124 142 A 20 20 0 0 0 142 124 L 142 50 Z"
          fill="#b45309"
          opacity="0.45"
        />
        <path
          d="M 60 134 Q 134 134 134 60"
          stroke="#78350f"
          strokeWidth="3.5"
          fill="none"
          opacity="0.25"
        />
        <path
          d="M 12 50 A 20 20 0 0 1 50 12 L 95 12 C 55 30 30 60 12 110 Z"
          fill={`url(#${glossGrad})`}
        />
        <path
          d="M 22 18 Q 75 14 128 18"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.95"
        />
        <path
          d="M 18 24 Q 14 75 18 120"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>

      {/* 3. RIGHT GREEN TILE */}
      <g transform="translate(345, 235) rotate(-10) translate(-46, -46)">
        <rect
          x="0"
          y="0"
          width="92"
          height="92"
          rx="18"
          fill={`url(#${greenBase})`}
          stroke="#14532d"
          strokeWidth="5.5"
          strokeLinejoin="round"
        />
        <rect
          x="6"
          y="6"
          width="80"
          height="80"
          rx="14"
          fill={`url(#${greenInner})`}
        />
        <path
          d="M 20 86 L 72 86 A 14 14 0 0 0 86 72 L 86 35 Z"
          fill="#052e16"
          opacity="0.45"
        />
        <path
          d="M 8 32 A 14 14 0 0 1 32 8 L 56 8 C 30 20 20 38 8 60 Z"
          fill={`url(#${glossGrad})`}
        />
        <path
          d="M 16 11 Q 46 8 76 11"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M 11 18 Q 8 46 11 72"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>
    </svg>
  );
};
