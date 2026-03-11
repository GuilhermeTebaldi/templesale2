import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Trash2, Camera, Tag, DollarSign, Type, Layout } from 'lucide-react';
import { toPng } from 'html-to-image';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for tailwind class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FrameData {
  image: string | null;
  price: string;
  category: string;
  productName: string;
  theme: 'luxury' | 'minimal' | 'modern' | 'brutalist' | 'editorial' | 'organic' | 'cyber' | 'vintage' | 'vibrant' | 'monochrome' | 'classic_gold' | 'wooden' | 'marble' | 'floral' | 'geometric' | 'neon_frame' | 'paper_cut' | 'glass' | 'tape' | 'shadow_box' | 'gallery_rail' | 'pillars' | 'cinema' | 'gradient_side' | 'royal_side';
}

export default function App() {
  const [data, setData] = useState<FrameData>({
    image: null,
    price: '',
    category: '',
    productName: '',
    theme: 'luxury',
  });
  const [isExporting, setIsExporting] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setData((prev) => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadFrame = useCallback(async () => {
    if (frameRef.current === null) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(frameRef.current, { cacheBust: true, quality: 1 });
      const link = document.createElement('a');
      link.download = `templesale-${data.productName || 'post'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    } finally {
      setIsExporting(false);
    }
  }, [data.productName]);

  const themes = {
    luxury: {
      container: "bg-stone-950 text-stone-100",
      overlay: "bg-gradient-to-t from-black/90 via-black/20 to-transparent",
      accent: "text-amber-400",
      border: "border-amber-400/30",
      font: "font-serif",
      extra: ""
    },
    minimal: {
      container: "bg-white text-stone-900",
      overlay: "bg-gradient-to-t from-white/80 via-white/10 to-transparent",
      accent: "text-stone-950",
      border: "border-stone-200",
      font: "font-sans",
      extra: ""
    },
    modern: {
      container: "bg-zinc-900 text-white",
      overlay: "bg-gradient-to-t from-black/60 via-transparent to-transparent backdrop-blur-[2px]",
      accent: "text-emerald-400",
      border: "border-zinc-700",
      font: "font-sans",
      extra: ""
    },
    brutalist: {
      container: "bg-white text-black",
      overlay: "bg-white/90 border-t-4 border-black mt-auto h-fit",
      accent: "text-black font-black",
      border: "border-black",
      font: "font-sans font-black uppercase tracking-tighter",
      extra: "border-4 border-black"
    },
    editorial: {
      container: "bg-[#FDFBF7] text-[#2D1B1B]",
      overlay: "bg-gradient-to-t from-[#2D1B1B]/20 to-transparent",
      accent: "text-[#8B0000]",
      border: "border-[#2D1B1B]/20",
      font: "font-serif italic",
      extra: ""
    },
    organic: {
      container: "bg-[#E8EAE3] text-[#4A5D4E]",
      overlay: "bg-gradient-to-t from-[#E8EAE3] via-[#E8EAE3]/20 to-transparent",
      accent: "text-[#2C3639]",
      border: "border-[#4A5D4E]/30",
      font: "font-sans",
      extra: "rounded-[3rem]"
    },
    cyber: {
      container: "bg-[#050510] text-[#00F5FF]",
      overlay: "bg-gradient-to-t from-black via-black/40 to-transparent border-t border-[#00F5FF]/30",
      accent: "text-[#00F5FF] drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]",
      border: "border-[#00F5FF]/40",
      font: "font-mono",
      extra: "shadow-[inset_0_0_50px_rgba(0,245,255,0.1)]"
    },
    vintage: {
      container: "bg-[#F4EBD0] text-[#122620]",
      overlay: "bg-gradient-to-t from-[#F4EBD0] via-[#F4EBD0]/40 to-transparent border-t-2 border-[#122620]/10",
      accent: "text-[#B68D40]",
      border: "border-[#122620]/20",
      font: "font-serif",
      extra: "sepia-[0.2]"
    },
    vibrant: {
      container: "bg-[#FF5F1F] text-black",
      overlay: "bg-white/95 m-4 rounded-2xl shadow-xl h-fit self-center mb-8",
      accent: "text-[#FF5F1F]",
      border: "border-black/10",
      font: "font-sans font-black",
      extra: ""
    },
    monochrome: {
      container: "bg-black text-white",
      overlay: "bg-gradient-to-t from-black via-black/60 to-transparent border-t border-white/20",
      accent: "text-white underline underline-offset-8",
      border: "border-white/40",
      font: "font-sans font-light tracking-[0.3em]",
      extra: ""
    },
    classic_gold: {
      container: "bg-stone-100",
      overlay: "bg-gradient-to-t from-white/95 via-white/20 to-transparent",
      accent: "text-amber-700",
      border: "border-amber-600",
      font: "font-serif",
      extra: "border-[8px] border-double border-amber-600 shadow-[inset_0_0_0_4px_rgba(180,130,0,0.2)]"
    },
    wooden: {
      container: "bg-stone-200",
      overlay: "bg-gradient-to-t from-[#3D2B1F] via-transparent to-transparent text-stone-100",
      accent: "text-amber-200",
      border: "border-amber-900/50",
      font: "font-serif",
      extra: "border-[10px] border-[#5D4037] shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]"
    },
    marble: {
      container: "bg-stone-50",
      overlay: "bg-gradient-to-t from-white/90 via-transparent to-transparent",
      accent: "text-stone-600",
      border: "border-stone-300",
      font: "font-serif tracking-widest",
      extra: "border-[12px] border-stone-200 shadow-[inset_0_0_10px_rgba(0,0,0,0.05)]"
    },
    floral: {
      container: "bg-[#FFF9F9]",
      overlay: "bg-gradient-to-t from-white/95 via-transparent to-transparent",
      accent: "text-pink-500",
      border: "border-pink-100",
      font: "font-serif italic",
      extra: "border-[6px] border-pink-50 shadow-[inset_0_0_20px_rgba(255,182,193,0.1)]"
    },
    geometric: {
      container: "bg-[#1A1A1A]",
      overlay: "bg-[#FFD700] text-black h-fit mt-auto py-4",
      accent: "text-black font-black",
      border: "border-black",
      font: "font-sans font-black",
      extra: "border-l-[12px] border-r-[12px] border-[#FFD700]"
    },
    neon_frame: {
      container: "bg-black",
      overlay: "bg-gradient-to-t from-black via-black/20 to-transparent border-t border-purple-500/30",
      accent: "text-purple-400",
      border: "border-purple-500",
      font: "font-mono",
      extra: "border-2 border-purple-500 shadow-[inset_0_0_20px_rgba(168,85,247,0.4),0_0_20px_rgba(168,85,247,0.4)]"
    },
    paper_cut: {
      container: "bg-stone-300",
      overlay: "bg-gradient-to-t from-white via-white/10 to-transparent",
      accent: "text-blue-600",
      border: "border-stone-100",
      font: "font-sans font-bold",
      extra: "border-[8px] border-stone-100 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]"
    },
    glass: {
      container: "bg-gradient-to-br from-blue-50 to-purple-50",
      overlay: "bg-white/20 backdrop-blur-md border-t border-white/40",
      accent: "text-white drop-shadow-md",
      border: "border-white/50",
      font: "font-sans font-light",
      extra: "border-[10px] border-white/30 shadow-xl"
    },
    tape: {
      container: "bg-stone-100",
      overlay: "bg-[#FDFD96]/90 text-stone-800 h-fit mt-auto py-3",
      accent: "text-stone-900 font-mono",
      border: "border-stone-300",
      font: "font-mono",
      extra: "border-t-[15px] border-b-[15px] border-stone-200/80"
    },
    shadow_box: {
      container: "bg-stone-800",
      overlay: "bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent text-white",
      accent: "text-stone-400",
      border: "border-stone-700",
      font: "font-serif",
      extra: "border-[4px] border-stone-700 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]"
    },
    gallery_rail: {
      container: "bg-white",
      overlay: "bg-gradient-to-t from-stone-900 via-transparent to-transparent text-white",
      accent: "text-stone-300",
      border: "border-stone-800",
      font: "font-serif",
      extra: "border-l-[2px] border-r-[2px] border-stone-800"
    },
    pillars: {
      container: "bg-stone-50",
      overlay: "bg-stone-900/90 text-white mt-auto py-6",
      accent: "text-stone-400",
      border: "border-stone-800",
      font: "font-serif tracking-widest",
      extra: "border-l-[40px] border-r-[40px] border-stone-900 shadow-2xl"
    },
    cinema: {
      container: "bg-black",
      overlay: "bg-black/80 text-white py-4",
      accent: "text-white font-mono",
      border: "border-white/20",
      font: "font-mono",
      extra: "border-l-[60px] border-r-[60px] border-black relative after:content-[''] after:absolute after:inset-y-0 after:left-[-40px] after:w-[20px] after:bg-[radial-gradient(circle,white_40%,transparent_40%)] after:bg-[size:20px_40px] before:content-[''] before:absolute before:inset-y-0 before:right-[-40px] before:w-[20px] before:bg-[radial-gradient(circle,white_40%,transparent_40%)] before:bg-[size:20px_40px]"
    },
    gradient_side: {
      container: "bg-white",
      overlay: "bg-white/90 text-stone-900 mt-auto py-4 rounded-t-2xl mx-4 shadow-2xl",
      accent: "text-indigo-600",
      border: "border-indigo-100",
      font: "font-sans font-bold",
      extra: "border-l-[20px] border-r-[20px] border-transparent bg-gradient-to-r from-indigo-500 via-white to-purple-500 bg-clip-border"
    },
    royal_side: {
      container: "bg-[#0A0A0A]",
      overlay: "bg-gradient-to-t from-black via-black/60 to-transparent text-white",
      accent: "text-amber-500",
      border: "border-amber-500/30",
      font: "font-serif italic",
      extra: "border-l-[30px] border-r-[30px] border-[#1A1A1A] shadow-[inset_0_0_20px_rgba(255,191,0,0.1)]"
    }
  };

  const currentTheme = themes[data.theme];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-200">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-950 rounded-lg flex items-center justify-center">
              <span className="text-white font-serif font-bold text-xl">T</span>
            </div>
            <h1 className="text-xl font-serif font-semibold tracking-tight">TempleSale <span className="text-stone-400 font-sans text-sm font-normal">Studio</span></h1>
          </div>
          <button
            onClick={downloadFrame}
            disabled={!data.image || isExporting}
            className="flex items-center gap-2 bg-stone-950 text-white px-6 py-2 rounded-full hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-stone-200"
          >
            {isExporting ? 'Exporting...' : <><Download size={18} /> Export for Instagram</>}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-8">
            <section className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                <Layout size={16} /> Configuration
              </h2>
              
              <div className="space-y-6 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-500 uppercase">Product Photo</label>
                  {!data.image ? (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-stone-200 rounded-2xl cursor-pointer hover:bg-stone-50 hover:border-stone-300 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-stone-400" />
                        <p className="mb-2 text-sm text-stone-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-stone-400">PNG, JPG or WEBP (Square recommended)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  ) : (
                    <div className="relative group rounded-2xl overflow-hidden h-48 border border-stone-200">
                      <img src={data.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          onClick={() => setData(prev => ({ ...prev, image: null }))}
                          className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition-transform"
                        >
                          <Trash2 size={20} />
                        </button>
                        <label className="p-2 bg-white rounded-full text-stone-900 cursor-pointer hover:scale-110 transition-transform">
                          <Camera size={20} />
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-500 uppercase flex items-center gap-1">
                      <Type size={12} /> Product Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Luxury Silk Scarf"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-950 outline-none transition-all"
                      value={data.productName}
                      onChange={(e) => setData(prev => ({ ...prev, productName: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500 uppercase flex items-center gap-1">
                        <DollarSign size={12} /> Price
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. $299"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-950 outline-none transition-all"
                        value={data.price}
                        onChange={(e) => setData(prev => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500 uppercase flex items-center gap-1">
                        <Tag size={12} /> Category
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Accessories"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-950 outline-none transition-all"
                        value={data.category}
                        onChange={(e) => setData(prev => ({ ...prev, category: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Theme Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-500 uppercase">Aesthetic Theme</label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {(Object.keys(themes) as Array<keyof typeof themes>).map((t) => (
                      <button
                        key={t}
                        onClick={() => setData(prev => ({ ...prev, theme: t }))}
                        className={cn(
                          "py-2 px-1 rounded-lg text-[9px] font-medium border transition-all capitalize truncate",
                          data.theme === t 
                            ? "bg-stone-950 text-white border-stone-950 shadow-md" 
                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                        )}
                        title={t.replace('_', ' ')}
                      >
                        {t.split('_')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="p-6 bg-stone-900 rounded-3xl text-stone-400 text-sm">
              <p className="italic">"Design is not just what it looks like and feels like. Design is how it works."</p>
              <p className="mt-2 text-xs font-bold text-stone-500">— TempleSale Creative Team</p>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-6 self-start">Live Preview</h2>
            
            <div className="relative group">
              {/* The actual frame to be exported */}
              <div 
                ref={frameRef}
                id="instagram-frame"
                className={cn(
                  "w-[350px] h-[350px] md:w-[500px] md:h-[500px] overflow-hidden relative shadow-2xl transition-all duration-500 flex flex-col",
                  currentTheme.container,
                  currentTheme.font,
                  currentTheme.extra
                )}
                style={{ aspectRatio: '1/1' }}
              >
                <div className="flex-1 relative overflow-hidden">
                  {data.image ? (
                    <img src={data.image} alt="Product" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-300">
                      <Layout size={64} strokeWidth={1} />
                    </div>
                  )}

                {/* Overlays (Inside the image area for some themes, or fixed) */}
                <div className={cn(
                  "absolute inset-0 flex flex-col justify-end p-6 md:p-10 transition-all duration-500 pointer-events-none", 
                  currentTheme.overlay,
                  data.theme === 'vibrant' ? 'p-10 md:p-14' : ''
                )}>
                  <div className="space-y-1 md:space-y-2 pointer-events-auto">
                    {data.category && (
                      <motion.span 
                        key={`${data.theme}-cat`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold block", currentTheme.accent)}
                      >
                        {data.category}
                      </motion.span>
                    )}
                    
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex-1">
                        <motion.h3 
                          key={`${data.theme}-name`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xl md:text-3xl font-medium leading-tight"
                        >
                          {data.productName || 'Product Name'}
                        </motion.h3>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-px w-8 bg-current opacity-30" />
                          <span className="text-[10px] md:text-xs uppercase tracking-widest opacity-60">templesale.com</span>
                        </div>
                      </div>

                      {data.price && (
                        <motion.div 
                          key={`${data.theme}-price`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={cn(
                            "px-4 py-2 md:px-6 md:py-3 border rounded-full flex items-center justify-center shrink-0",
                            currentTheme.border
                          )}
                        >
                          <span className="text-lg md:text-2xl font-bold">{data.price}</span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Overlay for "Real Frame" themes (REMOVED: Integrated into absolute overlay for consistency and visibility) */}

                {/* Decorative Elements (Only for some themes) */}
                {['luxury', 'minimal', 'modern', 'cyber', 'vintage', 'classic_gold', 'neon_frame'].includes(data.theme) && (
                  <>
                    <div className="absolute top-6 left-6 md:top-10 md:left-10 pointer-events-none">
                       <div className={cn("w-8 h-8 md:w-12 md:h-12 border-t-2 border-l-2 opacity-40", currentTheme.border)} />
                    </div>
                    <div className="absolute top-6 right-6 md:top-10 md:right-10 pointer-events-none">
                       <div className={cn("w-8 h-8 md:w-12 md:h-12 border-t-2 border-r-2 opacity-40", currentTheme.border)} />
                    </div>
                  </>
                )}
              </div>

              {/* Guide Lines (Visual only, not in export) */}
              <div className="absolute -inset-4 border border-stone-200 rounded-[2rem] -z-10 pointer-events-none" />
            </div>

            <p className="mt-8 text-stone-400 text-xs text-center max-w-xs">
              The preview above is exactly what will be exported as a 1:1 square image for your Instagram feed.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-stone-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-stone-950 rounded flex items-center justify-center">
              <span className="text-white font-serif font-bold text-sm">T</span>
            </div>
            <span className="text-sm font-serif">TempleSale</span>
          </div>
          <p className="text-stone-400 text-xs">© 2026 TempleSale. All rights reserved. Professional Branding Tools.</p>
          <div className="flex gap-6">
            <a href="#" className="text-stone-400 hover:text-stone-950 transition-colors text-xs uppercase tracking-widest font-bold">Privacy</a>
            <a href="#" className="text-stone-400 hover:text-stone-950 transition-colors text-xs uppercase tracking-widest font-bold">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
