import React from 'react';

interface TempleSaleAvatarFrameProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  isOwner?: boolean;
  className?: string;
}

/**
 * Moldura oficial TempleSale para foto de perfil da empresa:
 * Substitui o anel gradiente tipo 'story do Instagram' (laranja/vermelho/roxo)
 * por uma moldura exclusiva baseada na geometria e nos quadradinhos 3D brilhantes
 * (amarelo ouro, âmbar e verde esmeralda) da identidade TempleSale.
 */
export const TempleSaleAvatarFrame: React.FC<TempleSaleAvatarFrameProps> = ({
  src,
  alt,
  size = 'lg',
  isOwner = false,
  className = '',
}) => {
  // Configurações de tamanho proporcionais
  const config = {
    lg: {
      container: 'w-24 h-24 sm:w-28 sm:h-28',
      imgRadius: 'rounded-[20px] sm:rounded-[22px]',
      frameRadius: 'rounded-[24px] sm:rounded-[26px]',
      badgeOffset: '-top-2.5 -right-2.5 sm:-top-3 sm:-right-3',
      badgeSize: 'w-10 h-10 sm:w-12 sm:h-12',
      cornerDot: 'w-1.5 h-1.5',
    },
    md: {
      container: 'w-16 h-16 sm:w-18 sm:h-18',
      imgRadius: 'rounded-[14px] sm:rounded-[16px]',
      frameRadius: 'rounded-[17px] sm:rounded-[19px]',
      badgeOffset: '-top-2 -right-2',
      badgeSize: 'w-7 h-7 sm:w-8 sm:h-8',
      cornerDot: 'w-1 h-1',
    },
    sm: {
      container: 'w-10 h-10',
      imgRadius: 'rounded-[9px]',
      frameRadius: 'rounded-[11px]',
      badgeOffset: '-top-1.5 -right-1.5',
      badgeSize: 'w-5 h-5',
      cornerDot: 'w-0.5 h-0.5',
    },
  }[size];

  return (
    <div
      id="templesale-avatar-frame-container"
      className={`relative isolate z-0 inline-block select-none shrink-0 ${config.container} ${className}`}
    >
      {/* 1. MOLDURA EXTERNA COM ACABAMENTO BISOTADO E CORES OFICIAIS (Âmbar e Esmeralda) */}
      <div
        className={`relative w-full h-full ${config.frameRadius} p-[2.5px] sm:p-[3px] bg-gradient-to-br from-amber-400 via-amber-500/70 to-emerald-500 shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-transform duration-200 group-hover:scale-[1.02]`}
      >
        {/* Camada interna de profundidade (fundo escuro e borda fina) */}
        <div
          className={`w-full h-full ${config.imgRadius} bg-neutral-950 p-[2px] overflow-hidden flex items-center justify-center relative`}
        >
          {/* Foto da Empresa */}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover ${config.imgRadius} transition-opacity duration-200`}
            loading="lazy"
          />

          {/* Brilho de reflexo de vidro suave diagonal */}
          <div
            className={`absolute inset-0 ${config.imgRadius} pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.12]`}
          />
        </div>

        {/* Micro-quadradinhos decorativos nos cantos da moldura */}
        <div
          className={`absolute top-1 left-1 ${config.cornerDot} bg-amber-300 rounded-[1px] opacity-75 shadow-xs pointer-events-none`}
        />
        <div
          className={`absolute bottom-1 left-1 ${config.cornerDot} bg-amber-400 rounded-[1px] opacity-75 shadow-xs pointer-events-none`}
        />
        <div
          className={`absolute bottom-1 right-1 ${config.cornerDot} bg-emerald-400 rounded-[1px] opacity-75 shadow-xs pointer-events-none`}
        />
      </div>

      {/* 2. OS QUADRADINHOS BRILHANTES VETORIAIS DO TEMPLESALE (Emblema acoplado no canto superior da moldura) */}
      <div
        id="templesale-avatar-badge"
        className={`absolute ${config.badgeOffset} ${config.badgeSize} pointer-events-none z-10 filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)]`}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Gradiente Âmbar Superior */}
            <linearGradient id="frame-amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="65%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Gradiente Verde Esmeralda */}
            <linearGradient id="frame-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dcfce7" />
              <stop offset="20%" stopColor="#bbf7d0" />
              <stop offset="55%" stopColor="#4ade80" />
              <stop offset="85%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>

            {/* Reflexo de brilho branco vítreo */}
            <linearGradient id="frame-gloss" x1="0%" y1="0%" x2="70%" y2="70%">
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
              fill="url(#frame-amber-grad)"
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
              fill="url(#frame-gloss)"
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
              fill="url(#frame-amber-grad)"
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
              fill="url(#frame-gloss)"
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
              fill="url(#frame-green-grad)"
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
              fill="url(#frame-gloss)"
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
      </div>

      {/* 3. ETIQUETA "SUA" (Se for a empresa do proprietário logado) */}
      {isOwner && (
        <span
          id="badge-owner-avatar"
          className="absolute -bottom-1.5 -right-1.5 z-10 bg-emerald-500 text-neutral-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-lg border border-neutral-900"
        >
          SUA
        </span>
      )}
    </div>
  );
};
