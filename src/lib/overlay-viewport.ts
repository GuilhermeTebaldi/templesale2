// Overlay exit animations can finish after the body scroll lock is released.
// Recreate the navigation layer only once the departing overlay is gone.
export const OVERLAY_VIEWPORT_RESTORED = 'ts:overlay-viewport-restored';

export function notifyOverlayViewportRestored() {
  window.dispatchEvent(new Event(OVERLAY_VIEWPORT_RESTORED));
}
