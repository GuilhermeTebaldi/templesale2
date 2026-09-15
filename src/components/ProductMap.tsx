import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, MessageSquare, Search, Store, X } from "lucide-react";
import { type Product } from "./ProductCard";
import { useI18n } from "../i18n/provider";
import { type AppLocale } from "../i18n";
import { getCategoryLabel } from "../i18n/categories";
import { api, type EstablishmentDto } from "../lib/api";
import { buildWhatsappUrl } from "../lib/whatsapp";
import { layoutMapMarkers, MAP_PIN_SIZE, MAP_PIN_ANCHOR, MAP_LABEL_SIZE, MAP_LABEL_ANCHOR } from "../lib/map-marker-layout";

interface ProductMapProps {
  visitorLocation?: { lat: number; lng: number } | null;
  initialSearchPoint?: { lat: number; lng: number } | null;
  products: Product[];
  establishments?: EstablishmentDto[];
  onClose: () => void;
  initialFocusProductId?: number;
  initialCategory?: string;
  openResultsByDefault?: boolean;
  autoFocusPanelSearch?: boolean;
  onOpenProduct?: (product: Product) => void;
  onOpenEstablishment?: (idOrSlug: number | string) => void;
  onAddToCart?: (product: Product) => void;
}

type LocatedProduct = Product & {
  latitude: number;
  longitude: number;
  address?: string;
  keywords?: string[];
};

type GeoPoint = [number, number];

function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function calculateDistanceKm(from: LeafletLatLng | null, product: LocatedProduct): number | null {
  if (!from) {
    return null;
  }

  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(product.latitude - from.lat);
  const deltaLng = toRadians(product.longitude - from.lng);
  const startLat = toRadians(from.lat);
  const endLat = toRadians(product.latitude);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatDistanceLabel(distanceKm: number | null): string {
  if (distanceKm === null || !Number.isFinite(distanceKm)) {
    return "";
  }
  if (distanceKm < 1) {
    return `${Math.max(20, Math.round(distanceKm * 1000))} m`;
  }
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0).replace(".", ",")} km`;
}

function formatTravelTimeLabel(distanceKm: number | null): string {
  if (distanceKm === null || !Number.isFinite(distanceKm)) {
    return "";
  }
  const minutes = Math.max(2, Math.round((distanceKm / 28) * 60 + 3));
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}min` : `${hours}h`;
}

function buildMapDistanceSummary(userLocation: LeafletLatLng | null, product: LocatedProduct): string {
  const distanceKm = calculateDistanceKm(userLocation, product);
  const distanceLabel = formatDistanceLabel(distanceKm);
  const timeLabel = formatTravelTimeLabel(distanceKm);
  return distanceLabel && timeLabel ? `${distanceLabel} - ${timeLabel}` : "";
}

function buildMapLocationSummary(product: LocatedProduct): string {
  const parts = [
    String(product.city ?? "").trim(),
    String(product.address ?? "").trim(),
  ].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" - ");
  }
  return `${product.latitude.toFixed(5)}, ${product.longitude.toFixed(5)}`;
}

function buildStoreMarkerHtml(
  product: LocatedProduct,
  distanceSummary: string,
  compact = false,
  distant = false,
): string {
  const storeName = String(
    product.establishmentName ||
      product.sellerName ||
      product.name ||
      "Attività",
  ).trim();

  const imageUrl = String(
    product.establishmentLogoUrl ||
      product.image ||
      "",
  ).trim();

  const safeStoreName = escapeHtml(storeName);
  const safeImageUrl = escapeHtml(imageUrl);
  const safeDistanceSummary = escapeHtml(distanceSummary);

  const imageMarkup = safeImageUrl
    ? `<img
        src="${safeImageUrl}"
        alt=""
        style="
          width:36px;
          height:36px;
          flex:0 0 36px;
          border-radius:9999px;
          object-fit:cover;
          background:#f5f5f4;
        "
      />`
    : `<div
        style="
          width:36px;
          height:36px;
          flex:0 0 36px;
          border-radius:9999px;
          background:#e7e5e4;
          color:#78716c;
          display:flex;
          align-items:center;
          justify-content:center;
          font-family:serif;
          font-size:17px;
          font-weight:700;
        "
      >${safeStoreName.slice(0, 1).toUpperCase()}</div>`;

  if (compact) {
    return `<div style="position:relative;width:44px;height:48px;display:flex;align-items:flex-start;justify-content:center;pointer-events:none">
      <span style="position:absolute;top:40px;left:17px;border-left:5px solid transparent;border-right:5px solid transparent;border-top:8px solid #00c896"></span>
      <div style="position:relative;margin-top:${distant ? 24 : 2}px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border:2px solid #00c896;border-radius:50%;background:#0a0a0a;box-shadow:0 2px 5px #0005;width:${distant ? 18 : 40}px;height:${distant ? 18 : 40}px;overflow:hidden">
        ${distant ? "" : imageMarkup}
      </div>
    </div>`;
  }

  const distanceMarkup = safeDistanceSummary
    ? `<div
        style="
          margin-top:2px;
          font-size:9px;
          line-height:11px;
          font-weight:700;
          color:#6ee7b7;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        "
      >${safeDistanceSummary}</div>`
    : "";

  return `
    <div
      style="
        position:relative;
        width:190px;
        height:68px;
        display:flex;
        justify-content:center;
        pointer-events:none;
      "
    >
      <div
        style="
          position:absolute;
          top:0;
          left:50%;
          transform:translateX(-50%);
          width:182px;
          height:48px;
          box-sizing:border-box;
          display:flex;
          align-items:center;
          gap:8px;
          padding:5px 10px 5px 5px;
          background:#0a0a0a;
          border:1.5px solid #00c896;
          border-radius:9999px;
          box-shadow:0 12px 24px rgba(0,0,0,0.34);
          overflow:hidden;
        "
      >
        ${imageMarkup}

        <div
          style="
            min-width:0;
            flex:1;
            overflow:hidden;
          "
        >
          <div
            style="
              font-size:11px;
              line-height:13px;
              font-weight:800;
              color:#ffffff;
              white-space:nowrap;
              overflow:hidden;
              text-overflow:ellipsis;
            "
          >
            ${safeStoreName}
          </div>

          ${distanceMarkup}
        </div>
      </div>

      <div
        style="
          position:absolute;
          top:48px;
          left:50%;
          transform:translateX(-50%);
          width:0;
          height:0;
          border-left:9px solid transparent;
          border-right:9px solid transparent;
          border-top:14px solid #00c896;
        "
      ></div>

      <div
        style="
          position:absolute;
          top:47px;
          left:50%;
          transform:translateX(-50%);
          width:0;
          height:0;
          border-left:8px solid transparent;
          border-right:8px solid transparent;
          border-top:13px solid #0a0a0a;
        "
      ></div>
    </div>
  `;
}

function matchesProductSearch(
  product: Product,
  normalizedQuery: string,
  locale: AppLocale,
): boolean {
  if (!normalizedQuery) {
    return true;
  }

  const searchableFields = [
    product.name,
    product.category,
    product.establishmentName ?? "",
    product.establishmentCategory ?? "",
    product.sectionName ?? "",
    getCategoryLabel(product.category, locale),
    product.description ?? "",
    product.city ?? "",
    product.sellerName ?? "",
    product.establishmentSlug ?? "",
    (product as LocatedProduct).address ?? "",
    ...((product as LocatedProduct).keywords ?? []),
  ];
  return searchableFields
    .map((field) => normalizeSearchText(field))
    .some((normalizedField) => normalizedField.includes(normalizedQuery));
}

function parseCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toLocatedProduct(product: Product): LocatedProduct | null {
  const latitude = parseCoordinate(product.latitude);
  const longitude = parseCoordinate(product.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    ...product,
    latitude: clamp(latitude, -90, 90),
    longitude: clamp(longitude, -180, 180),
  };
}

function toLocatedEstablishment(establishment: EstablishmentDto): LocatedProduct | null {
  const latitude = parseCoordinate(establishment.latitude);
  const longitude = parseCoordinate(establishment.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    id: 1_000_000_000 + establishment.id,
    name: establishment.name,
    category: establishment.category || "Altro",
    price: "",
    image:
      String(establishment.logoUrl ?? "").trim() ||
      String(establishment.coverUrl ?? "").trim() ||
      String(establishment.ownerAvatarUrl ?? "").trim(),
    description: establishment.description,
    ownerId: establishment.ownerId,
    latitude: clamp(latitude, -90, 90),
    longitude: clamp(longitude, -180, 180),
    city: establishment.city,
    sellerName: establishment.name,
    establishmentId: establishment.id,
    establishmentSlug: establishment.slug,
    establishmentName: establishment.name,
    establishmentCategory: establishment.category,
    establishmentLogoUrl: establishment.logoUrl,
    establishmentWhatsappCountryIso: establishment.whatsappCountryIso,
    establishmentWhatsappNumber: establishment.whatsappNumber,
    address: establishment.address,
    keywords: establishment.keywords ?? [],
  };
}

function groupLocatedProductsByEstablishment(products: LocatedProduct[]): LocatedProduct[] {
  const grouped = new globalThis.Map<string, LocatedProduct>();
  for (const product of products) {
    const groupKey =
      product.establishmentId !== undefined && product.establishmentId !== null
        ? `establishment:${product.establishmentId}`
        : `product:${product.id}`;
    const existing = grouped.get(groupKey);
    if (existing) {
      continue;
    }
    grouped.set(groupKey, {
      ...product,
      name: product.establishmentName || product.sellerName || product.name,
      category: product.establishmentCategory || product.category,
      image: product.establishmentLogoUrl || product.image,
      description: product.establishmentName
        ? `${product.establishmentName} - prodotti e servizi`
        : product.description,
    });
  }
  return [...grouped.values()];
}

function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const denominator = yj - yi;
    if (denominator === 0) {
      continue;
    }

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / denominator + xi;
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

type LeafletLatLng = {
  lat: number;
  lng: number;
};

type LeafletPointerEvent = {
  latlng?: LeafletLatLng;
};

type LeafletMapInstance = {
  options?: { rotate?: boolean };
  touchGestures?: {
    enable: () => void;
    disable: () => void;
    _stopRotateInertia?: () => void;
  };
  dragRotate?: { enable: () => void; disable: () => void };
  shiftKeyRotate?: { enable: () => void; disable: () => void };
  fitBounds: (bounds: [number, number][], options?: unknown) => void;
  setView: (coords: [number, number], zoom?: number, options?: unknown) => void;
  on: (eventName: string, handler: (event: LeafletPointerEvent) => void) => void;
  off: (eventName: string, handler: (event: LeafletPointerEvent) => void) => void;
  getZoom: () => number;
  getMaxZoom: () => number;
  getSize: () => { x: number; y: number };
  latLngToContainerPoint: (coords: [number, number]) => { x: number; y: number };
  remove: () => void;
  invalidateSize?: (animate?: boolean) => void;
  containerPointToLatLng: (point: [number, number]) => LeafletLatLng;
  dragging: {
    disable: () => void;
    enable: () => void;
  };
  touchZoom?: {
    disable: () => void;
    enable: () => void;
  };
  doubleClickZoom?: {
    disable: () => void;
    enable: () => void;
  };
  scrollWheelZoom?: {
    disable: () => void;
    enable: () => void;
  };
  boxZoom?: {
    disable: () => void;
    enable: () => void;
  };
  keyboard?: {
    disable: () => void;
    enable: () => void;
  };
  tap?: {
    disable: () => void;
    enable: () => void;
  };
};

type LeafletMarkerInstance = {
  addTo: (map: LeafletMapInstance) => LeafletMarkerInstance;
  on: (eventName: string, handler: () => void) => LeafletMarkerInstance;
  remove: () => void;
};

type LeafletCircleMarkerInstance = {
  addTo: (map: LeafletMapInstance) => LeafletCircleMarkerInstance;
  on: (eventName: string, handler: () => void) => LeafletCircleMarkerInstance;
  remove: () => void;
};

type LeafletPolygonInstance = {
  addTo: (map: LeafletMapInstance) => LeafletPolygonInstance;
  remove: () => void;
  setLatLngs: (coords: [number, number][]) => void;
};

type LeafletTileLayerInstance = {
  addTo: (map: LeafletMapInstance) => LeafletTileLayerInstance;
  on: (eventName: string, handler: () => void) => LeafletTileLayerInstance;
  off?: (eventName: string, handler?: () => void) => LeafletTileLayerInstance;
  remove: () => void;
};

type LeafletGlobal = {
  Map?: { prototype: { setBearing?: (degrees: number) => void } };
  map: (container: HTMLElement, options?: unknown) => LeafletMapInstance;
  tileLayer: (url: string, options?: unknown) => LeafletTileLayerInstance;
  marker: (coords: [number, number], options?: unknown) => LeafletMarkerInstance;
  divIcon: (options?: unknown) => unknown;
  circleMarker: (
    coords: [number, number],
    options?: unknown,
  ) => LeafletCircleMarkerInstance;
  polygon: (coords: [number, number][], options?: unknown) => LeafletPolygonInstance;
  control: {
    zoom: (options?: {
      position?: "topleft" | "topright" | "bottomleft" | "bottomright";
    }) => {
      addTo: (map: LeafletMapInstance) => void;
    };
  };
  icon: (options: Record<string, unknown>) => unknown;
  Icon: {
    Default: {
      prototype: Record<string, unknown>;
      mergeOptions: (options: Record<string, string>) => void;
    };
  };
};

const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_SCRIPT_ID = "templesale-leaflet-js";
const LEAFLET_STYLE_ID = "templesale-leaflet-css";
const ROTATION_SCRIPT_ID = "templesale-leaflet-rotation-js";
const ROTATION_JS_URL = "https://unpkg.com/@tomickigrzegorz/leaflet-rotate@0.2.4/dist/leaflet-rotate.umd.min.js";
const ROTATION_INTEGRITY = "sha384-eYPnMdGW5hE3EidfQzVtTqcv8JEKwVlkz1xFC0MuxhGfCk+ltrVxWBZ7A2mnnFpc";
let rotationAssetsPromise: Promise<boolean> | null = null;
const DEFAULT_MAP_CENTER: LeafletLatLng = {
  lat: -23.55052,
  lng: -46.633308,
};
const PRIMARY_TILE_URL = "/api/map-tiles/{z}/{x}/{y}.png";
const SECONDARY_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TERTIARY_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
const QUATERNARY_TILE_URL = "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const MIN_DRAW_POINT_DELTA = 0.00003;
const DRAW_STATE_SYNC_INTERVAL_MS = 80;
const TILE_FALLBACK_TIMEOUT_MS = 20000;
const TILE_ERROR_THRESHOLD = 8;
const FOCUSED_POINT_MARKER_STYLE = {
  radius: 8,
  color: "#00c896",
  weight: 2,
  fillColor: "#00c896",
  fillOpacity: 0.95,
};
let leafletAssetsPromise: Promise<LeafletGlobal> | null = null;

function getLeafletFromWindow(): LeafletGlobal | undefined {
  return (window as unknown as { L?: LeafletGlobal }).L;
}

export function ensureLeafletAssets(): Promise<LeafletGlobal> {
  const existingLeaflet = getLeafletFromWindow();
  if (existingLeaflet) {
    return Promise.resolve(existingLeaflet);
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
          const loadedLeaflet = getLeafletFromWindow();
          if (loadedLeaflet) {
            resolve(loadedLeaflet);
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
        const loadedLeaflet = getLeafletFromWindow();
        if (!loadedLeaflet) {
          reject(new Error("Leaflet não carregado."));
          return;
        }

        delete loadedLeaflet.Icon.Default.prototype._getIconUrl;
        loadedLeaflet.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });
        resolve(loadedLeaflet);
      };
      script.onerror = () => {
        reject(new Error("Falha ao carregar Leaflet."));
      };
      document.head.appendChild(script);
    });
  }

  return leafletAssetsPromise;
}

export function ensureLeafletRotation(L: LeafletGlobal): Promise<boolean> {
  if (typeof L.Map?.prototype.setBearing === "function") return Promise.resolve(true);
  if (rotationAssetsPromise) return rotationAssetsPromise;
  rotationAssetsPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.id = ROTATION_SCRIPT_ID;
    script.src = ROTATION_JS_URL;
    script.integrity = ROTATION_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.async = true;
    const finish = (ready: boolean) => {
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      if (!ready) {
        script.remove();
        rotationAssetsPromise = null;
        console.warn("Rotação indisponível; mantendo os controles originais do mapa.");
      }
      resolve(ready);
    };
    const timeout = window.setTimeout(() => finish(false), 8000);
    script.onload = () => finish(typeof L.Map?.prototype.setBearing === "function");
    script.onerror = () => finish(false);
    document.head.appendChild(script);
  });
  return rotationAssetsPromise;
}

export function setMapInteractionForDrawing(map: LeafletMapInstance, isDrawing: boolean) {
  if (isDrawing) {
    // Version 0.2.4 does not cancel touch rotation inertia in disable().
    map.touchGestures?._stopRotateInertia?.();
    map.touchGestures?.disable();
    map.dragRotate?.disable();
    map.shiftKeyRotate?.disable();
    map.dragging.disable();
    map.touchZoom?.disable();
    map.doubleClickZoom?.disable();
    map.scrollWheelZoom?.disable();
    map.boxZoom?.disable();
    map.keyboard?.disable();
    map.tap?.disable();
    return;
  }

  map.dragging.enable();
  if (map.options?.rotate) {
    // The extension handles pinch and rotation together; do not run Leaflet's
    // original pinch handler in parallel or the map will jump during gestures.
    map.touchZoom?.disable();
    map.touchGestures?.enable();
    map.dragRotate?.enable();
    map.shiftKeyRotate?.enable();
  } else {
    map.touchZoom?.enable();
  }
  map.doubleClickZoom?.enable();
  map.scrollWheelZoom?.enable();
  map.boxZoom?.enable();
  map.keyboard?.enable();
  map.tap?.enable();
}

function getMapItemKey(product: LocatedProduct): string {
  return product.establishmentId ? `establishment:${product.establishmentId}` : `product:${product.id}`;
}

export default function ProductMap({
  products,
  visitorLocation,
  initialSearchPoint,
  establishments = [],
  onClose,
  initialFocusProductId,
  initialCategory,
  openResultsByDefault,
  autoFocusPanelSearch,
  onOpenProduct,
  onOpenEstablishment,
}: ProductMapProps) {
  const { t, locale } = useI18n();
  const [mapSearchPoint, setMapSearchPoint] = React.useState<LeafletLatLng | null>(initialSearchPoint ?? null);
  const searchOrigin = mapSearchPoint ?? visitorLocation ?? null;
  const [mapSearchLoading, setMapSearchLoading] = React.useState(false);
  const [mapSearchError, setMapSearchError] = React.useState(false);
  const [searchedEstablishments, setSearchedEstablishments] = React.useState<EstablishmentDto[]>([]);
  const productsWithLocation = React.useMemo(
    () =>
      groupLocatedProductsByEstablishment(
        [
          ...searchedEstablishments
            .map(toLocatedEstablishment)
            .filter((product): product is LocatedProduct => product !== null),
          ...establishments
            .map(toLocatedEstablishment)
            .filter((product): product is LocatedProduct => product !== null),
          ...products
            .map(toLocatedProduct)
            .filter((product): product is LocatedProduct => product !== null),
        ],
      ),
    [establishments, products, searchedEstablishments],
  );
  const hasProductsWithLocation = productsWithLocation.length > 0;

  const [leafletError, setLeafletError] = React.useState("");
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [currentPolygon, setCurrentPolygon] = React.useState<GeoPoint[]>([]);
  const [selectedProducts, setSelectedProducts] = React.useState<LocatedProduct[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [focusedMapItemKey, setFocusedMapItemKey] = React.useState<string | null>(null);
  const [expandedClusterKeys, setExpandedClusterKeys] = React.useState<string[]>([]);
  const [isTopSearchResultsOpen, setIsTopSearchResultsOpen] = React.useState(false);
  const [panelSearchQuery, setPanelSearchQuery] = React.useState("");
  const [mapReadyVersion, setMapReadyVersion] = React.useState(0);
  const [sellerLocationByOwnerId, setSellerLocationByOwnerId] = React.useState<Record<number, string>>({});
  const savedUserLocation = visitorLocation ?? null;
  const visitorLocationRef = React.useRef(savedUserLocation);
  visitorLocationRef.current = savedUserLocation;
  const visitorFramedRef = React.useRef(false);
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMapInstance | null>(null);
  const leafletRef = React.useRef<LeafletGlobal | null>(null);
  const markersRef = React.useRef<Array<{ remove: () => void }>>([]);
  const drawingPolygonRef = React.useRef<LeafletPolygonInstance | null>(null);
  const selectionPolygonRef = React.useRef<LeafletPolygonInstance | null>(null);
  const drawPointsRef = React.useRef<GeoPoint[]>([]);
  const isPointerDownRef = React.useRef(false);
  const isDrawingRef = React.useRef(false);
  const productsWithLocationRef = React.useRef<LocatedProduct[]>([]);
  const lastStateSyncRef = React.useRef(0);
  const tileLayerRef = React.useRef<LeafletTileLayerInstance | null>(null);
  const tileFallbackTimerRef = React.useRef<number | null>(null);
  const activeTileLoadRef = React.useRef(0);
  const hasLoadedAnyTileRef = React.useRef(false);
  const pendingSellerCityOwnerIdsRef = React.useRef<Set<number>>(new Set());
  const attemptedSellerCityOwnerIdsRef = React.useRef<Set<number>>(new Set());
  const topSearchContainerRef = React.useRef<HTMLDivElement | null>(null);
  const topSearchInputRef = React.useRef<HTMLInputElement | null>(null);


  React.useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !savedUserLocation) return;
    if (!visitorFramedRef.current && !mapSearchPoint) {
      visitorFramedRef.current = true;
      const target = productsWithLocationRef.current.find(item => item.id === initialFocusProductId);
      if (target) {
        map.fitBounds([[savedUserLocation.lat, savedUserLocation.lng], [target.latitude, target.longitude]], { padding: [48, 48], maxZoom: 15 });
      } else {
        map.setView([savedUserLocation.lat, savedUserLocation.lng], 13);
      }
    }
    const marker = L.marker([savedUserLocation.lat, savedUserLocation.lng], {
      title: t("Sua localização atual"),
      bubblingMouseEvents: false,
      zIndexOffset: 1000,
      icon: L.divIcon({
        className: "templesale-visitor-marker",
        html: '<span style="display:block;width:18px;height:18px;border:3px solid white;border-radius:50%;background:#3b82f6;box-shadow:0 0 0 7px rgba(59,130,246,.22)"></span>',
        iconSize: [18,18], iconAnchor: [9,9],
      }),
    }).addTo(map);
    return () => { marker.remove(); };
  }, [savedUserLocation?.lat, savedUserLocation?.lng, mapReadyVersion, initialFocusProductId, mapSearchPoint, t]);

  React.useEffect(() => {
    isDrawingRef.current = isDrawing;
    if (mapRef.current) {
      setMapInteractionForDrawing(mapRef.current, isDrawing);
    }
  }, [isDrawing]);

  React.useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    const preventGestureZoom = (event: Event) => {
      event.preventDefault();
    };

    const preventPinchTouchZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    const preventCtrlWheelZoom = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    };

    overlay.addEventListener("gesturestart", preventGestureZoom, {
      passive: false,
    });
    overlay.addEventListener("gesturechange", preventGestureZoom, {
      passive: false,
    });
    overlay.addEventListener("gestureend", preventGestureZoom, {
      passive: false,
    });
    overlay.addEventListener("touchmove", preventPinchTouchZoom, {
      passive: false,
    });
    overlay.addEventListener("wheel", preventCtrlWheelZoom, {
      passive: false,
    });

    return () => {
      overlay.removeEventListener("gesturestart", preventGestureZoom);
      overlay.removeEventListener("gesturechange", preventGestureZoom);
      overlay.removeEventListener("gestureend", preventGestureZoom);
      overlay.removeEventListener("touchmove", preventPinchTouchZoom);
      overlay.removeEventListener("wheel", preventCtrlWheelZoom);
    };
  }, []);

  React.useEffect(() => {
    productsWithLocationRef.current = productsWithLocation;
  }, [productsWithLocation]);

  const filteredProducts = React.useMemo(() => {
    if (searchOrigin) {
      const nearby = searchedEstablishments.map(toLocatedEstablishment).filter((item): item is LocatedProduct => item !== null);
      if (!mapSearchPoint && !searchQuery.trim() && initialFocusProductId) {
        const target = productsWithLocation.find(item => item.id === initialFocusProductId);
        if (target && !nearby.some(item => getMapItemKey(item) === getMapItemKey(target))) return [target, ...nearby];
      }
      return nearby;
    }
    return productsWithLocation.filter(item => searchQuery.trim()
      ? matchesProductSearch(item, normalizeSearchText(searchQuery), locale)
      : item.id === initialFocusProductId);
  }, [searchOrigin, searchedEstablishments, mapSearchPoint, searchQuery, initialFocusProductId, productsWithLocation, locale]);

  const filteredPanelProducts = React.useMemo(() => {
    const normalized = normalizeSearchText(panelSearchQuery);
    if (!normalized) {
      return selectedProducts;
    }

    return selectedProducts.filter((product) =>
      matchesProductSearch(product, normalized, locale),
    );
  }, [locale, panelSearchQuery, selectedProducts]);

  const normalizedTopSearchQuery = React.useMemo(
    () => normalizeSearchText(searchQuery),
    [searchQuery],
  );
  const topSearchResults = React.useMemo(() => {
    if (expandedClusterKeys.length) {
      return filteredProducts.filter(product => expandedClusterKeys.includes(getMapItemKey(product)));
    }
    if (!normalizedTopSearchQuery && !mapSearchPoint) {
      return [];
    }
    return filteredProducts.slice(0, 50);
  }, [filteredProducts, normalizedTopSearchQuery, mapSearchPoint, expandedClusterKeys]);
  const shouldShowTopSearchResults =
    (normalizedTopSearchQuery.length > 0 || Boolean(mapSearchPoint) || expandedClusterKeys.length > 0) && isTopSearchResultsOpen;

  React.useEffect(() => { setExpandedClusterKeys([]); }, [filteredProducts]);

  React.useEffect(() => {
    if (!focusedMapItemKey) {
      return;
    }
    if (filteredProducts.some((product) => getMapItemKey(product) === focusedMapItemKey)) {
      return;
    }
    setFocusedMapItemKey(null);
  }, [filteredProducts, focusedMapItemKey]);

  React.useEffect(() => {
    const controller = new AbortController();
    setSearchedEstablishments([]);
    setMapSearchLoading(true);
    setMapSearchError(false);
    const timer = window.setTimeout(() => {
      const request = searchOrigin
        ? api.getDiscovery({ ...searchOrigin, radius: 5, search: searchQuery.trim() }, controller.signal).then(page => page.items.map(item => item.establishment))
        : api.getEstablishments({ search: searchQuery.trim(), limit: 50 });
      void request.then(items => {
        if (!controller.signal.aborted) setSearchedEstablishments(items);
      }).catch(() => {
        if (!controller.signal.aborted) setMapSearchError(true);
      }).finally(() => {
        if (!controller.signal.aborted) setMapSearchLoading(false);
      });
    }, 260);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [searchQuery, searchOrigin?.lat, searchOrigin?.lng]);

  React.useEffect(() => {
    if (!mapSearchPoint || !mapRef.current || !leafletRef.current) return;
    const marker = leafletRef.current.circleMarker([mapSearchPoint.lat, mapSearchPoint.lng], {
      radius: 10, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.4, weight: 3,
      interactive: false,
    }).addTo(mapRef.current);
    return () => { marker.remove(); };
  }, [mapSearchPoint, mapReadyVersion]);

  React.useEffect(() => {
    const normalizedInitialCategory = String(initialCategory ?? "").trim();
    if (!normalizedInitialCategory || normalizedInitialCategory === "All") {
      return;
    }

    setSearchQuery(normalizedInitialCategory);
    setIsTopSearchResultsOpen(Boolean(openResultsByDefault));
  }, [initialCategory, openResultsByDefault]);

  React.useEffect(() => {
    if (!autoFocusPanelSearch) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      topSearchInputRef.current?.focus();
      if (normalizeSearchText(searchQuery)) {
        setIsTopSearchResultsOpen(true);
      }
    }, 180);

    return () => window.clearTimeout(focusTimer);
  }, [autoFocusPanelSearch, searchQuery]);

  React.useEffect(() => {
    if (!isTopSearchResultsOpen) {
      return;
    }

    const handleOutsideTopSearchClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (topSearchContainerRef.current?.contains(target)) {
        return;
      }
      setIsTopSearchResultsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideTopSearchClick);
    document.addEventListener("touchstart", handleOutsideTopSearchClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideTopSearchClick);
      document.removeEventListener("touchstart", handleOutsideTopSearchClick);
    };
  }, [isTopSearchResultsOpen]);

  const clearMarkers = React.useCallback(() => {
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current = [];
  }, []);

  const clearDrawingPolygon = React.useCallback(() => {
    if (drawingPolygonRef.current) {
      drawingPolygonRef.current.remove();
      drawingPolygonRef.current = null;
    }
  }, []);

  const clearSelectionPolygon = React.useCallback(() => {
    if (selectionPolygonRef.current) {
      selectionPolygonRef.current.remove();
      selectionPolygonRef.current = null;
    }
  }, []);

  const clearSelection = React.useCallback(() => {
    drawPointsRef.current = [];
    isPointerDownRef.current = false;
    clearDrawingPolygon();
    clearSelectionPolygon();
    setCurrentPolygon([]);
    setSelectedProducts([]);
    setShowResults(false);
    setPanelSearchQuery("");
    setIsTopSearchResultsOpen(false);
  }, [clearDrawingPolygon, clearSelectionPolygon]);

  const openMapItem = React.useCallback(
    (product: LocatedProduct) => {
      if (product.establishmentSlug || product.establishmentId) {
        onOpenEstablishment?.(product.establishmentSlug || product.establishmentId || product.id);
        return;
      }
      onOpenProduct?.(product);
    },
    [onOpenEstablishment, onOpenProduct],
  );

  const focusMapItem = React.useCallback(
    (product: LocatedProduct) => {
      if (product.establishmentId) void api.trackDiscovery('map', product.establishmentId);
      setFocusedMapItemKey(getMapItemKey(product));
      mapRef.current?.setView(
        [product.latitude, product.longitude],
        Math.max(16, mapRef.current.getZoom()),
      );
    },
    [],
  );

  const handleStartDrawingMode = () => {
    if (!hasProductsWithLocation) {
      return;
    }
    isPointerDownRef.current = false;
    drawPointsRef.current = [];
    clearDrawingPolygon();
    if (mapRef.current) {
      setMapInteractionForDrawing(mapRef.current, true);
    }
    setIsDrawing(true);
    setShowResults(false);
    setPanelSearchQuery("");
  };

  const handleStopDrawingMode = () => {
    setIsDrawing(false);
    drawPointsRef.current = [];
    isPointerDownRef.current = false;
    clearDrawingPolygon();
    if (mapRef.current) {
      setMapInteractionForDrawing(mapRef.current, false);
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    let finalizeDrawingOnWindow: (() => void) | null = null;
    let removeNativeTouchListeners: (() => void) | null = null;

    const clearTileFallbackTimer = () => {
      if (tileFallbackTimerRef.current !== null) {
        window.clearTimeout(tileFallbackTimerRef.current);
        tileFallbackTimerRef.current = null;
      }
    };

    const initializeMap = async () => {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      try {
        const L = await ensureLeafletAssets();
        const rotationReady = await ensureLeafletRotation(L);
        if (cancelled || !mapContainerRef.current) {
          return;
        }

        leafletRef.current = L;

        const savedUserLocation = visitorLocationRef.current;
        visitorFramedRef.current = false;
        const firstProduct = productsWithLocationRef.current[0];
        const focusedProduct = initialFocusProductId
          ? productsWithLocationRef.current.find(
              (product) => product.id === initialFocusProductId,
            )
          : null;
        const mapCenter: [number, number] = focusedProduct
          ? [focusedProduct.latitude, focusedProduct.longitude]
          : savedUserLocation
            ? [savedUserLocation.lat, savedUserLocation.lng]
            : firstProduct
              ? [firstProduct.latitude, firstProduct.longitude]
              : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng];

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          rotate: rotationReady,
          touchRotate: rotationReady,
          dragRotate: rotationReady,
          shiftKeyRotate: rotationReady,
          rotateControl: false,
        });
        map.setView(mapCenter, focusedProduct ? 15 : savedUserLocation || firstProduct ? 13 : 12);
        if (focusedProduct && savedUserLocation) {
          map.fitBounds([[savedUserLocation.lat, savedUserLocation.lng], [focusedProduct.latitude, focusedProduct.longitude]], { padding: [48, 48], maxZoom: 15 });
        }
        setMapInteractionForDrawing(map, isDrawingRef.current);

        const tileProviders = [PRIMARY_TILE_URL, SECONDARY_TILE_URL];

        const loadTileProvider = (nextIndex: number) => {
          if (nextIndex > 0 && hasLoadedAnyTileRef.current) {
            return;
          }

          if (nextIndex >= tileProviders.length) {
            setLeafletError(
              t("Não foi possível carregar os tiles do mapa nesta rede. Tente novamente em instantes."),
            );
            return;
          }

          const loadToken = activeTileLoadRef.current + 1;
          activeTileLoadRef.current = loadToken;
          let hasLoadedTileForProvider = false;
          let tileErrors = 0;
          setLeafletError("");

          if (tileLayerRef.current) {
            tileLayerRef.current.remove();
            tileLayerRef.current = null;
          }
          clearTileFallbackTimer();

          const layer = L.tileLayer(tileProviders[nextIndex], {
            attribution: TILE_ATTRIBUTION,
          });

          const moveToNextProvider = () => {
            if (hasLoadedAnyTileRef.current) {
              return;
            }
            if (loadToken !== activeTileLoadRef.current) {
              return;
            }
            loadTileProvider(nextIndex + 1);
          };

          const markProviderAsLoaded = () => {
            if (loadToken !== activeTileLoadRef.current) {
              return;
            }
            hasLoadedTileForProvider = true;
            hasLoadedAnyTileRef.current = true;
            clearTileFallbackTimer();
          };

          layer.on("tileload", markProviderAsLoaded);
          layer.on("load", () => {
            markProviderAsLoaded();
          });
          layer.on("tileerror", () => {
            if (
              loadToken !== activeTileLoadRef.current ||
              hasLoadedTileForProvider
            ) {
              return;
            }
            tileErrors += 1;
            if (tileErrors >= TILE_ERROR_THRESHOLD) {
              moveToNextProvider();
            }
          });

          layer.addTo(map);
          tileLayerRef.current = layer;

          tileFallbackTimerRef.current = window.setTimeout(() => {
            if (hasLoadedTileForProvider) {
              return;
            }
            moveToNextProvider();
          }, TILE_FALLBACK_TIMEOUT_MS);
        };

        loadTileProvider(0);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        const startDrawingAt = (event: LeafletPointerEvent) => {
          if (!isDrawingRef.current || !event.latlng) {
            return;
          }

          clearDrawingPolygon();
          clearSelectionPolygon();
          setCurrentPolygon([]);
          setSelectedProducts([]);
          setShowResults(false);
          setPanelSearchQuery("");
          setIsTopSearchResultsOpen(false);

          isPointerDownRef.current = true;
          drawPointsRef.current = [[event.latlng.lat, event.latlng.lng]];
          setMapInteractionForDrawing(map, true);

          const polygon = L.polygon(drawPointsRef.current, {
            color: "#5d4037",
            fillColor: "#fbc02d",
            fillOpacity: 0.12,
            weight: 3,
            dashArray: "5, 10",
          });
          polygon.addTo(map);
          drawingPolygonRef.current = polygon;
          lastStateSyncRef.current = Date.now();
        };

        const moveDrawing = (event: LeafletPointerEvent) => {
          if (!isDrawingRef.current || !event.latlng) {
            return;
          }

          if (!isPointerDownRef.current) {
            startDrawingAt(event);
          }

          if (!isPointerDownRef.current) {
            return;
          }

          const nextPoint: GeoPoint = [event.latlng.lat, event.latlng.lng];
          const lastPoint = drawPointsRef.current[drawPointsRef.current.length - 1];
          if (
            lastPoint &&
            Math.abs(lastPoint[0] - nextPoint[0]) +
              Math.abs(lastPoint[1] - nextPoint[1]) <
              MIN_DRAW_POINT_DELTA
          ) {
            return;
          }

          drawPointsRef.current = [...drawPointsRef.current, nextPoint];
          if (drawingPolygonRef.current) {
            drawingPolygonRef.current.setLatLngs(drawPointsRef.current);
          }

          const now = Date.now();
          if (now - lastStateSyncRef.current >= DRAW_STATE_SYNC_INTERVAL_MS) {
            setCurrentPolygon([...drawPointsRef.current]);
            lastStateSyncRef.current = now;
          }
        };

        const finalizeDrawing = () => {
          if (!isDrawingRef.current || !isPointerDownRef.current) {
            return;
          }

          isPointerDownRef.current = false;
          setMapInteractionForDrawing(map, false);

          const completedPolygon = [...drawPointsRef.current];
          drawPointsRef.current = [];
          clearDrawingPolygon();

          if (completedPolygon.length < 3) {
            setCurrentPolygon([]);
            return;
          }

          const polygon = L.polygon(completedPolygon, {
            color: "#5d4037",
            fillColor: "#fbc02d",
            fillOpacity: 0.18,
            weight: 3,
          });
          polygon.addTo(map);
          selectionPolygonRef.current = polygon;

          setCurrentPolygon(completedPolygon);
          const found = productsWithLocationRef.current.filter((product) =>
            isPointInPolygon([product.latitude, product.longitude], completedPolygon),
          );
          setSelectedProducts(found);
          setShowResults(true);
          setIsDrawing(false);
        };

        map.on("click", event => {
          if (isDrawingRef.current || !event.latlng) return;
          setMapSearchPoint({ lat: event.latlng.lat, lng: event.latlng.lng });
          setFocusedMapItemKey(null);
          setIsTopSearchResultsOpen(true);
        });
        map.on("mousedown", startDrawingAt);
        map.on("mousemove", moveDrawing);
        map.on("mouseup", finalizeDrawing);
        map.on("touchstart", startDrawingAt);
        map.on("touchmove", moveDrawing);
        map.on("touchend", finalizeDrawing);
        map.on("touchcancel", finalizeDrawing);

        const mapContainer = mapContainerRef.current;
        const toLeafletTouchEvent = (touch: Touch): LeafletPointerEvent | null => {
          if (!mapContainer) {
            return null;
          }

          const rect = mapContainer.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return null;
          }

          const latlng = map.containerPointToLatLng([x, y]);
          if (!Number.isFinite(latlng.lat) || !Number.isFinite(latlng.lng)) {
            return null;
          }

          return {
            latlng: {
              lat: latlng.lat,
              lng: latlng.lng,
            },
          };
        };

        const handleNativeTouchStart = (event: TouchEvent) => {
          if (!isDrawingRef.current || event.touches.length === 0) {
            return;
          }

          event.preventDefault();
          const touchEvent = toLeafletTouchEvent(event.touches[0]);
          if (!touchEvent) {
            return;
          }
          startDrawingAt(touchEvent);
        };

        const handleNativeTouchMove = (event: TouchEvent) => {
          if (!isDrawingRef.current || event.touches.length === 0) {
            return;
          }

          event.preventDefault();
          const touchEvent = toLeafletTouchEvent(event.touches[0]);
          if (!touchEvent) {
            return;
          }
          moveDrawing(touchEvent);
        };

        const handleNativeTouchEnd = (event: TouchEvent) => {
          if (!isDrawingRef.current) {
            return;
          }
          event.preventDefault();
          finalizeDrawing();
        };

        if (mapContainer) {
          mapContainer.addEventListener("touchstart", handleNativeTouchStart, {
            passive: false,
          });
          mapContainer.addEventListener("touchmove", handleNativeTouchMove, {
            passive: false,
          });
          mapContainer.addEventListener("touchend", handleNativeTouchEnd, {
            passive: false,
          });
          mapContainer.addEventListener("touchcancel", handleNativeTouchEnd, {
            passive: false,
          });

          removeNativeTouchListeners = () => {
            mapContainer.removeEventListener("touchstart", handleNativeTouchStart);
            mapContainer.removeEventListener("touchmove", handleNativeTouchMove);
            mapContainer.removeEventListener("touchend", handleNativeTouchEnd);
            mapContainer.removeEventListener("touchcancel", handleNativeTouchEnd);
          };
        }

        finalizeDrawingOnWindow = () => {
          finalizeDrawing();
        };
        window.addEventListener("mouseup", finalizeDrawingOnWindow);
        window.addEventListener("touchend", finalizeDrawingOnWindow);
        window.addEventListener("touchcancel", finalizeDrawingOnWindow);

        mapRef.current = map;
        setMapReadyVersion((current) => current + 1);
        setTimeout(() => {
          map.invalidateSize?.(true);
        }, 0);
      } catch (error) {
        const message =
          error instanceof Error ? t(error.message) : t("Falha ao carregar o mapa.");
        setLeafletError(message);
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
      clearMarkers();
      clearDrawingPolygon();
      clearSelectionPolygon();
      if (finalizeDrawingOnWindow) {
        window.removeEventListener("mouseup", finalizeDrawingOnWindow);
        window.removeEventListener("touchend", finalizeDrawingOnWindow);
        window.removeEventListener("touchcancel", finalizeDrawingOnWindow);
      }
      if (removeNativeTouchListeners) {
        removeNativeTouchListeners();
      }
      activeTileLoadRef.current += 1;
      hasLoadedAnyTileRef.current = false;
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
        tileLayerRef.current = null;
      }
      clearTileFallbackTimer();
      if (mapRef.current) {
        mapRef.current.touchGestures?._stopRotateInertia?.();
        mapRef.current.remove();
        mapRef.current = null;
      }
      leafletRef.current = null;
    };
  }, [
    clearDrawingPolygon,
    clearMarkers,
    clearSelectionPolygon,
    initialFocusProductId,
    t,
  ]);

  React.useEffect(() => {
    if (!mapRef.current || !leafletRef.current) {
      return;
    }

    const map = mapRef.current;
    const L = leafletRef.current;
    const orderedProducts = [...filteredProducts]
      .sort((a, b) => {
        const aIsFocused =
          a.id === initialFocusProductId || getMapItemKey(a) === focusedMapItemKey ? 1 : 0;
        const bIsFocused =
          b.id === initialFocusProductId || getMapItemKey(b) === focusedMapItemKey ? 1 : 0;
        return bIsFocused - aIsFocused;
      })
      .slice(0, 80);
    const productByKey = new globalThis.Map(orderedProducts.map(product => [getMapItemKey(product), product]));
    let updateTimer: number | undefined;
    const renderMarkers = () => {
      if (mapRef.current !== map) return;
      const zoom = map.getZoom();
      const reserved = [savedUserLocation, mapSearchPoint].filter(Boolean).map(point =>
        map.latLngToContainerPoint([point!.lat, point!.lng]));
      const groups = layoutMapMarkers(orderedProducts.map(product => ({
        ...map.latLngToContainerPoint([product.latitude, product.longitude]),
        key: getMapItemKey(product),
        priority: product.id === initialFocusProductId || getMapItemKey(product) === focusedMapItemKey,
      })), zoom, map.getSize(), reserved);
      clearMarkers();
      markersRef.current = groups.map(group => {
        const members = group.keys.map(key => productByKey.get(key)!);
        const product = members[0];
        const clustered = members.length > 1;
        const position = clustered ? map.containerPointToLatLng([group.x, group.y])
          : { lat: product.latitude, lng: product.longitude };
        const title = clustered ? t("{count} resultado(s)", { count: members.length })
          : product.establishmentName || product.sellerName || product.name;
        const storeMarker = L.marker([position.lat, position.lng], {
          bubblingMouseEvents: false,
          title,
          icon: L.divIcon({
            className: "templesale-store-map-marker",
            html: clustered
              ? `<div style="position:relative;width:44px;height:48px"><span style="position:absolute;top:40px;left:17px;border-left:5px solid transparent;border-right:5px solid transparent;border-top:8px solid #00c896"></span><div style="position:relative;width:44px;height:44px;box-sizing:border-box;border:3px solid #00c896;border-radius:50%;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;box-shadow:0 2px 5px #0005">${members.length}</div></div>`
              : buildStoreMarkerHtml(product, buildMapDistanceSummary(searchOrigin, product), !group.detailed, zoom < 10),
            iconSize: group.detailed ? MAP_LABEL_SIZE : [MAP_PIN_SIZE, MAP_PIN_ANCHOR[1]],
            iconAnchor: group.detailed ? MAP_LABEL_ANCHOR : MAP_PIN_ANCHOR,
          }),
          zIndexOffset: members.some(item => item.id === initialFocusProductId || getMapItemKey(item) === focusedMapItemKey) ? 10000 : 0,
        });
        storeMarker.on("click", () => {
          if (!clustered) { openMapItem(product); return; }
          const maxZoom = Math.min(18, map.getMaxZoom());
          if (map.getZoom() < maxZoom) {
            map.setView([position.lat, position.lng], Math.min(maxZoom, map.getZoom() + 2));
          } else {
            // Same building or dense street: reuse the existing result list.
            setExpandedClusterKeys(group.keys);
            setIsTopSearchResultsOpen(true);
          }
        });
        return storeMarker.addTo(map);
      });
    };
    // Wait for the gesture to settle; never query the backend when changing zoom/bearing.
    const scheduleMarkers = () => {
      window.clearTimeout(updateTimer);
      updateTimer = window.setTimeout(renderMarkers, 100);
    };
    map.on("zoomend moveend rotate resize", scheduleMarkers);
    renderMarkers();

    return () => {
      window.clearTimeout(updateTimer);
      map.off("zoomend moveend rotate resize", scheduleMarkers);
      clearMarkers();
    };
  }, [clearMarkers, filteredProducts, focusedMapItemKey, initialFocusProductId, mapReadyVersion, openMapItem, searchOrigin, savedUserLocation, mapSearchPoint, t]);

  React.useEffect(() => {
    if (!showResults || currentPolygon.length < 3) {
      return;
    }

    const found = productsWithLocation.filter((product) =>
      isPointInPolygon([product.latitude, product.longitude], currentPolygon),
    );
    setSelectedProducts(found);
  }, [currentPolygon, productsWithLocation, showResults]);

  React.useEffect(() => {
    if (filteredProducts.length !== 1 || !mapRef.current) {
      return;
    }

    mapRef.current.setView(
      [filteredProducts[0].latitude, filteredProducts[0].longitude],
      15,
    );
  }, [filteredProducts]);

  React.useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = mapRef.current;
    const timeoutA = window.setTimeout(() => {
      map.invalidateSize?.(true);
    }, 0);
    const timeoutB = window.setTimeout(() => {
      map.invalidateSize?.(true);
    }, 260);

    return () => {
      window.clearTimeout(timeoutA);
      window.clearTimeout(timeoutB);
    };
  }, [showResults]);

  React.useEffect(() => {
    if (hasProductsWithLocation) {
      return;
    }

    clearSelection();
    setIsDrawing(false);
  }, [clearSelection, hasProductsWithLocation]);

  React.useEffect(() => {
    if (!showResults) {
      return;
    }

    const ownerIdsToResolve = filteredPanelProducts.reduce<number[]>(
      (accumulator, product) => {
        const ownerId = Number(product.ownerId);
        if (!Number.isInteger(ownerId) || ownerId <= 0) {
          return accumulator;
        }
        if (product.city?.trim()) {
          return accumulator;
        }
        if (sellerLocationByOwnerId[ownerId]?.trim()) {
          return accumulator;
        }
        if (pendingSellerCityOwnerIdsRef.current.has(ownerId)) {
          return accumulator;
        }
        if (attemptedSellerCityOwnerIdsRef.current.has(ownerId)) {
          return accumulator;
        }
        if (accumulator.includes(ownerId)) {
          return accumulator;
        }
        accumulator.push(ownerId);
        return accumulator;
      },
      [],
    );

    if (ownerIdsToResolve.length === 0) {
      return;
    }

    let cancelled = false;

    ownerIdsToResolve.forEach((ownerId) => {
      pendingSellerCityOwnerIdsRef.current.add(ownerId);
      attemptedSellerCityOwnerIdsRef.current.add(ownerId);

      void api
        .getPublicUserById(ownerId)
        .then((user) => {
          if (cancelled) {
            return;
          }
          const locationParts = [
            String(user.city ?? "").trim(),
            String(user.neighborhood ?? "").trim(),
            String(user.state ?? "").trim(),
            String(user.country ?? "").trim(),
          ].filter((value) => Boolean(value));
          const normalizedLocation =
            locationParts.join(", ") || String(user.street ?? "").trim();
          if (!normalizedLocation) {
            return;
          }
          setSellerLocationByOwnerId((current) => {
            if (current[ownerId] === normalizedLocation) {
              return current;
            }
            return {
              ...current,
              [ownerId]: normalizedLocation,
            };
          });
        })
        .catch(() => {
          // no-op: fallback visual já cobre ausência da cidade
        })
        .finally(() => {
          pendingSellerCityOwnerIdsRef.current.delete(ownerId);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [filteredPanelProducts, sellerLocationByOwnerId, showResults]);

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[170] overflow-hidden bg-neutral-950"
    >
      <div className="relative w-full h-full font-sans text-neutral-100">
        <div
       className="absolute left-2 right-2 top-[max(8px,calc(env(safe-area-inset-top)+8px))] z-[3000] flex items-start gap-1.5 pointer-events-none sm:left-[96px] sm:right-auto sm:top-6 sm:w-[460px] sm:gap-2"  >
          <div className="relative z-30 flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950/94 p-2 shadow-2xl backdrop-blur-md pointer-events-auto sm:gap-2.5">
           <div className="hidden sm:flex shrink-0 items-center gap-3">
  <div className="w-10 h-10 bg-white text-neutral-950 rounded-full flex items-center justify-center">
    <Store size={19} />
  </div>
</div>

            <div className="h-8 w-px bg-neutral-800 hidden sm:block" />

            <div ref={topSearchContainerRef} className="relative min-w-0 grow">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                size={16}
              />
              <input
                ref={topSearchInputRef}
                type="text"
                placeholder={t(mapSearchPoint ? "Buscar neste ponto do mapa..." : "Buscar lojas, categorias ou cidade...")}
                value={searchQuery}
                onFocus={() => {
                  if (normalizeSearchText(searchQuery)) {
                    setIsTopSearchResultsOpen(true);
                  }
                }}
                onClick={() => {
                  if (normalizeSearchText(searchQuery)) {
                    setIsTopSearchResultsOpen(true);
                  }
                }}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setExpandedClusterKeys([]);
                  setSearchQuery(nextQuery);
                  setFocusedMapItemKey(null);
                  setIsTopSearchResultsOpen(normalizeSearchText(nextQuery).length > 0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsTopSearchResultsOpen(false);
                  }
                }}
                className="w-full pl-9 pr-9 py-2 bg-neutral-900 border border-neutral-800 rounded-lg sm:rounded-xl text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 transition-all" />
              {normalizedTopSearchQuery && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSearchQuery("");
                    setFocusedMapItemKey(null);
                    setIsTopSearchResultsOpen(false);
                    topSearchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
                  aria-label={t("Limpar busca")}
                  title={t("Limpar busca")}
                >
                  <X className="w-4 h-4 mx-auto" />
                </button>
              )}
              {shouldShowTopSearchResults && (
                <div className="absolute z-40 top-[calc(100%+8px)] left-0 right-0 bg-neutral-950/98 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl overflow-hidden sm:max-h-[min(520px,calc(100vh-120px))]">
                  <div className="px-3 py-2 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between gap-3">
                    <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-emerald-400">
                      {mapSearchPoint ? t("Até 5 km do ponto escolhido") : t("Lojas encontradas")}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {t("{count} resultado(s)", { count: expandedClusterKeys.length ? topSearchResults.length : filteredProducts.length })}
                    </span>
                  </div>

                  {topSearchResults.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-neutral-400">
                      {mapSearchLoading ? t("Buscando…") : mapSearchError ? t("Não foi possível carregar empresas próximas.") : t("Sem resultados para esta busca.")}
                    </p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto sm:max-h-[440px]">
         {topSearchResults.map((product) => {
  const distanceSummary =
    buildMapDistanceSummary(searchOrigin, product);

  const locationSummary =
    buildMapLocationSummary(product);

  const isFocused =
    focusedMapItemKey === getMapItemKey(product);
  const whatsappUrl = buildWhatsappUrl(
    product.establishmentWhatsappCountryIso || product.sellerWhatsappCountryIso,
    product.establishmentWhatsappNumber || product.sellerWhatsappNumber,
    product.name,
    { kind: "establishment" },
  );

  return (
    <div
      key={product.id}
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        focusMapItem(product);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        focusMapItem(product);
      }}
      className={`w-full border-b border-neutral-900 px-3 py-3 text-left last:border-b-0 transition-colors hover:bg-neutral-900 ${
        isFocused ? "bg-neutral-900" : ""
      }`}
      aria-label={t("Ver {name} no mapa", {
        name: product.name,
      })}
    >
      <div className="flex min-w-0 items-start gap-3">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-11 w-11 shrink-0 rounded-full border border-neutral-700 bg-neutral-800 object-cover sm:h-10 sm:w-10"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-sm font-bold text-neutral-300 sm:h-10 sm:w-10">
            {product.name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white sm:text-xs">
                {product.name}
              </p>

              <p className="mt-0.5 truncate text-[10px] text-neutral-400">
                {getCategoryLabel(product.category, locale)}
              </p>
            </div>

            {isFocused && (
              <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-emerald-300">
                {t("No mapa")}
              </span>
            )}
          </div>

          <div className="mt-2 space-y-1.5">
            <div className="flex min-w-0 items-center gap-1.5 text-neutral-300">
              <MapPin
                size={12}
                className="shrink-0 text-neutral-500"
              />

              <span className="min-w-0 truncate text-[10px] leading-tight">
                {locationSummary}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                {distanceSummary ||
                  t("Distância disponível após permitir localização")}
              </span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                focusMapItem(product);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-500/40 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-sky-300 transition-colors hover:bg-sky-500 hover:text-neutral-950"
              aria-label={t("Ver {name} no mapa", {
                name: product.name,
              })}
            >
              <MapPin className="h-3 w-3" />
              {isFocused ? t("No mapa") : t("Mapa")}
            </button>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  event.stopPropagation();
                  if (product.establishmentId) void api.trackDiscovery('whatsapp', product.establishmentId);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300 transition-colors hover:bg-emerald-500 hover:text-neutral-950"
                aria-label={t("WhatsApp")}
                title={t("WhatsApp")}
              >
                <MessageSquare className="h-3 w-3" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
})}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="relative z-20 bg-neutral-950/94 backdrop-blur-md border border-neutral-800 rounded-xl p-1 shadow-2xl flex items-center gap-1 pointer-events-auto">
            <button
              type="button"
              onClick={onClose}
              className="p-3 rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-white transition-all duration-200"
              title={t("Fechar mapa")}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {leafletError ? (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="w-full max-w-2xl bg-red-50 border border-red-100 rounded-xl p-8 text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">{t("Falha no mapa")}</h3>
              <p className="text-sm text-red-500">{leafletError}</p>
            </div>
          </div>
        ) : (
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, #1f2937 0%, #111827 42%, #050505 100%)",
              cursor: isDrawing ? "crosshair" : undefined,
              touchAction: "none",
            }}
          />
        )}

        {!leafletError && !hasProductsWithLocation && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-neutral-950 text-white px-6 py-3 rounded-full shadow-2xl text-sm border border-neutral-800">
            {t("Nenhuma atividade com localização disponível no momento.")}
          </div>
        )}


        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2600] flex items-start justify-center border-t border-neutral-900 bg-neutral-950/96 px-4 text-[8px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md"
          style={{
            height: "max(14px, calc(env(safe-area-inset-bottom) + 8px))",
          }}
        >
          TempleSale
        </div>

        <AnimatePresence>
          {false && showResults && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-full sm:w-105 bg-stone-50/98 backdrop-blur-xl border-l border-stone-200 z-[2500] shadow-2xl flex flex-col"
            >
              <div className="p-4 sm:p-6 border-b border-stone-100 bg-stone-100/90">
                <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-stone-800">
                      {t("Attività trovate")}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-stone-500">
                      {t("{count} attività nella zona selezionata", {
                        count: selectedProducts.length,
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResults(false)}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors text-stone-400 hover:text-stone-600"
                    title={t("Fechar resultados")}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder={t("Filtrar resultados...")}
                    value={panelSearchQuery}
                    onChange={(event) => setPanelSearchQuery(event.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-white/80 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-500 transition-all"
                  />
                  {panelSearchQuery.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPanelSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                      aria-label={t("Limpar busca")}
                      title={t("Limpar busca")}
                    >
                      <X className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {filteredPanelProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center text-stone-300">
                      <Search size={32} />
                    </div>
                    <div>
                      <p className="font-medium text-stone-600">
                        {t("Nenhuma atividade encontrada")}
                      </p>
                      <p className="text-sm text-stone-400">
                        {t("Tente mudar o filtro ou desenhar outra área.")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-4 sm:gap-6">
                    {filteredPanelProducts.map((product) => (
                      <motion.button
                        key={product.id}
                        type="button"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group text-left bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${
                          onOpenProduct || onOpenEstablishment ? "cursor-pointer" : ""
                        }`}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!onOpenProduct && !onOpenEstablishment) {
                            return;
                          }
                          openMapItem(product);
                        }}
                        onKeyDown={(event) => {
                          if (!onOpenProduct && !onOpenEstablishment) {
                            return;
                          }
                          if (event.key !== "Enter" && event.key !== " ") {
                            return;
                          }
                          event.preventDefault();
                          openMapItem(product);
                        }}
                        aria-label={
                          onOpenProduct || onOpenEstablishment
                            ? t("Abrir atividade {name}", { name: product.name })
                            : undefined
                        }
                      >
                        <div className="aspect-4/3 relative overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                            <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-stone-900/90 backdrop-blur-sm text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md border border-stone-700/20 text-stone-100">
                              {getCategoryLabel(product.category, locale)}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 sm:p-4">
                          <h3 className="font-medium text-stone-900 text-xs sm:text-base truncate">
                            {product.name}
                          </h3>
                          <div className="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                              {product.category}
                            </span>
                            <span className="text-[10px] sm:text-xs font-semibold text-stone-400 text-left sm:text-right truncate">
                              {product.city?.trim() ||
                                (Number.isInteger(product.ownerId)
                                  ? sellerLocationByOwnerId[Number(product.ownerId)]?.trim()
                                  : "") ||
                                `${product.latitude.toFixed(5)}, ${product.longitude.toFixed(5)}` ||
                                t("Localização indisponível")}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-stone-50/50 border-t border-stone-100">
                <button
                  type="button"
                  onClick={clearSelection}
                  className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium shadow-lg shadow-stone-900/20 hover:bg-black transition-all active:scale-[0.98]"
                >
                  {t("Nova pesquisa")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
