import React, { useState } from 'react';
import { Sliders, Sparkles, Sun, Contrast } from 'lucide-react';
import { FILTER_PRESETS } from '../data/filters';
import { FilterPreset, PhotoAdjustments } from '../types';

interface FilterControlsProps {
  imageSrc: string;
  selectedFilter: FilterPreset;
  onSelectFilter: (filter: FilterPreset) => void;
  adjustments: PhotoAdjustments;
  onChangeAdjustments: (adjustments: PhotoAdjustments) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  imageSrc,
  selectedFilter,
  onSelectFilter,
  adjustments,
  onChangeAdjustments,
}) => {
  const [activeTab, setActiveTab] = useState<'filters' | 'adjust'>('filters');

  const handleSliderChange = (key: keyof PhotoAdjustments, value: number) => {
    onChangeAdjustments({
      ...adjustments,
      [key]: value,
    });
  };

  const handleResetAdjustments = () => {
    onChangeAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
    });
  };

  return (
    <div className="w-full bg-neutral-900 border-t border-neutral-800/80 p-3">
      {/* Sub-tabs: Filtros vs Ajustes Finos */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/70">
        <div className="flex gap-2">
          <button
            type="button"
            id="tab-filters"
            onClick={() => setActiveTab('filters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'filters'
                ? 'bg-neutral-700 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Filtros
          </button>
          <button
            type="button"
            id="tab-adjust"
            onClick={() => setActiveTab('adjust')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'adjust'
                ? 'bg-neutral-700 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            Ajustes
          </button>
        </div>

        {activeTab === 'adjust' && (
          <button
            type="button"
            id="btn-reset-adjustments"
            onClick={handleResetAdjustments}
            className="text-[11px] text-neutral-400 hover:text-white transition"
          >
            Redefinir
          </button>
        )}
      </div>

      {activeTab === 'filters' ? (
        /* Filters Carousel */
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          {FILTER_PRESETS.map((preset) => {
            const isSelected = selectedFilter.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                id={`filter-preset-${preset.id}`}
                onClick={() => onSelectFilter(preset)}
                className="flex flex-col items-center gap-1.5 shrink-0 snap-start group"
              >
                <div
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/30 scale-105'
                      : 'border-neutral-700 group-hover:border-neutral-500 opacity-80 group-hover:opacity-100'
                  }`}
                >
                  <img
                    src={imageSrc}
                    alt={preset.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    style={{ filter: preset.filterString }}
                  />
                </div>
                <span
                  className={`text-[11px] font-medium tracking-tight whitespace-nowrap ${
                    isSelected ? 'text-blue-400 font-semibold' : 'text-neutral-400'
                  }`}
                >
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Manual Adjustments Sliders */
        <div className="space-y-3 py-1 px-1">
          {/* Brilho */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-neutral-300 w-24">
              <Sun className="w-3.5 h-3.5 text-amber-300" /> Brilho
            </span>
            <input
              type="range"
              id="slider-brightness"
              min={60}
              max={140}
              value={adjustments.brightness}
              onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
              className="flex-1 accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] text-neutral-400 w-9 text-right">
              {adjustments.brightness}%
            </span>
          </div>

          {/* Contraste */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-neutral-300 w-24">
              <Contrast className="w-3.5 h-3.5 text-indigo-300" /> Contraste
            </span>
            <input
              type="range"
              id="slider-contrast"
              min={60}
              max={150}
              value={adjustments.contrast}
              onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
              className="flex-1 accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] text-neutral-400 w-9 text-right">
              {adjustments.contrast}%
            </span>
          </div>

          {/* Saturação */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-neutral-300 w-24">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> Saturação
            </span>
            <input
              type="range"
              id="slider-saturation"
              min={0}
              max={180}
              value={adjustments.saturation}
              onChange={(e) => handleSliderChange('saturation', Number(e.target.value))}
              className="flex-1 accent-blue-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] text-neutral-400 w-9 text-right">
              {adjustments.saturation}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
