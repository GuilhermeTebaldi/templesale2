import React, { useState } from 'react';
import {
  X,
  Check,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { OverlayItem, FontStyleType } from '../types';

interface TextOverlayEditorProps {
  initialOverlay?: OverlayItem | null;
  onSave: (overlayData: Omit<OverlayItem, 'id' | 'x' | 'y'>) => void;
  onCancel: () => void;
}

const COLORS = [
  { name: 'Branco', value: '#ffffff' },
  { name: 'Preto', value: '#000000' },
  { name: 'Amarelo', value: '#facc15' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Vermelho', value: '#f43f5e' },
  { name: 'Azul', value: '#38bdf8' },
  { name: 'Verde', value: '#4ade80' },
  { name: 'Roxo', value: '#a855f7' },
];

const FONTS: { id: FontStyleType; label: string; fontClass: string }[] = [
  { id: 'sans', label: 'Sans', fontClass: 'font-sans' },
  { id: 'display', label: 'Impact', fontClass: 'font-black tracking-wider uppercase' },
  { id: 'serif', label: 'Serif', fontClass: 'font-serif' },
  { id: 'handwriting', label: 'Cursivo', fontClass: 'italic font-serif' },
  { id: 'mono', label: 'Mono', fontClass: 'font-mono' },
  { id: 'neon', label: 'Neon', fontClass: 'font-bold tracking-wide' },
];

const BACKGROUNDS: { id: OverlayItem['backgroundColor']; label: string }[] = [
  { id: 'transparent', label: 'Transparente' },
  { id: 'black-translucent', label: 'Fundo Escuro' },
  { id: 'white-translucent', label: 'Fundo Claro' },
  { id: 'primary', label: 'Destaque Azul' },
  { id: 'neon', label: 'Borda Neon' },
];

const QUICK_EMOJIS = [
  '✨', '🔥', '❤️', '⭐', '📸', '🌴', '☕', '🕶️',
  '🎉', '🚀', '💯', '🌸', '🍕', '🎶', '✌️', '💪',
];

export const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({
  initialOverlay,
  onSave,
  onCancel,
}) => {
  const [text, setText] = useState(initialOverlay?.text || '');
  const [color, setColor] = useState(initialOverlay?.color || '#ffffff');
  const [fontStyle, setFontStyle] = useState<FontStyleType>(initialOverlay?.fontStyle || 'sans');
  const [backgroundColor, setBackgroundColor] = useState<OverlayItem['backgroundColor']>(
    initialOverlay?.backgroundColor || 'black-translucent'
  );
  const [textAlign, setTextAlign] = useState<OverlayItem['textAlign']>(
    initialOverlay?.textAlign || 'center'
  );
  const [fontSize, setFontSize] = useState<number>(initialOverlay?.fontSize || 26);
  const [rotation] = useState(initialOverlay?.rotation || 0);

  const handleAppendEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    onSave({
      type: 'text',
      text: text.trim(),
      color,
      fontStyle,
      backgroundColor,
      textAlign,
      fontSize,
      rotation,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-4 text-white shadow-2xl space-y-3.5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-neutral-200">Texto & Emojis</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-full text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="min-h-20 bg-neutral-950/90 rounded-2xl flex items-center justify-center p-3 border border-neutral-800 overflow-hidden">
          <div
            className={`px-3 py-1.5 rounded-xl transition-all max-w-full ${
              backgroundColor === 'black-translucent'
                ? 'bg-black/75 shadow-lg'
                : backgroundColor === 'white-translucent'
                ? 'bg-white/90 shadow-lg'
                : backgroundColor === 'primary'
                ? 'bg-blue-600 shadow-lg'
                : backgroundColor === 'neon'
                ? 'bg-slate-950 border-2 shadow-lg'
                : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
            }`}
            style={{
              color,
              borderColor: backgroundColor === 'neon' ? color : undefined,
              fontSize: `${fontSize}px`,
              textAlign,
              textShadow:
                backgroundColor === 'transparent'
                  ? '0 2px 6px rgba(0,0,0,0.85)'
                  : fontStyle === 'neon'
                  ? `0 0 10px ${color}`
                  : undefined,
            }}
          >
            <span className="break-words whitespace-pre-wrap">
              {text || 'Digite algo...'}
            </span>
          </div>
        </div>

        {/* Text Input */}
        <div>
          <input
            id="text-overlay-input"
            type="text"
            autoFocus
            maxLength={80}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite seu texto ou toque nos emojis..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Quick Emoji Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {QUICK_EMOJIS.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAppendEmoji(emoji)}
              className="text-base p-1 rounded-lg hover:bg-neutral-800 transition active:scale-125 shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Font Style Selection */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 mb-1">Fonte</label>
          <div className="grid grid-cols-6 gap-1.5">
            {FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                id={`font-style-${f.id}`}
                onClick={() => setFontStyle(f.id)}
                className={`py-1 px-1 rounded-lg text-xs transition border text-center ${
                  fontStyle === f.id
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-semibold shadow'
                    : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:text-white'
                } ${f.fontClass}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="block text-[11px] font-medium text-neutral-400 mb-1">Cor</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                id={`color-btn-${c.name}`}
                onClick={() => setColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  color === c.value ? 'border-blue-400 scale-110 shadow-md' : 'border-neutral-700'
                }`}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Background & Alignment */}
        <div className="grid grid-cols-2 gap-2.5 items-center">
          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Fundo</label>
            <select
              id="select-text-bg"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value as OverlayItem['backgroundColor'])}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {BACKGROUNDS.map((bg) => (
                <option key={bg.id} value={bg.id}>
                  {bg.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-400 mb-1">Alinhamento</label>
            <div className="flex bg-neutral-950 rounded-xl border border-neutral-800 p-0.5">
              <button
                type="button"
                onClick={() => setTextAlign('left')}
                className={`flex-1 py-1 flex items-center justify-center rounded-lg text-xs transition ${
                  textAlign === 'left' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTextAlign('center')}
                className={`flex-1 py-1 flex items-center justify-center rounded-lg text-xs transition ${
                  textAlign === 'center' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTextAlign('right')}
                className={`flex-1 py-1 flex items-center justify-center rounded-lg text-xs transition ${
                  textAlign === 'right' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Font Size Slider */}
        <div>
          <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
            <span>Tamanho</span>
            <span className="font-semibold text-neutral-200">{fontSize}px</span>
          </div>
          <input
            type="range"
            id="slider-font-size"
            min={14}
            max={140}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            id="btn-cancel-text-overlay"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition active:scale-98"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-apply-text-overlay"
            onClick={() => handleSubmit()}
            disabled={!text.trim()}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition active:scale-98 shadow-lg shadow-blue-600/25"
          >
            <Check className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
