// One scroll owner on mobile; desktop keeps the existing document scroll.
export function appScrollRegion(): HTMLElement | null {
  if (typeof window === 'undefined' || window.innerWidth >= 640) return null;
  return document.getElementById('app-scroll-region');
}
export function appScrollTop(): number {
  return appScrollRegion()?.scrollTop ?? (window.scrollY || window.pageYOffset || 0);
}
export function scrollAppTo(options: ScrollToOptions): void {
  (appScrollRegion() ?? window).scrollTo(options);
}
