import React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  getNetworkLoadingSnapshot,
  subscribeNetworkLoading,
} from "../lib/networkActivity";
import loadingLogoSrc from "../../logo-cropped-1772137553672.png";

const GLOBAL_LOADING_LOGO_SRC = loadingLogoSrc;

export default function GlobalLoadingOverlay() {
  const isVisible = React.useSyncExternalStore(
    subscribeNetworkLoading,
    getNetworkLoadingSnapshot,
    () => false,
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="global-loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/65 backdrop-blur-md"
          aria-live="polite"
          aria-busy="true"
        >
          <motion.img
            src={GLOBAL_LOADING_LOGO_SRC}
            alt="Carregando..."
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
