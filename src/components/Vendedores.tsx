import React from "react";
import { motion } from "motion/react";
import { X, Search, Store, LoaderCircle, Package } from "lucide-react";
import ProductCard, { type Product } from "./ProductCard";
import { api, type VendorDto } from "../lib/api";
import { useI18n } from "../i18n/provider";

interface VendedoresProps {
  onClose: () => void;
  onOpenProduct: (product: Product) => void;
}

function getVendorInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "V";
  }

  const [first, second] = words;
  return `${first.charAt(0)}${second ? second.charAt(0) : ""}`.toUpperCase();
}

export default function Vendedores({ onClose, onOpenProduct }: VendedoresProps) {
  const { t } = useI18n();
  const [query, setQuery] = React.useState("");
  const [vendors, setVendors] = React.useState<VendorDto[]>([]);
  const [selectedVendor, setSelectedVendor] = React.useState<VendorDto | null>(null);
  const [isLoadingVendors, setIsLoadingVendors] = React.useState(true);
  const [isLoadingVendorProducts, setIsLoadingVendorProducts] = React.useState(false);
  const [vendorsError, setVendorsError] = React.useState("");
  const [vendorProductsError, setVendorProductsError] = React.useState("");
  const [vendorProducts, setVendorProducts] = React.useState<Product[]>([]);
  const [failedAvatarVendorIds, setFailedAvatarVendorIds] = React.useState<number[]>([]);

  const productsCacheRef = React.useRef<Record<number, Product[]>>({});
  const vendorQueryRequestIdRef = React.useRef(0);
  const vendorProductsRequestIdRef = React.useRef(0);

  React.useEffect(() => {
    const requestId = vendorQueryRequestIdRef.current + 1;
    vendorQueryRequestIdRef.current = requestId;
    const timer = setTimeout(() => {
      void (async () => {
        setIsLoadingVendors(true);
        setVendorsError("");
        try {
          const list = await api.getVendors(query, 80);
          if (vendorQueryRequestIdRef.current !== requestId) {
            return;
          }

          setVendors(list);
          setSelectedVendor((current) => {
            if (current && list.some((vendor) => vendor.id === current.id)) {
              return current;
            }
            return list[0] ?? null;
          });
        } catch (error) {
          if (vendorQueryRequestIdRef.current !== requestId) {
            return;
          }
          const message = error instanceof Error ? error.message : t("Falha ao listar vendedores.");
          setVendorsError(message);
          setVendors([]);
          setSelectedVendor(null);
        } finally {
          if (vendorQueryRequestIdRef.current === requestId) {
            setIsLoadingVendors(false);
          }
        }
      })();
    }, 220);

    return () => {
      clearTimeout(timer);
    };
  }, [query, t]);

  React.useEffect(() => {
    const vendorId = selectedVendor?.id;
    if (!vendorId) {
      setVendorProducts([]);
      setVendorProductsError("");
      setIsLoadingVendorProducts(false);
      return;
    }

    const cachedProducts = productsCacheRef.current[vendorId];
    if (cachedProducts) {
      setVendorProducts(cachedProducts);
      setVendorProductsError("");
      setIsLoadingVendorProducts(false);
      return;
    }

    const requestId = vendorProductsRequestIdRef.current + 1;
    vendorProductsRequestIdRef.current = requestId;

    void (async () => {
      setIsLoadingVendorProducts(true);
      setVendorProductsError("");
      try {
        const payload = await api.getVendorProducts(vendorId);
        if (vendorProductsRequestIdRef.current !== requestId) {
          return;
        }
        productsCacheRef.current[vendorId] = payload.products;
        setVendorProducts(payload.products);
        setSelectedVendor((current) => {
          if (!current || current.id !== payload.vendor.id) {
            return current;
          }
          return payload.vendor;
        });
      } catch (error) {
        if (vendorProductsRequestIdRef.current !== requestId) {
          return;
        }
        const message =
          error instanceof Error ? error.message : t("Falha ao carregar vendedor.");
        setVendorProductsError(message);
        setVendorProducts([]);
      } finally {
        if (vendorProductsRequestIdRef.current === requestId) {
          setIsLoadingVendorProducts(false);
        }
      }
    })();
  }, [selectedVendor?.id, t]);

  const markVendorAvatarAsFailed = (vendorId: number) => {
    setFailedAvatarVendorIds((current) => {
      if (current.includes(vendorId)) {
        return current;
      }
      return [...current, vendorId];
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-150 bg-[#fdfcfb] flex flex-col"
    >
      <div className="p-6 sm:p-8 flex items-center justify-between border-b border-stone-100">
        <div className="flex items-center gap-4">
          <Store className="w-6 h-6 text-stone-800" />
          <h2 className="text-2xl font-serif tracking-widest uppercase">{t("Vendedores")}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-stone-50 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-stone-600" />
        </button>
      </div>

      <div className="grow min-h-0 grid grid-cols-1 lg:grid-cols-[340px_1fr]">
        <aside className="border-b lg:border-b-0 lg:border-r border-stone-100 p-5 sm:p-6 flex flex-col min-h-0">
          <div className="flex items-center gap-3 border border-stone-200 bg-white px-4 py-3 rounded-sm">
            <Search className="w-4 h-4 text-stone-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("Buscar vendedores...")}
              className="grow bg-transparent outline-none text-sm text-stone-700 placeholder:text-stone-400"
            />
          </div>

          <div className="mt-4 grow overflow-y-auto overscroll-contain pr-1">
            {isLoadingVendors ? (
              <div className="py-10 flex items-center justify-center text-stone-400">
                <LoaderCircle className="w-5 h-5 animate-spin" />
              </div>
            ) : vendorsError ? (
              <p className="text-sm text-red-500">{vendorsError}</p>
            ) : vendors.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs uppercase tracking-[0.2em]">
                {t("Nenhum vendedor encontrado.")}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {vendors.map((vendor) => {
                  const isSelected = selectedVendor?.id === vendor.id;
                  const hasValidAvatar =
                    Boolean(vendor.avatarUrl) && !failedAvatarVendorIds.includes(vendor.id);

                  return (
                    <button
                      key={vendor.id}
                      onClick={() => setSelectedVendor(vendor)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-sm border transition-colors text-left ${
                        isSelected
                          ? "border-stone-300 bg-stone-100"
                          : "border-transparent hover:border-stone-200 hover:bg-white"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 shrink-0 flex items-center justify-center">
                        {hasValidAvatar ? (
                          <img
                            src={vendor.avatarUrl}
                            alt={vendor.name}
                            className="w-full h-full object-cover"
                            onError={() => markVendorAvatarAsFailed(vendor.id)}
                          />
                        ) : (
                          <span className="text-[11px] font-semibold tracking-[0.2em] text-stone-600">
                            {getVendorInitials(vendor.name)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif italic text-stone-800 truncate text-base">{vendor.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
                          {t("{count} anúncio(s)", { count: String(vendor.productCount) })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="p-5 sm:p-8 overflow-y-auto overscroll-contain">
          {!selectedVendor ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-stone-400 gap-4">
              <Store className="w-10 h-10 text-stone-200" />
              <p className="text-xs uppercase tracking-[0.2em] text-center">
                {t("Selecione um vendedor para ver os produtos.")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-stone-500" />
                <h3 className="text-sm uppercase tracking-[0.2em] text-stone-500">
                  {t("Produtos de {vendor}", { vendor: selectedVendor.name })}
                </h3>
              </div>

              {isLoadingVendorProducts ? (
                <div className="py-16 flex items-center justify-center text-stone-400">
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                </div>
              ) : vendorProductsError ? (
                <p className="text-sm text-red-500">{vendorProductsError}</p>
              ) : vendorProducts.length === 0 ? (
                <div className="py-16 text-center text-xs uppercase tracking-[0.2em] text-stone-400">
                  {t("Este vendedor ainda não publicou produtos.")}
                </div>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-10">
                  {vendorProducts.map((product) => (
                    <div key={product.id}>
                      <ProductCard
                        product={product}
                        onClick={() => onOpenProduct(product)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
