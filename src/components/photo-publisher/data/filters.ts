import { FilterPreset } from '../types';

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'normal',
    name: 'Normal',
    filterString: 'none',
  },
  {
    id: 'vivid',
    name: 'Vívido',
    filterString: 'contrast(1.15) saturate(1.4) brightness(1.05)',
  },
  {
    id: 'bw',
    name: 'P&B',
    filterString: 'grayscale(1) contrast(1.2) brightness(0.95)',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    filterString: 'sepia(0.4) contrast(0.9) brightness(1.05) saturate(1.2)',
  },
  {
    id: 'warm',
    name: 'Quente',
    filterString: 'sepia(0.25) saturate(1.3) hue-rotate(-10deg) brightness(1.02)',
  },
  {
    id: 'cool',
    name: 'Frio',
    filterString: 'saturate(1.1) hue-rotate(180deg) brightness(1.05) contrast(1.1)',
  },
  {
    id: 'noir',
    name: 'Noir',
    filterString: 'grayscale(1) contrast(1.6) brightness(0.85)',
  },
  {
    id: 'sunset',
    name: 'Pôr do Sol',
    filterString: 'sepia(0.35) contrast(1.1) saturate(1.5) hue-rotate(-20deg)',
  },
  {
    id: 'fade',
    name: 'Suave',
    filterString: 'contrast(0.85) brightness(1.1) saturate(0.8)',
  },
];

export const SAMPLE_PHOTOS = [
  {
    id: 'nature',
    name: 'Natureza',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    description: 'Praia e horizonte tropical',
  },
  {
    id: 'coffee',
    name: 'Café & Estilo',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80',
    description: 'Café da manhã acolhedor',
  },
  {
    id: 'city',
    name: 'Urbano',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1000&q=80',
    description: 'Luzes da cidade à noite',
  },
  {
    id: 'portrait',
    name: 'Retrato',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    description: 'Retrato expressivo com luz natural',
  },
];
