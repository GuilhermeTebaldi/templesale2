import { useCallback, useEffect, useRef, useState } from 'react';
import { readDevicePreference, writeDevicePreference } from './device-preferences';

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
    if (saved && isValidGeoPoint(saved.lat, saved.lng) && typeof saved.at === 'number' && Date.now() - saved.at < 30 * 60 * 1000) return { lat: saved.lat, lng: saved.lng };
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
  const [choice, setChoice] = useState(() => {
    const saved = readDevicePreference('discovery-location');
    if (saved === 'accepted' || saved === 'dismissed') return saved;
    try { return localStorage.getItem('templesale_map_location_prompted') === 'true' ? 'accepted' : null; } catch { return null; }
  });
  const autoPrompted = useRef(false);
  const [gpsRequest, setGpsRequest] = useState(0);
  useEffect(() => { onOriginChange?.(origin); }, [onOriginChange, origin]);
  const previous = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const gpsAttempt = useRef(0);
  const gpsWanted = useRef(false);
  useEffect(() => () => { gpsAttempt.current += 1; autoPrompted.current = false; }, []);
  const receivePosition = useCallback((position: GeolocationPosition) => {
    writeDevicePreference('discovery-location', 'accepted'); setChoice('accepted');
    setLocating(false);
    if (!isValidGeoPoint(position.coords.latitude, position.coords.longitude) || position.coords.accuracy > 1000) { setFresh(false); setError("Posizione imprecisa. Riprova o scegli una città."); return; }
    const next = { lat: position.coords.latitude, lng: position.coords.longitude };
    setError(''); setFresh(true);
    if (!shouldUpdateLocation(previous.current, next, Date.now())) return;
    previous.current = { ...next, at: Date.now() };
    setOrigin(next);
    try {
      localStorage.removeItem(CITY_KEY);
      localStorage.setItem(LOCATION_KEY, JSON.stringify({ ...next, at: Date.now() }));
      localStorage.setItem('templesale_map_location_prompted', 'true');
    } catch { /* optional storage */ }
  }, []);
  const receiveLocationError = useCallback((failure: GeolocationPositionError) => {
    setLocating(false); setFresh(false);
    setError(failure.code === 1
      ? 'Posizione bloccata dal browser.'
      : 'Impossibile ottenere la posizione. Riprova o scegli una città.');
    if (failure.code === 1) {
      setEnabled(false); setChoice('dismissed');
      previous.current = null;
      setOrigin(current => current?.city ? current : null);
    }
  }, []);
  const useGps = useCallback(() => {
    if (!navigator.geolocation) { setError("Questo browser non supporta la posizione. Scegli una città."); return; }
    autoPrompted.current = true;
    gpsWanted.current = true;
    const attempt = ++gpsAttempt.current;
    previous.current = null; setGpsRequest(value => value + 1);
    try { localStorage.removeItem(CITY_KEY); } catch { /* optional storage */ }
    setFresh(false);
    setError(''); setLocating(true); setEnabled(false);
    // Start directly inside the click handler so retry retains the user gesture.
    navigator.geolocation.getCurrentPosition(position => {
      if (attempt !== gpsAttempt.current) return;
      receivePosition(position); setEnabled(true);
    }, failure => {
      if (attempt === gpsAttempt.current) receiveLocationError(failure);
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  }, [receivePosition, receiveLocationError]);
  const dismissGps = useCallback(() => {
    gpsWanted.current = false;
    gpsAttempt.current += 1;
    writeDevicePreference('discovery-location', 'dismissed'); setChoice('dismissed');
    setEnabled(false); setLocating(false);
  }, []);
  const useCity = useCallback((city: string) => {
    const value = city.trim();
    if (!value) return;
    gpsWanted.current = false;
    gpsAttempt.current += 1;
    setEnabled(false); setLocating(false); setError(''); setOrigin({ city: value }); previous.current = null;
    writeDevicePreference('discovery-location', 'dismissed'); setChoice('dismissed'); setFresh(false);
    try { localStorage.setItem(CITY_KEY, value); } catch { /* optional storage */ }
  }, []);
  useEffect(() => {
    const update = () => {
      setVisible(document.visibilityState === 'visible');
      setFresh(false); previous.current = null;
      if (document.visibilityState === 'visible') setGpsRequest(value => value + 1);
    };
    document.addEventListener('visibilitychange', update);
    window.addEventListener('pageshow', update);
    return () => { document.removeEventListener('visibilitychange', update); window.removeEventListener('pageshow', update); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    let permission: PermissionStatus | null = null;
    const restorePermission = () => {
      if (!cancelled && gpsWanted.current && permission?.state === 'granted') {
        writeDevicePreference('discovery-location', 'accepted'); setChoice('accepted'); setEnabled(true);
      }
    };
    // Permission checks do not prompt; the GPS request below asks the browser.
    if (active && navigator.permissions) {
      void navigator.permissions.query({ name: 'geolocation' }).then(status => {
        if (cancelled) return;
        permission = status;
        permission.addEventListener('change', restorePermission);
        restorePermission();
      }).catch(() => undefined);
    }
    window.addEventListener('pageshow', restorePermission);
    document.addEventListener('visibilitychange', restorePermission);
    return () => {
      cancelled = true;
      permission?.removeEventListener('change', restorePermission);
      window.removeEventListener('pageshow', restorePermission);
      document.removeEventListener('visibilitychange', restorePermission);
    };
  }, [active]);
  useEffect(() => {
    if (!active || autoPrompted.current) return;
    autoPrompted.current = true;
    useGps();
  }, [active, useGps]);
  useEffect(() => {
    if (!enabled || !active || !visible || !navigator.geolocation) return;
    let cancelled = false;
    setLocating(true);
    const watch = navigator.geolocation.watchPosition(position => {
      if (!cancelled) receivePosition(position);
    }, failure => {
      if (!cancelled) receiveLocationError(failure);
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    return () => { cancelled = true; navigator.geolocation.clearWatch(watch); };
  }, [active, enabled, visible, gpsRequest, receivePosition, receiveLocationError]);
  return { origin, error, locating, fresh, useGps, useCity, needsConsent: choice === null && !locating && !error, dismissGps };
}
