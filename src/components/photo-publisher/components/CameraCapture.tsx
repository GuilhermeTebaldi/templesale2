import React, { useRef, useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import {
  Camera,
  Image as ImageIcon,
  RotateCw,
  AlertCircle,
} from 'lucide-react';

interface CameraCaptureProps {
  onPhotoTaken: (imageSrc: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoTaken }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [flashAnimation, setFlashAnimation] = useState<boolean>(false);
  const shouldAutoStartCameraRef = useRef(false);

  // Initialize and switch camera stream
  const startCamera = async () => {
    shouldAutoStartCameraRef.current = true;
    setIsStartingCamera(true);
    setCameraError(null);

    // Stop existing stream if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }
      setIsStartingCamera(false);
      void api.saveCameraPermissionGranted().catch(() => {});
    } catch (err) {
      const error = err as Error;
      console.warn('Camera stream error:', error);
      setCameraError(
        'Câmera indisponível no navegador. Você pode selecionar uma foto da galeria abaixo.'
      );
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const maybeStartCamera = async () => {
      if (shouldAutoStartCameraRef.current) {
        await startCamera();
        return;
      }

      try {
        const permission = await navigator.permissions?.query({
          name: 'camera' as PermissionName,
        });
        if (!cancelled && permission?.state === 'granted') {
          shouldAutoStartCameraRef.current = true;
          await startCamera();
          return;
        }
      } catch {
        // Continue with the account-level permission record below.
      }

      try {
        const storedPermission = await api.getCameraPermissionStatus();
        if (!cancelled && storedPermission.granted) {
          shouldAutoStartCameraRef.current = true;
          await startCamera();
        }
      } catch {
        // Unauthenticated/legacy deployments keep the manual camera button available.
      }
    };

    void maybeStartCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  };

  // Capture current video frame and go directly to editor (no review screen)
  const handleCapture = () => {
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
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      stopStream();
      onPhotoTaken(result);
    };
    reader.readAsDataURL(file);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

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
            Câmera
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
            <span className="text-xs text-neutral-400">Iniciando câmera...</span>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-neutral-950/95 z-20">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-200 mb-1">Câmera indisponível</h3>
            <p className="text-xs text-neutral-400 max-w-xs leading-relaxed mb-5">
              {cameraError}
            </p>
            <button
              type="button"
              id="btn-retry-camera"
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!stream && !cameraError && !isStartingCamera && (
          <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-neutral-950 z-20">
            <div className="w-14 h-14 rounded-full bg-white text-neutral-950 flex items-center justify-center mb-4 shadow-xl">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-100 mb-2">Escolha sua foto</h3>
            <p className="text-xs text-neutral-400 max-w-xs leading-relaxed mb-5">
              Abra a câmera só quando for fotografar. Para publicar sem pedir câmera, use a galeria.
            </p>
            <button
              type="button"
              id="btn-start-camera"
              onClick={() => void startCamera()}
              className="px-5 py-2.5 rounded-full bg-white text-xs font-bold uppercase tracking-[0.14em] text-neutral-950 transition hover:bg-neutral-200 active:scale-95"
            >
              Usar câmera
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom Controls */}
      <footer className="absolute bottom-0 inset-x-0 z-20 px-6 py-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-around">
        <input
          ref={fileInputRef}
          type="file"
          id="gallery-file-input"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

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
          <span className="text-[11px] font-medium tracking-wide">Galeria</span>
        </button>

        {/* Shutter Button */}
        <button
          type="button"
          id="btn-capture-shutter"
          onClick={handleCapture}
          aria-label="Capturar foto"
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
          aria-label="Alternar câmera"
          className="flex flex-col items-center gap-1.5 text-neutral-300 hover:text-white transition active:scale-95 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-neutral-900/80 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:border-white/50 group-hover:bg-neutral-800 transition shadow-lg">
            <RotateCw className="w-5 h-5 text-neutral-200" />
          </div>
          <span className="text-[11px] font-medium tracking-wide">Virar</span>
        </button>
      </footer>
    </div>
  );
};
