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
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [choice, setChoice] = useState(() => {
    const saved = readDevicePreference('discovery-location');
    if (saved === 'accepted' || saved === 'dismissed') return saved;
    try { return localStorage.getItem('templesale_map_location_prompted') === 'true' ? 'accepted' : null; } catch { return null; }
  });
  const autoPrompted = useRef(false);
  useEffect(() => { onOriginChange?.(origin); }, [onOriginChange, origin]);
  const previous = useRef<{ lat: number; lng: number; at: number } | null>(null);
  const gpsAttempt = useRef(0);
  const gpsWanted = useRef(false);
  const requestPending = useRef(false);
  const watchId = useRef<number | null>(null);
  const stopTracking = useCallback(() => {
    gpsAttempt.current += 1;
    requestPending.current = false;
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current);
    watchId.current = null;
  }, []);
  const receivePosition = useCallback((position: GeolocationPosition) => {
    requestPending.current = false;
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
    requestPending.current = false;
    setLocating(false); setFresh(false);
    setError(failure.code === 1
      ? 'Posizione bloccata dal browser.'
      : 'Impossibile ottenere la posizione. Riprova o scegli una città.');
    if (failure.code === 1) {
      stopTracking(); setChoice('dismissed');
      previous.current = null;
      setOrigin(current => current?.city ? current : null);
    }
  }, [stopTracking]);
  // One watch obtains the first fix and all subsequent updates. Keep it alive
  // across visibility changes: the browser pauses/resumes delivery itself.
  const startTracking = useCallback(() => {
    if (watchId.current !== null || !active) return;
    if (!navigator.geolocation) { setError("Questo browser non supporta la posizione. Scegli una città."); return; }
    requestPending.current = true;
    const attempt = ++gpsAttempt.current;
    setError(''); setLocating(true);
    watchId.current = navigator.geolocation.watchPosition(position => {
      if (attempt === gpsAttempt.current) receivePosition(position);
    }, failure => {
      if (attempt === gpsAttempt.current) receiveLocationError(failure);
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  }, [active, receivePosition, receiveLocationError]);
  const useGps = useCallback(() => {
    if (requestPending.current) return;
    autoPrompted.current = true; gpsWanted.current = true;
    stopTracking(); previous.current = null;
    try { localStorage.removeItem(CITY_KEY); } catch { /* optional storage */ }
    setFresh(false);
    // A retry starts synchronously inside the tap, preserving the user gesture.
    startTracking();
  }, [startTracking, stopTracking]);
  const acceptNativePosition = useCallback((position: GeolocationPosition) => {
    autoPrompted.current = true; gpsWanted.current = true;
    // Invalidate a pending script request before accepting the native control.
    stopTracking(); previous.current = null;
    receivePosition(position); startTracking();
  }, [receivePosition, startTracking, stopTracking]);
  const dismissGps = useCallback(() => {
    gpsWanted.current = false;
    stopTracking();
    writeDevicePreference('discovery-location', 'dismissed'); setChoice('dismissed');
    setLocating(false);
  }, [stopTracking]);
  const useCity = useCallback((city: string) => {
    const value = city.trim();
    if (!value) return;
    gpsWanted.current = false;
    stopTracking();
    setLocating(false); setError(''); setOrigin({ city: value }); previous.current = null;
    writeDevicePreference('discovery-location', 'dismissed'); setChoice('dismissed'); setFresh(false);
    try { localStorage.setItem(CITY_KEY, value); } catch { /* optional storage */ }
  }, [stopTracking]);
  useEffect(() => {
    let cancelled = false;
    let permission: PermissionStatus | null = null;
    const restorePermission = (changed = false) => {
      if (cancelled || !gpsWanted.current || requestPending.current || document.visibilityState !== 'visible') return;
      if (permission?.state === 'granted') {
        writeDevicePreference('discovery-location', 'accepted'); setChoice('accepted');
        startTracking();
      } else if (permission?.state === 'denied') {
        receiveLocationError({ code: 1 } as GeolocationPositionError);
      } else if (changed && permission?.state === 'prompt') {
        // An expired/session grant is not a new consent. Leave the retry button
        // available rather than causing another prompt on every app switch.
        stopTracking(); setLocating(false); setFresh(false);
      }
    };
    const resume = () => restorePermission();
    const changed = () => restorePermission(true);
    // Permission checks do not prompt; the GPS request below asks the browser.
    if (active && navigator.permissions) {
      void navigator.permissions.query({ name: 'geolocation' }).then(status => {
        if (cancelled) return;
        permission = status;
        permission.addEventListener('change', changed);
        if (permission.state === 'granted' || permission.state === 'denied') restorePermission();
      }).catch(() => undefined);
    }
    window.addEventListener('pageshow', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      cancelled = true;
      permission?.removeEventListener('change', changed);
      window.removeEventListener('pageshow', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [active, startTracking, stopTracking, receiveLocationError]);
  useEffect(() => {
    if (active && !autoPrompted.current) {
      autoPrompted.current = true;
      useGps();
    }
    return () => {
      stopTracking(); autoPrompted.current = false;
    };
  }, [active, useGps, stopTracking]);
  return { origin, error, locating, fresh, useGps, useCity, acceptNativePosition, receiveLocationError, needsConsent: choice === null && !locating && !error, dismissGps };
}
