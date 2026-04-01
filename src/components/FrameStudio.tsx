import React from "react";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCcw,
  Search,
} from "lucide-react";
import { api } from "../lib/api";
import {
  formatEuroFromUnknown,
  getNegotiablePriceLabel,
  isNegotiablePrice,
  parsePriceToNumber,
} from "../lib/currency";
import { resolveProductImages } from "../lib/product-images";
import { getCategoryLabel } from "../i18n/categories";
import type { Product } from "./ProductCard";

type FrameThemeKey =
  | "luxury"
  | "minimal"
  | "modern"
  | "brutalist"
  | "editorial"
  | "organic"
  | "cyber"
  | "vintage"
  | "vibrant"
  | "monochrome"
  | "classic_gold"
  | "wooden"
  | "marble"
  | "floral"
  | "geometric"
  | "neon_frame"
  | "paper_cut"
  | "glass"
  | "tape"
  | "shadow_box"
  | "gallery_rail"
  | "pillars"
  | "cinema"
  | "gradient_side"
  | "royal_side";

type FrameTheme = {
  cardClass: string;
  overlayClass: string;
  categoryClass: string;
  titleClass: string;
  pricePillClass: string;
  footerClass: string;
};

const FRAME_IMAGE_FALLBACK = "https://picsum.photos/seed/templesale-frame/800/800";
const FRAME_SITE_LABEL = "templesale.com";

const FRAME_THEME_KEYS: FrameThemeKey[] = [
  "luxury",
  "minimal",
  "modern",
  "brutalist",
  "editorial",
  "organic",
  "cyber",
  "vintage",
  "vibrant",
  "monochrome",
  "classic_gold",
  "wooden",
  "marble",
  "floral",
  "geometric",
  "neon_frame",
  "paper_cut",
  "glass",
  "tape",
  "shadow_box",
  "gallery_rail",
  "pillars",
  "cinema",
  "gradient_side",
  "royal_side",
];

const FRAME_THEME_LABELS: Record<FrameThemeKey, string> = {
  luxury: "Luxury",
  minimal: "Minimal",
  modern: "Modern",
  brutalist: "Brutalist",
  editorial: "Editorial",
  organic: "Organic",
  cyber: "Cyber",
  vintage: "Vintage",
  vibrant: "Vibrant",
  monochrome: "Monochrome",
  classic_gold: "Classic Gold",
  wooden: "Wooden",
  marble: "Marble",
  floral: "Floral",
  geometric: "Geometric",
  neon_frame: "Neon Frame",
  paper_cut: "Paper Cut",
  glass: "Glass",
  tape: "Tape",
  shadow_box: "Shadow Box",
  gallery_rail: "Gallery Rail",
  pillars: "Pillars",
  cinema: "Cinema",
  gradient_side: "Gradient Side",
  royal_side: "Royal Side",
};

type CanvasFrameTheme = {
  categoryColor: string;
  titleColor: string;
  footerColor: string;
  gradientTop: string;
  gradientMiddle: string;
  gradientBottom: string;
  priceBackground: string;
  priceBorder: string;
  priceText: string;
};

const CANVAS_THEME_PRESETS: Record<"luxury" | "minimal" | "modern" | "warm" | "neon", CanvasFrameTheme> = {
  luxury: {
    categoryColor: "#fcd34d",
    titleColor: "#f5f5f4",
    footerColor: "rgba(231,229,228,0.95)",
    gradientTop: "rgba(0,0,0,0.02)",
    gradientMiddle: "rgba(0,0,0,0.35)",
    gradientBottom: "rgba(0,0,0,0.9)",
    priceBackground: "rgba(0,0,0,0.35)",
    priceBorder: "rgba(251,191,36,0.5)",
    priceText: "#fcd34d",
  },
  minimal: {
    categoryColor: "#57534e",
    titleColor: "#1c1917",
    footerColor: "#57534e",
    gradientTop: "rgba(255,255,255,0.02)",
    gradientMiddle: "rgba(255,255,255,0.45)",
    gradientBottom: "rgba(255,255,255,0.95)",
    priceBackground: "rgba(255,255,255,1)",
    priceBorder: "rgba(214,211,209,1)",
    priceText: "#292524",
  },
  modern: {
    categoryColor: "#67e8f9",
    titleColor: "#ffffff",
    footerColor: "rgba(224,247,250,0.95)",
    gradientTop: "rgba(9,9,11,0.02)",
    gradientMiddle: "rgba(9,9,11,0.35)",
    gradientBottom: "rgba(9,9,11,0.95)",
    priceBackground: "rgba(24,24,27,0.8)",
    priceBorder: "rgba(34,211,238,0.5)",
    priceText: "#67e8f9",
  },
  warm: {
    categoryColor: "#fde68a",
    titleColor: "#fafaf9",
    footerColor: "rgba(245,245,244,0.9)",
    gradientTop: "rgba(41,37,36,0.05)",
    gradientMiddle: "rgba(28,25,23,0.38)",
    gradientBottom: "rgba(17,24,39,0.88)",
    priceBackground: "rgba(28,25,23,0.6)",
    priceBorder: "rgba(253,230,138,0.55)",
    priceText: "#fde68a",
  },
  neon: {
    categoryColor: "#c084fc",
    titleColor: "#f5f3ff",
    footerColor: "rgba(233,213,255,0.95)",
    gradientTop: "rgba(0,0,0,0.02)",
    gradientMiddle: "rgba(17,24,39,0.34)",
    gradientBottom: "rgba(2,6,23,0.94)",
    priceBackground: "rgba(17,24,39,0.82)",
    priceBorder: "rgba(192,132,252,0.6)",
    priceText: "#d8b4fe",
  },
};

const CANVAS_THEME_BY_FRAME: Record<FrameThemeKey, keyof typeof CANVAS_THEME_PRESETS> = {
  luxury: "luxury",
  minimal: "minimal",
  modern: "modern",
  brutalist: "minimal",
  editorial: "warm",
  organic: "minimal",
  cyber: "neon",
  vintage: "warm",
  vibrant: "warm",
  monochrome: "modern",
  classic_gold: "warm",
  wooden: "warm",
  marble: "minimal",
  floral: "minimal",
  geometric: "warm",
  neon_frame: "neon",
  paper_cut: "minimal",
  glass: "minimal",
  tape: "minimal",
  shadow_box: "modern",
  gallery_rail: "modern",
  pillars: "warm",
  cinema: "modern",
  gradient_side: "modern",
  royal_side: "warm",
};

const FRAME_THEMES: Record<FrameThemeKey, FrameTheme> = {
  luxury: {
    cardClass: "bg-stone-950 text-stone-100 border border-amber-500/30",
    overlayClass: "bg-gradient-to-t from-black/90 via-black/30 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.25em] text-amber-300 font-semibold",
    titleClass: "text-3xl leading-tight font-serif italic text-stone-100",
    pricePillClass:
      "inline-flex items-center rounded-full border border-amber-400/50 bg-black/35 px-4 py-2 text-xl font-semibold text-amber-300",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-stone-300/90",
  },
  minimal: {
    cardClass: "bg-white text-stone-900 border border-stone-200",
    overlayClass: "bg-gradient-to-t from-white/95 via-white/45 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.2em] text-stone-500 font-semibold",
    titleClass: "text-3xl leading-tight font-medium text-stone-900",
    pricePillClass:
      "inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-xl font-semibold text-stone-800",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-stone-500",
  },
  modern: {
    cardClass: "bg-zinc-950 text-white border border-cyan-400/30",
    overlayClass: "bg-gradient-to-t from-zinc-950/95 via-zinc-950/35 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.25em] text-cyan-300 font-semibold",
    titleClass: "text-3xl leading-tight font-semibold text-white",
    pricePillClass:
      "inline-flex items-center rounded-full border border-cyan-400/50 bg-zinc-900/80 px-4 py-2 text-xl font-semibold text-cyan-300",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-cyan-100/90",
  },
  brutalist: {
    cardClass: "bg-white text-black border-4 border-black",
    overlayClass: "bg-gradient-to-t from-white/95 via-white/30 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.22em] text-black font-black",
    titleClass: "text-3xl leading-tight font-black uppercase tracking-tight text-black",
    pricePillClass:
      "inline-flex items-center rounded-sm border-2 border-black bg-white px-4 py-2 text-xl font-black text-black",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-black/80 font-bold",
  },
  editorial: {
    cardClass: "bg-[#FDFBF7] text-[#2D1B1B] border border-[#2D1B1B]/20",
    overlayClass: "bg-gradient-to-t from-[#2D1B1B]/25 via-[#2D1B1B]/10 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-[#8B0000] font-semibold",
    titleClass: "text-3xl leading-tight italic font-serif text-[#2D1B1B]",
    pricePillClass:
      "inline-flex items-center rounded-full border border-[#8B0000]/35 bg-white/85 px-4 py-2 text-xl font-semibold text-[#8B0000]",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-[#2D1B1B]/80",
  },
  organic: {
    cardClass: "bg-[#E8EAE3] text-[#2C3639] border border-[#4A5D4E]/30 rounded-[1.2rem]",
    overlayClass: "bg-gradient-to-t from-[#E8EAE3]/95 via-[#E8EAE3]/45 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.2em] text-[#2C3639] font-semibold",
    titleClass: "text-3xl leading-tight font-medium text-[#2C3639]",
    pricePillClass:
      "inline-flex items-center rounded-full border border-[#4A5D4E]/40 bg-[#E8EAE3]/90 px-4 py-2 text-xl font-semibold text-[#2C3639]",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-[#4A5D4E]",
  },
  cyber: {
    cardClass:
      "bg-[#050510] text-[#00F5FF] border border-[#00F5FF]/40 shadow-[inset_0_0_50px_rgba(0,245,255,0.12)]",
    overlayClass: "bg-gradient-to-t from-black via-black/45 to-transparent",
    categoryClass:
      "text-[11px] uppercase tracking-[0.24em] text-[#00F5FF] font-semibold drop-shadow-[0_0_8px_rgba(0,245,255,0.55)]",
    titleClass: "text-3xl leading-tight font-mono font-semibold text-[#d9fbff]",
    pricePillClass:
      "inline-flex items-center rounded-full border border-[#00F5FF]/55 bg-[#03111a]/85 px-4 py-2 text-xl font-semibold text-[#67e8f9]",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-[#9debf3]",
  },
  vintage: {
    cardClass: "bg-[#F4EBD0] text-[#122620] border border-[#122620]/20",
    overlayClass: "bg-gradient-to-t from-[#F4EBD0]/95 via-[#F4EBD0]/45 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-[#B68D40] font-semibold",
    titleClass: "text-3xl leading-tight font-serif text-[#122620]",
    pricePillClass:
      "inline-flex items-center rounded-full border border-[#122620]/30 bg-[#F4EBD0]/90 px-4 py-2 text-xl font-semibold text-[#122620]",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-[#122620]/80",
  },
  vibrant: {
    cardClass: "bg-[#FF5F1F] text-black border border-black/20",
    overlayClass: "bg-gradient-to-t from-white/95 via-white/45 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-[#FF5F1F] font-black",
    titleClass: "text-3xl leading-tight font-black text-black",
    pricePillClass:
      "inline-flex items-center rounded-full border border-black/40 bg-white px-4 py-2 text-xl font-black text-black",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-black/80 font-bold",
  },
  monochrome: {
    cardClass: "bg-black text-white border border-white/35",
    overlayClass: "bg-gradient-to-t from-black via-black/70 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.3em] text-white font-light",
    titleClass: "text-3xl leading-tight font-light tracking-wide text-white",
    pricePillClass:
      "inline-flex items-center rounded-full border border-white/55 bg-black/70 px-4 py-2 text-xl font-semibold text-white",
    footerClass: "text-[11px] uppercase tracking-[0.24em] text-white/90",
  },
  classic_gold: {
    cardClass:
      "bg-stone-100 text-stone-900 border-[8px] border-double border-amber-600 shadow-[inset_0_0_0_4px_rgba(180,130,0,0.2)]",
    overlayClass: "bg-gradient-to-t from-white/95 via-white/35 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-amber-700 font-semibold",
    titleClass: "text-3xl leading-tight font-serif text-stone-900",
    pricePillClass:
      "inline-flex items-center rounded-full border border-amber-700/45 bg-white/90 px-4 py-2 text-xl font-semibold text-amber-700",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-amber-900/80",
  },
  wooden: {
    cardClass:
      "bg-[#3D2B1F] text-stone-100 border-[10px] border-[#5D4037] shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]",
    overlayClass: "bg-gradient-to-t from-[#2b1f17]/92 via-[#3D2B1F]/40 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-amber-200 font-semibold",
    titleClass: "text-3xl leading-tight font-serif text-stone-100",
    pricePillClass:
      "inline-flex items-center rounded-full border border-amber-300/45 bg-[#2b1f17]/80 px-4 py-2 text-xl font-semibold text-amber-200",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-amber-100/90",
  },
  marble: {
    cardClass:
      "bg-stone-50 text-stone-700 border-[12px] border-stone-200 shadow-[inset_0_0_10px_rgba(0,0,0,0.05)]",
    overlayClass: "bg-gradient-to-t from-white/92 via-white/45 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-stone-500 font-semibold",
    titleClass: "text-3xl leading-tight font-serif tracking-wide text-stone-700",
    pricePillClass:
      "inline-flex items-center rounded-full border border-stone-300 bg-white/95 px-4 py-2 text-xl font-semibold text-stone-700",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-stone-500",
  },
  floral: {
    cardClass:
      "bg-[#FFF9F9] text-[#7f1d1d] border-[6px] border-pink-100 shadow-[inset_0_0_20px_rgba(255,182,193,0.12)]",
    overlayClass: "bg-gradient-to-t from-white/94 via-pink-50/40 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-pink-500 font-semibold",
    titleClass: "text-3xl leading-tight font-serif italic text-[#7f1d1d]",
    pricePillClass:
      "inline-flex items-center rounded-full border border-pink-300/65 bg-white/90 px-4 py-2 text-xl font-semibold text-pink-600",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-pink-700/80",
  },
  geometric: {
    cardClass: "bg-[#1A1A1A] text-black border-l-[12px] border-r-[12px] border-[#FFD700]",
    overlayClass: "bg-gradient-to-t from-[#FFD700] via-[#FFD700]/65 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-black font-black",
    titleClass: "text-3xl leading-tight font-black uppercase text-black",
    pricePillClass:
      "inline-flex items-center rounded-full border border-black/45 bg-[#FFD700] px-4 py-2 text-xl font-black text-black",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-black/85 font-bold",
  },
  neon_frame: {
    cardClass:
      "bg-black text-purple-200 border-2 border-purple-500 shadow-[inset_0_0_20px_rgba(168,85,247,0.45),0_0_20px_rgba(168,85,247,0.35)]",
    overlayClass: "bg-gradient-to-t from-black via-black/45 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-purple-400 font-semibold",
    titleClass: "text-3xl leading-tight font-mono font-semibold text-purple-100",
    pricePillClass:
      "inline-flex items-center rounded-full border border-purple-400/60 bg-purple-950/60 px-4 py-2 text-xl font-semibold text-purple-300",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-purple-200",
  },
  paper_cut: {
    cardClass:
      "bg-stone-300 text-stone-800 border-[8px] border-stone-100 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]",
    overlayClass: "bg-gradient-to-t from-white/95 via-white/45 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.22em] text-blue-600 font-semibold",
    titleClass: "text-3xl leading-tight font-bold text-stone-800",
    pricePillClass:
      "inline-flex items-center rounded-full border border-stone-300 bg-white/90 px-4 py-2 text-xl font-semibold text-blue-700",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-stone-700",
  },
  glass: {
    cardClass: "bg-gradient-to-br from-blue-50 to-purple-50 text-white border-[10px] border-white/35 shadow-xl",
    overlayClass: "bg-gradient-to-t from-black/55 via-black/20 to-transparent backdrop-blur-[2px]",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-white/90 font-semibold drop-shadow",
    titleClass: "text-3xl leading-tight font-light text-white drop-shadow",
    pricePillClass:
      "inline-flex items-center rounded-full border border-white/60 bg-white/20 px-4 py-2 text-xl font-semibold text-white backdrop-blur",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-white/90",
  },
  tape: {
    cardClass: "bg-stone-100 text-stone-900 border border-stone-300",
    overlayClass: "bg-gradient-to-t from-[#FDFD96]/92 via-[#FDFD96]/52 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.22em] text-stone-900 font-mono font-semibold",
    titleClass: "text-3xl leading-tight font-mono text-stone-900",
    pricePillClass:
      "inline-flex items-center rounded-md border border-stone-500/45 bg-[#FDFD96] px-4 py-2 text-xl font-semibold text-stone-900",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-stone-900/80 font-mono",
  },
  shadow_box: {
    cardClass:
      "bg-stone-800 text-white border-[4px] border-stone-700 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]",
    overlayClass: "bg-gradient-to-t from-stone-900 via-stone-900/45 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-stone-300 font-semibold",
    titleClass: "text-3xl leading-tight font-serif text-white",
    pricePillClass:
      "inline-flex items-center rounded-full border border-stone-400/50 bg-stone-900/65 px-4 py-2 text-xl font-semibold text-stone-200",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-stone-300/90",
  },
  gallery_rail: {
    cardClass: "bg-white text-white border-l-[2px] border-r-[2px] border-stone-800",
    overlayClass: "bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-stone-300 font-semibold",
    titleClass: "text-3xl leading-tight font-serif text-white",
    pricePillClass:
      "inline-flex items-center rounded-full border border-stone-300/40 bg-stone-900/75 px-4 py-2 text-xl font-semibold text-stone-200",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-stone-200/90",
  },
  pillars: {
    cardClass: "bg-stone-50 text-white border-l-[40px] border-r-[40px] border-stone-900 shadow-2xl",
    overlayClass: "bg-gradient-to-t from-stone-900/95 via-stone-900/52 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-stone-400 font-semibold",
    titleClass: "text-3xl leading-tight font-serif tracking-wide text-white",
    pricePillClass:
      "inline-flex items-center rounded-full border border-stone-400/45 bg-stone-900/80 px-4 py-2 text-xl font-semibold text-stone-200",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-stone-300/90",
  },
  cinema: {
    cardClass: "bg-black text-white border-l-[60px] border-r-[60px] border-black",
    overlayClass: "bg-gradient-to-t from-black/95 via-black/62 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-white font-mono",
    titleClass: "text-3xl leading-tight font-mono text-white",
    pricePillClass:
      "inline-flex items-center rounded-full border border-white/45 bg-black/75 px-4 py-2 text-xl font-semibold text-white",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-white/85 font-mono",
  },
  gradient_side: {
    cardClass:
      "bg-white text-stone-900 border-l-[20px] border-r-[20px] border-transparent [background-image:linear-gradient(to_right,#6366f1,#ffffff,#a855f7)] [background-origin:border-box] [background-clip:padding-box,border-box]",
    overlayClass: "bg-gradient-to-t from-white/95 via-white/48 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-indigo-600 font-semibold",
    titleClass: "text-3xl leading-tight font-bold text-stone-900",
    pricePillClass:
      "inline-flex items-center rounded-full border border-indigo-300/65 bg-white px-4 py-2 text-xl font-semibold text-indigo-700",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-indigo-700/85",
  },
  royal_side: {
    cardClass:
      "bg-[#0A0A0A] text-white border-l-[30px] border-r-[30px] border-[#1A1A1A] shadow-[inset_0_0_20px_rgba(255,191,0,0.1)]",
    overlayClass: "bg-gradient-to-t from-black via-black/62 to-transparent",
    categoryClass: "text-[11px] uppercase tracking-[0.24em] text-amber-500 font-semibold",
    titleClass: "text-3xl leading-tight font-serif italic text-white",
    pricePillClass:
      "inline-flex items-center rounded-full border border-amber-500/50 bg-black/70 px-4 py-2 text-xl font-semibold text-amber-400",
    footerClass: "text-[11px] uppercase tracking-[0.2em] text-amber-200/90",
  },
};

const SERIF_CANVAS_TITLE_THEMES = new Set<FrameThemeKey>([
  "luxury",
  "editorial",
  "vintage",
  "classic_gold",
  "wooden",
  "marble",
  "floral",
  "gallery_rail",
  "pillars",
  "royal_side",
]);

function resolveCanvasTheme(themeKey: FrameThemeKey): CanvasFrameTheme {
  const presetKey = CANVAS_THEME_BY_FRAME[themeKey] ?? "luxury";
  return CANVAS_THEME_PRESETS[presetKey];
}

function normalizeSearch(value: string): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function toDisplayPrice(product: Product): string {
  if (product.priceNegotiable || isNegotiablePrice(product.price)) {
    return getNegotiablePriceLabel("it-IT");
  }
  const parsed = parsePriceToNumber(String(product.price ?? ""));
  if (parsed === null || parsed <= 0) {
    return "";
  }
  return formatEuroFromUnknown(product.price, "it-IT");
}

function sanitizeDownloadName(value: string): string {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "templesale-moldura";
}

function normalizeImageUrl(value: string): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }

  if (/^(data:|blob:|https?:)/i.test(normalized)) {
    return normalized;
  }
  if (normalized.startsWith("//")) {
    return `https:${normalized}`;
  }
  if (/^res\.cloudinary\.com\//i.test(normalized)) {
    return `https://${normalized}`;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(normalized)) {
    return `https://${normalized}`;
  }
  if (normalized.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${normalized}`;
  }

  return normalized;
}

function isCrossOriginImageUrl(url: string): boolean {
  const normalized = normalizeImageUrl(url);
  if (!normalized || normalized.startsWith("data:") || normalized.startsWith("blob:")) {
    return false;
  }
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const parsed = new URL(normalized, window.location.origin);
    return parsed.origin !== window.location.origin;
  } catch {
    return true;
  }
}

async function waitForImageElement(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) {
    if (typeof image.decode === "function") {
      await image.decode().catch(() => undefined);
    }
    return;
  }

  await new Promise<void>((resolve) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 12000);

    const finish = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
    };

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
  });
}

async function waitForRenderableImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll("img"));
  if (images.length === 0) {
    return;
  }
  await Promise.all(images.map((image) => waitForImageElement(image)));
}

async function loadImageForCanvas(url: string): Promise<HTMLImageElement | null> {
  const normalizedUrl = normalizeImageUrl(url);
  if (!normalizedUrl) {
    return null;
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";

    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, 12000);

    const onLoad = () => {
      cleanup();
      resolve(image);
    };

    const onError = () => {
      cleanup();
      resolve(null);
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      image.onload = null;
      image.onerror = null;
    };

    image.onload = onLoad;
    image.onerror = onError;
    image.src = normalizedUrl;
  });
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) {
    return;
  }

  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  const offsetX = (sourceWidth - cropWidth) / 2;
  const offsetY = (sourceHeight - cropHeight) / 2;
  context.drawImage(image, offsetX, offsetY, cropWidth, cropHeight, 0, 0, width, height);
}

function drawRoundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeRadius = Math.max(0, Math.min(radius, height / 2, width / 2));
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const normalized = String(text ?? "").trim();
  if (!normalized) {
    return [];
  }

  const words = normalized.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const candidateWidth = context.measureText(candidate).width;
    if (candidateWidth <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      lines.push(word);
      currentLine = "";
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  if (lines.length === maxLines && words.length > 0) {
    const lastIndex = maxLines - 1;
    let lastLine = lines[lastIndex] ?? "";
    while (lastLine.length > 0 && context.measureText(`${lastLine}...`).width > maxWidth) {
      lastLine = lastLine.slice(0, -1).trimEnd();
    }
    lines[lastIndex] = lastLine ? `${lastLine}...` : "...";
  }

  return lines;
}

async function exportFrameWithCanvasFallback(params: {
  imageUrl: string;
  frameTitle: string;
  frameCategory: string;
  framePrice: string;
  frameTheme: FrameThemeKey;
}): Promise<string> {
  const canvas = document.createElement("canvas");
  const size = 1080;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas non disponibile.");
  }

  const loadedImage = await loadImageForCanvas(params.imageUrl);
  if (loadedImage) {
    drawImageCover(context, loadedImage, size, size);
  } else {
    context.fillStyle = "#1c1917";
    context.fillRect(0, 0, size, size);
  }

  const theme = resolveCanvasTheme(params.frameTheme);
  const gradient = context.createLinearGradient(0, size * 0.2, 0, size);
  gradient.addColorStop(0, theme.gradientTop);
  gradient.addColorStop(0.62, theme.gradientMiddle);
  gradient.addColorStop(1, theme.gradientBottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const category = String(params.frameCategory ?? "").trim() || "Categoria";
  const title = String(params.frameTitle ?? "").trim() || "Nome prodotto";
  const price = String(params.framePrice ?? "").trim();
  const showPrice = shouldShowPrice(price);

  const padding = 76;
  const footerY = size - padding;

  context.textAlign = "left";
  context.textBaseline = "alphabetic";

  const titleFont = SERIF_CANVAS_TITLE_THEMES.has(params.frameTheme)
    ? "italic 600 72px serif"
    : "600 68px Inter, Arial, sans-serif";
  context.font = titleFont;
  context.fillStyle = theme.titleColor;
  const titleLines = wrapCanvasText(context, title, size - padding * 2, 3);
  const titleLineHeight = 78;
  const titleBottomY = showPrice ? footerY - 150 : footerY - 84;
  const minTitleStartY = padding + 128;
  const titleStartY = Math.max(
    minTitleStartY,
    titleBottomY - titleLineHeight * Math.max(titleLines.length - 1, 0),
  );
  titleLines.forEach((line, index) => {
    context.fillText(line, padding, titleStartY + index * titleLineHeight);
  });

  context.font = "600 28px Inter, Arial, sans-serif";
  const categoryText = category.toUpperCase();
  const categoryGap = 58;
  const minCategoryY = padding + 54;
  const categoryY = Math.max(minCategoryY, titleStartY - categoryGap);
  context.shadowColor = "rgba(0,0,0,0.42)";
  context.shadowBlur = 8;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 1;
  context.fillStyle = theme.categoryColor;
  context.fillText(categoryText, padding, categoryY);
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;

  if (showPrice) {
    context.font = "700 40px Inter, Arial, sans-serif";
    const priceText = price;
    const textWidth = context.measureText(priceText).width;
    const pillHeight = 72;
    const pillWidth = textWidth + 56;
    const pillX = padding;
    const pillY = footerY - 68;

    drawRoundedRectangle(context, pillX, pillY - pillHeight + 12, pillWidth, pillHeight, 36);
    context.fillStyle = theme.priceBackground;
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = theme.priceBorder;
    context.stroke();

    context.fillStyle = theme.priceText;
    context.fillText(priceText, pillX + 28, pillY);
  }

  context.font = "600 24px Inter, Arial, sans-serif";
  context.fillStyle = theme.footerColor;
  const footerTextWidth = context.measureText(FRAME_SITE_LABEL).width;
  context.fillText(FRAME_SITE_LABEL, size - padding - footerTextWidth, footerY);

  return canvas.toDataURL("image/png");
}

function shouldShowPrice(value: string): boolean {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return false;
  }

  if (isNegotiablePrice(normalized)) {
    return true;
  }

  const parsed = parsePriceToNumber(normalized);
  if (parsed === null) {
    return true;
  }

  return parsed > 0;
}

export default function FrameStudio() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
  const [productsError, setProductsError] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedProductId, setSelectedProductId] = React.useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [frameTitle, setFrameTitle] = React.useState("");
  const [frameCategory, setFrameCategory] = React.useState("");
  const [framePrice, setFramePrice] = React.useState("");
  const [frameTheme, setFrameTheme] = React.useState<FrameThemeKey>("luxury");
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState("");
  const frameRef = React.useRef<HTMLDivElement | null>(null);

  const loadProducts = React.useCallback(async () => {
    setIsLoadingProducts(true);
    setProductsError("");
    try {
      const loaded = await api.getProducts();
      const normalizedProducts = Array.isArray(loaded) ? loaded : [];
      normalizedProducts.sort((left, right) => Number(right.id) - Number(left.id));
      setProducts(normalizedProducts);
      if (normalizedProducts.length > 0) {
        setSelectedProductId((current) => current ?? normalizedProducts[0].id);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Errore durante il caricamento dei prodotti.";
      setProductsError(message);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  React.useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const selectedProduct = React.useMemo(() => {
    if (!selectedProductId) {
      return null;
    }
    return products.find((item) => item.id === selectedProductId) ?? null;
  }, [products, selectedProductId]);

  const selectedProductImages = React.useMemo(() => {
    if (!selectedProduct) {
      return [];
    }
    return resolveProductImages(selectedProduct).map((image) => normalizeImageUrl(image));
  }, [selectedProduct]);

  const selectedImageUrl = React.useMemo(() => {
    if (selectedProductImages.length === 0) {
      return "";
    }
    const safeIndex = Math.min(selectedImageIndex, selectedProductImages.length - 1);
    return selectedProductImages[safeIndex] ?? "";
  }, [selectedImageIndex, selectedProductImages]);

  React.useEffect(() => {
    if (!selectedProduct) {
      return;
    }
    setSelectedImageIndex(0);
    setFrameTitle(selectedProduct.name);
    setFrameCategory(getCategoryLabel(selectedProduct.category, "it-IT"));
    setFramePrice(toDisplayPrice(selectedProduct));
  }, [selectedProduct]);

  const filteredProducts = React.useMemo(() => {
    const normalizedQuery = normalizeSearch(searchQuery);
    if (!normalizedQuery) {
      return products.slice(0, 80);
    }

    return products
      .filter((product) => {
        const name = normalizeSearch(product.name);
        const category = normalizeSearch(product.category);
        const id = String(product.id);
        return (
          name.includes(normalizedQuery) ||
          category.includes(normalizedQuery) ||
          id.includes(normalizedQuery)
        );
      })
      .slice(0, 80);
  }, [products, searchQuery]);

  const currentTheme = FRAME_THEMES[frameTheme];
  const canExport = Boolean(selectedImageUrl) && !isExporting;

  const handleExport = React.useCallback(async () => {
    if (!frameRef.current || !selectedImageUrl) {
      return;
    }

    const node = frameRef.current;
    setIsExporting(true);
    setExportError("");

    try {
      await waitForRenderableImages(node);

      let dataUrl = "";
      const useCanvasFirst = isCrossOriginImageUrl(selectedImageUrl);
      if (useCanvasFirst) {
        dataUrl = await exportFrameWithCanvasFallback({
          imageUrl: selectedImageUrl,
          frameTitle,
          frameCategory,
          framePrice,
          frameTheme,
        });
      } else {
        try {
          dataUrl = await toPng(node, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: "#ffffff",
            includeQueryParams: true,
          });
        } catch (htmlToImageError) {
          console.warn("[FrameStudio] html-to-image export failed, trying fallback.", htmlToImageError);
          dataUrl = await exportFrameWithCanvasFallback({
            imageUrl: selectedImageUrl,
            frameTitle,
            frameCategory,
            framePrice,
            frameTheme,
          });
        }
      }

      if (!dataUrl) {
        throw new Error("Nessuna immagine generata durante l'esportazione.");
      }

      const link = document.createElement("a");
      link.download = `${sanitizeDownloadName(frameTitle)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("[FrameStudio] Export failed.", error);
      setExportError("Esportazione non riuscita. Riprova con un'altra immagine.");
    } finally {
      setIsExporting(false);
    }
  }, [frameCategory, framePrice, frameTheme, frameTitle, selectedImageUrl]);

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#f8f7f4]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-1 rounded-sm border border-stone-300 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-stone-600 hover:border-stone-800 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Sito
            </a>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                TempleSale Studio
              </p>
              <h1 className="text-sm sm:text-base font-semibold tracking-[0.04em]">
                Generatore Moldura Instagram
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadProducts();
            }}
            className="inline-flex items-center gap-2 rounded-sm border border-stone-300 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-stone-700 hover:border-stone-800 transition-colors"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Aggiorna prodotti
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(320px,440px)]">
        <section className="rounded-sm border border-stone-200 bg-white p-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
            Cerca prodotto
          </h2>
          <div className="mt-3 flex items-center gap-2 rounded-sm border border-stone-200 px-3 py-2">
            <Search className="h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Nome, categoria o ID"
              className="w-full bg-transparent text-sm text-stone-700 outline-none placeholder:text-stone-400"
            />
          </div>

          <div className="mt-4 max-h-[68vh] space-y-2 overflow-y-auto pr-1">
            {isLoadingProducts ? (
              <p className="py-6 text-center text-sm text-stone-500">Caricamento prodotti...</p>
            ) : productsError ? (
              <div className="space-y-3 rounded-sm border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{productsError}</p>
                <button
                  type="button"
                  onClick={() => {
                    void loadProducts();
                  }}
                  className="rounded-sm border border-red-300 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-red-700 hover:border-red-500"
                >
                  Riprova
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone-500">Nessun prodotto trovato.</p>
            ) : (
              filteredProducts.map((product) => {
                const isActive = selectedProductId === product.id;
                const resolvedImages = resolveProductImages(product).map((image) =>
                  normalizeImageUrl(image),
                );
                const firstImage = resolvedImages[0] || FRAME_IMAGE_FALLBACK;
                const imageCount = resolvedImages.filter(Boolean).length;
                const priceLabel = toDisplayPrice(product);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProductId(product.id)}
                    className={`w-full rounded-sm border p-2 text-left transition-colors ${
                      isActive
                        ? "border-stone-800 bg-stone-100"
                        : "border-stone-200 bg-white hover:border-stone-400"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="h-14 w-14 flex-none rounded-sm object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">
                          ID {product.id} · {getCategoryLabel(product.category, "it-IT")}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-sm font-medium text-stone-800">
                          {product.name}
                        </p>
                        <p className="mt-1 text-[11px] text-stone-500">
                          {imageCount} foto
                          {priceLabel ? ` · ${priceLabel}` : ""}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-sm border border-stone-200 bg-white p-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
            Dati moldura
          </h2>

          {!selectedProduct ? (
            <p className="text-sm text-stone-500">
              Seleziona un prodotto dalla lista per iniziare.
            </p>
          ) : (
            <>
              <div className="rounded-sm border border-stone-200 bg-stone-50 p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">
                  Prodotto selezionato
                </p>
                <p className="mt-1 text-sm font-medium text-stone-900">{selectedProduct.name}</p>
                <p className="mt-1 text-xs text-stone-600">
                  ID {selectedProduct.id} · {getCategoryLabel(selectedProduct.category, "it-IT")}
                </p>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500">
                  Scegli foto del prodotto
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {selectedProductImages.map((imageUrl, index) => (
                    <button
                      key={`${selectedProduct.id}-${index}`}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square overflow-hidden rounded-sm border ${
                        index === selectedImageIndex
                          ? "border-stone-800"
                          : "border-stone-200 hover:border-stone-400"
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`Foto ${index + 1}`}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-1.5">
                  <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500">
                    Titolo
                  </span>
                  <input
                    type="text"
                    value={frameTitle}
                    onChange={(event) => setFrameTitle(event.target.value)}
                    className="rounded-sm border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-700"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500">
                      Categoria
                    </span>
                    <input
                      type="text"
                      value={frameCategory}
                      onChange={(event) => setFrameCategory(event.target.value)}
                      className="rounded-sm border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-700"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500">
                      Prezzo
                    </span>
                    <input
                      type="text"
                      value={framePrice}
                      onChange={(event) => setFramePrice(event.target.value)}
                      className="rounded-sm border border-stone-200 px-3 py-2 text-sm text-stone-800 outline-none focus:border-stone-700"
                    />
                  </label>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500">
                    Tema
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {FRAME_THEME_KEYS.map((themeKey) => (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setFrameTheme(themeKey)}
                        className={`rounded-sm border px-2 py-1.5 text-[10px] uppercase tracking-[0.08em] ${
                          frameTheme === themeKey
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-stone-300 text-stone-700 hover:border-stone-700"
                        }`}
                      >
                        {FRAME_THEME_LABELS[themeKey]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void handleExport();
                  }}
                  disabled={!canExport}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-sm bg-stone-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isExporting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Esportazione...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Scarica PNG
                    </>
                  )}
                </button>
                {exportError && <p className="text-xs text-red-600">{exportError}</p>}
              </div>
            </>
          )}
        </section>

        <section className="rounded-sm border border-stone-200 bg-white p-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
            Anteprima Instagram 1:1
          </h2>
          <div className="mt-4 flex justify-center">
            <div
              ref={frameRef}
              className={`relative aspect-square w-full max-w-[520px] overflow-hidden ${currentTheme.cardClass}`}
            >
              {selectedImageUrl ? (
                <img
                  src={selectedImageUrl}
                  alt={frameTitle || "Anteprima prodotto"}
                  className="absolute inset-0 h-full w-full object-cover"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-100 text-stone-400">
                  <ImageIcon className="h-16 w-16" />
                </div>
              )}

              <div className={`absolute inset-0 ${currentTheme.overlayClass}`} />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="flex flex-col gap-4">
                  <span
                    className={`${currentTheme.categoryClass} inline-flex w-fit items-center leading-none [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]`}
                  >
                    {frameCategory || "Categoria"}
                  </span>
                  <h3 className={`${currentTheme.titleClass} mt-0`}>
                    {frameTitle || "Nome prodotto"}
                  </h3>
                  <div className="flex items-end justify-between gap-3">
                    {shouldShowPrice(framePrice) ? (
                      <span className={currentTheme.pricePillClass}>{framePrice}</span>
                    ) : (
                      <span />
                    )}
                    <span className={currentTheme.footerClass}>templesale.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-stone-500">
            L'anteprima è identica al file PNG esportato.
          </p>
        </section>
      </main>
    </div>
  );
}
