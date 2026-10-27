import React from 'react';
import { Home, Search, Plus, MapPin, Building2 } from 'lucide-react';
import type { ActiveTab } from '../types';
import { OVERLAY_VIEWPORT_RESTORED } from '../lib/overlay-viewport';

export default function MobileNavigation({ activeTab, setActiveTab, onOpenCreatePost, hasRegisteredAccount }: {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenCreatePost: () => void;
  hasRegisteredAccount: boolean;
}) {
  const [isMobileKeyboardOpen, setIsMobileKeyboardOpen] = React.useState(false);
  const mobileNavigationViewportRef = React.useRef<HTMLElement | null>(null);
  const checkNavigationLayout = React.useCallback(() => {
    const frame = mobileNavigationViewportRef.current;
    // The dock is a normal flex row. Repair only accidental inline geometry;
    // never follow scrolling or store keyboard/viewport pixel measurements.
    if (!frame || document.visibilityState !== 'visible' || window.innerWidth >= 640) return;
    for (const property of ['height', 'top', 'bottom', 'transform']) {
      if (frame.style.getPropertyValue(property)) frame.style.removeProperty(property);
    }
  }, []);
  React.useLayoutEffect(checkNavigationLayout, [checkNavigationLayout]);

  React.useEffect(() => {
    let frameId = 0;
    let referenceHeight = window.innerHeight;
    let referenceWidth = window.innerWidth;
    const update = () => {
      frameId = 0;
      if (document.visibilityState !== 'visible') return;
      checkNavigationLayout();
      const focused = document.activeElement;
      const textFocused = (focused instanceof HTMLInputElement && !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'hidden', 'image'].includes(focused.type))
        || focused instanceof HTMLTextAreaElement || focused instanceof HTMLSelectElement
        || (focused instanceof HTMLElement && focused.isContentEditable);
      if (referenceWidth !== window.innerWidth) {
        referenceWidth = window.innerWidth;
        referenceHeight = window.innerHeight;
      }
      referenceHeight = Math.max(referenceHeight, window.innerHeight);
      const open = textFocused && referenceHeight - (window.visualViewport?.height ?? window.innerHeight) > 150;
      setIsMobileKeyboardOpen(current => current === open ? current : open);
    };
    const schedule = () => { if (!frameId) frameId = window.requestAnimationFrame(update); };
    const events = ['resize', 'orientationchange', 'pageshow', 'focus', 'focusin', 'focusout', OVERLAY_VIEWPORT_RESTORED];
    for (const event of events) window.addEventListener(event, schedule);
    document.addEventListener('visibilitychange', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {attributes:true, attributeFilter:['class','style']});
    const watchdog = window.setInterval(() => {
      if (document.visibilityState === 'visible' && window.innerWidth < 640) schedule();
    }, 1000);
    update();
    return () => {
      for (const event of events) window.removeEventListener(event, schedule);
      document.removeEventListener('visibilitychange', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      observer.disconnect(); window.clearInterval(watchdog);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [checkNavigationLayout]);


  return (
      <div ref={mobileNavigationViewportRef} id="mobile-navigation-viewport" className="ts-mobile-navigation-viewport sm:hidden">
      <nav
        id="mobile-bottom-nav"
        aria-label="Navigazione principale"
        style={{ paddingBottom: `max(${hasRegisteredAccount ? '0.5rem' : '0.25rem'}, env(safe-area-inset-bottom, 0px))` }}
        className={`pointer-events-auto absolute inset-x-0 bottom-0 bg-white border-t border-neutral-800 px-2 flex items-center justify-around ${
          hasRegisteredAccount ? 'pt-1 pb-2' : 'py-1'
        } ${isMobileKeyboardOpen ? 'pointer-events-none invisible opacity-0' : 'visible opacity-100'} transition-opacity duration-150`}
      >
        {/* Feed Tab */}
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex h-12 min-w-16 flex-col items-center justify-end rounded-lg px-2.5 pb-1 transition-colors ${
            activeTab === 'feed' ? 'text-white' : 'text-neutral-400'
          }`}
        >
          <Home className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium mt-0.5">Home</span>
        </button>

        {/* Search Tab */}
        <button
          onClick={() => setActiveTab('search')}
          hidden={hasRegisteredAccount}
          className={`flex h-12 min-w-16 flex-col items-center justify-end rounded-lg px-2.5 pb-1 transition-colors ${
            activeTab === 'search' ? 'text-white' : 'text-neutral-400'
          }`}
        >
          <Search className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium mt-0.5">Cerca</span>
        </button>

        {/* + Publicar Central Highlight Button */}
        {hasRegisteredAccount && (
          <button
            onClick={onOpenCreatePost}
            className="group flex h-12 min-w-16 flex-col items-center justify-end rounded-lg px-2.5 pb-1 cursor-pointer"
            title="+ Pubblica foto"
          >
            <div className="mb-0.5 flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full border-4 border-neutral-900 bg-neutral-100 text-neutral-950 shadow-2xl transition-transform group-active:-translate-y-3 group-active:scale-95">
              <Plus className="w-6 h-6 stroke-[2.8]" />
            </div>
            <span className="-mt-3 text-[10px] font-bold leading-none text-neutral-100">Pubblica</span>
          </button>
        )}

        {/* Mapa Tab */}
        <button
          id="mobile-tab-btn-map"
          onClick={() => setActiveTab('map')}
          hidden={hasRegisteredAccount}
          className={`flex h-12 min-w-16 flex-col items-center justify-end rounded-lg px-2.5 pb-1 transition-colors cursor-pointer ${
            activeTab === 'map' ? 'text-white' : 'text-neutral-400'
          }`}
          title="Mappa delle attività"
        >
          <MapPin className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium mt-0.5">Mappa</span>
        </button>

        {/* Minha Empresa Tab */}
        <button
          onClick={() => setActiveTab('profile')}
          hidden={!hasRegisteredAccount}
          className={`flex h-12 min-w-16 flex-col items-center justify-end rounded-lg px-2.5 pb-1 transition-colors ${
            activeTab === 'profile' ? 'text-white' : 'text-neutral-400'
          }`}
        >
          <Building2 className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium mt-0.5">Attività</span>
        </button>
      </nav>
      </div>
  );
}
