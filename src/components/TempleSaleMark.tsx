import React from 'react';

// The same vector artwork is shared by avatar badges and subtle brand accents.
export const TempleSaleMark = ({ className = 'h-full w-full overflow-visible' }: { className?: string }) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Gradiente Âmbar Superior */}
        <linearGradient id={`${id}-amber`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="25%" stopColor="#fef08a" />
          <stop offset="65%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
    
        {/* Gradiente Verde Esmeralda */}
        <linearGradient id={`${id}-green`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dcfce7" />
          <stop offset="20%" stopColor="#bbf7d0" />
          <stop offset="55%" stopColor="#4ade80" />
          <stop offset="85%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
    
        {/* Reflexo de brilho branco vítreo */}
        <linearGradient id={`${id}-gloss`} x1="0%" y1="0%" x2="70%" y2="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
    
      {/* Quadradinho 1: Amarelo Dourado Principal (inclinado -11°) */}
      <g transform="translate(34, 62) rotate(-11) translate(-17, -17)">
        <rect
          x="0"
          y="0"
          width="34"
          height="34"
          rx="7"
          fill={`url(#${id}-amber)`}
          stroke="#c2410c"
          strokeWidth="2"
        />
        <path
          d="M 8 32 L 26 32 A 6 6 0 0 0 32 26 L 32 14 Z"
          fill="#b45309"
          opacity="0.4"
        />
        <path
          d="M 3 11 A 6 6 0 0 1 11 3 L 20 3 C 11 7 6 13 3 23 Z"
          fill={`url(#${id}-gloss)`}
        />
        <path
          d="M 5 4 Q 16 3 28 4"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>
    
      {/* Quadradinho 2: Âmbar Superior (inclinado +14°) */}
      <g transform="translate(54, 25) rotate(14) translate(-14, -14)">
        <rect
          x="0"
          y="0"
          width="28"
          height="28"
          rx="6"
          fill={`url(#${id}-amber)`}
          stroke="#9a3412"
          strokeWidth="1.8"
        />
        <path
          d="M 6 26 L 22 26 A 5 5 0 0 0 26 22 L 26 12 Z"
          fill="#b45309"
          opacity="0.4"
        />
        <path
          d="M 2.5 9 A 5 5 0 0 1 9 2.5 L 17 2.5 C 9 6 5 11 2.5 19 Z"
          fill={`url(#${id}-gloss)`}
        />
        <path
          d="M 4 3 Q 13 2 23 3"
          stroke="#ffffff"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>
    
      {/* Quadradinho 3: Verde Esmeralda (inclinado -10°) */}
      <g transform="translate(74, 52) rotate(-10) translate(-14, -14)">
        <rect
          x="0"
          y="0"
          width="28"
          height="28"
          rx="6"
          fill={`url(#${id}-green)`}
          stroke="#14532d"
          strokeWidth="1.8"
        />
        <path
          d="M 6 26 L 22 26 A 5 5 0 0 0 26 22 L 26 11 Z"
          fill="#052e16"
          opacity="0.45"
        />
        <path
          d="M 2.5 9 A 5 5 0 0 1 9 2.5 L 16 2.5 C 9 6 5 11 2.5 18 Z"
          fill={`url(#${id}-gloss)`}
        />
        <path
          d="M 4 3 Q 14 2 23 3"
          stroke="#ffffff"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>
    </svg>
  );
};
