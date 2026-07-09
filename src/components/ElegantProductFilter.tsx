import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronRight, RotateCcw, SlidersHorizontal, X } from "lucide-react";

type CategoryFilter = {
  key: string;
  count: number;
};

type ElegantProductFilterProps = {
  activeCategory: string;
  categories: CategoryFilter[];
  effectivePriceSliderValue: number;
  hasMaxPriceFilter: boolean;
  priceSliderMax: number;
  priceSliderStep: number;
  resultsCount: number;
  formatPrice: (value: number) => string;
  getCategoryName: (category: string) => string;
  onCategorySelect: (category: string) => void;
  onClearAll: () => void;
  onMaxPriceChange: (value: number | null) => void;
  labels: {
    all: string;
    apply: string;
    category: string;
    clear: string;
    clearAll: string;
    filter: string;
    filters: string;
    maxPrice: string;
    noActiveFilters: string;
    price: string;
    results: string;
    selectedFilters: string;
  };
};

export default function ElegantProductFilter({
  activeCategory,
  categories,
  effectivePriceSliderValue,
  hasMaxPriceFilter,
  priceSliderMax,
  priceSliderStep,
  resultsCount,
  formatPrice,
  getCategoryName,
  onCategorySelect,
  onClearAll,
  onMaxPriceChange,
  labels,
}: ElegantProductFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const activeCategoryFilter = activeCategory !== "All" ? activeCategory : "";
  const hasActiveFilters = Boolean(activeCategoryFilter) || hasMaxPriceFilter;

  const visibleCategories = React.useMemo(
    () => categories.filter((category) => category.key !== "All"),
    [categories],
  );

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      onMaxPriceChange(null);
      return;
    }
    onMaxPriceChange(nextValue);
  };

  return (
    <section className="bg-[#fdfcfb] border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-900 bg-stone-950 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm transition-colors hover:bg-stone-800"
                aria-expanded={isOpen}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {labels.filters}
                {hasActiveFilters && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] leading-none text-stone-950">
                    {(activeCategoryFilter ? 1 : 0) + (hasMaxPriceFilter ? 1 : 0)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onCategorySelect("All");
                  onMaxPriceChange(null);
                }}
                className={`h-10 rounded-md border px-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${
                  !hasActiveFilters
                    ? "border-stone-900 bg-stone-100 text-stone-900"
                    : "border-stone-200 bg-white text-stone-500 hover:border-stone-500 hover:text-stone-800"
                }`}
              >
                {labels.all}
              </button>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
              <span className="text-stone-900">{resultsCount}</span> {labels.results}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
            {!hasActiveFilters ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                {labels.noActiveFilters}
              </span>
            ) : (
              <>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                  {labels.selectedFilters}
                </span>

                {activeCategoryFilter && (
                  <button
                    type="button"
                    onClick={() => onCategorySelect("All")}
                    className="inline-flex h-8 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-[11px] font-semibold text-stone-700 transition-colors hover:border-stone-500"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-stone-400">
                      {labels.category}
                    </span>
                    {getCategoryName(activeCategoryFilter)}
                    <X className="h-3 w-3 text-stone-400" />
                  </button>
                )}

                {hasMaxPriceFilter && (
                  <button
                    type="button"
                    onClick={() => onMaxPriceChange(null)}
                    className="inline-flex h-8 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-[11px] font-semibold text-stone-700 transition-colors hover:border-stone-500"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-stone-400">
                      {labels.price}
                    </span>
                    {formatPrice(effectivePriceSliderValue)}
                    <X className="h-3 w-3 text-stone-400" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClearAll}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-stone-500 transition-colors hover:border-stone-900 hover:text-stone-900"
                >
                  <RotateCcw className="h-3 w-3" />
                  {labels.clearAll}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-80 flex justify-start">
            <motion.button
              type="button"
              aria-label={labels.clear}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 230 }}
              className="relative flex h-full w-full max-w-md flex-col border-l border-stone-100 bg-white shadow-[0_0_50px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-950 text-white">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-950">
                      {labels.filters}
                    </h2>
                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                      {resultsCount} {labels.results}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-900"
                  aria-label={labels.clear}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grow overflow-y-auto px-6 py-6">
                <div className="space-y-8">
                  <div>
                    <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                      {labels.category}
                    </h3>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => onCategorySelect("All")}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-3 text-left transition-colors ${
                          activeCategory === "All"
                            ? "border-stone-900 bg-stone-50 text-stone-950"
                            : "border-stone-100 bg-white text-stone-600 hover:border-stone-300"
                        }`}
                      >
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
                          {labels.all}
                        </span>
                        {activeCategory === "All" ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
                        )}
                      </button>

                      {visibleCategories.map((category) => {
                        const selected = activeCategory === category.key;

                        return (
                          <button
                            key={category.key}
                            type="button"
                            onClick={() => onCategorySelect(category.key)}
                            className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-3 text-left transition-colors ${
                              selected
                                ? "border-stone-900 bg-stone-50 text-stone-950"
                                : "border-stone-100 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
                            }`}
                          >
                            <span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.14em]">
                              {getCategoryName(category.key)}
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span className="text-[10px] font-mono text-stone-400">
                                {category.count}
                              </span>
                              {selected ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-stone-100 pt-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                        {labels.maxPrice}
                      </h3>
                      <span className="rounded-md border border-stone-100 bg-stone-50 px-2.5 py-1 text-[11px] font-bold text-stone-950">
                        {formatPrice(effectivePriceSliderValue)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={priceSliderMax}
                      step={priceSliderStep}
                      value={effectivePriceSliderValue}
                      onChange={handlePriceChange}
                      className="h-1.5 w-full cursor-pointer accent-stone-950"
                      aria-label={labels.maxPrice}
                    />

                    <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                      <span>{formatPrice(0)}</span>
                      <span>{formatPrice(priceSliderMax)}</span>
                    </div>

                    {hasMaxPriceFilter && (
                      <button
                        type="button"
                        onClick={() => onMaxPriceChange(null)}
                        className="mt-4 h-9 rounded-md border border-stone-200 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-600 transition-colors hover:border-stone-900 hover:text-stone-900"
                      >
                        {labels.clear}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-stone-100 bg-white p-5">
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setIsOpen(false);
                  }}
                  className="h-11 rounded-md border border-stone-200 px-5 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500 transition-colors hover:border-stone-900 hover:text-stone-900"
                >
                  {labels.clear}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-11 grow rounded-md bg-stone-950 px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-stone-800"
                >
                  {labels.apply} ({resultsCount})
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
