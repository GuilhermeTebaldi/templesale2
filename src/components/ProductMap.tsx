import React from "react";
import { motion } from "motion/react";
import { X, MapPin, Navigation } from "lucide-react";
import { type Product } from "./ProductCard";

interface ProductMapProps {
  products: Product[];
  onClose: () => void;
}

type LocatedProduct = Product & {
  latitude: number;
  longitude: number;
};

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

function toLocatedProduct(product: Product): LocatedProduct | null {
  const latitude = parseCoordinate(product.latitude);
  const longitude = parseCoordinate(product.longitude);

  if (latitude === null || longitude === null) {
    return null;
  }

  return {
    ...product,
    latitude,
    longitude,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function buildMapUrl(latitude: number, longitude: number): string {
  const lat = clamp(latitude, -90, 90);
  const lng = clamp(longitude, -180, 180);
  const delta = 0.03;
  const left = clamp(lng - delta, -180, 180);
  const right = clamp(lng + delta, -180, 180);
  const bottom = clamp(lat - delta, -90, 90);
  const top = clamp(lat + delta, -90, 90);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
}

function buildOpenStreetMapLink(latitude: number, longitude: number): string {
  const lat = clamp(latitude, -90, 90);
  const lng = clamp(longitude, -180, 180);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
}

export default function ProductMap({ products, onClose }: ProductMapProps) {
  const productsWithLocation = React.useMemo(
    () =>
      products
        .map(toLocatedProduct)
        .filter((product): product is LocatedProduct => product !== null),
    [products],
  );
  const [selectedProductId, setSelectedProductId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (productsWithLocation.length === 0) {
      setSelectedProductId(null);
      return;
    }

    const stillExists = productsWithLocation.some(
      (product) => product.id === selectedProductId,
    );
    if (!stillExists) {
      setSelectedProductId(productsWithLocation[0].id);
    }
  }, [productsWithLocation, selectedProductId]);

  const selectedProduct =
    productsWithLocation.find((product) => product.id === selectedProductId) || null;
  const mapUrl = selectedProduct
    ? buildMapUrl(selectedProduct.latitude, selectedProduct.longitude)
    : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-170 bg-[#fdfcfb] flex flex-col"
    >
      <div className="p-4 sm:p-8 flex items-center justify-between border-b border-stone-100">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-stone-700" />
          <h2 className="text-sm sm:text-xl font-serif tracking-widest uppercase">Mapa de Produtos</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
          <X className="w-6 h-6 text-stone-600" />
        </button>
      </div>

      <div className="grow min-h-0 overflow-hidden grid grid-cols-1 grid-rows-[minmax(320px,45vh)_1fr] lg:grid-cols-[360px_1fr] lg:grid-rows-1">
        <section className="order-1 lg:order-2 p-4 sm:p-6 lg:p-8 min-h-0">
          {selectedProduct ? (
            <div className="h-full min-h-[280px] flex flex-col">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
                    Localização selecionada
                  </p>
                  <h3 className="text-xl font-serif italic text-stone-800">
                    {selectedProduct.name}
                  </h3>
                </div>
                <a
                  href={buildOpenStreetMapLink(selectedProduct.latitude, selectedProduct.longitude)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 hover:text-black"
                >
                  Abrir no mapa
                </a>
              </div>

              <div className="grow min-h-[220px] border border-stone-100 overflow-hidden rounded-sm">
                <iframe
                  title={`Mapa de ${selectedProduct.name}`}
                  src={mapUrl}
                  className="w-full h-full"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[220px] border border-dashed border-stone-200 rounded-sm flex items-center justify-center">
              <p className="text-sm text-stone-500">
                Selecione um produto com localização para visualizar no mapa.
              </p>
            </div>
          )}
        </section>

        <aside className="order-2 lg:order-1 border-t border-stone-100 lg:border-t-0 lg:border-r overflow-y-auto min-h-0 p-4 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-4">
            Produtos com localização
          </p>

          {productsWithLocation.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-stone-200 rounded-sm">
              <Navigation className="w-6 h-6 text-stone-300 mx-auto mb-3" />
              <p className="text-xs text-stone-500">
                Nenhum produto com latitude/longitude cadastrado ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {productsWithLocation.map((product) => {
                const isSelected = product.id === selectedProductId;
                return (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    className={`w-full text-left p-3 rounded-sm border transition-colors ${
                      isSelected
                        ? "border-stone-800 bg-stone-50"
                        : "border-stone-100 hover:border-stone-300"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      {product.category}
                    </p>
                    <p className="font-serif italic text-stone-800">{product.name}</p>
                    <p className="text-[11px] font-mono text-stone-500 mt-1">
                      {product.latitude.toFixed(6)}, {product.longitude.toFixed(6)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      </div>
    </motion.div>
  );
}
