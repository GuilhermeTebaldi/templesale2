import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ShoppingBag, Menu, ArrowRight, Instagram, Twitter, Facebook, X, User, Package, CreditCard, Settings, LogOut, ChevronRight, Heart, Plus, Minus, Share2, Bell, Filter, Globe, MapPin, RotateCcw, Map, Store, Languages, FileText, Shield, HelpCircle, ChevronDown, ImagePlus, LoaderCircle } from "lucide-react";
import ProductCard, { type Product } from "./components/ProductCard";
import ProductDetails from "./components/ProductDetails";
import NewProduct from "./components/NewProduct";
import Auth, { type AuthMode, type AuthSubmitPayload } from "./components/Auth";
import MeusAnuncios from "./components/MeusAnuncios";
import EditePerfil from "./components/EditePerfil";
import ProductMap from "./components/ProductMap";
import Curtidas from "./components/Curtidas";
import Carrinho, { type CartItem } from "./components/Carrinho";
import Vendedores from "./components/Vendedores";
import { api, type NotificationDto, type SessionUser, type UpdateProfileInput } from "./lib/api";
import { useI18n } from "./i18n/provider";
import { localeOptions, type AppLocale } from "./i18n";
import { formatCollectionDate, formatRelativeTime } from "./i18n/formatters";
import { getCategoryLabel } from "./i18n/categories";

const CATEGORIES = [
  "All",
  "Imóveis",
  "Terreno",
  "Aluguel",
  "Veículos",
  "Eletrônicos e Celulares",
  "Informática e Games",
  "Casa, Móveis e Decoração",
  "Eletrodomésticos",
  "Moda e Acessórios",
  "Beleza e Saúde",
  "Bebês e Crianças",
  "Esportes e Lazer",
  "Hobbies e Colecionáveis",
  "Antiguidades",
  "Livros, Papelaria e Cursos",
  "Instrumentos Musicais",
  "Ferramentas e Construção",
  "Jardim e Pet",
  "Serviços",
  "Empregos",
  "Outros"
];
const BRAND_NAME = "TempleSale";
const AUTH_TOKEN_STORAGE_KEY = "templesale_auth_token";
const CART_STORAGE_KEY = "templesale_cart_items";
const CART_UNSEEN_STORAGE_KEY = "templesale_cart_unseen_alert";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toSafeCartQuantity(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : 0;
}

function getProductStockQuantity(product: Product): number {
  const parsed = Number(product.quantity);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  const normalized = Math.floor(parsed);
  return normalized >= 0 ? normalized : 0;
}

function readCartStorage(): Record<number, number> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const normalizedEntries = Object.entries(parsed)
      .map(([rawProductId, rawQuantity]) => [Number(rawProductId), toSafeCartQuantity(rawQuantity)] as const)
      .filter(([productId, quantity]) => Number.isInteger(productId) && productId > 0 && quantity > 0)
      .map(([productId, quantity]) => [productId, quantity] as const);

    return Object.fromEntries(normalizedEntries);
  } catch {
    return {};
  }
}

function readCartUnseenAlertStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(CART_UNSEEN_STORAGE_KEY) === "1";
}

export default function App() {
  const { locale, setLocale, t } = useI18n();
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = React.useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = React.useState(false);
  const [isUserOpen, setIsUserOpen] = React.useState(false);
  const [isMapOpen, setIsMapOpen] = React.useState(false);
  const [isNewProductOpen, setIsNewProductOpen] = React.useState(false);
  const [isMeusAnunciosOpen, setIsMeusAnunciosOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isCurtidasOpen, setIsCurtidasOpen] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isEditePerfilOpen, setIsEditePerfilOpen] = React.useState(false);
  const [isVendedoresOpen, setIsVendedoresOpen] = React.useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState<AuthMode>("register");
  const [currentUser, setCurrentUser] = React.useState<SessionUser | null>(null);
  const [profileCompletionMessage, setProfileCompletionMessage] = React.useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [restoreSearchAfterProductClose, setRestoreSearchAfterProductClose] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [myProducts, setMyProducts] = React.useState<Product[]>([]);
  const [likedProducts, setLikedProducts] = React.useState<Product[]>([]);
  const [cartQuantitiesByProductId, setCartQuantitiesByProductId] = React.useState<Record<number, number>>(
    () => readCartStorage(),
  );
  const [hasUnseenCartAlert, setHasUnseenCartAlert] = React.useState<boolean>(
    () => readCartUnseenAlertStorage(),
  );
  const [notifications, setNotifications] = React.useState<NotificationDto[]>([]);
  const [readNotificationIds, setReadNotificationIds] = React.useState<string[]>([]);
  const [heroDate, setHeroDate] = React.useState<Date>(() => new Date());
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [cartToast, setCartToast] = React.useState<{
    id: number;
    message: string;
    variant: "success" | "warning";
  } | null>(null);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = React.useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = React.useState(false);
  const [avatarUploadError, setAvatarUploadError] = React.useState("");
  const cartToastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMemberAccess = Boolean(currentUser);
  const hasRequiredProfileForPublishing = React.useMemo(() => {
    if (!currentUser) {
      return false;
    }

    const normalizedName = String(currentUser.name ?? "").trim();
    const normalizedWhatsapp = String(currentUser.whatsappNumber ?? "")
      .replace(/\D/g, "")
      .trim();

    return normalizedName.length >= 2 && normalizedWhatsapp.length >= 6;
  }, [currentUser]);
  const memberName = currentUser?.name || t("Membro cadastrado");
  const memberAvatar =
    String(currentUser?.avatarUrl ?? "").trim() ||
    "https://picsum.photos/seed/avatar/200/200";
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const avatarButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const avatarPickerPanelRef = React.useRef<HTMLDivElement | null>(null);
  const notificationsButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const notificationsPanelRef = React.useRef<HTMLDivElement | null>(null);
  const heroCollectionLabel = React.useMemo(
    () => formatCollectionDate(heroDate, locale),
    [heroDate, locale],
  );

  React.useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        const data = await api.getProducts();
        if (!cancelled) {
          setProducts(asArray<Product>(data));
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProducts(false);
        }
      }
    };

    const restoreSession = async () => {
      if (typeof window !== "undefined") {
        const hostname = window.location.hostname.toLowerCase();
        const isTemplesaleHost =
          hostname === "templesale.com" || hostname === "www.templesale.com";
        if (isTemplesaleHost) {
          const storedToken = String(
            window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? "",
          ).trim();
          if (!storedToken) {
            if (!cancelled) {
              setCurrentUser(null);
            }
            return;
          }
        }
      }

      try {
        const user = await api.getCurrentUser();
        if (!cancelled) {
          setCurrentUser(user);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      }
    };

    fetchProducts();
    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const updateHeroDate = () => {
      setHeroDate(new Date());
    };

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const delayMs = Math.max(1000, nextMidnight.getTime() - now.getTime());

    let dailyIntervalId: ReturnType<typeof setInterval> | null = null;
    const midnightTimeoutId = setTimeout(() => {
      updateHeroDate();
      dailyIntervalId = setInterval(updateHeroDate, 24 * 60 * 60 * 1000);
    }, delayMs);

    return () => {
      clearTimeout(midnightTimeoutId);
      if (dailyIntervalId) {
        clearInterval(dailyIntervalId);
      }
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const fetchMyProducts = async () => {
      if (!currentUser) {
        setMyProducts([]);
        return;
      }

      try {
        const data = await api.getMyProducts();
        if (!cancelled) {
          setMyProducts(asArray<Product>(data));
        }
      } catch (err) {
        console.error("Error fetching my products:", err);
        if (!cancelled) {
          setMyProducts([]);
        }
      }
    };

    fetchMyProducts();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  React.useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      if (!currentUser) {
        setNotifications([]);
        return;
      }

      try {
        const data = await api.getNotifications();
        if (!cancelled) {
          setNotifications(asArray<NotificationDto>(data));
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
        if (!cancelled) {
          setNotifications([]);
        }
      }
    };

    fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  React.useEffect(() => {
    let cancelled = false;

    const refreshNotificationsWhenOpen = async () => {
      if (!currentUser || !isNotificationsOpen) {
        return;
      }

      try {
        const data = await api.getNotifications();
        if (!cancelled) {
          setNotifications(asArray<NotificationDto>(data));
        }
      } catch (err) {
        console.error("Error refreshing notifications:", err);
      }
    };

    refreshNotificationsWhenOpen();

    return () => {
      cancelled = true;
    };
  }, [currentUser, isNotificationsOpen]);

  React.useEffect(() => {
    setReadNotificationIds([]);
  }, [currentUser?.id]);

  React.useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (notificationsPanelRef.current?.contains(target)) {
        return;
      }
      if (notificationsButtonRef.current?.contains(target)) {
        return;
      }

      setIsNotificationsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isNotificationsOpen]);

  React.useEffect(() => {
    if (!isAvatarPickerOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (avatarPickerPanelRef.current?.contains(target)) {
        return;
      }
      if (avatarButtonRef.current?.contains(target)) {
        return;
      }

      setIsAvatarPickerOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAvatarPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isAvatarPickerOpen]);

  React.useEffect(() => {
    if (!isUserOpen && isAvatarPickerOpen) {
      setIsAvatarPickerOpen(false);
    }
  }, [isUserOpen, isAvatarPickerOpen]);

  React.useEffect(() => {
    let cancelled = false;

    const fetchLikedProducts = async () => {
      if (!currentUser) {
        setLikedProducts([]);
        return;
      }

      try {
        const data = await api.getLikedProducts();
        if (!cancelled) {
          setLikedProducts(asArray<Product>(data));
        }
      } catch (err) {
        console.error("Error fetching liked products:", err);
        if (!cancelled) {
          setLikedProducts([]);
        }
      }
    };

    fetchLikedProducts();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  React.useEffect(() => {
    if (!hasMemberAccess) {
      setIsMenuOpen(false);
      setIsFilterMenuOpen(false);
      setIsLanguageMenuOpen(false);
      setIsUserOpen(false);
      setIsMapOpen(false);
      setIsNewProductOpen(false);
      setIsMeusAnunciosOpen(false);
      setEditingProduct(null);
      setIsCurtidasOpen(false);
      setIsCartOpen(false);
      setIsEditePerfilOpen(false);
      setIsNotificationsOpen(false);
      setIsAccountSettingsOpen(false);
      setIsAvatarPickerOpen(false);
      setIsAvatarUploading(false);
      setAvatarUploadError("");
      setProfileCompletionMessage("");
    }
  }, [hasMemberAccess]);

  React.useEffect(() => {
    return () => {
      if (cartToastTimerRef.current) {
        clearTimeout(cartToastTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartQuantitiesByProductId));
  }, [cartQuantitiesByProductId]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(CART_UNSEEN_STORAGE_KEY, hasUnseenCartAlert ? "1" : "0");
  }, [hasUnseenCartAlert]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Error logging out:", err);
    }

    setCurrentUser(null);
    setMyProducts([]);
    setLikedProducts([]);
    setNotifications([]);
    setReadNotificationIds([]);
    setEditingProduct(null);
    setIsUserOpen(false);
    setIsMenuOpen(false);
    setIsFilterMenuOpen(false);
    setIsLanguageMenuOpen(false);
    setIsMapOpen(false);
    setIsCurtidasOpen(false);
    setProfileCompletionMessage("");
    setIsAvatarPickerOpen(false);
    setIsAvatarUploading(false);
    setAvatarUploadError("");
  };

  const handleAuthSubmit = async (payload: AuthSubmitPayload) => {
    const email = payload.email.trim();
    const password = payload.password.trim();
    const name = payload.name.trim();

    const user =
      payload.mode === "register"
        ? await api.register({ name, email, password })
        : await api.login({ email, password });

    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const likedProductIds = React.useMemo(
    () => new Set(likedProducts.map((product) => product.id)),
    [likedProducts],
  );
  const productsById = React.useMemo(() => {
    const map = new globalThis.Map<number, Product>();
    [...products, ...myProducts, ...likedProducts].forEach((product) => {
      map.set(product.id, product);
    });
    return map;
  }, [products, myProducts, likedProducts]);
  const cartItems = React.useMemo<CartItem[]>(() => {
    return Object.entries(cartQuantitiesByProductId)
      .map(([productId, quantity]) => ({
        productId: Number(productId),
        quantity: toSafeCartQuantity(quantity),
      }))
      .filter((item) => Number.isInteger(item.productId) && item.productId > 0 && item.quantity > 0)
      .map((item) => {
        const product = productsById.get(item.productId);
        if (!product) {
          return null;
        }

        const stock = getProductStockQuantity(product);
        if (stock <= 0) {
          return null;
        }

        return {
          product,
          quantity: Math.min(item.quantity, stock),
        };
      })
      .filter((item): item is CartItem => item !== null);
  }, [cartQuantitiesByProductId, productsById]);
  const cartItemsCount = React.useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );
  const markCartAlertAsSeen = React.useCallback(() => {
    setHasUnseenCartAlert(false);
  }, []);

  React.useEffect(() => {
    if (cartItemsCount === 0 && hasUnseenCartAlert) {
      setHasUnseenCartAlert(false);
    }
  }, [cartItemsCount, hasUnseenCartAlert]);

  React.useEffect(() => {
    if (isCartOpen) {
      markCartAlertAsSeen();
    }
  }, [isCartOpen, markCartAlertAsSeen]);

  React.useEffect(() => {
    setCartQuantitiesByProductId((current) => {
      const nextEntries = Object.entries(current)
        .map(([productId, rawQuantity]) => {
          const normalizedProductId = Number(productId);
          const normalizedQuantity = toSafeCartQuantity(rawQuantity);
          if (!Number.isInteger(normalizedProductId) || normalizedProductId <= 0 || normalizedQuantity <= 0) {
            return null;
          }

          const product = productsById.get(normalizedProductId);
          if (!product) {
            return null;
          }

          const stock = getProductStockQuantity(product);
          if (stock <= 0) {
            return null;
          }

          return [normalizedProductId, Math.min(normalizedQuantity, stock)] as const;
        })
        .filter((entry): entry is readonly [number, number] => entry !== null);

      const next = Object.fromEntries(nextEntries);
      const currentSerialized = JSON.stringify(current);
      const nextSerialized = JSON.stringify(next);
      if (currentSerialized === nextSerialized) {
        return current;
      }
      return next;
    });
  }, [productsById]);

  const readNotificationIdSet = React.useMemo(
    () => new Set(readNotificationIds),
    [readNotificationIds],
  );
  const containsBrandName = React.useCallback((value: string) => {
    return value.toLowerCase().includes("templesale");
  }, []);
  const notificationsToDisplay = React.useMemo<NotificationDto[]>(() => {
    if (!currentUser) {
      return [];
    }
    if (notifications.length > 0) {
      return notifications;
    }

    return [
      {
        id: `system-welcome:${currentUser.id}`,
        type: "system_welcome",
        title: t("Bem-vindo a TempleSale"),
        message: t("Bem-vindo a plataforma de vendas TempleSale."),
        createdAt: Math.floor(Date.now() / 1000),
      },
    ];
  }, [notifications, currentUser, t]);
  const unreadNotificationsCount = React.useMemo(
    () =>
      notificationsToDisplay.reduce(
        (count, notification) => count + (readNotificationIdSet.has(notification.id) ? 0 : 1),
        0,
      ),
    [notificationsToDisplay, readNotificationIdSet],
  );

  const showCartToast = React.useCallback(
    (message: string, variant: "success" | "warning" = "success") => {
      if (cartToastTimerRef.current) {
        clearTimeout(cartToastTimerRef.current);
      }
      setCartToast({
        id: Date.now(),
        message,
        variant,
      });
      cartToastTimerRef.current = setTimeout(() => {
        setCartToast(null);
      }, 2000);
    },
    [],
  );

  const openProductDetails = React.useCallback(
    (product: Product, options?: { fromSearch?: boolean }) => {
      setSelectedProduct(product);
      if (options?.fromSearch) {
        setRestoreSearchAfterProductClose(true);
        setIsSearchOpen(false);
        return;
      }
      setRestoreSearchAfterProductClose(false);
    },
    [],
  );

  const handleProductDetailsClose = React.useCallback(() => {
    setSelectedProduct(null);
    if (restoreSearchAfterProductClose) {
      setIsSearchOpen(true);
      setRestoreSearchAfterProductClose(false);
    }
  }, [restoreSearchAfterProductClose]);

  const hasResolvedProductFromUrl = React.useRef(false);
  React.useEffect(() => {
    if (hasResolvedProductFromUrl.current) {
      return;
    }
    if (products.length === 0 || typeof window === "undefined") {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const rawProductId = searchParams.get("product");
    if (!rawProductId) {
      hasResolvedProductFromUrl.current = true;
      return;
    }

    const productId = Number(rawProductId);
    if (!Number.isInteger(productId) || productId <= 0) {
      hasResolvedProductFromUrl.current = true;
      return;
    }

    const sharedProduct = products.find((item) => item.id === productId);
    if (sharedProduct) {
      setSelectedProduct(sharedProduct);
    }

    hasResolvedProductFromUrl.current = true;
  }, [products]);

  const handleToggleLike = async (product: Product) => {
    if (!currentUser) {
      setAuthModalMode("register");
      setIsAuthModalOpen(true);
      return;
    }

    const isCurrentlyLiked = likedProductIds.has(product.id);

    try {
      if (isCurrentlyLiked) {
        await api.unlikeProduct(product.id);
        setLikedProducts((current) => current.filter((item) => item.id !== product.id));
        return;
      }

      await api.likeProduct(product.id);
      setLikedProducts((current) => [product, ...current.filter((item) => item.id !== product.id)]);
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleAddToCart = React.useCallback(
    (product: Product, quantityToAdd = 1) => {
      const stockQuantity = getProductStockQuantity(product);
      if (stockQuantity <= 0) {
        showCartToast(t("Produto esgotado."), "warning");
        return;
      }

      const currentQuantity = toSafeCartQuantity(cartQuantitiesByProductId[product.id]);
      if (currentQuantity >= stockQuantity) {
        showCartToast(t("Você já atingiu o limite disponível deste produto."), "warning");
        return;
      }

      const normalizedAddition = Math.max(1, Math.floor(quantityToAdd));
      const nextQuantity = Math.min(stockQuantity, currentQuantity + normalizedAddition);
      const addedCount = Math.max(0, nextQuantity - currentQuantity);
      if (addedCount <= 0) {
        showCartToast(t("Não foi possível adicionar mais unidades."), "warning");
        return;
      }

      setCartQuantitiesByProductId((current) => ({
        ...current,
        [product.id]: nextQuantity,
      }));
      setHasUnseenCartAlert(true);
      showCartToast(
        t("{count} item(s) adicionado(s) ao carrinho.", {
          count: String(addedCount),
        }),
        "success",
      );
    },
    [cartQuantitiesByProductId, showCartToast, t],
  );

  const handleRemoveFromCart = React.useCallback((productId: number) => {
    setCartQuantitiesByProductId((current) => {
      if (!(productId in current)) {
        return current;
      }
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }, []);

  const handleClearCart = React.useCallback(() => {
    setCartQuantitiesByProductId({});
  }, []);

  const handleUpdateCartItemQuantity = React.useCallback(
    (productId: number, nextQuantity: number) => {
      const product = productsById.get(productId);
      if (!product) {
        return;
      }

      const stockQuantity = getProductStockQuantity(product);
      if (stockQuantity <= 0) {
        return;
      }

      const normalizedQuantity = Math.max(1, Math.floor(nextQuantity));
      const safeQuantity = Math.min(stockQuantity, normalizedQuantity);

      setCartQuantitiesByProductId((current) => {
        if (toSafeCartQuantity(current[productId]) === safeQuantity) {
          return current;
        }
        return {
          ...current,
          [productId]: safeQuantity,
        };
      });
    },
    [productsById],
  );

  const syncUpdatedProduct = (updated: Product) => {
    setProducts((current) =>
      current.map((product) => (product.id === updated.id ? updated : product)),
    );
    setMyProducts((current) =>
      current.map((product) => (product.id === updated.id ? updated : product)),
    );
    setLikedProducts((current) =>
      current.map((product) => (product.id === updated.id ? updated : product)),
    );
    setSelectedProduct((current) => (current?.id === updated.id ? updated : current));
  };

  const syncSellerProfileAcrossProducts = (updatedUser: SessionUser) => {
    const applySellerProfile = (product: Product): Product => {
      if (product.ownerId !== updatedUser.id) {
        return product;
      }
      return {
        ...product,
        sellerName: updatedUser.name,
        sellerWhatsappCountryIso: updatedUser.whatsappCountryIso,
        sellerWhatsappNumber: updatedUser.whatsappNumber,
      };
    };

    setProducts((current) => current.map(applySellerProfile));
    setMyProducts((current) => current.map(applySellerProfile));
    setLikedProducts((current) => current.map(applySellerProfile));
    setSelectedProduct((current) => (current ? applySellerProfile(current) : current));
  };

  const markNotificationAsRead = (notificationId: string) => {
    setReadNotificationIds((current) => {
      if (current.includes(notificationId)) {
        return current;
      }
      return [...current, notificationId];
    });
  };

  const markAllNotificationsAsRead = () => {
    setReadNotificationIds((current) => {
      const readSet = new Set(current);
      notificationsToDisplay.forEach((notification) => {
        readSet.add(notification.id);
      });
      return Array.from(readSet);
    });
  };

  const handleProfileSave = async (profileData: UpdateProfileInput) => {
    const updatedUser = await api.updateProfile(profileData);
    const mergedUser: SessionUser = {
      ...(currentUser ?? updatedUser),
      ...updatedUser,
      name: updatedUser.name || profileData.name,
      whatsappCountryIso:
        updatedUser.whatsappCountryIso || profileData.whatsappCountryIso,
      whatsappNumber: updatedUser.whatsappNumber || profileData.whatsappNumber,
    };

    setCurrentUser(mergedUser);
    syncSellerProfileAcrossProducts(mergedUser);
    setProfileCompletionMessage("");
  };

  const handleProfileAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!currentUser) {
      return;
    }

    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarUploadError(t("Arquivo inválido. Envie uma imagem."));
      return;
    }

    if (file.size <= 0 || file.size > 12 * 1024 * 1024) {
      setAvatarUploadError(t("Imagem muito grande. Limite de 12 MB."));
      return;
    }

    setIsAvatarUploading(true);
    setAvatarUploadError("");
    try {
      const uploadResult = await api.uploadProfileImage(file);
      const updatedUser = await api.updateProfileAvatar(uploadResult.url);
      const mergedUser: SessionUser = {
        ...(currentUser ?? updatedUser),
        ...updatedUser,
        avatarUrl: updatedUser.avatarUrl || uploadResult.url,
      };
      setCurrentUser(mergedUser);
      setIsAvatarPickerOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("Falha ao enviar foto de perfil.");
      setAvatarUploadError(message);
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleOpenNewProduct = () => {
    setIsUserOpen(false);

    if (!hasRequiredProfileForPublishing) {
      setIsNewProductOpen(false);
      setProfileCompletionMessage(
        t("Para anunciar um produto, preencha nome e telefone no seu perfil."),
      );
      setIsEditePerfilOpen(true);
      return;
    }

    setProfileCompletionMessage("");
    setIsEditePerfilOpen(false);
    setIsNewProductOpen(true);
  };

  const availableCategoryFilters = React.useMemo(() => {
    const categoryCounts = new globalThis.Map<string, number>();
    products.forEach((product) => {
      const category = String(product.category ?? "").trim();
      if (!category) {
        return;
      }
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    });

    const knownCategories = CATEGORIES.filter((category) => category !== "All");
    const knownCategoriesWithProducts = knownCategories.filter(
      (category) => (categoryCounts.get(category) ?? 0) > 0,
    );
    const knownSet = new Set<string>(knownCategories);
    const customCategoriesWithProducts = Array.from(categoryCounts.keys()) as string[];
    const filteredCustomCategories = customCategoriesWithProducts
      .filter((category) => !knownSet.has(category))
      .sort((a, b) => a.localeCompare(b, locale));

    return [
      {
        key: "All",
        count: products.length,
      },
      ...knownCategoriesWithProducts.map((category) => ({
        key: category,
        count: categoryCounts.get(category) ?? 0,
      })),
      ...filteredCustomCategories.map((category) => ({
        key: category,
        count: categoryCounts.get(category) ?? 0,
      })),
    ];
  }, [products, locale]);

  React.useEffect(() => {
    const hasActiveCategory = availableCategoryFilters.some(
      (category) => category.key === activeCategory,
    );
    if (!hasActiveCategory) {
      setActiveCategory("All");
    }
  }, [availableCategoryFilters, activeCategory]);

  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence>
        {isAuthModalOpen && (
          <Auth
            onSubmit={handleAuthSubmit}
            defaultMode={authModalMode}
            onClose={() => setIsAuthModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartToast && (
          <motion.div
            key={cartToast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-170 px-4"
          >
            <div
              className={`min-w-[260px] max-w-[90vw] border px-4 py-3 shadow-xl backdrop-blur-sm flex items-center gap-3 ${
                cartToast.variant === "warning"
                  ? "bg-amber-50/95 border-amber-200 text-amber-800"
                  : "bg-stone-900/95 border-stone-800 text-white"
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="text-xs tracking-[0.06em]">{cartToast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Menu Overlay */}
      <motion.div
        initial={false}
        animate={isMenuOpen || isUserOpen ? { opacity: 1 } : { opacity: 0 }}
        className={`fixed inset-0 z-70 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
          isMenuOpen || isUserOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={() => {
          setIsMenuOpen(false);
          setIsFilterMenuOpen(false);
          setIsLanguageMenuOpen(false);
          setIsUserOpen(false);
          setIsAvatarPickerOpen(false);
        }}
      />

      {hasMemberAccess && (
        <>
      {/* User Dashboard Overlay */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isUserOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm z-80 bg-[#fdfcfb] shadow-2xl flex flex-col"
      >
        <div className="p-8 flex justify-between items-center border-b border-stone-100">
          <h2 className="text-xl font-serif tracking-widest uppercase">{t("Painel")}</h2>
          <button
            onClick={() => {
              setIsUserOpen(false);
              setIsLanguageMenuOpen(false);
              setIsAccountSettingsOpen(false);
              setIsAvatarPickerOpen(false);
            }}
            className="p-2 hover:bg-stone-50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>
        
        <div className="grow overflow-y-auto p-8 flex flex-col gap-10">
          {/* User Profile Summary */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                ref={avatarButtonRef}
                onClick={() => setIsAvatarPickerOpen((current) => !current)}
                className="w-16 h-16 rounded-full overflow-hidden bg-stone-100 border border-stone-200 p-0.5"
              >
                <img
                  src={memberAvatar}
                  alt={t("Avatar do usuário")}
                  className="w-full h-full object-cover rounded-full"
                />
                {isAvatarUploading && (
                  <span className="absolute inset-0 bg-black/35 text-white flex items-center justify-center rounded-full">
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  </span>
                )}
              </button>
              <AnimatePresence>
                {isAvatarPickerOpen && (
                  <motion.div
                    ref={avatarPickerPanelRef}
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    className="absolute top-[calc(100%+0.5rem)] left-0 z-90 min-w-[180px] bg-white border border-stone-200 shadow-lg rounded-sm p-2"
                  >
                    <button
                      disabled={isAvatarUploading}
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-700 hover:bg-stone-100 disabled:text-stone-300 disabled:hover:bg-transparent transition-colors"
                    >
                      <ImagePlus className="w-3.5 h-3.5" />
                      {isAvatarUploading ? t("Enviando foto...") : t("Escolher foto")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <h3 className="font-serif italic text-xl text-stone-800">{memberName}</h3>
              <p className="text-[10px] uppercase tracking-widest text-stone-400">
                {t("Membro cadastrado")}
              </p>
              {avatarUploadError && (
                <p className="text-[11px] text-red-500 mt-1">{avatarUploadError}</p>
              )}
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void handleProfileAvatarUpload(event);
            }}
          />

          {/* Dashboard Links */}
          <nav className="flex flex-col gap-2">
            <button 
              onClick={handleOpenNewProduct}
              className="flex items-center justify-between p-4 bg-stone-900 text-white hover:bg-black transition-colors group mb-4 rounded-sm"
            >
              <div className="flex items-center gap-4">
                <Plus className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                <span className="text-xs uppercase tracking-widest font-bold">
                  {t("Novo Produto")}
                </span>
              </div>
              <ArrowRight className="w-3 h-3 text-white/50 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => {
                setIsUserOpen(false);
                setProfileCompletionMessage("");
                setIsEditePerfilOpen(true);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <User className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
                <span className="text-xs uppercase tracking-widest font-medium text-stone-600 group-hover:text-stone-800 transition-colors">
                  {t("Editar perfil")}
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-stone-300 group-hover:text-stone-500 transition-colors" />
            </button>

            <button
              onClick={() => {
                setIsUserOpen(false);
                setIsCurtidasOpen(true);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <Heart className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
                <span className="text-xs uppercase tracking-widest font-medium text-stone-600 group-hover:text-stone-800 transition-colors">
                  {t("Curtidas")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-stone-400">{likedProducts.length}</span>
                <ChevronRight className="w-3 h-3 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => {
                setIsUserOpen(false);
                setIsMeusAnunciosOpen(true);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <Package className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
                <span className="text-xs uppercase tracking-widest font-medium text-stone-600 group-hover:text-stone-800 transition-colors">
                  {t("Meus anúncios")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-stone-400">{myProducts.length}</span>
                <ChevronRight className="w-3 h-3 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </div>
            </button>

            <div>
              <button
                onClick={() => setIsLanguageMenuOpen((current) => !current)}
                className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <Languages className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
                  <span className="text-xs uppercase tracking-widest font-medium text-stone-600 group-hover:text-stone-800 transition-colors">
                    {t("Idioma")}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 text-stone-300 transition-transform duration-300 ${
                    isLanguageMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {isLanguageMenuOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-stone-50/50"
                  >
                    {localeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setLocale(option.value as AppLocale);
                          setIsLanguageMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-4 pl-12 pr-4 py-3 hover:bg-stone-100 transition-colors group ${
                          locale === option.value ? "bg-stone-100" : ""
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-widest font-medium text-stone-500 group-hover:text-stone-800 transition-colors">
                          {t(option.label)}
                        </span>
                        {locale === option.value && (
                          <span className="text-[10px] uppercase tracking-[0.15em] text-stone-500">
                            {t("Ativo")}
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <button
                onClick={() => setIsAccountSettingsOpen((current) => !current)}
                className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <Settings className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
                  <span className="text-xs uppercase tracking-widest font-medium text-stone-600 group-hover:text-stone-800 transition-colors">
                    {t("Configurações da conta")}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 text-stone-300 transition-transform duration-300 ${
                    isAccountSettingsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {isAccountSettingsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-stone-50/50"
                  >
                    {[
                      { icon: FileText, label: "Termos" },
                      { icon: Shield, label: "Privacidade" },
                      { icon: HelpCircle, label: "Suporte" },
                    ].map((subItem) => (
                      <button
                        key={subItem.label}
                        className="w-full flex items-center gap-4 pl-12 py-3 hover:bg-stone-100 transition-colors group"
                      >
                        <subItem.icon className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-800 transition-colors" />
                        <span className="text-[10px] uppercase tracking-widest font-medium text-stone-500 group-hover:text-stone-800 transition-colors">
                          {t(subItem.label)}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          <div className="mt-auto">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 border border-stone-100 text-stone-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50/30 transition-all text-xs uppercase tracking-[0.2em] font-medium"
            >
              <LogOut className="w-4 h-4" />
              {t("Sair")}
            </button>
          </div>
        </div>
      </motion.div>
        </>
      )}

      <AnimatePresence>
        {isMapOpen && (
          <ProductMap
            products={products}
            onOpenProduct={(product) => {
              openProductDetails(product);
            }}
            onClose={() => setIsMapOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVendedoresOpen && (
          <Vendedores
            onClose={() => setIsVendedoresOpen(false)}
            onOpenProduct={(product) => {
              setIsVendedoresOpen(false);
              openProductDetails(product);
            }}
          />
        )}
      </AnimatePresence>

      {/* Product Details View */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetails 
            product={selectedProduct} 
            products={products}
            onOpenProduct={(product) => setSelectedProduct(product)}
            onClose={handleProductDetailsClose}
            isLiked={likedProductIds.has(selectedProduct.id)}
            onToggleLike={() => {
              void handleToggleLike(selectedProduct);
            }}
            onAddToCart={(quantity) => {
              handleAddToCart(selectedProduct, quantity);
            }}
          />
        )}
      </AnimatePresence>

      {/* New Product View */}
      <AnimatePresence>
        {(hasMemberAccess && isNewProductOpen) && (
          <NewProduct 
            onClose={() => setIsNewProductOpen(false)} 
            onPublish={async (newProd) => {
              const sellerPhone = String(currentUser?.whatsappNumber ?? "").replace(/\D/g, "");
              const published = await api.createProduct({
                ...newProd,
                phone: sellerPhone || undefined,
                seller_phone: sellerPhone || undefined,
                whatsappNumber: sellerPhone || undefined,
                whatsappCountryIso: currentUser?.whatsappCountryIso || "IT",
              });
              setProducts((current) => [published, ...current]);
              setMyProducts((current) => [published, ...current]);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(hasMemberAccess && editingProduct) && (
          <NewProduct
            mode="edit"
            initialProduct={editingProduct}
            onClose={() => setEditingProduct(null)}
            onPublish={async (updatedInput) => {
              const sellerPhone = String(currentUser?.whatsappNumber ?? "").replace(/\D/g, "");
              const updated = await api.updateProduct(editingProduct.id, {
                ...updatedInput,
                phone: sellerPhone || undefined,
                seller_phone: sellerPhone || undefined,
                whatsappNumber: sellerPhone || undefined,
                whatsappCountryIso: currentUser?.whatsappCountryIso || "IT",
              });
              syncUpdatedProduct(updated);
              setEditingProduct(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Meus Anúncios View */}
      <AnimatePresence>
        {(hasMemberAccess && isMeusAnunciosOpen) && (
          <MeusAnuncios 
            products={myProducts}
            onClose={() => setIsMeusAnunciosOpen(false)}
            onEdit={(prod) => {
              setIsMeusAnunciosOpen(false);
              setEditingProduct(prod);
            }}
            onDelete={async (id) => {
              await api.deleteProduct(id);
              setMyProducts((current) => current.filter((p) => p.id !== id));
              setProducts((current) => current.filter((p) => p.id !== id));
              setLikedProducts((current) => current.filter((p) => p.id !== id));
              setSelectedProduct((current) => (current?.id === id ? null : current));
              setEditingProduct((current) => (current?.id === id ? null : current));
              setCartQuantitiesByProductId((current) => {
                if (!(id in current)) {
                  return current;
                }
                const next = { ...current };
                delete next[id];
                return next;
              });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <Carrinho
            items={cartItems}
            onClose={() => setIsCartOpen(false)}
            onOpenProduct={(product) => {
              setIsCartOpen(false);
              openProductDetails(product);
            }}
            onRemove={handleRemoveFromCart}
            onClear={handleClearCart}
            onUpdateQuantity={handleUpdateCartItemQuantity}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(hasMemberAccess && isCurtidasOpen) && (
          <Curtidas
            products={likedProducts}
            onClose={() => setIsCurtidasOpen(false)}
            onOpenProduct={(product) => {
              openProductDetails(product);
              setIsCurtidasOpen(false);
            }}
            onRemove={async (id) => {
              try {
                await api.unlikeProduct(id);
                setLikedProducts((current) => current.filter((product) => product.id !== id));
              } catch (err) {
                console.error("Error removing liked product:", err);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Editar Perfil View */}
      <AnimatePresence>
        {(hasMemberAccess && isEditePerfilOpen) && (
          <EditePerfil 
            onClose={() => setIsEditePerfilOpen(false)}
            onSave={handleProfileSave}
            initialData={currentUser}
            initialErrorMessage={profileCompletionMessage}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isMenuOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm z-80 bg-[#fdfcfb] shadow-2xl flex flex-col"
      >
        <div className="p-8 flex justify-between items-center border-b border-stone-100">
          <h2 className="text-xl font-serif tracking-widest uppercase">{t("Menu")}</h2>
          <button
            onClick={() => {
              setIsMenuOpen(false);
              setIsFilterMenuOpen(false);
              setIsLanguageMenuOpen(false);
            }}
            className="p-2 hover:bg-stone-50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>
        
        <div className="grow overflow-y-auto p-8 flex flex-col gap-8">
          <nav className="flex flex-col gap-4">
            <button
              className="flex items-center justify-between text-xl font-serif italic text-stone-800 hover:translate-x-2 transition-transform duration-300 group"
              onClick={() => setIsFilterMenuOpen((current) => !current)}
            >
              <span className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-stone-300 group-hover:text-stone-800 transition-colors" />
                {t("Filtro")}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-stone-300 group-hover:text-stone-600 transition-all ${
                  isFilterMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isFilterMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-stone-50/50 border border-stone-100 rounded-sm"
                >
                  <div className="max-h-56 overflow-y-auto">
                    {availableCategoryFilters.map((category) => (
                      <button
                        key={category.key}
                        onClick={() => {
                          setActiveCategory(category.key);
                          setIsFilterMenuOpen(false);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-4 px-4 py-3 border-b border-stone-100 last:border-b-0 transition-colors ${
                          activeCategory === category.key ? "bg-stone-100" : "hover:bg-stone-100/70"
                        }`}
                      >
                        <span
                          className={`text-[11px] uppercase tracking-[0.2em] ${
                            activeCategory === category.key ? "text-stone-900" : "text-stone-600"
                          }`}
                        >
                          {category.key === "All" ? t("Todos") : getCategoryLabel(category.key, locale)}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400">{category.count}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              className="flex items-center gap-4 text-xl font-serif italic text-stone-800 hover:translate-x-2 transition-transform duration-300 group"
              onClick={() => {
                setIsFilterMenuOpen(false);
                setIsMenuOpen(false);
                setIsMapOpen(true);
              }}
            >
              <Map className="w-5 h-5 text-stone-300 group-hover:text-stone-800 transition-colors" />
              {t("Mapa")}
            </button>

            <button
              className="flex items-center justify-between gap-4 text-xl font-serif italic text-stone-800 hover:translate-x-2 transition-transform duration-300 group"
              onClick={() => {
                setIsFilterMenuOpen(false);
                setIsMenuOpen(false);
                setIsCartOpen(true);
              }}
            >
              <span className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-stone-300 group-hover:text-stone-800 transition-colors" />
                {t("Carrinho")}
                {cartItemsCount > 0 && (
                  <span
                    className={`w-2 h-2 rounded-full bg-red-500 ${
                      hasUnseenCartAlert ? "animate-pulse" : ""
                    }`}
                  />
                )}
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                {cartItemsCount > 0 ? cartItemsCount : 0}
              </span>
            </button>

            <button
              className="flex items-center gap-4 text-xl font-serif italic text-stone-800 hover:translate-x-2 transition-transform duration-300 group"
              onClick={() => {
                setIsFilterMenuOpen(false);
                setIsMenuOpen(false);
                setIsVendedoresOpen(true);
              }}
            >
              <Store className="w-5 h-5 text-stone-300 group-hover:text-stone-800 transition-colors" />
              {t("Vendedor")}
            </button>
          </nav>
          
          <div className="h-px bg-stone-100 my-4" />
          
          <div className="flex flex-col gap-4 text-[10px] uppercase tracking-[0.2em] font-medium text-stone-400">
            <a href="#" className="hover:text-black transition-colors">{t("Arquivo")}</a>
            <a href="#" className="hover:text-black transition-colors">{t("Diário")}</a>
            <a href="#" className="hover:text-black transition-colors">{t("Sobre nós")}</a>
            <a href="#" className="hover:text-black transition-colors">{t("Contato")}</a>
          </div>
        </div>
        
        <div className="p-8 border-t border-stone-100 bg-stone-50/50">
          <div className="flex gap-6">
            <Instagram className="w-5 h-5 text-stone-400 hover:text-black transition-colors cursor-pointer" />
            <Twitter className="w-5 h-5 text-stone-400 hover:text-black transition-colors cursor-pointer" />
            <Facebook className="w-5 h-5 text-stone-400 hover:text-black transition-colors cursor-pointer" />
          </div>
        </div>
      </motion.div>

      {/* Search Overlay */}
      <motion.div
        initial={false}
        animate={isSearchOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        className={`fixed inset-0 z-60 bg-[#fdfcfb] transition-all duration-300 ${
          isSearchOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="grow flex items-center gap-4">
            <Search className="w-5 h-5 text-stone-400" />
            <input
              autoFocus={isSearchOpen}
              type="text"
              placeholder={t("Buscar em nossos produtos...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xl font-serif italic text-stone-800 placeholder:text-stone-300"
            />
          </div>
          <button 
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
            className="p-2 hover:bg-stone-50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>
        
        {/* Quick Results Preview (Optional but nice) */}
        {searchQuery && (
          <div className="max-w-7xl mx-auto px-6 py-10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-8">
              {t("Resultados para \"{query}\"", { query: searchQuery })}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {products.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category.toLowerCase().includes(searchQuery.toLowerCase())
              ).slice(0, 6).map(product => (
                <div
                  key={product.id}
                  className="flex flex-col gap-2 group cursor-pointer"
                  onClick={() => openProductDetails(product, { fromSearch: true })}
                >
                  <div className="aspect-3/4 overflow-hidden bg-stone-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <span className="text-[10px] font-serif italic text-stone-800 truncate">{product.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fdfcfb]/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-8 w-auto sm:w-1/3 shrink-0">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="relative p-2 -ml-2 hover:bg-stone-50 rounded-full transition-colors"
            >
              <Menu className="w-5 h-5 text-stone-600" />
              {hasUnseenCartAlert && cartItemsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
         
          </div>

          <h1
            className="text-sm sm:text-2xl font-serif tracking-[0.08em] sm:tracking-[0.15em] uppercase text-center grow px-2 whitespace-nowrap notranslate"
            translate="no"
          >
            {BRAND_NAME}
          </h1>

          <div className="flex items-center justify-end gap-1 sm:gap-4 w-auto sm:w-1/3 shrink-0">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 hover:bg-stone-50 rounded-full transition-colors"
            >
              <Search className="w-5 h-5 text-stone-600" />
            </button>
            {hasMemberAccess ? (
              <>
                <div className="relative">
                  <button 
                    ref={notificationsButtonRef}
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-2 hover:bg-stone-50 rounded-full transition-colors relative"
                  >
                    <Bell className="w-5 h-5 text-stone-600" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#fdfcfb]" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setIsNotificationsOpen(false)}
                          className="fixed inset-0 z-90"
                        />
                        <motion.div
                          ref={notificationsPanelRef}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ type: "spring", damping: 20, stiffness: 300 }}
                          className="absolute -right-2.5 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-white border border-stone-100 shadow-xl rounded-xl z-100 overflow-hidden"
                        >
                          <div className="p-4 border-b border-stone-50 flex items-center justify-between">
                            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-800">
                              {t("Notificações")}
                            </h3>
                            <button
                              onClick={markAllNotificationsAsRead}
                              disabled={unreadNotificationsCount === 0}
                              className={`text-[10px] transition-colors ${
                                unreadNotificationsCount === 0
                                  ? "text-stone-300 cursor-not-allowed"
                                  : "text-stone-400 hover:text-stone-800"
                              }`}
                            >
                              {t("Marcar tudo como lido")}
                            </button>
                          </div>
                          <div className="max-h-100 overflow-y-auto">
                            {notificationsToDisplay.length === 0 ? (
                              <div className="p-4 text-xs text-stone-400">
                                {t("Nenhuma notificação disponível.")}
                              </div>
                            ) : (
                              notificationsToDisplay.map((notification) => {
                                const isRead = readNotificationIdSet.has(notification.id);

                                return (
                                  <div
                                    key={notification.id}
                                    onClick={() => markNotificationAsRead(notification.id)}
                                    className={`p-4 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors cursor-pointer relative ${
                                      !isRead ? "bg-stone-50/50" : ""
                                    }`}
                                  >
                                    {!isRead && (
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-stone-900" />
                                    )}
                                    <div className="flex justify-between items-start mb-1">
                                      <h4
                                        className={`text-xs font-bold text-stone-800 ${
                                          containsBrandName(notification.title) ? "notranslate" : ""
                                        }`}
                                        translate={containsBrandName(notification.title) ? "no" : "yes"}
                                      >
                                        {notification.title}
                                      </h4>
                                      <span className="text-[9px] text-stone-400">
                                        {formatRelativeTime(notification.createdAt, locale)}
                                      </span>
                                    </div>
                                    <p
                                      className={`text-xs text-stone-500 leading-relaxed ${
                                        containsBrandName(notification.message) ? "notranslate" : ""
                                      }`}
                                      translate={containsBrandName(notification.message) ? "no" : "yes"}
                                    >
                                      {notification.message}
                                    </p>
                                  </div>
                                );
                              })
                            )}
                          </div>
                          <div className="p-3 bg-stone-50 text-center">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">
                              {notificationsToDisplay.length}{" "}
                              {notificationsToDisplay.length === 1 ? t("notificação") : t("notificações")}
                            </span>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={() => setIsUserOpen(true)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-stone-200 hover:border-stone-400 transition-all p-0.5 shrink-0"
                >
                  <img 
                    src={memberAvatar} 
                    alt={t("Perfil do usuário")} 
                    className="w-full h-full object-cover rounded-full"
                  />
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode("register");
                  setIsAuthModalOpen(true);
                }}
                className="px-4 sm:px-5 py-2 border border-stone-200 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 hover:text-black hover:border-stone-400 transition-colors rounded-sm"
              >
                {t("Cadastrar")}
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="grow pt-20">
        {/* Hero Section */}
        <section className="relative h-[80vh] overflow-hidden">
          <img
            src="https://i.pinimg.com/736x/b3/15/52/b315527f272a1a00df44206a286308b7.jpg?v=20260225"
            alt={t("Imagem de destaque")}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-xs uppercase tracking-[0.4em] mb-6"
            >
              {heroCollectionLabel}
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-8xl font-serif italic mb-8 max-w-4xl leading-tight"
            >
              {t("Santuario da venda.")}
            </motion.h2>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              onClick={() => setIsSearchOpen(true)}
              className="group flex items-center gap-3 px-8 py-4 bg-white text-black text-xs uppercase tracking-[0.2em] font-medium hover:bg-stone-100 transition-all"
            >
              {t("Explorar coleção")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="sticky top-20 z-40 bg-[#fdfcfb] border-b border-stone-100">
          <div className="max-w-7xl mx-auto relative">
            {/* Gradient masks for mobile scroll */}
            <div className="absolute inset-y-0 left-0 w-8 bg-linear-to-r from-[#fdfcfb] to-transparent z-10 pointer-events-none md:hidden" />
            <div className="absolute inset-y-0 right-0 w-8 bg-linear-to-l from-[#fdfcfb] to-transparent z-10 pointer-events-none md:hidden" />
            
            <div className="flex items-center justify-start gap-6 sm:gap-10 overflow-x-auto no-scrollbar px-6 sm:px-10 h-14 sm:h-16 scroll-smooth">
              {availableCategoryFilters.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={`text-[10px] uppercase tracking-[0.2em] font-medium transition-all whitespace-nowrap relative py-2 ${
                    activeCategory === category.key
                      ? "text-black" 
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {category.key === "All" ? t("Todos") : getCategoryLabel(category.key, locale)}
                  {activeCategory === category.key && (
                    <motion.div 
                      layoutId="activeCategory"
                      className="absolute bottom-0 left-0 right-0 h-px bg-black"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          {isLoadingProducts ? (
            <div className="py-20 text-center text-stone-400 text-xs uppercase tracking-[0.2em]">
              {t("Carregando produtos...")}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                {t("Nenhum produto real publicado ainda.")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-10 sm:gap-y-16">
              {filteredProducts.map((product) => (
                <div key={product.id}>
                  <ProductCard 
                    product={product} 
                    onClick={() => openProductDetails(product)}
                    isLiked={likedProductIds.has(product.id)}
                    onToggleLike={() => {
                      void handleToggleLike(product);
                    }}
                    onAddToCart={() => {
                      handleAddToCart(product, 1);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter / CTA */}
        <section className="bg-stone-100 py-32 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl md:text-5xl font-serif italic mb-6 notranslate" translate="no">
              {t("Junte-se ao TempleSale")}
            </h3>
            <p className="text-stone-500 mb-10 text-sm tracking-wide leading-relaxed">
              {t("Inscreva-se para receber acesso antecipado às novas coleções, lançamentos exclusivos do arquivo e histórias dos nossos artesãos.")}
            </p>
            <form className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder={t("Endereço de email")}
                className="grow bg-white border-none px-6 py-4 text-sm focus:ring-1 focus:ring-stone-400 outline-none transition-all"
              />
              <button className="px-10 py-4 bg-stone-900 text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors">
                {t("Inscrever-se")}
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-100 py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-xl font-serif tracking-[0.15em] uppercase mb-6 notranslate" translate="no">
              {BRAND_NAME}
            </h2>
            <p className="text-stone-400 text-sm max-w-sm leading-relaxed">
              {t("Uma vitrine curada de objetos que definem o santuário moderno. Acreditamos na beleza duradoura dos materiais naturais e na alma do feito à mão.")}
            </p>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6">{t("Informações")}</h4>
            <ul className="space-y-4 text-stone-500 text-sm">
              <li><a href="#" className="hover:text-black transition-colors">{t("Frete e devoluções")}</a></li>
              <li><a href="#" className="hover:text-black transition-colors">{t("Política de privacidade")}</a></li>
              <li><a href="#" className="hover:text-black transition-colors">{t("Termos de serviço")}</a></li>
              <li><a href="#" className="hover:text-black transition-colors">{t("Contato")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6">{t("Social")}</h4>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors">
                <Instagram className="w-4 h-4 text-stone-600" />
              </a>
              <a href="#" className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors">
                <Twitter className="w-4 h-4 text-stone-600" />
              </a>
              <a href="#" className="p-2 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors">
                <Facebook className="w-4 h-4 text-stone-600" />
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-stone-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
            © 2026 <span className="notranslate" translate="no">{BRAND_NAME}</span>.{" "}
            {t("Todos os direitos reservados.")}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
            {t("Design com intenção")}
          </span>
        </div>
      </footer>
    </div>
  );
}
