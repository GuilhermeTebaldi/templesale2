import { useCallback, useEffect, useRef, useState } from 'react';

export type DiscoveryOrigin = { lat: number; lng: number; city?: never } | { city: string; lat?: never; lng?: never };
const CITY_KEY = 'templesale_discovery_city';
const LOCATION_KEY = 'templesale_map_user_location';

export function isValidGeoPoint(latitude: unknown, longitude: unknown): boolean {
  return typeof latitude === 'number' && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
    && typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function readDiscoveryOrigin(): DiscoveryOrigin | null {
  try {
    const city = localStorage.getItem(CITY_KEY)?.trim();
    if (city) return { city };
    const saved = JSON.parse(localStorage.getItem(LOCATION_KEY) || 'null');
    if (saved && isValidGeoPoint(saved.lat, saved.lng)) return { lat: saved.lat, lng: saved.lng };
  } catch { /* Browsing without storage remains supported. */ }
  return null;
}

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radians = (value: number) => value * Math.PI / 180;
  const h = Math.sin(radians(b.lat - a.lat) / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(radians(b.lng - a.lng) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function shouldUpdateLocation(previous: { lat: number; lng: number; at: number } | null, next: { lat: number; lng: number }, now: number) {
  return !previous || (now - previous.at >= 30000 && distanceMeters(previous, next) >= 150);
}

export function useDiscoveryLocation(active: boolean, onOriginChange?: (origin: DiscoveryOrigin | null) => void) {
  const [origin, setOrigin] = useState<DiscoveryOrigin | null>(readDiscoveryOrigin);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [fresh, setFresh] = useState(false);
  const autoPrompted = useRef(false);
  useEffect(() => { onOriginChange?.(origin); }, [onOriginChange, origin]);
  const previous = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const useGps = useCallback(() => {
    if (!navigator.geolocation) { setError('Este navegador não oferece localização. Escolha uma cidade.'); return; }
    setError(''); setLocating(true); setEnabled(true);
  }, []);
  const useCity = useCallback((city: string) => {
    const value = city.trim();
    if (!value) return;
    setEnabled(false); setLocating(false); setError(''); setOrigin({ city: value }); previous.current = null;
    try { localStorage.setItem(CITY_KEY, value); } catch { /* optional storage */ }
  }, []);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    let cancelled = false;
    // Querying permission does not prompt; the active hook attempts the first request automatically.
    if (active && !origin?.city && navigator.permissions) {
      void navigator.permissions.query({ name: 'geolocation' }).then(permission => {
        if (!cancelled && permission.state === 'granted') setEnabled(true);
      }).catch(() => undefined);
    }
    return () => { cancelled = true; };
  }, [active, origin?.city]);
  useEffect(() => {
    if (!active || origin?.city || autoPrompted.current) return;
    autoPrompted.current = true;
    useGps();
  }, [active, origin?.city, useGps]);
  useEffect(() => {
    if (!enabled || !active || !visible || !navigator.geolocation) return;
    let cancelled = false;
    const watch = navigator.geolocation.watchPosition(position => {
      if (cancelled) return;
      setLocating(false);
      if (position.coords.accuracy > 1000) { setError('Localização imprecisa. Tente novamente ou escolha uma cidade.'); return; }
      const next = { lat: position.coords.latitude, lng: position.coords.longitude };
      setError(''); setFresh(true);
      if (!shouldUpdateLocation(previous.current, next, Date.now())) return;
      previous.current = { ...next, at: Date.now() };
      setOrigin(next);
      try {
        localStorage.removeItem(CITY_KEY);
        localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
        localStorage.setItem('templesale_map_location_prompted', 'true');
      } catch { /* optional storage */ }
    }, failure => {
      if (cancelled) return;
      setLocating(false);
      setError(failure.code === 1 ? 'Localização não autorizada. Escolha uma cidade ou libere a permissão no navegador.' : 'Não foi possível obter sua localização. Tente novamente ou escolha uma cidade.');
      if (failure.code === 1) {
        setEnabled(false);
        previous.current = null;
        setOrigin(current => current?.city ? current : null);
      }
      // Timeouts and temporary signal loss do not stop movement updates.
    }, { enableHighAccuracy: false, maximumAge: 30000, timeout: 15000 });
    return () => { cancelled = true; navigator.geolocation.clearWatch(watch); };
  }, [active, enabled, visible]);
  return { origin, error, locating, fresh, useGps, useCity };
}
