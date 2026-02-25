import React from "react";
import { motion } from "motion/react";
import { X, MapPin } from "lucide-react";
import { useI18n } from "../i18n/provider";

type GeoPoint = {
  latitude: number;
  longitude: number;
};

interface LeafletMapPickerProps {
  center: GeoPoint;
  selectedPoint: GeoPoint | null;
  onSelectPoint: (point: GeoPoint) => void;
  onClose: () => void;
  onConfirm: (point: GeoPoint) => void;
}

const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_SCRIPT_ID = "templesale-leaflet-js";
const LEAFLET_STYLE_ID = "templesale-leaflet-css";

type LeafletMapInstance = {
  setView: (coords: [number, number], zoom?: number, options?: unknown) => void;
  on: (eventName: string, handler: (event: { latlng: { lat: number; lng: number } }) => void) => void;
  remove: () => void;
};

type LeafletMarkerInstance = {
  addTo: (map: LeafletMapInstance) => LeafletMarkerInstance;
  setLatLng: (coords: [number, number]) => void;
  remove: () => void;
};

type LeafletGlobal = {
  map: (container: HTMLElement, options?: unknown) => LeafletMapInstance;
  tileLayer: (url: string, options?: unknown) => { addTo: (map: LeafletMapInstance) => void };
  marker: (coords: [number, number]) => LeafletMarkerInstance;
  Icon: {
    Default: {
      prototype: Record<string, unknown>;
      mergeOptions: (options: Record<string, string>) => void;
    };
  };
};

declare global {
  interface Window {
    L?: LeafletGlobal;
  }
}

let leafletAssetsPromise: Promise<LeafletGlobal> | null = null;

function ensureLeafletAssets(): Promise<LeafletGlobal> {
  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (!document.getElementById(LEAFLET_STYLE_ID)) {
    const style = document.createElement("link");
    style.id = LEAFLET_STYLE_ID;
    style.rel = "stylesheet";
    style.href = LEAFLET_CSS_URL;
    document.head.appendChild(style);
  }

  if (!leafletAssetsPromise) {
    leafletAssetsPromise = new Promise<LeafletGlobal>((resolve, reject) => {
      const existingScript = document.getElementById(LEAFLET_SCRIPT_ID) as
        | HTMLScriptElement
        | null;

      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (window.L) {
            resolve(window.L);
            return;
          }
          reject(new Error("Leaflet não carregado."));
        });
        existingScript.addEventListener("error", () => {
          reject(new Error("Falha ao carregar Leaflet."));
        });
        return;
      }

      const script = document.createElement("script");
      script.id = LEAFLET_SCRIPT_ID;
      script.src = LEAFLET_JS_URL;
      script.async = true;
      script.onload = () => {
        if (!window.L) {
          reject(new Error("Leaflet não carregado."));
          return;
        }

        delete window.L.Icon.Default.prototype._getIconUrl;
        window.L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });
        resolve(window.L);
      };
      script.onerror = () => {
        reject(new Error("Falha ao carregar Leaflet."));
      };
      document.head.appendChild(script);
    });
  }

  return leafletAssetsPromise;
}

export default function LeafletMapPicker({
  center,
  selectedPoint,
  onSelectPoint,
  onClose,
  onConfirm,
}: LeafletMapPickerProps) {
  const { t } = useI18n();
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMapInstance | null>(null);
  const markerRef = React.useRef<LeafletMarkerInstance | null>(null);
  const [leafletError, setLeafletError] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      try {
        const L = await ensureLeafletAssets();
        if (cancelled || !mapContainerRef.current) {
          return;
        }

        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true,
        });

        map.setView([center.latitude, center.longitude], 15);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        map.on("click", (event) => {
          onSelectPoint({
            latitude: event.latlng.lat,
            longitude: event.latlng.lng,
          });
        });

        mapRef.current = map;
      } catch (error) {
        const message =
          error instanceof Error ? t(error.message) : t("Falha ao carregar o mapa.");
        setLeafletError(message);
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center.latitude, center.longitude, onSelectPoint, t]);

  React.useEffect(() => {
    if (!mapRef.current) {
      return;
    }
    mapRef.current.setView([center.latitude, center.longitude]);
  }, [center.latitude, center.longitude]);

  React.useEffect(() => {
    if (!mapRef.current || !window.L) {
      return;
    }

    if (!selectedPoint) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const coords: [number, number] = [selectedPoint.latitude, selectedPoint.longitude];
    if (!markerRef.current) {
      markerRef.current = window.L.marker(coords).addTo(mapRef.current);
      return;
    }
    markerRef.current.setLatLng(coords);
  }, [selectedPoint]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-130 bg-black/20 backdrop-blur-sm p-4 md:p-10"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="w-full h-full max-w-6xl mx-auto bg-[#fdfcfb] border border-stone-200 rounded-sm shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
              {t("Localização manual")}
            </p>
            <h3 className="text-2xl font-serif italic text-stone-800">
              {t("Escolher local no mapa")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-stone-50 rounded-full transition-colors"
            aria-label={t("Fechar")}
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        <div className="p-6 flex-1 min-h-0 flex flex-col gap-5">
          <p className="text-sm text-stone-500">
            {t("Arraste para mover o mapa e clique uma vez para marcar o ponto real.")}
          </p>

          {leafletError ? (
            <div className="flex-1 min-h-[320px] border border-red-100 bg-red-50 rounded-sm flex items-center justify-center">
              <p className="text-sm text-red-600">{leafletError}</p>
            </div>
          ) : (
            <div
              ref={mapContainerRef}
              className="flex-1 min-h-[320px] border border-stone-200 rounded-sm overflow-hidden bg-stone-100"
            />
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-stone-500">
              {selectedPoint
                ? `${selectedPoint.latitude.toFixed(6)}, ${selectedPoint.longitude.toFixed(6)}`
                : t("Nenhum ponto selecionado no mapa.")}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 border border-stone-200 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 hover:border-stone-400 hover:text-stone-800 transition-colors"
              >
                {t("Cancelar")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedPoint) {
                    return;
                  }
                  onConfirm(selectedPoint);
                }}
                disabled={!selectedPoint}
                className="px-5 py-3 bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black transition-colors disabled:bg-stone-400 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                {t("Confirmar localização")}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
