export interface FilterPreset {
  id: string;
  name: string;
  filterString: string;
  badgeColor?: string;
}

export interface PhotoCrop {
  x: number; // horizontal pan offset in px
  y: number; // vertical pan offset in px
  scale: number; // zoom scale (1.0 to 3.0)
}

export interface PhotoAdjustments {
  brightness: number; // 50 to 150 (default 100)
  contrast: number;   // 50 to 150 (default 100)
  saturation: number; // 0 to 200 (default 100)
  sepia: number;      // 0 to 100 (default 0)
}

export type FontStyleType = 'sans' | 'serif' | 'mono' | 'handwriting' | 'display' | 'neon';

export interface OverlayItem {
  id: string;
  type: 'text' | 'sticker';
  text: string;
  x: number; // percentage 0 - 100 (center of element)
  y: number; // percentage 0 - 100 (center of element)
  fontSize: number; // in px
  color: string;
  backgroundColor: 'transparent' | 'black-translucent' | 'white-translucent' | 'primary' | 'neon';
  fontStyle: FontStyleType;
  textAlign: 'left' | 'center' | 'right';
  rotation: number; // in degrees
}

// Deprecated aliases kept for backward compatibility if needed
export type TextOverlay = OverlayItem;
export interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation?: number;
}

export interface PublishedPost {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  likes?: number;
}
