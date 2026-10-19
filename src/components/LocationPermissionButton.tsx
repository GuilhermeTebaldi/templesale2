import React, { useEffect, useRef } from 'react';

interface NativeLocationControl extends HTMLElement {
  readonly position: GeolocationPosition | null;
  readonly error: GeolocationPositionError | null;
}

export default function LocationPermissionButton({ locating, onRequest, onPosition, onError }: {
  locating: boolean;
  onRequest: () => void;
  onPosition: (position: GeolocationPosition) => void;
  onError: (error: GeolocationPositionError) => void;
}) {
  const nativeSupported = 'HTMLGeolocationElement' in window;
  const control = useRef<NativeLocationControl | null>(null);
  useEffect(() => {
    const element = control.current;
    if (!element) return;
    const receive = () => {
      if (element.position) onPosition(element.position);
      else if (element.error) onError(element.error);
    };
    element.addEventListener('location', receive);
    return () => element.removeEventListener('location', receive);
  }, [onPosition, onError]);

  // The browser owns this control and can offer recovery after a previous denial.
  if (nativeSupported) return React.createElement('geolocation', {
    ref: control, accuracymode: 'precise', lang: 'it', className: 'ts-location-control',
  });

  return <button type="button" disabled={locating} onClick={onRequest} className="font-semibold text-sky-600 disabled:opacity-50">
    <span>{locating ? 'Ricerca posizione…' : 'Usa la mia posizione'}</span>
  </button>;
}
