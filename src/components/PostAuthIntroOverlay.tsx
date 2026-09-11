import React from 'react';
import { motion } from 'motion/react';

interface PostAuthIntroOverlayProps {
  onComplete: () => void;
}

const CINEMA_BRAND_FONT =
  '"Copperplate", "Copperplate Gothic Light", fantasy';

export default function PostAuthIntroOverlay({ onComplete }: PostAuthIntroOverlayProps) {
  React.useEffect(() => {
    const timer = window.setTimeout(onComplete, 4800);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      key="post-auth-intro-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-black text-white"
      aria-live="polite"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="flex flex-col items-center px-6 text-center"
      >
        <div
          className="text-[46px] font-semibold tracking-[0.08em] sm:text-[72px]"
          style={{ fontFamily: CINEMA_BRAND_FONT }}
        >
          <span className="ts-brand-cinema-intro ts-brand-cinema-intro-large">
            <span className="ts-brand-letter ts-brand-letter-t">T</span>
            <span className="ts-brand-rest ts-brand-rest-temple">emple</span>
            <span className="ts-brand-letter ts-brand-letter-s">S</span>
            <span className="ts-brand-rest ts-brand-rest-sale">ale</span>
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
