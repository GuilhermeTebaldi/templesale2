import React from 'react';
import {
  Trash2,
  Copy,
  Edit3,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { OverlayItem, FontStyleType } from '../types';

interface OverlayToolbarProps {
  selectedItem: OverlayItem;
  onUpdate: (updates: Partial<OverlayItem>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
}

const QUICK_COLORS = [
  '#ffffff',
  '#000000',
  '#facc15',
  '#f97316',
  '#f43f5e',
  '#38bdf8',
  '#4ade80',
  '#a855f7',
];

const FONTS: { id: FontStyleType; label: string }[] = [
  { id: 'sans', label: 'Sans' },
  { id: 'display', label: 'Impact' },
  { id: 'serif', label: 'Serif' },
  { id: 'handwriting', label: 'Cursivo' },
  { id: 'mono', label: 'Mono' },
  { id: 'neon', label: 'Neon' },
];

const BACKGROUND_STYLES: {
  id: OverlayItem['backgroundColor'];
  label: string;
}[] = [
  { id: 'transparent', label: 'Transp.' },
  { id: 'black-translucent', label: 'Escuro' },
  { id: 'white-translucent', label: 'Claro' },
  { id: 'primary', label: 'Azul' },
  { id: 'neon', label: 'Neon' },
];

export const OverlayToolbar: React.FC<OverlayToolbarProps> = ({
  selectedItem,
  onUpdate,
  onDelete,
  onDuplicate,
  onEdit,
}) => {
  const [activeSubMenu, setActiveSubMenu] = React.useState<
    'none' | 'colors' | 'fonts' | 'background' | 'size'
  >('none');

  const cycleAlignment = () => {
    const nextAlign: Record<'left' | 'center' | 'right', 'left' | 'center' | 'right'> = {
      left: 'center',
      center: 'right',
      right: 'left',
    };
    onUpdate({ textAlign: nextAlign[selectedItem.textAlign || 'center'] });
  };

  return (
    <div
      id="overlay-selected-toolbar"
      className="w-full bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 p-2 space-y-2 z-30 select-none animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Active sub-menus */}
      {activeSubMenu === 'size' && (
        <div className="flex items-center justify-between gap-3 px-2 py-1 bg-neutral-950/80 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => onUpdate({ fontSize: Math.max(14, selectedItem.fontSize - 3) })}
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min={14}
            max={140}
            value={selectedItem.fontSize}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
            className="flex-1 accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <button
            type="button"
            onClick={() => onUpdate({ fontSize: Math.min(140, selectedItem.fontSize + 4) })}
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-neutral-200 w-9 text-right">
            {selectedItem.fontSize}px
          </span>
        </div>
      )}

      {activeSubMenu === 'colors' && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-neutral-950/80 rounded-xl border border-neutral-800 overflow-x-auto">
          {QUICK_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onUpdate({ color: c })}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full shrink-0 border-2 transition ${
                selectedItem.color === c ? 'border-blue-400 scale-110 shadow' : 'border-neutral-700'
              }`}
            />
          ))}
        </div>
      )}

      {activeSubMenu === 'fonts' && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-neutral-950/80 rounded-xl border border-neutral-800 overflow-x-auto">
          {FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onUpdate({ fontStyle: f.id })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition ${
                selectedItem.fontStyle === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {activeSubMenu === 'background' && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-neutral-950/80 rounded-xl border border-neutral-800 overflow-x-auto">
          {BACKGROUND_STYLES.map((bg) => (
            <button
              key={bg.id}
              type="button"
              onClick={() => onUpdate({ backgroundColor: bg.id })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition ${
                selectedItem.backgroundColor === bg.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              {bg.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Tool Buttons */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center gap-1">
          {/* Edit text */}
          <button
            type="button"
            id="toolbar-btn-edit-text"
            onClick={onEdit}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition active:scale-95"
            title="Editar texto"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-400" />
            <span>Editar</span>
          </button>

          {/* Size */}
          <button
            type="button"
            id="toolbar-btn-size"
            onClick={() => setActiveSubMenu(activeSubMenu === 'size' ? 'none' : 'size')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 ${
              activeSubMenu === 'size'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
            }`}
            title="Tamanho"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>{selectedItem.fontSize}px</span>
          </button>

          {/* Color */}
          <button
            type="button"
            id="toolbar-btn-colors"
            onClick={() => setActiveSubMenu(activeSubMenu === 'colors' ? 'none' : 'colors')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 ${
              activeSubMenu === 'colors'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
            }`}
            title="Cor"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/50"
              style={{ backgroundColor: selectedItem.color }}
            />
            <span>Cor</span>
          </button>

          {/* Font style */}
          <button
            type="button"
            id="toolbar-btn-fonts"
            onClick={() => setActiveSubMenu(activeSubMenu === 'fonts' ? 'none' : 'fonts')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 ${
              activeSubMenu === 'fonts'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
            }`}
            title="Estilo da fonte"
          >
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>Fonte</span>
          </button>

          {/* Background */}
          <button
            type="button"
            id="toolbar-btn-bg"
            onClick={() => setActiveSubMenu(activeSubMenu === 'background' ? 'none' : 'background')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition active:scale-95 ${
              activeSubMenu === 'background'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
            }`}
            title="Destaque de fundo"
          >
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fundo</span>
          </button>

          {/* Alignment */}
          <button
            type="button"
            id="toolbar-btn-align"
            onClick={cycleAlignment}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition active:scale-95"
            title="Alinhamento"
          >
            {selectedItem.textAlign === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
            {(!selectedItem.textAlign || selectedItem.textAlign === 'center') && (
              <AlignCenter className="w-3.5 h-3.5" />
            )}
            {selectedItem.textAlign === 'right' && <AlignRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Duplicate and Delete */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="toolbar-btn-duplicate"
            onClick={onDuplicate}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition active:scale-95"
            title="Duplicar"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            id="toolbar-btn-delete"
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-300 transition active:scale-95 border border-red-800/60"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
