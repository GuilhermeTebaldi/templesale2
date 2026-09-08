import React from 'react';

interface TempleSaleLogoProps {
  className?: string;
  size?: number | string;
}

export const TempleSaleLogo: React.FC<TempleSaleLogoProps> = ({
  className = 'w-8 h-8',
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <img
        src="/templesale-logo.svg"
        alt="TempleSale Logo"
        className="w-full h-full object-contain filter drop-shadow-sm"
      />
    </div>
  );
};
