import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Pencil, Trash2, Package, X, Maximize2, Minimize2 } from "lucide-react";
import { type Product } from "./ProductCard";
import { useI18n } from "../i18n/provider";
import { formatEuroFromUnknown } from "../lib/currency";
import { getCategoryLabel } from "../i18n/categories";

interface ProductMapProps {
  products: Product[];
  onClose: () => void;
  initialFocusProductId?: number;
  onOpenProduct?: (product: Product) => void;
  initialCategory?: string;
  openResultsByDefault?: boolean;
  autoFocusPanelSearch?: boolean;
}

type LocatedProduct = Product & {
  latitude: number;
  longitude: number;
};

type GeoPoint = [number, number];

type ProductSearchIndex = {
  searchableText: string;
  city: string;
};

type SmartSearchQuery = {
  normalizedQuery: string;
  city: string | null;
  terms: string[];
};

const SEARCH_CONNECTOR_TOKENS = new Set([
  "a",
  "ad",
  "ao",
  "au",
  "da",
  "de",
  "del",
  "della",
  "dello",
  "do",
  "e",
  "em",
  "en",
  "in",
  "la",
  "na",
  "nel",
  "nella",
  "nello",
  "no",
  "nos",
  "per",
  "perto",
  "sur",
  "vicino",
  "near",
]);

function normalizeSearchValue(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isWholePhraseMatch(haystack: string, phrase: string): boolean {
  if (!haystack || !phrase) {
    return false;
  }
  return (
    haystack === phrase ||
    haystack.startsWith(`${phrase} `) ||
    haystack.endsWith(` ${phrase}`) ||
    haystack.includes(` ${phrase} `)
  );
}

function parseSmartSearchQuery(rawQuery: string, knownCities: string[]): SmartSearchQuery {
  const normalizedQuery = normalizeSearchValue(rawQuery);
  if (!normalizedQuery) {
    return {
      normalizedQuery: "",
      city: null,
      terms: [],
    };
  }

  const matchedCity =
    knownCities.find((city) => isWholePhraseMatch(normalizedQuery, city)) ?? null;

  const cityTokens = new Set(
    matchedCity
      ? matchedCity
          .split(" ")
          .map((token) => token.trim())
          .filter((token) => token.length > 0)
      : [],
  );
  const tokens = normalizedQuery
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  const terms = tokens.filter(
    (token) => !SEARCH_CONNECTOR_TOKENS.has(token) && !cityTokens.has(token),
  );

  return {
    normalizedQuery,
    city: matchedCity,
    terms: terms.length > 0 || matchedCity ? terms : tokens,
  };
}

function buildProductSearchIndex(product: Product): ProductSearchIndex {
  const categoryLabelPt = getCategoryLabel(product.category, "pt-BR");
  const categoryLabelIt = getCategoryLabel(product.category, "it-IT");
  const detailValues = Object.values(product.details ?? {})
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ");

  return {
    searchableText: normalizeSearchValue(
      [
        product.name,
        product.category,
        categoryLabelPt,
        categoryLabelIt,
        product.city ?? "",
        product.description ?? "",
        detailValues,
      ].join(" "),
    ),
    city: normalizeSearchValue(product.city ?? ""),
  };
}

function matchesSmartSearchQuery(
  query: SmartSearchQuery,
  index: ProductSearchIndex | undefined,
): boolean {
  if (!index) {
    return false;
  }

  if (!query.normalizedQuery) {
    return true;
  }

  if (query.city && !isWholePhraseMatch(index.city, query.city)) {
    return false;
  }

  if (query.terms.length === 0) {
    return true;
  }

  return query.terms.every((term) => index.searchableText.includes(term));
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
  setView: (coords: [number, number], zoom?: number, options?: unknown) => void;
  on: (eventName: string, handler: (event: LeafletPointerEvent) => void) => void;
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
  remove: () => void;
};

type LeafletCircleMarkerInstance = {
  addTo: (map: LeafletMapInstance) => LeafletCircleMarkerInstance;
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
  map: (container: HTMLElement, options?: unknown) => LeafletMapInstance;
  tileLayer: (url: string, options?: unknown) => LeafletTileLayerInstance;
  marker: (coords: [number, number], options?: unknown) => LeafletMarkerInstance;
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
const DEFAULT_MAP_CENTER: LeafletLatLng = {
  lat: -23.55052,
  lng: -46.633308,
};
const PRIMARY_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SECONDARY_TILE_URL = "/api/map-tiles/{z}/{x}/{y}.png";
const TERTIARY_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
const QUATERNARY_TILE_URL = "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const MIN_DRAW_POINT_DELTA = 0.00003;
const DRAW_STATE_SYNC_INTERVAL_MS = 80;
const TILE_FALLBACK_TIMEOUT_MS = 20000;
const TILE_ERROR_THRESHOLD = 8;

let leafletAssetsPromise: Promise<LeafletGlobal> | null = null;

function getLeafletFromWindow(): LeafletGlobal | undefined {
  return (window as unknown as { L?: LeafletGlobal }).L;
}

function ensureLeafletAssets(): Promise<LeafletGlobal> {
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

function setMapInteractionForDrawing(map: LeafletMapInstance, isDrawing: boolean) {
  if (isDrawing) {
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
  map.touchZoom?.enable();
  map.doubleClickZoom?.enable();
  map.scrollWheelZoom?.enable();
  map.boxZoom?.enable();
  map.keyboard?.enable();
  map.tap?.enable();
}

export default function ProductMap({
  products,
  onClose,
  initialFocusProductId,
  onOpenProduct,
  initialCategory = "All",
  openResultsByDefault = false,
  autoFocusPanelSearch = false,
}: ProductMapProps) {
  const { t, locale } = useI18n();
  const productsWithLocation = React.useMemo(
    () =>
      products
        .map(toLocatedProduct)
        .filter((product): product is LocatedProduct => product !== null),
    [products],
  );
  const hasProductsWithLocation = productsWithLocation.length > 0;
  const searchableIndexByProductId = React.useMemo(() => {
    const index = new globalThis.Map<number, ProductSearchIndex>();
    productsWithLocation.forEach((product) => {
      index.set(product.id, buildProductSearchIndex(product));
    });
    return index;
  }, [productsWithLocation]);
  const knownNormalizedCities = React.useMemo(() => {
    const cities = new Set<string>();
    productsWithLocation.forEach((product) => {
      const normalizedCity = normalizeSearchValue(product.city ?? "");
      if (normalizedCity) {
        cities.add(normalizedCity);
      }
    });

    return Array.from(cities).sort((left, right) => {
      const tokenCountDifference = right.split(" ").length - left.split(" ").length;
      if (tokenCountDifference !== 0) {
        return tokenCountDifference;
      }
      return right.length - left.length;
    });
  }, [productsWithLocation]);

  const [leafletError, setLeafletError] = React.useState("");
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [currentPolygon, setCurrentPolygon] = React.useState<GeoPoint[]>([]);
  const [selectedProducts, setSelectedProducts] = React.useState<LocatedProduct[]>([]);
  const [showResults, setShowResults] = React.useState(openResultsByDefault);
  const [isSearchResultsMode, setIsSearchResultsMode] = React.useState(openResultsByDefault);
  const [isResultsExpanded, setIsResultsExpanded] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState(initialCategory);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [panelSearchQuery, setPanelSearchQuery] = React.useState("");
  const [mapReadyVersion, setMapReadyVersion] = React.useState(0);

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
  const panelSearchInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    isDrawingRef.current = isDrawing;
    if (mapRef.current) {
      setMapInteractionForDrawing(mapRef.current, isDrawing);
    }
  }, [isDrawing]);

  React.useEffect(() => {
    productsWithLocationRef.current = productsWithLocation;
  }, [productsWithLocation]);

  const availableCategoryFilters = React.useMemo(() => {
    const categoryCounts = new globalThis.Map<string, number>();
    productsWithLocation.forEach((product) => {
      const category = String(product.category ?? "").trim();
      if (!category) {
        return;
      }
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    });

    const categories = Array.from(categoryCounts.entries())
      .sort(([left], [right]) => left.localeCompare(right, locale))
      .map(([key, count]) => ({ key, count }));

    return [
      { key: "All", count: productsWithLocation.length },
      ...categories,
    ];
  }, [productsWithLocation, locale]);

  React.useEffect(() => {
    const hasActiveCategory = availableCategoryFilters.some(
      (category) => category.key === activeCategory,
    );
    if (!hasActiveCategory) {
      setActiveCategory("All");
    }
  }, [availableCategoryFilters, activeCategory]);

  const categoryFilteredProducts = React.useMemo(() => {
    if (activeCategory === "All") {
      return productsWithLocation;
    }
    return productsWithLocation.filter((product) => product.category === activeCategory);
  }, [productsWithLocation, activeCategory]);
  const mapSearchQuery = React.useMemo(
    () => parseSmartSearchQuery(searchQuery, knownNormalizedCities),
    [searchQuery, knownNormalizedCities],
  );
  const panelSearchFilterQuery = React.useMemo(
    () => parseSmartSearchQuery(panelSearchQuery, knownNormalizedCities),
    [panelSearchQuery, knownNormalizedCities],
  );

  const filteredProducts = React.useMemo(() => {
    return categoryFilteredProducts.filter((product) =>
      matchesSmartSearchQuery(
        mapSearchQuery,
        searchableIndexByProductId.get(product.id),
      ),
    );
  }, [categoryFilteredProducts, mapSearchQuery, searchableIndexByProductId]);

  const filteredPanelProducts = React.useMemo(() => {
    if (!panelSearchFilterQuery.normalizedQuery) {
      return selectedProducts;
    }

    return selectedProducts.filter((product) =>
      matchesSmartSearchQuery(
        panelSearchFilterQuery,
        searchableIndexByProductId.get(product.id),
      ),
    );
  }, [panelSearchFilterQuery, searchableIndexByProductId, selectedProducts]);

  React.useEffect(() => {
    if (!openResultsByDefault) {
      return;
    }
    setShowResults(true);
    setIsSearchResultsMode(true);
  }, [openResultsByDefault]);

  React.useEffect(() => {
    if (!showResults || !isSearchResultsMode) {
      return;
    }
    setSelectedProducts(categoryFilteredProducts);
  }, [showResults, isSearchResultsMode, categoryFilteredProducts]);

  React.useEffect(() => {
    if (!showResults || !autoFocusPanelSearch) {
      return;
    }
    const focusTimer = window.setTimeout(() => {
      panelSearchInputRef.current?.focus();
    }, 120);
    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [showResults, autoFocusPanelSearch]);

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
  }, [clearDrawingPolygon, clearSelectionPolygon]);

  const handleStartDrawingMode = () => {
    if (!hasProductsWithLocation) {
      return;
    }
    isPointerDownRef.current = false;
    drawPointsRef.current = [];
    clearDrawingPolygon();
    setIsSearchResultsMode(false);
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
        if (cancelled || !mapContainerRef.current) {
          return;
        }

        leafletRef.current = L;

        const firstProduct = productsWithLocationRef.current[0];
        const focusedProduct = initialFocusProductId
          ? productsWithLocationRef.current.find(
              (product) => product.id === initialFocusProductId,
            )
          : null;
        const mapCenter: [number, number] = focusedProduct
          ? [focusedProduct.latitude, focusedProduct.longitude]
          : firstProduct
            ? [firstProduct.latitude, firstProduct.longitude]
          : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng];

        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: true,
        });
        map.setView(mapCenter, focusedProduct ? 15 : firstProduct ? 13 : 12);
        setMapInteractionForDrawing(map, isDrawingRef.current);

        const tileProviders = [PRIMARY_TILE_URL];

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
          setIsSearchResultsMode(false);
          setIsDrawing(false);
        };

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

    clearMarkers();

    const map = mapRef.current;
    const L = leafletRef.current;

    markersRef.current = filteredProducts.map((product) => {
      const marker = L.circleMarker([product.latitude, product.longitude], {
        radius: 7,
        color: "#5d4037",
        weight: 2,
        fillColor: "#fbc02d",
        fillOpacity: 0.85,
      });
      marker.addTo(map);
      return marker;
    });
  }, [clearMarkers, filteredProducts, mapReadyVersion]);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-170 bg-[#fdfcfb] overflow-hidden"
    >
      <div className="relative w-full h-full font-sans text-stone-900">
        <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col sm:flex-row items-start sm:items-center gap-4 pointer-events-none">
          <div className="bg-stone-50/95 backdrop-blur-md border border-stone-200 rounded-2xl p-4 shadow-xl pointer-events-auto flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center text-stone-100">
                <Package size={20} />
              </div>
              <div className="hidden md:block">
                <h1 className="text-sm font-semibold tracking-tight text-stone-800">
                  {t("Mapa de produtos")}
                </h1>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-medium">
                  {t("Descoberta")}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-stone-200 hidden sm:block" />

            <div className="relative grow sm:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                size={16}
              />
              <input
                type="text"
                placeholder={t("Buscar produtos, categorias ou cidade (ex.: casa em Ardea)...")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-500 transition-all"
              />
            </div>
          </div>

          <div className="bg-stone-50/95 backdrop-blur-md border border-stone-200 rounded-2xl p-1 shadow-xl flex items-center gap-1 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                if (isDrawing) {
                  handleStopDrawingMode();
                  return;
                }
                handleStartDrawingMode();
              }}
              className={`p-3 rounded-xl transition-all duration-200 ${
                isDrawing
                  ? "bg-stone-900 text-white shadow-lg"
                  : "text-stone-500 hover:bg-stone-100"
              }`}
              title={t("Desenhar área")}
              disabled={!hasProductsWithLocation}
            >
              <Pencil size={18} />
            </button>
            <div className="w-px h-6 bg-stone-200 mx-1" />
            <button
              type="button"
              onClick={() => {
                if (showResults) {
                  setShowResults(false);
                  return;
                }
                setIsSearchResultsMode(true);
                setShowResults(true);
              }}
              className={`p-3 rounded-xl transition-all duration-200 ${
                showResults
                  ? "bg-stone-900 text-white shadow-lg"
                  : "text-stone-500 hover:bg-stone-100"
              }`}
              title={t("Produtos encontrados")}
            >
              <Package size={18} />
            </button>
            <div className="w-px h-6 bg-stone-200 mx-1" />
            <button
              type="button"
              onClick={clearSelection}
              className="p-3 rounded-xl text-stone-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
              title={t("Limpar seleção")}
            >
              <Trash2 size={18} />
            </button>
            <div className="w-px h-6 bg-stone-200 mx-1" />
            <button
              type="button"
              onClick={onClose}
              className="p-3 rounded-xl text-stone-500 hover:bg-stone-100 transition-all duration-200"
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
                "radial-gradient(circle at 20% 20%, #f7f2e8 0%, #ece7db 45%, #e7e1d4 100%)",
              cursor: isDrawing ? "crosshair" : undefined,
              touchAction: "none",
            }}
          />
        )}

        {!leafletError && !hasProductsWithLocation && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm">
            {t("Nenhum produto com localização disponível no momento.")}
          </div>
        )}

        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`absolute top-0 right-0 h-full ${
                isResultsExpanded ? "w-full" : "w-full sm:w-[420px]"
              } bg-stone-50/98 backdrop-blur-xl border-l border-stone-200 z-[2000] shadow-2xl flex flex-col`}
            >
              <div className="p-6 border-b border-stone-100 bg-stone-100/80">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-800">
                      {t("Produtos encontrados")}
                    </h2>
                    <p className="text-xs text-stone-500">
                      {isSearchResultsMode
                        ? t("{count} itens encontrados", {
                            count: selectedProducts.length,
                          })
                        : t("{count} itens na área selecionada", {
                            count: selectedProducts.length,
                          })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsResultsExpanded((current) => !current)}
                      className="hidden sm:inline-flex p-2 hover:bg-white/50 rounded-full transition-colors text-stone-400 hover:text-stone-600"
                      title={isResultsExpanded ? t("Reduzir painel") : t("Expandir painel")}
                    >
                      {isResultsExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResults(false)}
                      className="p-2 hover:bg-white/50 rounded-full transition-colors text-stone-400 hover:text-stone-600"
                      title={t("Fechar resultados")}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                    size={14}
                  />
                  <input
                    ref={panelSearchInputRef}
                    type="text"
                    placeholder={t("Filtrar resultados por produto, categoria ou cidade...")}
                    value={panelSearchQuery}
                    onChange={(event) => setPanelSearchQuery(event.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/80 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-500 transition-all"
                  />
                </div>

                <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {availableCategoryFilters.map((category) => (
                    <button
                      key={`map-results-category-${category.key}`}
                      onClick={() => {
                        setActiveCategory(category.key);
                        setIsSearchResultsMode(true);
                        setShowResults(true);
                      }}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-full text-[9px] uppercase tracking-[0.16em] transition-colors ${
                        activeCategory === category.key
                          ? "border-stone-900 bg-stone-900 text-white"
                          : "border-stone-200 text-stone-600 hover:border-stone-400"
                      }`}
                    >
                      <span>
                        {category.key === "All" ? t("Todos") : getCategoryLabel(category.key, locale)}
                      </span>
                      <span className={activeCategory === category.key ? "text-white/80" : "text-stone-400"}>
                        {category.count}
                      </span>
                    </button>
                  ))}
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
                        {t("Nenhum produto encontrado")}
                      </p>
                      <p className="text-sm text-stone-400">
                        {t("Tente mudar o filtro ou desenhar outra área.")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`grid gap-4 sm:gap-6 ${
                      isResultsExpanded ? "grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" : "grid-cols-2 sm:grid-cols-1"
                    }`}
                  >
                    {filteredPanelProducts.map((product) => (
                      <motion.button
                        key={product.id}
                        type="button"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group text-left bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${
                          onOpenProduct ? "cursor-pointer" : ""
                        }`}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!onOpenProduct) {
                            return;
                          }
                          onOpenProduct(product);
                        }}
                        onKeyDown={(event) => {
                          if (!onOpenProduct) {
                            return;
                          }
                          if (event.key !== "Enter" && event.key !== " ") {
                            return;
                          }
                          event.preventDefault();
                          onOpenProduct(product);
                        }}
                        aria-label={
                          onOpenProduct
                            ? t("Abrir detalhes de {name}", { name: product.name })
                            : undefined
                        }
                      >
                        <div className="aspect-[4/3] relative overflow-hidden">
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
                            <span className="text-sm sm:text-lg font-semibold text-stone-700">
                              {formatEuroFromUnknown(product.price, locale)}
                            </span>
                            <span className="text-[10px] sm:text-xs font-semibold text-stone-400 text-left sm:text-right">
                              {product.city?.trim() || t("Cidade não informada")}
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
                  onClick={() => {
                    if (isSearchResultsMode) {
                      setPanelSearchQuery("");
                      setSearchQuery("");
                      setActiveCategory("All");
                      return;
                    }
                    clearSelection();
                  }}
                  className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium shadow-lg shadow-stone-900/20 hover:bg-black transition-all active:scale-[0.98]"
                >
                  {isSearchResultsMode ? t("Limpar busca") : t("Nova pesquisa")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isDrawing && !currentPolygon.length && !leafletError && hasProductsWithLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-stone-900 text-stone-100 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-stone-700/40"
          >
            <Pencil size={16} className="animate-pulse" />
            <span className="text-sm font-medium">
              {t("Clique e arraste para desenhar no mapa")}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
