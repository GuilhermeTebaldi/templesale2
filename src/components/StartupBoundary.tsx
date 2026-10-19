import React from 'react';
import GlobalLoadingOverlay from './GlobalLoadingOverlay';

export function StartupReady() {
  React.useEffect(() => { window.dispatchEvent(new Event('templesale:ready')); }, []);
  return null;
}

export class StartupBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  declare props: React.PropsWithChildren;
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) {
    console.error('[templesale:startup]', error);
    window.dispatchEvent(new Event('templesale:ready'));
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <GlobalLoadingOverlay forceVisible retry />;
  }
}
