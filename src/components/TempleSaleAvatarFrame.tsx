import React from 'react';
import { TempleSaleMark } from './TempleSaleMark';
import { ProgressiveProductImage } from './ProductCard';

interface TempleSaleAvatarFrameProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  isOwner?: boolean;
  showBrandBadge?: boolean;
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
  showBrandBadge = true,
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
          <ProgressiveProductImage
            src={src}
            alt={alt}
            className={`relative w-full h-full object-cover ${config.imgRadius} transition-opacity duration-200`}
            loading="lazy"
            variant="thumbnail"
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
      {showBrandBadge && <div
        id="templesale-avatar-badge"
        className={`absolute ${config.badgeOffset} ${config.badgeSize} pointer-events-none z-10 filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)]`}
      >
        <TempleSaleMark />
      </div>}

      {/* 3. ETIQUETA "SUA" (Se for a empresa do proprietário logado) */}
      {isOwner && (
        <span
          id="badge-owner-avatar"
          className="absolute -bottom-1.5 -right-1.5 z-10 bg-emerald-500 text-neutral-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow-lg border border-neutral-900"
        >
          TUA
        </span>
      )}
    </div>
  );
};
