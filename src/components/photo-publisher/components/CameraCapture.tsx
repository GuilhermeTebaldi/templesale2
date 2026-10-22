import React, { useRef, useState, useEffect } from 'react';
import { readDevicePreference, writeDevicePreference } from '../../../lib/device-preferences';
import {
  Camera,
  Image as ImageIcon,
  RotateCw,
  AlertCircle,
  X,
} from 'lucide-react';

interface CameraCaptureProps {
  onPhotoTaken: (imageSrc: string) => void;
  onCancel?: () => void;
}

export function usesSystemPhotoSourceMenu() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function usesNativePhotoCapture() {
  return /Android/i.test(navigator.userAgent) || usesSystemPhotoSourceMenu();
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoTaken, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraRef = useRef<HTMLInputElement | null>(null);
  const useNativeCamera = usesNativePhotoCapture();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [flashAnimation, setFlashAnimation] = useState<boolean>(false);
  const startingRef = useRef(false);
  const generationRef = useRef(0);

  // Initialize and switch camera stream
  const startCamera = async (desiredFacingMode: 'user' | 'environment' = facingMode) => {
    if (useNativeCamera) { nativeCameraRef.current?.click(); return; }
    if (startingRef.current) return;
    startingRef.current = true;
    const generation = generationRef.current;
    setIsStartingCamera(true);
    setCameraError(null);

    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (track?.readyState === 'live') {
        try {
          if (track.getSettings().facingMode !== desiredFacingMode) await track.applyConstraints({ facingMode: { exact: desiredFacingMode } });
          if (generation !== generationRef.current) return;
          if (track.getSettings().facingMode === desiredFacingMode) {
            setFacingMode(desiredFacingMode); setIsStartingCamera(false); return;
          }
        } catch { /* Devices that cannot switch in-place use a new stream. */ }
      }
      if (generation !== generationRef.current) return;
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null; setStream(null);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: desiredFacingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (generation !== generationRef.current) {
        newStream.getTracks().forEach(track=>track.stop());
        return;
      }
      streamRef.current = newStream;
      setFacingMode(desiredFacingMode);
      writeDevicePreference('camera-used', 'true');
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }
      setIsStartingCamera(false);
    } catch (err) {
      if (generation !== generationRef.current) return;
      const error = err as Error;
      console.warn('Camera stream error:', error);
      setCameraError(error.name === 'NotAllowedError'
        ? 'Fotocamera bloccata dal browser. Puoi usare la galleria.'
        : 'Fotocamera non disponibile nel browser. Puoi scegliere una foto dalla galleria.');
      setIsStartingCamera(false);
    } finally {startingRef.current=false;}
  };

  useEffect(() => {
    let cancelled = false;

    const maybeStartCamera = async () => {
      try {
        const permission = await navigator.permissions?.query({
          name: 'camera' as PermissionName,
        });
        if (!cancelled && permission?.state === 'granted') {
          await startCamera();
          return;
        }
        // Resume prior successful use; the browser still enforces permission.
        if (!cancelled && readDevicePreference('camera-used') === 'true') await startCamera();
      } catch {
        // An account record cannot grant this browser permission. Unsupported
        // permission queries still enforce permission through getUserMedia.
        if (!cancelled && readDevicePreference('camera-used') === 'true') await startCamera();
      }
    };

    if (!useNativeCamera) void maybeStartCamera();

    return () => {
      cancelled = true;
      generationRef.current += 1;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  };

  // Capture current video frame and go directly to editor (no review screen)
  const handleCapture = () => {
    if (useNativeCamera) { void startCamera(); return; }
    if (!videoRef.current) return;

    setFlashAnimation(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopStream();
    setTimeout(() => {
      onPhotoTaken(dataUrl);
    }, 100);
  };

  // Handle image upload from file picker and go directly to editor
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;

    const generation = generationRef.current;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (generation !== generationRef.current) return;
      const result = event.target?.result as string;
      stopStream();
      onPhotoTaken(result);
    };
    reader.onerror = () => { if (generation === generationRef.current) setCameraError('Impossibile leggere la foto. Riprova o scegli dalla galleria.'); };
    reader.readAsDataURL(file);
  };

  const toggleFacingMode = () => {
    void startCamera(facingMode === 'user' ? 'environment' : 'user');
  };

  const fileInputs = <>
    {useNativeCamera && <input ref={nativeCameraRef} type="file" id="native-camera-input" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={handleFileUpload} />}
    <input ref={fileInputRef} type="file" id="gallery-file-input" accept="image/*" className="hidden" onChange={handleFileUpload} />
  </>;

  if (useNativeCamera) return <div id="native-photo-options" className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40" onClick={onCancel}>
    <section role="dialog" aria-modal="true" aria-label="Scegli foto" className="relative isolate w-full max-w-lg overflow-hidden rounded-t-3xl bg-stone-800 p-5 text-white shadow-xl" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }} onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === 'Escape') onCancel?.(); }}>
      <img src="/photo-picker-background.webp" alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-105 object-cover blur-[2px]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'linear-gradient(rgba(0,0,0,.4), rgba(0,0,0,.65))' }} />
      {fileInputs}
      <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold" style={{ color: '#fff' }}>Foto</h2><button type="button" onClick={onCancel} aria-label="Chiudi" autoFocus className="rounded-full text-white bg-black/25 p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><X className="h-5 w-5" /></button></div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" id="btn-capture-shutter" onClick={handleCapture} className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-white/70 bg-white/95 p-5 font-semibold text-slate-900 shadow-lg transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Camera className="h-7 w-7" />Scatta foto</button>
        <button type="button" id="btn-open-gallery" onClick={() => fileInputRef.current?.click()} className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-white/70 bg-white/95 p-5 font-semibold text-slate-900 shadow-lg transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><ImageIcon className="h-7 w-7" />Galleria</button>
      </div>
      {cameraError && <p role="alert" className="mt-3 rounded-xl bg-white p-3 text-sm text-red-700">{cameraError}</p>}
    </section>
  </div>;

  return (
    <div
      id="camera-capture-container"
      className="flex flex-col h-full w-full max-w-lg mx-auto bg-black text-white relative overflow-hidden select-none"
    >
      {/* Top Header Floating Bar */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 py-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-sm font-semibold tracking-wide text-neutral-100">
            Fotocamera
          </h1>
        </div>
      </header>

      {/* Viewfinder Area (Full space) */}
      <div className="relative flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden">
        {/* Flash Effect */}
        {flashAnimation && (
          <div className="absolute inset-0 bg-white z-40 pointer-events-none transition-opacity duration-150 opacity-90" />
        )}

        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          } ${cameraError ? 'hidden' : 'block'}`}
        />

        {/* Camera Guidelines Grid */}
        {!cameraError && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20 border border-white/20">
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div />
          </div>
        )}

        {isStartingCamera && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/70 backdrop-blur-xs text-neutral-300 gap-3 z-10">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-neutral-400">Avvio della fotocamera...</span>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-neutral-950/95 z-20">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-200 mb-1">Fotocamera non disponibile</h3>
            <p className="text-xs text-neutral-400 max-w-xs leading-relaxed mb-5">
              {cameraError}
            </p>
            <button
              type="button"
              id="btn-retry-camera"
              onClick={() => void startCamera()}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition"
            >
              Riprova
            </button>
          </div>
        )}

        {!stream && !cameraError && !isStartingCamera && (
          <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-neutral-950 z-20">
            <div className="w-14 h-14 rounded-full bg-white text-neutral-950 flex items-center justify-center mb-4 shadow-xl">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-100 mb-2">Scegli la tua foto</h3>
            <p className="text-xs text-neutral-400 max-w-xs leading-relaxed mb-5">
              Apri la fotocamera quando vuoi scattare. Puoi anche scegliere una foto dalla galleria.
            </p>
            <button
              type="button"
              id="btn-start-camera"
              onClick={() => void startCamera()}
              className="px-5 py-2.5 rounded-full bg-white text-xs font-bold uppercase tracking-[0.14em] text-neutral-950 transition hover:bg-neutral-200 active:scale-95"
            >
              Usa fotocamera
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom Controls */}
      <footer className="absolute bottom-0 inset-x-0 z-20 px-6 py-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-around">
        {fileInputs}

        {/* Gallery Button */}
        <button
          type="button"
          id="btn-open-gallery"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1.5 text-neutral-300 hover:text-white transition active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-neutral-900/80 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:border-white/50 group-hover:bg-neutral-800 transition shadow-lg">
            <ImageIcon className="w-5 h-5 text-neutral-200" />
          </div>
          <span className="text-[11px] font-medium tracking-wide">Galleria</span>
        </button>

        {/* Shutter Button */}
        <button
          type="button"
          id="btn-capture-shutter"
          onClick={handleCapture}
          disabled={!stream || isStartingCamera}
          aria-label="Scatta foto"
          className="relative w-20 h-20 rounded-full border-4 border-white p-1 flex items-center justify-center transition transform active:scale-90 hover:scale-105 shadow-2xl"
        >
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-inner">
            <Camera className="w-7 h-7 text-neutral-950" />
          </div>
        </button>

        {/* Switch Camera Button */}
        <button
          type="button"
          id="btn-switch-camera"
          onClick={toggleFacingMode}
          disabled={!stream || isStartingCamera}
          aria-label="Cambia fotocamera"
          className="flex flex-col items-center gap-1.5 text-neutral-300 hover:text-white transition active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-neutral-900/80 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:border-white/50 group-hover:bg-neutral-800 transition shadow-lg">
            <RotateCw className="w-5 h-5 text-neutral-200" />
          </div>
          <span className="text-[11px] font-medium tracking-wide">Inverti</span>
        </button>
      </footer>
    </div>
  );
};
