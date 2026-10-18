// Stable across deployments. Preferences never substitute for browser permission.
export function readDevicePreference(key: 'camera-used' | 'discovery-location'): string | null {
  try { return localStorage.getItem(`templesale_${key}`); } catch { return null; }
}
export function writeDevicePreference(key: 'camera-used' | 'discovery-location', value: string) {
  try { localStorage.setItem(`templesale_${key}`, value); } catch { /* Storage is optional. */ }
}
