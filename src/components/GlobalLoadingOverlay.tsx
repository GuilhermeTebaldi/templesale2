import React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  getNetworkLoadingSnapshot,
  subscribeNetworkLoading,
} from "../lib/networkActivity";
const GLOBAL_LOADING_LOGO_SRC = "/templesale-loading-logo.webp?v=monochrome-2";

export default function GlobalLoadingOverlay({ forceVisible = false, retry = false }: { forceVisible?: boolean; retry?: boolean } = {}) {
  const isNetworkLoading = React.useSyncExternalStore(
    subscribeNetworkLoading,
    getNetworkLoadingSnapshot,
    () => false,
  );
  const isVisible = forceVisible || isNetworkLoading;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="global-loading-overlay"
          initial={{ opacity: forceVisible ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[99999] flex flex-col gap-5 items-center justify-center bg-white/65 backdrop-blur-md"
          aria-live="polite"
          aria-busy="true"
          data-startup-loading={forceVisible ? 'true' : undefined}
        >
          <motion.img
            src={GLOBAL_LOADING_LOGO_SRC}
            alt="Caricamento..."
            className="h-16 w-16 sm:h-20 sm:w-20 select-none object-contain"
            initial={{ opacity: 0.65, scale: 0.96 }}
            animate={{ opacity: [0.65, 1, 0.65], scale: [0.96, 1.04, 0.96] }}
            transition={{
              duration: 1.2,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }}
            draggable={false}
          />
          {retry && <button type="button" onClick={() => window.location.reload()} className="rounded-full border border-neutral-300 bg-white px-6 py-2 text-sm text-neutral-900" translate="no">Riprova</button>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
