import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ShoppingBag, Menu, ArrowRight, Instagram, X, User, Package, CreditCard, Settings, LogOut, ChevronRight, ChevronLeft, Heart, Plus, Minus, Share2, Bell, Globe, MapPin, RotateCcw, Map, Store, Languages, FileText, Shield, HelpCircle, ChevronDown, ImagePlus, LoaderCircle, Trash2, Users, Mail, MessageCircle, Home, Filter } from "lucide-react";
import ProductCard, { ProgressiveProductImage, type Product } from "./components/ProductCard";
import ProductDetails from "./components/ProductDetails";
import NewProduct from "./components/NewProduct";
import NewPublication from "./components/NewPublication";
import PublicationViewer from "./components/PublicationViewer";
import { Header as SocialHeader } from "./components/Header";
import { FeedView as SocialFeedView } from "./components/FeedView";
import { CompanyProfile as SocialCompanyProfile } from "./components/CompanyProfile";
import { CompanySearch as SocialCompanySearch } from "./components/CompanySearch";
import { CompanyProfileDrawer as SocialCompanyProfileDrawer, type SupportedLanguage as SocialSupportedLanguage } from "./components/CompanyProfileDrawer";
import { NotificationsPopover as SocialNotificationsPopover } from "./components/NotificationsPopover";
import { TempleSaleLogo as SocialTempleSaleLogo } from "./components/TempleSaleLogo";
import Auth, { type AuthMode, type AuthSubmitPayload } from "./components/Auth";
import MeusAnuncios from "./components/MeusAnuncios";
import EditePerfil from "./components/EditePerfil";
import ProductMap from "./components/ProductMap";
import Curtidas from "./components/Curtidas";
import Carrinho, { type CartItem } from "./components/Carrinho";
import Vendedores from "./components/Vendedores";
import ElegantProductFilter from "./components/ElegantProductFilter";
import ArtGalleryProductCard from "./components/ArtGalleryProductCard";
import {
  api,
  type NotificationDto,
  type PublicLikerDto,
  type SessionUser,
  type UpdateProfileInput,
  type EstablishmentDto,
  type StorefrontSectionDto,
  type PublicationDto,
  type ProductCommentDto,
} from "./lib/api";
import { useI18n } from "./i18n/provider";
import { localeOptions, type AppLocale } from "./i18n";
import { formatCollectionDate, formatRelativeTime } from "./i18n/formatters";
import { getCategoryLabel } from "./i18n/categories";
import { parsePriceToNumber } from "./lib/currency";
import { buildWhatsappUrl } from "./lib/whatsapp";
import type {
  ActiveTab as SocialActiveTab,
  AppNotification as SocialAppNotification,
  Auth0User as SocialAuth0User,
  Company as SocialCompany,
  Post as SocialPost,
} from "./types";
import {
  AUTH0_AUDIENCE,
  AUTH0_DEBUG_LOGS,
  IS_AUTH0_CONFIGURED,
  writeAuth0Diagnostic,
} from "./lib/auth0-config";

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
  "Vintage",
  "Antiguidades",
  "Livros, Papelaria e Cursos",
  "Instrumentos Musicais",
  "Ferramentas e Construção",
  "Jardim e Pet",
  "Serviços",
  "Empregos",
  "Outros"
];
const ESTABLISHMENT_CATEGORIES = [
  "All",
  "Ristorante",
  "Bar",
  "Negozi",
  "Barbieri",
  "Palestre",
  "Officine",
  "Mercati",
  "Arredamento",
  "Elettronica",
  "Hotel",
  "Altro",
];
const USE_ELEGANT_PRODUCT_FILTER = true;
const USE_ART_GALLERY_PRODUCT_GRID = true;
const BRAND_NAME = "TempleSale";
const HOME_HERO_FALLBACK_IMAGE =
  "https://i.pinimg.com/1200x/47/38/db/4738dbf78874192b8e38d5eadf13717f.jpg";
const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/the.templesale/";
const CONTACT_EMAIL = "thetemplesale@gmail.com";
const PARTNER_PROMO_URL = "https://www.puntoescort.com/";
const PARTNER_PROMO_LOGO =
  "https://i.pinimg.com/736x/db/b4/39/dbb4391fea99581de1a5e4d2f02d2c7c.jpg";
const CART_STORAGE_KEY = "templesale_cart_items";
const CART_UNSEEN_STORAGE_KEY = "templesale_cart_unseen_alert";
const READ_NOTIFICATIONS_STORAGE_KEY = "templesale_read_notifications";
const MOBILE_INITIAL_PRODUCT_LIMIT = 30;
const MOBILE_MORE_PRODUCT_LIMIT = 20;
const DESKTOP_PRODUCT_LIMIT = 36;
const NOTIFICATIONS_POLL_INTERVAL_MS = 120000;
const NOTIFICATION_UNDO_TIMEOUT_MS = 5000;

function isMobileProductViewport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(max-width: 639px)").matches;
}

function getProductPageLimit(isLoadMore: boolean): number {
  if (isMobileProductViewport()) {
    return isLoadMore ? MOBILE_MORE_PRODUCT_LIMIT : MOBILE_INITIAL_PRODUCT_LIMIT;
  }
  return DESKTOP_PRODUCT_LIMIT;
}

function getScopedStorageKey(baseKey: string, userId?: number | null): string {
  const normalizedUserId = Number(userId);
  if (Number.isInteger(normalizedUserId) && normalizedUserId > 0) {
    return `${baseKey}:user:${normalizedUserId}`;
  }
  return `${baseKey}:guest`;
}

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

function normalizeProductSlug(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function resolveProductSlugFromPathname(pathname: string): string {
  const segments = String(pathname ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  if (segments.length !== 1) {
    return "";
  }

  try {
    return normalizeProductSlug(decodeURIComponent(segments[0]));
  } catch {
    return normalizeProductSlug(segments[0]);
  }
}

function buildProductPath(product: Product): string {
  const normalizedSlug = normalizeProductSlug(product.slug);
  if (normalizedSlug) {
    return `/${encodeURIComponent(normalizedSlug)}`;
  }
  return `/?product=${product.id}`;
}

function parseCartStorage(raw: string): Record<number, number> {
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

function readCartStorage(storageKey: string, fallbackKeys: string[] = []): Record<number, number> {
  if (typeof window === "undefined") {
    return {};
  }

  const keys = [storageKey, ...fallbackKeys];
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      continue;
    }
    return parseCartStorage(raw);
  }

  return {};
}

function readCartUnseenAlertStorage(storageKey: string, fallbackKeys: string[] = []): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const keys = [storageKey, ...fallbackKeys];
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      continue;
    }
    return raw === "1";
  }

  return false;
}

function readNotificationIdsStorage(storageKey: string): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  } catch {
    return [];
  }
}

export default function App() {
  const { locale, setLocale, t } = useI18n();
  const {
    getAccessTokenSilently,
    getIdTokenClaims,
    error: auth0Error,
    isAuthenticated: isAuth0Authenticated,
    isLoading: isAuth0Loading,
    logout: auth0Logout,
    user: auth0User,
  } = useAuth0();
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = React.useState(false);
  const [isUserOpen, setIsUserOpen] = React.useState(false);
  const [isMapOpen, setIsMapOpen] = React.useState(false);
  const [mapInitialCategory, setMapInitialCategory] = React.useState("All");
  const [mapOpenWithResults, setMapOpenWithResults] = React.useState(false);
  const [mapAutoFocusPanelSearch, setMapAutoFocusPanelSearch] = React.useState(false);
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
  const [products, setProducts] = React.useState<Product[]>([]);
  const [myProducts, setMyProducts] = React.useState<Product[]>([]);
  const [likedProducts, setLikedProducts] = React.useState<Product[]>([]);
  const [establishments, setEstablishments] = React.useState<EstablishmentDto[]>([]);
  const [myEstablishment, setMyEstablishment] = React.useState<EstablishmentDto | null>(null);
  const [selectedEstablishment, setSelectedEstablishment] = React.useState<EstablishmentDto | null>(null);
  const [, setSelectedEstablishmentProducts] = React.useState<Product[]>([]);
  const [selectedEstablishmentPublications, setSelectedEstablishmentPublications] = React.useState<PublicationDto[]>([]);
  const [selectedPublication, setSelectedPublication] = React.useState<PublicationDto | null>(null);
  const [focusedPublicationCommentId, setFocusedPublicationCommentId] = React.useState<number | null>(null);
  const [isEstablishmentPageOpen, setIsEstablishmentPageOpen] = React.useState(false);
  const [publicationFeed, setPublicationFeed] = React.useState<PublicationDto[]>([]);
  const [publicationCommentsById, setPublicationCommentsById] = React.useState<Record<number, ProductCommentDto[]>>({});
  const [isLoadingPublicationFeed, setIsLoadingPublicationFeed] = React.useState(true);
  const [isLoadingMorePublicationFeed, setIsLoadingMorePublicationFeed] = React.useState(false);
  const [hasMorePublicationFeed, setHasMorePublicationFeed] = React.useState(false);
  const [nextPublicationFeedOffset, setNextPublicationFeedOffset] = React.useState(0);
  const [publicationFeedError, setPublicationFeedError] = React.useState("");
  const [isLoadingEstablishments, setIsLoadingEstablishments] = React.useState(false);
  const activityOnboardingShownRef = React.useRef<number | null>(null);
  const [cartQuantitiesByProductId, setCartQuantitiesByProductId] = React.useState<Record<number, number>>(
    () =>
      readCartStorage(getScopedStorageKey(CART_STORAGE_KEY), [
        CART_STORAGE_KEY,
      ]),
  );
  const [hasUnseenCartAlert, setHasUnseenCartAlert] = React.useState<boolean>(
    () =>
      readCartUnseenAlertStorage(getScopedStorageKey(CART_UNSEEN_STORAGE_KEY), [
        CART_UNSEEN_STORAGE_KEY,
      ]),
  );
  const [notifications, setNotifications] = React.useState<NotificationDto[]>([]);
  const [readNotificationIds, setReadNotificationIds] = React.useState<string[]>([]);
  const [swipedNotificationId, setSwipedNotificationId] = React.useState<string | null>(null);
  const [deletedNotificationUndo, setDeletedNotificationUndo] = React.useState<{
    notification: NotificationDto;
  } | null>(null);
  const [focusedCommentId, setFocusedCommentId] = React.useState<number | null>(null);
  const [likersProduct, setLikersProduct] = React.useState<Product | null>(null);
  const [productLikers, setProductLikers] = React.useState<PublicLikerDto[]>([]);
  const [isLoadingProductLikers, setIsLoadingProductLikers] = React.useState(false);
  const [productLikersError, setProductLikersError] = React.useState("");
  const [heroDate, setHeroDate] = React.useState<Date>(() => new Date());
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = React.useState(false);
  const [hasMoreProducts, setHasMoreProducts] = React.useState(false);
  const [nextProductsOffset, setNextProductsOffset] = React.useState(0);
  const [productsError, setProductsError] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState("");
  const [socialActiveTab, setSocialActiveTab] = React.useState<SocialActiveTab>("feed");
  const [socialSelectedCompanyId, setSocialSelectedCompanyId] = React.useState<string>("");
  const [savedPublicationIds, setSavedPublicationIds] = React.useState<string[]>([]);
  const [cartToast, setCartToast] = React.useState<{
    id: number;
    message: string;
    variant: "success" | "warning";
  } | null>(null);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = React.useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = React.useState(false);
  const [avatarUploadError, setAvatarUploadError] = React.useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = React.useState(false);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = React.useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = React.useState<number | null>(null);
  const [mobileProductGridColumns, setMobileProductGridColumns] = React.useState<1 | 2>(1);
  const [desktopProductGridColumns, setDesktopProductGridColumns] = React.useState<2 | 3 | 4>(3);
  const cartToastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const productsRequestSequenceRef = React.useRef(0);
  const publicationsRequestSequenceRef = React.useRef(0);
  const auth0SyncAttemptedRef = React.useRef(false);
  const hasMemberAccess = Boolean(currentUser);
  const cartStorageKey = React.useMemo(
    () => getScopedStorageKey(CART_STORAGE_KEY, currentUser?.id),
    [currentUser?.id],
  );
  const cartUnseenStorageKey = React.useMemo(
    () => getScopedStorageKey(CART_UNSEEN_STORAGE_KEY, currentUser?.id),
    [currentUser?.id],
  );
  const readNotificationsStorageKey = React.useMemo(
    () => getScopedStorageKey(READ_NOTIFICATIONS_STORAGE_KEY, currentUser?.id),
    [currentUser?.id],
  );
  const isOverlayBlockingScroll =
    isAuthModalOpen ||
    isMenuOpen ||
    isUserOpen ||
    isMapOpen ||
    isVendedoresOpen ||
    Boolean(selectedProduct) ||
    (hasMemberAccess &&
      (isNewProductOpen ||
        Boolean(editingProduct) ||
        isMeusAnunciosOpen ||
        isCurtidasOpen ||
        isCartOpen ||
        isEditePerfilOpen));
  const hasRequiredProfileForPublishing = React.useMemo(() => {
    if (!currentUser) {
      return false;
    }

    const normalizedName = String(currentUser.name ?? "").trim();
    const normalizedWhatsapp = String(currentUser.whatsappNumber ?? "")
      .replace(/\D/g, "")
      .trim();
    const activityName = String(myEstablishment?.name ?? "").trim();
    const activityCategory = String(myEstablishment?.category ?? "").trim();
    const activityCity = String(myEstablishment?.city ?? "").trim();
    const activityWhatsapp = String(myEstablishment?.whatsappNumber ?? currentUser.whatsappNumber ?? "")
      .replace(/\D/g, "")
      .trim();

    return (
      normalizedName.length >= 2 &&
      normalizedWhatsapp.length >= 6 &&
      activityName.length >= 2 &&
      activityName !== normalizedName &&
      activityCategory.length >= 2 &&
      activityCategory !== "Altro" &&
      activityCity.length >= 2 &&
      activityWhatsapp.length >= 6
    );
  }, [currentUser, myEstablishment]);
  const memberName = currentUser?.name || t("Membro cadastrado");
  const memberEmail = String(currentUser?.email ?? "").trim();
  const memberAvatar =
    String(myEstablishment?.logoUrl ?? "").trim() ||
    String(currentUser?.avatarUrl ?? "").trim() ||
    "https://picsum.photos/seed/avatar/200/200";
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);
  const avatarButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const avatarPickerPanelRef = React.useRef<HTMLDivElement | null>(null);
  const notificationsButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const notificationsPanelRef = React.useRef<HTMLDivElement | null>(null);
  const notificationUndoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const homeSearchInputRef = React.useRef<HTMLInputElement | null>(null);
  const categoryDropdownRef = React.useRef<HTMLDivElement | null>(null);
  const hydratedCartStorageKeyRef = React.useRef<string | null>(null);
  const hydratedCartUnseenStorageKeyRef = React.useRef<string | null>(null);
  const hydratedReadNotificationsStorageKeyRef = React.useRef<string | null>(null);
  const heroCollectionLabel = React.useMemo(
    () => formatCollectionDate(heroDate, locale),
    [heroDate, locale],
  );

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const body = document.body;
    const unlockScroll = () => {
      if (!body.classList.contains("ts-scroll-lock")) {
        return;
      }
      const restoreY = Number(body.dataset.tsScrollLockY ?? "0");
      body.classList.remove("ts-scroll-lock");
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      delete body.dataset.tsScrollLockY;
      window.scrollTo(0, Number.isFinite(restoreY) ? restoreY : 0);
    };

    if (!isOverlayBlockingScroll) {
      unlockScroll();
      return;
    }

    if (!body.classList.contains("ts-scroll-lock")) {
      const currentY = window.scrollY || window.pageYOffset || 0;
      body.dataset.tsScrollLockY = String(currentY);
      body.classList.add("ts-scroll-lock");
      body.style.top = `-${currentY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
    }

    return () => {
      if (!isOverlayBlockingScroll) {
        unlockScroll();
      }
    };
  }, [isOverlayBlockingScroll]);

  React.useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const loadProductsPage = React.useCallback(
    async ({
      append,
      offset = 0,
      attempt = 0,
    }: {
      append: boolean;
      offset?: number;
      attempt?: number;
    }): Promise<void> => {
      const requestSequence = productsRequestSequenceRef.current + 1;
      productsRequestSequenceRef.current = requestSequence;
      const isLatestRequest = () => productsRequestSequenceRef.current === requestSequence;
      const limit = getProductPageLimit(append);

      if (append) {
        setIsLoadingMoreProducts(true);
      } else {
        setIsLoadingProducts(true);
        setProductsError("");
      }

      try {
        const page = await api.getProductsPage({
          limit,
          offset,
          search: debouncedSearchQuery,
          category: activeCategory,
          maxPrice:
            typeof maxPriceFilter === "number" && Number.isFinite(maxPriceFilter) && maxPriceFilter > 0
              ? maxPriceFilter
              : null,
        });

        if (!isLatestRequest()) {
          return;
        }

        setProducts((current) => {
          if (!append) {
            return asArray<Product>(page.products);
          }

          const nextById = new globalThis.Map<number, Product>();
          current.forEach((product) => nextById.set(product.id, product));
          asArray<Product>(page.products).forEach((product) => nextById.set(product.id, product));
          return Array.from(nextById.values());
        });
        setHasMoreProducts(page.hasMore);
        setNextProductsOffset(page.nextOffset);
        setProductsError("");
      } catch (err) {
        const maxRetries = append ? 1 : 4;
        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000);
          console.warn(
            `[products] Tentativa ${attempt + 1} falhou. Nova tentativa em ${delayMs}ms.`,
            err,
          );
          await new Promise<void>((resolve) => {
            globalThis.setTimeout(resolve, delayMs);
          });
          await loadProductsPage({ append, offset, attempt: attempt + 1 });
          return;
        }

        console.error("Error fetching products:", err);
        if (!isLatestRequest()) {
          return;
        }
        const message = err instanceof Error ? err.message : t("Falha ao carregar produtos.");
        setProductsError(message);
        if (!append) {
          setProducts([]);
          setHasMoreProducts(false);
          setNextProductsOffset(0);
        }
      } finally {
        if (!isLatestRequest()) {
          return;
        }
        if (append) {
          setIsLoadingMoreProducts(false);
        } else {
          setIsLoadingProducts(false);
        }
      }
    },
    [
      activeCategory,
      debouncedSearchQuery,
      maxPriceFilter,
      t,
    ],
  );

  React.useEffect(() => {
    void loadProductsPage({ append: false });
  }, [loadProductsPage]);

  const loadPublicationFeedPage = React.useCallback(
    async ({
      append,
      offset = 0,
    }: {
      append: boolean;
      offset?: number;
    }): Promise<void> => {
      const requestSequence = publicationsRequestSequenceRef.current + 1;
      publicationsRequestSequenceRef.current = requestSequence;
      const isLatestRequest = () => publicationsRequestSequenceRef.current === requestSequence;
      const limit = append ? 8 : 12;

      if (append) {
        setIsLoadingMorePublicationFeed(true);
      } else {
        setIsLoadingPublicationFeed(true);
        setPublicationFeedError("");
      }

      try {
        const page = await api.getPublicationsFeed({ limit, offset });
        if (!isLatestRequest()) {
          return;
        }
        setPublicationFeed((current) => {
          if (!append) {
            return page.publications;
          }
          const nextById = new globalThis.Map<number, PublicationDto>();
          current.forEach((publication) => nextById.set(publication.id, publication));
          page.publications.forEach((publication) => nextById.set(publication.id, publication));
          return [...nextById.values()];
        });
        setHasMorePublicationFeed(page.hasMore);
        setNextPublicationFeedOffset(page.nextOffset);
        setPublicationFeedError("");
      } catch (error) {
        console.error("Error fetching publication feed:", error);
        if (!isLatestRequest()) {
          return;
        }
        setPublicationFeedError(error instanceof Error ? error.message : t("Falha ao carregar publicações."));
        if (!append) {
          setPublicationFeed([]);
          setHasMorePublicationFeed(false);
          setNextPublicationFeedOffset(0);
        }
      } finally {
        if (!isLatestRequest()) {
          return;
        }
        if (append) {
          setIsLoadingMorePublicationFeed(false);
        } else {
          setIsLoadingPublicationFeed(false);
        }
      }
    },
    [t],
  );

  React.useEffect(() => {
    void loadPublicationFeedPage({ append: false });
  }, [loadPublicationFeedPage]);

  React.useEffect(() => {
    const missingPublicationIds = publicationFeed
      .map((publication) => publication.id)
      .filter((publicationId) => !(publicationId in publicationCommentsById))
      .slice(0, 20);

    if (missingPublicationIds.length === 0) {
      return;
    }

    let isActive = true;
    void Promise.all(
      missingPublicationIds.map(async (publicationId) => {
        try {
          const comments = await api.getPublicationComments(publicationId);
          return [publicationId, comments] as const;
        } catch (error) {
          console.error("Error loading publication comments for feed:", error);
          return [publicationId, []] as const;
        }
      }),
    ).then((entries) => {
      if (!isActive) {
        return;
      }
      setPublicationCommentsById((current) => {
        const next = { ...current };
        entries.forEach(([publicationId, comments]) => {
          next[publicationId] = comments;
        });
        return next;
      });
    });

    return () => {
      isActive = false;
    };
  }, [publicationCommentsById, publicationFeed]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoadingEstablishments(true);
      try {
        const list = await api.getEstablishments({
          search: debouncedSearchQuery,
          category: activeCategory,
          limit: 80,
        });
        if (!cancelled) {
          setEstablishments(list);
        }
      } catch (error) {
        console.error("Error fetching establishments:", error);
        if (!cancelled) {
          setEstablishments([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEstablishments(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCategory, debouncedSearchQuery]);

  React.useEffect(() => {
    let cancelled = false;
    if (!currentUser) {
      setMyEstablishment(null);
      activityOnboardingShownRef.current = null;
      return;
    }
    void (async () => {
      try {
        const establishment = await api.getMyEstablishment();
        if (!cancelled) {
          setMyEstablishment(establishment);
        }
      } catch (error) {
        console.error("Error fetching my establishment:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  React.useEffect(() => {
    if (!currentUser || !myEstablishment) {
      return;
    }
    if (activityOnboardingShownRef.current === currentUser.id) {
      return;
    }
    const normalizedActivityName = String(myEstablishment.name ?? "").trim();
    const normalizedUserName = String(currentUser.name ?? "").trim();
    const missingActivityFields = [
      normalizedActivityName.length < 2 || normalizedActivityName === normalizedUserName
        ? t("nome da attività")
        : "",
      myEstablishment.category === "Altro" ? t("categoria") : "",
      !String(myEstablishment.city ?? "").trim() ? t("cidade") : "",
      !String(myEstablishment.whatsappNumber ?? "").replace(/\D/g, "").trim()
        ? t("WhatsApp")
        : "",
    ].filter(Boolean);
    const needsActivityProfile =
      missingActivityFields.length > 0;

    if (!needsActivityProfile) {
      return;
    }

    activityOnboardingShownRef.current = currentUser.id;
    setProfileCompletionMessage(
      t("Complete i dati della tua attività per pubblicare e apparire nella Home.") +
        ` ${t("Falta")}: ${missingActivityFields.join(", ")}.`,
    );
    setIsEditePerfilOpen(true);
    setIsUserOpen(false);
  }, [currentUser, myEstablishment, t]);

  const handleLoadMoreProducts = React.useCallback(() => {
    if (isLoadingProducts || isLoadingMoreProducts || !hasMoreProducts) {
      return;
    }
    void loadProductsPage({ append: true, offset: nextProductsOffset });
  }, [
    hasMoreProducts,
    isLoadingMoreProducts,
    isLoadingProducts,
    loadProductsPage,
    nextProductsOffset,
  ]);

  React.useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (!api.hasLocalAuthToken()) {
        setCurrentUser(null);
        return;
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

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (auth0Error) {
      writeAuth0Diagnostic("sdk-error", {
        error: auth0Error.message,
        name: auth0Error.name,
      });
    }
    if (AUTH0_DEBUG_LOGS) {
      console.info("[auth0] state", {
        isConfigured: IS_AUTH0_CONFIGURED,
        isLoading: isAuth0Loading,
        isAuthenticated: isAuth0Authenticated,
        email: auth0User?.email,
        audience: AUTH0_AUDIENCE || "(none)",
        error: auth0Error?.message,
      });
    }
    if (!IS_AUTH0_CONFIGURED || isAuth0Loading || !isAuth0Authenticated) {
      if (!isAuth0Authenticated) {
        auth0SyncAttemptedRef.current = false;
      }
      return;
    }
    if (auth0SyncAttemptedRef.current) {
      return;
    }

    let cancelled = false;
    auth0SyncAttemptedRef.current = true;

    const syncAuth0Session = async () => {
      try {
        writeAuth0Diagnostic("sync-started", {
          email: auth0User?.email,
          audience: AUTH0_AUDIENCE || "(none)",
        });
        const idToken = String(
          ((await getIdTokenClaims()) as { __raw?: string } | undefined)?.__raw ?? "",
        );
        const token = AUTH0_AUDIENCE
          ? await getAccessTokenSilently({
              authorizationParams: { audience: AUTH0_AUDIENCE },
            })
          : idToken;
        if (!token) {
          throw new Error("Auth0 não retornou token para sincronizar sessão.");
        }

        const user = await api.syncAuth0(token, idToken);
        if (!cancelled) {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          writeAuth0Diagnostic("sync-completed", {
            userId: user.id,
            email: user.email,
          });
        }
      } catch (error) {
        auth0SyncAttemptedRef.current = false;
        writeAuth0Diagnostic("sync-failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        if (AUTH0_DEBUG_LOGS) {
          console.error("[auth0] getAccessTokenSilently/sync error", error);
        }
      }
    };

    void syncAuth0Session();

    return () => {
      cancelled = true;
    };
  }, [
    getAccessTokenSilently,
    getIdTokenClaims,
    auth0User?.email,
    auth0Error,
    isAuth0Authenticated,
    isAuth0Loading,
  ]);

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
    const preferredLocale = currentUser?.preferredLocale;
    if (!preferredLocale) {
      return;
    }
    if (preferredLocale !== locale) {
      setLocale(preferredLocale);
    }
  }, [currentUser?.id, currentUser?.preferredLocale, locale, setLocale]);

  React.useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

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
      }
    };

    void fetchNotifications();
    if (currentUser) {
      const notificationEventsUrl = api.getNotificationEventsUrl();
      let notificationEvents: EventSource | null = null;

      if (notificationEventsUrl && typeof window !== "undefined" && "EventSource" in window) {
        notificationEvents = new EventSource(notificationEventsUrl, { withCredentials: true });
        notificationEvents.addEventListener("ready", () => {
          void fetchNotifications();
        });
        notificationEvents.addEventListener("notifications-changed", () => {
          void fetchNotifications();
        });
        notificationEvents.onerror = (error) => {
          console.warn("Notification live stream disconnected; fallback refresh is active.", error);
        };
      }

      intervalId = setInterval(() => {
        void fetchNotifications();
      }, NOTIFICATIONS_POLL_INTERVAL_MS);

      return () => {
        cancelled = true;
        notificationEvents?.close();
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentUser?.id]);

  React.useEffect(() => {
    return () => {
      if (notificationUndoTimerRef.current) {
        clearTimeout(notificationUndoTimerRef.current);
        notificationUndoTimerRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (!currentUser) {
      setReadNotificationIds([]);
      hydratedReadNotificationsStorageKeyRef.current = null;
      return;
    }
    setReadNotificationIds(readNotificationIdsStorage(readNotificationsStorageKey));
    hydratedReadNotificationsStorageKeyRef.current = readNotificationsStorageKey;
  }, [currentUser?.id, readNotificationsStorageKey]);

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
    if (!isCategoryDropdownOpen && !isPriceDropdownOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (categoryDropdownRef.current?.contains(target)) {
        return;
      }
      setIsCategoryDropdownOpen(false);
      setIsPriceDropdownOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCategoryDropdownOpen(false);
        setIsPriceDropdownOpen(false);
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
  }, [isCategoryDropdownOpen, isPriceDropdownOpen]);

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
    setCartQuantitiesByProductId(
      readCartStorage(cartStorageKey, [CART_STORAGE_KEY]),
    );
    setHasUnseenCartAlert(
      readCartUnseenAlertStorage(cartUnseenStorageKey, [CART_UNSEEN_STORAGE_KEY]),
    );
    hydratedCartStorageKeyRef.current = cartStorageKey;
    hydratedCartUnseenStorageKeyRef.current = cartUnseenStorageKey;
  }, [cartStorageKey, cartUnseenStorageKey]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !currentUser) {
      return;
    }
    if (hydratedReadNotificationsStorageKeyRef.current !== readNotificationsStorageKey) {
      return;
    }
    window.localStorage.setItem(readNotificationsStorageKey, JSON.stringify(readNotificationIds));
  }, [currentUser?.id, readNotificationIds, readNotificationsStorageKey]);

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
    if (hydratedCartStorageKeyRef.current !== cartStorageKey) {
      return;
    }
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cartQuantitiesByProductId));
  }, [cartQuantitiesByProductId, cartStorageKey]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (hydratedCartUnseenStorageKeyRef.current !== cartUnseenStorageKey) {
      return;
    }
    window.localStorage.setItem(cartUnseenStorageKey, hasUnseenCartAlert ? "1" : "0");
  }, [hasUnseenCartAlert, cartUnseenStorageKey]);

  const clearLocalAuth0Cache = () => {
    if (typeof window === "undefined") {
      return;
    }

    [window.localStorage, window.sessionStorage].forEach((storage) => {
      const keysToRemove: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (!key) {
          continue;
        }
        if (
          key.startsWith("@@auth0spajs@@") ||
          key.startsWith("auth0.") ||
          key === "templesale_auth0_diagnostic"
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => storage.removeItem(key));
    });
  };

  const clearUserSessionState = () => {
    setCurrentUser(null);
    setMyProducts([]);
    setLikedProducts([]);
    setNotifications([]);
    setReadNotificationIds([]);
    setEditingProduct(null);
    setIsUserOpen(false);
    setIsMenuOpen(false);
    setIsLanguageMenuOpen(false);
    setIsMapOpen(false);
    setIsCurtidasOpen(false);
    setProfileCompletionMessage("");
    setIsAvatarPickerOpen(false);
    setIsAvatarUploading(false);
    setAvatarUploadError("");
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Error logging out:", err);
    }

    auth0SyncAttemptedRef.current = false;
    clearLocalAuth0Cache();
    clearUserSessionState();

    if (IS_AUTH0_CONFIGURED && isAuth0Authenticated) {
      await auth0Logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
    }
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

  const handleLocaleChange = React.useCallback(
    (nextLocale: AppLocale) => {
      setLocale(nextLocale);
      if (!currentUser) {
        return;
      }

      setCurrentUser((prev) =>
        prev ? { ...prev, preferredLocale: nextLocale } : prev,
      );

      void api
        .updatePreferredLocale(nextLocale)
        .then((updatedUser) => {
          if (!updatedUser) {
            return;
          }
          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  ...updatedUser,
                  preferredLocale: updatedUser.preferredLocale ?? nextLocale,
                }
              : prev,
          );
        })
        .catch((error) => {
          console.error("Error updating preferred locale:", error);
        });
    },
    [currentUser, setLocale],
  );

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
    if (isLoadingProducts || productsById.size === 0) {
      return;
    }

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
  }, [productsById, isLoadingProducts]);

  const readNotificationIdSet = React.useMemo(
    () => new Set(readNotificationIds),
    [readNotificationIds],
  );
  const containsBrandName = React.useCallback((value: string) => {
    return value.toLowerCase().includes("templesale");
  }, []);
  const getNotificationPresentation = React.useCallback(
    (notification: NotificationDto) => {
      const actorName =
        String(("actorName" in notification ? notification.actorName : "") ?? "").trim() ||
        t("Alguém");
      const productName =
        String(("productName" in notification ? notification.productName : "") ?? "").trim() ||
        t("seu anúncio");

      if (notification.type === "product_like") {
        return {
          title: t("Nova curtida"),
          message: t('{actor} curtiu seu anúncio "{product}".', {
            actor: actorName,
            product: productName,
          }),
        };
      }

      if (notification.type === "product_cart_interest") {
        return {
          title: t("Novo interesse no carrinho"),
          message: t('{actor} adicionou seu anúncio "{product}" ao carrinho.', {
            actor: actorName,
            product: productName,
          }),
        };
      }

      if (notification.type === "product_comment") {
        return {
          title: t("Novo comentário na publicação"),
          message: t('{actor} comentou na sua publicação "{product}".', {
            actor: actorName,
            product: productName,
          }),
        };
      }

      if (notification.type === "publication_comment") {
        return {
          title: t("Nuovo commento"),
          message: t("{actor} ha commentato la tua pubblicazione.", {
            actor: actorName,
          }),
        };
      }

      return {
        title: notification.title,
        message: notification.message,
      };
    },
    [t],
  );
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

  React.useEffect(() => {
    if (!isNotificationsOpen || notificationsToDisplay.length === 0) {
      return;
    }

    setReadNotificationIds((current) => {
      const readSet = new Set(current);
      let changed = false;

      notificationsToDisplay.forEach((notification) => {
        if (readSet.has(notification.id)) {
          return;
        }
        readSet.add(notification.id);
        changed = true;
      });

      if (!changed) {
        return current;
      }
      return Array.from(readSet);
    });
  }, [isNotificationsOpen, notificationsToDisplay]);

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

  const openProductDetails = React.useCallback((product: Product, options?: { focusCommentId?: number | null }) => {
    if (typeof window !== "undefined") {
      const nextPath = buildProductPath(product);
      const currentLocation = `${window.location.pathname}${window.location.search}`;
      const targetLocation = new URL(nextPath, window.location.origin);
      const nextLocation = `${targetLocation.pathname}${targetLocation.search}`;
      if (currentLocation !== nextLocation) {
        window.history.pushState({ productId: product.id }, "", nextLocation);
      }
    }

    setFocusedCommentId(options?.focusCommentId ?? null);
    setSelectedProduct(product);

    void api.trackProductClick(product.id).catch((error) => {
      console.error("Error tracking product click:", error);
    });
  }, []);

  const openEstablishmentPage = React.useCallback(async (establishment: EstablishmentDto | number | string) => {
    const idOrSlug =
      typeof establishment === "object"
        ? establishment.slug || establishment.id
        : establishment;
    const cachedEstablishment =
      typeof establishment === "object"
        ? establishment
        : establishments.find(
            (item) =>
              String(item.id) === String(establishment) ||
              String(item.slug ?? "") === String(establishment),
          ) ?? null;
    if (cachedEstablishment) {
      setSelectedEstablishment(cachedEstablishment);
      setSelectedEstablishmentProducts([]);
      setSelectedEstablishmentPublications([]);
      setIsEstablishmentPageOpen(true);
      if (typeof window !== "undefined") {
        window.history.pushState(
          { establishmentId: cachedEstablishment.id },
          "",
          `/attivita/${encodeURIComponent(cachedEstablishment.slug || String(cachedEstablishment.id))}`,
        );
      }
    }
    try {
      const payload = await api.getEstablishment(idOrSlug);
      setSelectedEstablishment(payload.establishment);
      setSelectedEstablishmentProducts(payload.products as Product[]);
      setSelectedEstablishmentPublications(payload.publications);
      setIsEstablishmentPageOpen(true);
      if (typeof window !== "undefined") {
        window.history.pushState(
          { establishmentId: payload.establishment.id },
          "",
          `/attivita/${encodeURIComponent(payload.establishment.slug || String(payload.establishment.id))}`,
        );
      }
    } catch (error) {
      console.error("Error opening establishment:", error);
    }
  }, [establishments]);

  const closeEstablishmentPage = React.useCallback(() => {
    setIsEstablishmentPageOpen(false);
    setSelectedEstablishment(null);
    setSelectedEstablishmentProducts([]);
    setSelectedEstablishmentPublications([]);
    setSelectedPublication(null);
    setFocusedPublicationCommentId(null);
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/attivita/")) {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const handleProductDetailsClose = React.useCallback(() => {
    setSelectedProduct(null);
    setFocusedCommentId(null);

    if (typeof window !== "undefined") {
      const currentLocation = `${window.location.pathname}${window.location.search}`;
      if (currentLocation !== "/") {
        window.history.replaceState({}, "", "/");
      }
    }
  }, []);

  const hasResolvedProductFromUrl = React.useRef(false);
  React.useEffect(() => {
    if (hasResolvedProductFromUrl.current) {
      return;
    }
    if (products.length === 0 || typeof window === "undefined") {
      return;
    }

    const establishmentMatch = window.location.pathname.match(/^\/attivita\/([^/]+)\/?$/);
    if (establishmentMatch?.[1]) {
      hasResolvedProductFromUrl.current = true;
      void openEstablishmentPage(decodeURIComponent(establishmentMatch[1]));
      return;
    }

    const slugFromPathname = resolveProductSlugFromPathname(window.location.pathname);
    if (slugFromPathname) {
      const sharedBySlug = products.find(
        (item) => normalizeProductSlug(item.slug) === slugFromPathname,
      );
      if (sharedBySlug) {
        setSelectedProduct(sharedBySlug);
        hasResolvedProductFromUrl.current = true;
        return;
      }
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
  }, [products, openEstablishmentPage]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncSelectedProductFromUrl = () => {
      const establishmentMatch = window.location.pathname.match(/^\/attivita\/([^/]+)\/?$/);
      if (establishmentMatch?.[1]) {
        setSelectedProduct(null);
        void openEstablishmentPage(decodeURIComponent(establishmentMatch[1]));
        return;
      }

      const slugFromPathname = resolveProductSlugFromPathname(window.location.pathname);
      if (slugFromPathname) {
        const sharedBySlug = products.find(
          (item) => normalizeProductSlug(item.slug) === slugFromPathname,
        );
        setSelectedProduct(sharedBySlug ?? null);
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const rawProductId = searchParams.get("product");
      const productId = Number(rawProductId);
      if (Number.isInteger(productId) && productId > 0) {
        const sharedProduct = products.find((item) => item.id === productId);
        setSelectedProduct(sharedProduct ?? null);
        return;
      }

      setSelectedProduct(null);
    };

    const handlePopState = () => {
      syncSelectedProductFromUrl();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [products, openEstablishmentPage]);

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

      void api.notifyProductCartInterest(product.id).catch((error) => {
        console.error("Error notifying product cart interest:", error);
      });

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

  const resolveProductForNotification = async (productId?: number) => {
    if (!productId) {
      return null;
    }

    const existingProduct =
      products.find((product) => product.id === productId) ??
      myProducts.find((product) => product.id === productId) ??
      likedProducts.find((product) => product.id === productId);
    if (existingProduct) {
      return existingProduct;
    }

    try {
      return await api.getProductById(productId);
    } catch (error) {
      console.error("Error loading notification product:", error);
      return null;
    }
  };

  const openProductLikers = async (product: Product) => {
    setLikersProduct(product);
    setProductLikers([]);
    setProductLikersError("");
    setIsLoadingProductLikers(true);
    try {
      const users = await api.getProductLikers(product.id);
      setProductLikers(users);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("Não foi possível carregar as curtidas.");
      setProductLikersError(message);
    } finally {
      setIsLoadingProductLikers(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationDto) => {
    markNotificationAsRead(notification.id);
    setSwipedNotificationId(null);
    if (notification.type === "publication_comment" && notification.publicationId) {
      try {
        const payload = await api.getPublication(notification.publicationId);
        setSelectedEstablishment(payload.establishment);
        setSelectedPublication(payload.publication);
        setFocusedPublicationCommentId(notification.commentId ?? null);
        setIsEstablishmentPageOpen(true);
        setIsNotificationsOpen(false);
        if (typeof window !== "undefined") {
          window.history.pushState(
            { establishmentId: payload.establishment.id, publicationId: payload.publication.id },
            "",
            `/attivita/${encodeURIComponent(payload.establishment.slug || String(payload.establishment.id))}`,
          );
        }
      } catch (error) {
        console.error("Error loading notification publication:", error);
      }
      return;
    }
    if (!("productId" in notification) || !notification.productId) {
      return;
    }

    const product = await resolveProductForNotification(notification.productId);
    if (!product) {
      return;
    }

    setIsNotificationsOpen(false);
    openProductDetails(product, {
      focusCommentId: notification.type === "product_comment" ? notification.commentId ?? null : null,
    });
    if (notification.type === "product_like") {
      void openProductLikers(product);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const notificationToDelete = notificationsToDisplay.find((notification) => notification.id === notificationId);

    if (notificationUndoTimerRef.current) {
      clearTimeout(notificationUndoTimerRef.current);
      notificationUndoTimerRef.current = null;
    }

    if (notificationToDelete) {
      setDeletedNotificationUndo({ notification: notificationToDelete });
      notificationUndoTimerRef.current = setTimeout(() => {
        setDeletedNotificationUndo(null);
        notificationUndoTimerRef.current = null;
      }, NOTIFICATION_UNDO_TIMEOUT_MS);
    }

    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
    setReadNotificationIds((current) => current.filter((id) => id !== notificationId));
    setSwipedNotificationId(null);

    try {
      await api.deleteNotification(notificationId);
    } catch (error) {
      console.error("Error deleting notification:", error);
      setDeletedNotificationUndo(null);
      void api.getNotifications().then((data) => setNotifications(asArray<NotificationDto>(data))).catch(() => {});
    }
  };

  const handleUndoDeleteNotification = async () => {
    if (!deletedNotificationUndo) {
      return;
    }

    const { notification } = deletedNotificationUndo;
    if (notificationUndoTimerRef.current) {
      clearTimeout(notificationUndoTimerRef.current);
      notificationUndoTimerRef.current = null;
    }

    setDeletedNotificationUndo(null);
    setNotifications((current) => {
      if (current.some((item) => item.id === notification.id)) {
        return current;
      }
      return [...current, notification].sort((a, b) => b.createdAt - a.createdAt);
    });

    try {
      await api.restoreNotification(notification.id);
    } catch (error) {
      console.error("Error restoring notification:", error);
      void api.getNotifications().then((data) => setNotifications(asArray<NotificationDto>(data))).catch(() => {});
    }
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

  const handleProfileSave = async (
    profileData: UpdateProfileInput,
    establishmentData?: Partial<EstablishmentDto>,
  ) => {
    const updatedUser = await api.updateProfile(profileData);
    const mergedUser: SessionUser = {
      ...(currentUser ?? updatedUser),
      ...updatedUser,
      name: updatedUser.name || profileData.name,
      whatsappCountryIso:
        updatedUser.whatsappCountryIso || profileData.whatsappCountryIso,
      whatsappNumber: updatedUser.whatsappNumber || profileData.whatsappNumber,
    };
    let establishmentLatitude =
      typeof establishmentData?.latitude === "number" && Number.isFinite(establishmentData.latitude)
        ? establishmentData.latitude
        : myEstablishment?.latitude;
    let establishmentLongitude =
      typeof establishmentData?.longitude === "number" && Number.isFinite(establishmentData.longitude)
        ? establishmentData.longitude
        : myEstablishment?.longitude;
    if (
      (typeof establishmentLatitude !== "number" || typeof establishmentLongitude !== "number") &&
      (establishmentData?.address || establishmentData?.city || profileData.city)
    ) {
      const lookupQuery = [
        establishmentData?.address,
        establishmentData?.city ?? profileData.city,
        profileData.state,
        profileData.country || "Italia",
      ]
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(", ");
      const geocoded = lookupQuery ? await api.geocodeLocation(lookupQuery).catch(() => null) : null;
      if (geocoded) {
        establishmentLatitude = geocoded.latitude;
        establishmentLongitude = geocoded.longitude;
      }
    }

    if (
      typeof establishmentLatitude === "number" &&
      typeof establishmentLongitude === "number"
    ) {
      const updatedLocationUser = await api.updateProfileLocation(
        establishmentLatitude,
        establishmentLongitude,
      ).catch(() => null);
      if (updatedLocationUser) {
        mergedUser.locationLatitude = updatedLocationUser.locationLatitude;
        mergedUser.locationLongitude = updatedLocationUser.locationLongitude;
      } else {
        mergedUser.locationLatitude = establishmentLatitude;
        mergedUser.locationLongitude = establishmentLongitude;
      }
    }

    setCurrentUser(mergedUser);
    syncSellerProfileAcrossProducts(mergedUser);
    const savedEstablishment = await api.saveEstablishment({
      id: establishmentData?.id ?? myEstablishment?.id,
      name: establishmentData?.name ?? myEstablishment?.name ?? mergedUser.name,
      category: establishmentData?.category ?? myEstablishment?.category ?? "Altro",
      description: establishmentData?.description ?? myEstablishment?.description ?? "",
      openingHours: establishmentData?.openingHours ?? myEstablishment?.openingHours ?? "",
      city: establishmentData?.city ?? mergedUser.city,
      address:
        establishmentData?.address ??
        [mergedUser.street, mergedUser.neighborhood].filter(Boolean).join(", "),
      latitude: establishmentLatitude,
      longitude: establishmentLongitude,
      whatsappCountryIso: establishmentData?.whatsappCountryIso ?? mergedUser.whatsappCountryIso,
      whatsappNumber: establishmentData?.whatsappNumber ?? mergedUser.whatsappNumber,
      phone: establishmentData?.phone ?? mergedUser.whatsappNumber,
    });
    setMyEstablishment(savedEstablishment);
    setEstablishments((current) => {
      const withoutCurrent = current.filter((item) => item.id !== savedEstablishment.id);
      return [savedEstablishment, ...withoutCurrent];
    });
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
      const savedEstablishment = await api.saveEstablishment({
        id: myEstablishment?.id,
        name: myEstablishment?.name || mergedUser.name,
        category: myEstablishment?.category || "Altro",
        logoUrl: uploadResult.url,
        coverUrl: myEstablishment?.coverUrl || "",
        description: myEstablishment?.description || "",
        openingHours: myEstablishment?.openingHours || "",
        city: myEstablishment?.city || mergedUser.city || "",
        address:
          myEstablishment?.address ||
          [mergedUser.street, mergedUser.neighborhood].filter(Boolean).join(", "),
        latitude: myEstablishment?.latitude,
        longitude: myEstablishment?.longitude,
        whatsappCountryIso: myEstablishment?.whatsappCountryIso || mergedUser.whatsappCountryIso || "IT",
        whatsappNumber: myEstablishment?.whatsappNumber || mergedUser.whatsappNumber || "",
        phone: myEstablishment?.phone || mergedUser.whatsappNumber || "",
      });
      setCurrentUser(mergedUser);
      setMyEstablishment(savedEstablishment);
      setEstablishments((current) => {
        const withoutCurrent = current.filter((item) => item.id !== savedEstablishment.id);
        return [savedEstablishment, ...withoutCurrent];
      });
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
        t("Complete nome, categoria, cidade e WhatsApp da sua attività antes de publicar."),
      );
      setIsEditePerfilOpen(true);
      return;
    }

    setProfileCompletionMessage("");
    setIsEditePerfilOpen(false);
    setIsNewProductOpen(true);
  };

  const openMapWithSearch = React.useCallback(
    (category?: string) => {
      const normalizedCategory = String(category ?? activeCategory).trim() || "All";
      setMapInitialCategory(normalizedCategory);
      setMapOpenWithResults(true);
      setMapAutoFocusPanelSearch(true);
      setIsMenuOpen(false);
      setIsMapOpen(true);
    },
    [activeCategory],
  );

  const openMapDefault = React.useCallback(() => {
    const normalizedCategory = String(activeCategory).trim() || "All";
    setMapInitialCategory(normalizedCategory);
    setMapOpenWithResults(false);
    setMapAutoFocusPanelSearch(false);
    setIsMenuOpen(false);
    setIsMapOpen(true);
  }, [activeCategory]);

  const scrollPageToTop = React.useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const applyScrollTop = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch {
        window.scrollTo(0, 0);
      }

      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    applyScrollTop();
    window.requestAnimationFrame(applyScrollTop);
    window.setTimeout(applyScrollTop, 60);
  }, []);

  const handleCategorySelect = React.useCallback(
    (categoryKey: string) => {
      setActiveCategory(categoryKey);
      scrollPageToTop();
    },
    [scrollPageToTop],
  );

  const handleSearchQueryChange = React.useCallback(
    (nextSearchQuery: string) => {
      setSearchQuery(nextSearchQuery);
      scrollPageToTop();
    },
    [scrollPageToTop],
  );

  const catalogProducts = products;

  const availableCategoryFilters = React.useMemo(() => {
    const knownCategories = ESTABLISHMENT_CATEGORIES.filter((category) => category !== "All");
    const categoryCounts = new globalThis.Map<string, number>();
    establishments.forEach((establishment) => {
      const category = String(establishment.category ?? "").trim();
      if (!category) {
        return;
      }
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    });

    const knownSet = new Set<string>(knownCategories);
    const customCategoriesWithProducts = Array.from(categoryCounts.keys()) as string[];
    const filteredCustomCategories = customCategoriesWithProducts
      .filter((category) => !knownSet.has(category))
      .sort((a, b) => a.localeCompare(b, locale));

    return [
      {
        key: "All",
        count: establishments.length,
      },
      ...knownCategories.map((category) => ({
        key: category,
        count: categoryCounts.get(category) ?? 0,
      })),
      ...filteredCustomCategories.map((category) => ({
        key: category,
        count: categoryCounts.get(category) ?? 0,
      })),
    ];
  }, [establishments, locale]);

  const priceSliderMax = React.useMemo(() => {
    const rawMaxPrice = catalogProducts.reduce((highest, product) => {
      if (product.priceNegotiable) {
        return highest;
      }
      const parsedPrice = parsePriceToNumber(String(product.price ?? ""));
      if (parsedPrice === null || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return highest;
      }
      return Math.max(highest, parsedPrice);
    }, 0);

    const activeMaxPrice =
      typeof maxPriceFilter === "number" && Number.isFinite(maxPriceFilter) ? maxPriceFilter : 0;
    const resolvedMaxPrice = Math.max(rawMaxPrice, activeMaxPrice);

    if (resolvedMaxPrice <= 0) {
      return 1000;
    }

    const roundingBase =
      resolvedMaxPrice <= 100 ? 10 : resolvedMaxPrice <= 1000 ? 50 : resolvedMaxPrice <= 5000 ? 100 : 500;
    return Math.ceil(resolvedMaxPrice / roundingBase) * roundingBase;
  }, [catalogProducts, maxPriceFilter]);

  const priceSliderStep = React.useMemo(() => {
    if (priceSliderMax <= 100) {
      return 1;
    }
    if (priceSliderMax <= 1000) {
      return 10;
    }
    if (priceSliderMax <= 5000) {
      return 50;
    }
    return 100;
  }, [priceSliderMax]);

  const hasMaxPriceFilter =
    typeof maxPriceFilter === "number" &&
    Number.isFinite(maxPriceFilter) &&
    maxPriceFilter > 0;
  const effectivePriceSliderValue = hasMaxPriceFilter ? maxPriceFilter : priceSliderMax;
  const formatSliderEuro = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(Math.max(0, value));

  const filteredProducts = React.useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const resolvedMaxPriceFilter = hasMaxPriceFilter ? maxPriceFilter : null;

    return catalogProducts
      .filter((product) => {
        const matchesCategory =
          activeCategory === "All" ||
          product.establishmentCategory === activeCategory ||
          product.category === activeCategory;
        const matchesSearch =
          normalizedSearch === "" ||
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.category.toLowerCase().includes(normalizedSearch) ||
          String(product.sectionName ?? "").toLowerCase().includes(normalizedSearch) ||
          String(product.establishmentName ?? "").toLowerCase().includes(normalizedSearch) ||
          String(product.establishmentCategory ?? "").toLowerCase().includes(normalizedSearch) ||
          String(product.description ?? "").toLowerCase().includes(normalizedSearch) ||
          String(product.city ?? "").toLowerCase().includes(normalizedSearch) ||
          String(product.sellerName ?? "").toLowerCase().includes(normalizedSearch);
        const matchesPrice =
          resolvedMaxPriceFilter === null ||
          (!product.priceNegotiable &&
            (() => {
              const productPrice = parsePriceToNumber(String(product.price ?? ""));
              return productPrice !== null && productPrice <= resolvedMaxPriceFilter;
            })());
        return matchesCategory && matchesSearch && matchesPrice;
      })
      .sort((left, right) => {
        const clickDiff =
          Math.max(0, Number(right.clickCount ?? 0)) - Math.max(0, Number(left.clickCount ?? 0));
        if (clickDiff !== 0) {
          return clickDiff;
        }
        return right.id - left.id;
      });
  }, [catalogProducts, activeCategory, searchQuery, hasMaxPriceFilter, maxPriceFilter]);

  const visibleEstablishments = React.useMemo(() => establishments, [establishments]);
  const isDiscoveryMode = React.useMemo(
    () => debouncedSearchQuery.trim().length > 0 || activeCategory !== "All",
    [activeCategory, debouncedSearchQuery],
  );
  const buildEstablishmentFromPublication = React.useCallback(
    (publication: PublicationDto): EstablishmentDto => {
      const existing =
        establishments.find((item) => item.id === publication.establishmentId) ??
        (selectedEstablishment?.id === publication.establishmentId ? selectedEstablishment : null);
      return {
        id: publication.establishmentId,
        ownerId: publication.ownerId,
        name: publication.establishmentName || existing?.name || t("Attività"),
        slug: publication.establishmentSlug || existing?.slug || String(publication.establishmentId),
        category: publication.establishmentCategory || existing?.category || "Altro",
        logoUrl: publication.establishmentLogoUrl || existing?.logoUrl || "",
        coverUrl: publication.establishmentCoverUrl || existing?.coverUrl || "",
        description: existing?.description || "",
        city: publication.establishmentCity || existing?.city || "",
        address: existing?.address || "",
        latitude: existing?.latitude,
        longitude: existing?.longitude,
        whatsappCountryIso: existing?.whatsappCountryIso,
        whatsappNumber: existing?.whatsappNumber,
        phone: existing?.phone,
        openingHours: existing?.openingHours,
        keywords: existing?.keywords ?? [],
        isActive: existing?.isActive ?? true,
        productCount: existing?.productCount ?? 0,
        publicationCount: existing?.publicationCount,
        sections: existing?.sections,
      };
    },
    [establishments, selectedEstablishment, t],
  );

  const productGridClassName = React.useMemo(() => {
    if (!USE_ART_GALLERY_PRODUCT_GRID) {
      return "grid grid-cols-2 items-stretch gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4";
    }
    if (mobileProductGridColumns === 1 && desktopProductGridColumns === 2) {
      return "grid grid-cols-1 items-stretch gap-x-3 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-2";
    }
    if (mobileProductGridColumns === 1 && desktopProductGridColumns === 3) {
      return "grid grid-cols-1 items-stretch gap-x-3 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-3";
    }
    if (mobileProductGridColumns === 1 && desktopProductGridColumns === 4) {
      return "grid grid-cols-1 items-stretch gap-x-3 gap-y-8 sm:gap-x-8 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4";
    }
    if (mobileProductGridColumns === 2 && desktopProductGridColumns === 2) {
      return "grid grid-cols-2 items-stretch gap-x-3 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-2";
    }
    if (mobileProductGridColumns === 2 && desktopProductGridColumns === 3) {
      return "grid grid-cols-2 items-stretch gap-x-3 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-3";
    }
    return "grid grid-cols-2 items-stretch gap-x-3 gap-y-8 sm:gap-x-8 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4";
  }, [desktopProductGridColumns, mobileProductGridColumns]);

  const randomProductsByCategory = React.useMemo(() => {
    const productsByCategory = new globalThis.Map<string, Product[]>();

    catalogProducts.forEach((product) => {
      const category = String(product.category ?? "").trim();
      if (!category) {
        return;
      }

      const current = productsByCategory.get(category);
      if (current) {
        current.push(product);
        return;
      }
      productsByCategory.set(category, [product]);
    });

    const picked = Array.from(productsByCategory.values())
      .map((items) => {
        if (items.length === 0) {
          return null;
        }
        const randomIndex = Math.floor(Math.random() * items.length);
        return items[randomIndex] ?? null;
      })
      .filter((item): item is Product => item !== null);

    return picked.sort((left, right) =>
      getCategoryLabel(left.category, locale).localeCompare(getCategoryLabel(right.category, locale), locale),
    );
  }, [catalogProducts, locale]);

  const socialCompanyIdFromEstablishmentId = React.useCallback((id: number) => `company_${id}`, []);
  const socialPostIdFromPublicationId = React.useCallback((id: number) => `publication_${id}`, []);
  const publicationIdFromSocialPostId = React.useCallback((id: string) => {
    const parsed = Number(String(id).replace(/^publication_/, ""));
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, []);
  const establishmentIdFromSocialCompanyId = React.useCallback((id: string) => {
    const parsed = Number(String(id).replace(/^company_/, ""));
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, []);

  const socialCompanies = React.useMemo<SocialCompany[]>(() => {
    const byId = new globalThis.Map<number, EstablishmentDto>();
    establishments.forEach((establishment) => byId.set(establishment.id, establishment));
    if (myEstablishment) {
      byId.set(myEstablishment.id, myEstablishment);
    }
    publicationFeed.forEach((publication) => {
      if (byId.has(publication.establishmentId)) {
        return;
      }
      byId.set(publication.establishmentId, buildEstablishmentFromPublication(publication));
    });

    return Array.from(byId.values()).map((establishment) => ({
      id: socialCompanyIdFromEstablishmentId(establishment.id),
      name: establishment.name,
      logo:
        establishment.logoUrl ||
        establishment.coverUrl ||
        `https://picsum.photos/seed/templesale-company-${establishment.id}/160/160`,
      category: establishment.category || t("Attività"),
      city: establishment.city || currentUser?.city || "",
      description: establishment.description || "",
      whatsapp: String(establishment.whatsappNumber || establishment.phone || currentUser?.whatsappNumber || "").trim(),
      address: establishment.address || "",
      mapQuery: establishment.address || establishment.city || establishment.name,
      lat: establishment.latitude,
      lng: establishment.longitude,
      hours: establishment.openingHours || "",
      keywords: establishment.keywords?.length ? establishment.keywords : [establishment.category, establishment.city].filter(Boolean),
      isOwner: myEstablishment?.id === establishment.id,
      createdAt: new Date().toISOString(),
    }));
  }, [
    buildEstablishmentFromPublication,
    currentUser?.city,
    currentUser?.whatsappNumber,
    establishments,
    myEstablishment,
    publicationFeed,
    socialCompanyIdFromEstablishmentId,
    t,
  ]);

  const activeSocialCompany = React.useMemo<SocialCompany>(() => {
    const fallbackCompany: SocialCompany = {
      id: myEstablishment ? socialCompanyIdFromEstablishmentId(myEstablishment.id) : "company_guest",
      name: myEstablishment?.name || currentUser?.name || BRAND_NAME,
      logo: memberAvatar,
      category: myEstablishment?.category || t("Attività"),
      city: myEstablishment?.city || currentUser?.city || "",
      description: myEstablishment?.description || "",
      whatsapp: myEstablishment?.whatsappNumber || currentUser?.whatsappNumber || "",
      address: myEstablishment?.address || "",
      mapQuery: myEstablishment?.address || myEstablishment?.city || "",
      lat: myEstablishment?.latitude,
      lng: myEstablishment?.longitude,
      hours: myEstablishment?.openingHours || "",
      keywords: [myEstablishment?.category, myEstablishment?.city].filter(Boolean) as string[],
      isOwner: Boolean(myEstablishment),
      createdAt: new Date().toISOString(),
    };
    return socialCompanies.find((company) => company.isOwner) || socialCompanies[0] || fallbackCompany;
  }, [currentUser, memberAvatar, myEstablishment, socialCompanies, socialCompanyIdFromEstablishmentId, t]);

  React.useEffect(() => {
    if (!socialSelectedCompanyId && activeSocialCompany.id) {
      setSocialSelectedCompanyId(activeSocialCompany.id);
    }
  }, [activeSocialCompany.id, socialSelectedCompanyId]);

  const toSocialComments = React.useCallback((items: ProductCommentDto[]) => {
    const flattened: ProductCommentDto[] = [];
    const visit = (comment: ProductCommentDto) => {
      flattened.push(comment);
      comment.replies.forEach(visit);
    };
    items.forEach(visit);
    return flattened.map((comment) => ({
      id: `comment_${comment.id}`,
      postId: socialPostIdFromPublicationId(comment.publicationId ?? 0),
      authorName: comment.authorName,
      authorAvatar: comment.authorAvatarUrl,
      text: comment.body,
      createdAt: new Date(comment.createdAt).toISOString(),
    }));
  }, [socialPostIdFromPublicationId]);

  const socialPosts = React.useMemo<SocialPost[]>(
    () =>
      publicationFeed.map((publication) => ({
        id: socialPostIdFromPublicationId(publication.id),
        companyId: socialCompanyIdFromEstablishmentId(publication.establishmentId),
        imageUrl: publication.imageUrl,
        caption: publication.caption || "",
        createdAt: new Date(publication.createdAt).toISOString(),
        comments: toSocialComments(publicationCommentsById[publication.id] ?? []),
        likesCount: 0,
      })),
    [
      publicationCommentsById,
      publicationFeed,
      socialCompanyIdFromEstablishmentId,
      socialPostIdFromPublicationId,
      toSocialComments,
    ],
  );

  const selectedSocialCompany = React.useMemo(
    () =>
      socialCompanies.find((company) => company.id === socialSelectedCompanyId) ||
      activeSocialCompany,
    [activeSocialCompany, socialCompanies, socialSelectedCompanyId],
  );
  const selectedSocialCompanyPosts = React.useMemo(
    () => socialPosts.filter((post) => post.companyId === selectedSocialCompany.id),
    [selectedSocialCompany.id, socialPosts],
  );

  const socialUser = React.useMemo<SocialAuth0User>(
    () => ({
      isAuthenticated: hasMemberAccess,
      sub: currentUser?.id ? String(currentUser.id) : undefined,
      name: memberName,
      email: memberEmail,
      picture: memberAvatar,
      companyId: activeSocialCompany.id,
    }),
    [activeSocialCompany.id, currentUser?.id, hasMemberAccess, memberAvatar, memberEmail, memberName],
  );

  const socialNotifications = React.useMemo<SocialAppNotification[]>(
    () =>
      notificationsToDisplay
        .filter((notification) => notification.type === "publication_comment" || notification.type === "admin_broadcast")
        .map((notification) => {
          const publicationId =
            "publicationId" in notification && notification.publicationId
              ? notification.publicationId
              : publicationFeed[0]?.id ?? 0;
          const publication = publicationFeed.find((item) => item.id === publicationId);
          return {
            id: notification.id,
            type: "comment",
            postId: socialPostIdFromPublicationId(publicationId),
            companyId: publication
              ? socialCompanyIdFromEstablishmentId(publication.establishmentId)
              : activeSocialCompany.id,
            postImageUrl:
              String(("productImageUrl" in notification ? notification.productImageUrl : "") ?? "").trim() ||
              publication?.imageUrl ||
              activeSocialCompany.logo,
            authorName: String(("actorName" in notification ? notification.actorName : "") || notification.title || BRAND_NAME),
            text: notification.message,
            createdAt: new Date(notification.createdAt).toISOString(),
            read: readNotificationIdSet.has(notification.id),
          };
        }),
    [
      activeSocialCompany.id,
      activeSocialCompany.logo,
      notificationsToDisplay,
      publicationFeed,
      readNotificationIdSet,
      socialCompanyIdFromEstablishmentId,
      socialPostIdFromPublicationId,
    ],
  );

  const openSocialPost = React.useCallback(
    (post: SocialPost) => {
      const publicationId = publicationIdFromSocialPostId(post.id);
      const publication = publicationId ? publicationFeed.find((item) => item.id === publicationId) : null;
      if (!publication) {
        return;
      }
      const establishment = buildEstablishmentFromPublication(publication);
      setSelectedEstablishment(establishment);
      setSelectedPublication(publication);
      setFocusedPublicationCommentId(null);
    },
    [buildEstablishmentFromPublication, publicationFeed, publicationIdFromSocialPostId],
  );

  const selectSocialCompany = React.useCallback(
    (companyId: string) => {
      setSocialSelectedCompanyId(companyId);
      setSocialActiveTab("profile");
      const establishmentId = establishmentIdFromSocialCompanyId(companyId);
      const establishment = establishmentId ? establishments.find((item) => item.id === establishmentId) : null;
      if (establishment) {
        void openEstablishmentPage(establishment);
      }
    },
    [establishmentIdFromSocialCompanyId, establishments, openEstablishmentPage],
  );

  const addSocialComment = React.useCallback(
    async (postId: string, text: string) => {
      const publicationId = publicationIdFromSocialPostId(postId);
      if (!publicationId) {
        return;
      }
      if (!hasMemberAccess) {
        setAuthModalMode("register");
        setIsAuthModalOpen(true);
        return;
      }
      try {
        const nextComments = await api.createPublicationComment(publicationId, { body: text });
        setPublicationCommentsById((current) => ({
          ...current,
          [publicationId]: nextComments,
        }));
        const payload = await api.getPublication(publicationId);
        setPublicationFeed((current) =>
          current.map((publication) => (publication.id === publicationId ? payload.publication : publication)),
        );
        setSelectedPublication((current) => (current?.id === publicationId ? payload.publication : current));
      } catch (error) {
        console.error("Error creating social comment:", error);
      }
    },
    [hasMemberAccess, publicationIdFromSocialPostId],
  );

  const changeSocialTab = React.useCallback(
    (tab: SocialActiveTab) => {
      if (tab === "map") {
        openMapDefault();
        return;
      }
      setSocialActiveTab(tab);
    },
    [openMapDefault],
  );

  const toggleSavedSocialPost = React.useCallback((postId: string) => {
    setSavedPublicationIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId],
    );
  }, []);

  const deleteSocialPost = React.useCallback(
    async (postId: string) => {
      const publicationId = publicationIdFromSocialPostId(postId);
      if (!publicationId) {
        return;
      }

      const publication = publicationFeed.find((item) => item.id === publicationId);
      if (!publication) {
        return;
      }

      if (!hasMemberAccess || currentUser?.id !== publication.ownerId) {
        setAuthModalMode("register");
        setIsAuthModalOpen(true);
        return;
      }

      try {
        await api.deletePublication(publicationId);
        setPublicationFeed((current) => current.filter((item) => item.id !== publicationId));
        setSelectedEstablishmentPublications((current) =>
          current.filter((item) => item.id !== publicationId),
        );
        setSelectedPublication((current) => (current?.id === publicationId ? null : current));
        setPublicationCommentsById((current) => {
          const next = { ...current };
          delete next[publicationId];
          return next;
        });
        setSavedPublicationIds((current) => current.filter((id) => id !== postId));
        setMyEstablishment((current) =>
          current && current.id === publication.establishmentId
            ? { ...current, publicationCount: Math.max(0, (current.publicationCount ?? 1) - 1) }
            : current,
        );
        void api.getEstablishments({ search: debouncedSearchQuery, category: activeCategory, limit: 80 })
          .then(setEstablishments)
          .catch(() => null);
      } catch (error) {
        console.error("Error deleting social publication:", error);
      }
    },
    [
      activeCategory,
      currentUser?.id,
      debouncedSearchQuery,
      hasMemberAccess,
      publicationFeed,
      publicationIdFromSocialPostId,
    ],
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased selection:bg-neutral-800 selection:text-white flex flex-col">
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
        {isMapOpen && (
          <ProductMap
            products={products}
            initialCategory={mapInitialCategory}
            openResultsByDefault={mapOpenWithResults}
            autoFocusPanelSearch={mapAutoFocusPanelSearch}
            onOpenProduct={(product) => {
              openProductDetails(product);
            }}
            onOpenEstablishment={(idOrSlug) => {
              void openEstablishmentPage(idOrSlug);
            }}
            currentUser={currentUser}
            onUserLocationSaved={(updatedUser) => {
              setCurrentUser((current) => ({
                ...(current ?? updatedUser),
                locationLatitude: updatedUser.locationLatitude,
                locationLongitude: updatedUser.locationLongitude,
              }));
            }}
            onClose={() => {
              setIsMapOpen(false);
              setMapOpenWithResults(false);
              setMapAutoFocusPanelSearch(false);
            }}
          />
        )}
      </AnimatePresence>

      <SocialHeader
        activeTab={socialActiveTab}
        setActiveTab={changeSocialTab}
        unreadNotificationsCount={unreadNotificationsCount}
        onToggleNotifications={() => setIsNotificationsOpen((current) => !current)}
        onOpenCreatePost={handleOpenNewProduct}
        onOpenCompanyModal={() => {
          if (!hasMemberAccess) {
            setAuthModalMode("register");
            setIsAuthModalOpen(true);
            return;
          }
          setIsUserOpen(true);
        }}
        user={socialUser}
        activeCompany={activeSocialCompany}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 pb-24 sm:pb-16">
        <div style={{ display: socialActiveTab === "feed" ? "block" : "none" }}>
          <SocialFeedView
            posts={socialPosts}
            companies={socialCompanies}
            onOpenPost={openSocialPost}
            onSelectCompany={selectSocialCompany}
            onAddComment={(postId, text) => {
              void addSocialComment(postId, text);
            }}
            onOpenCreatePost={handleOpenNewProduct}
            savedPostIds={savedPublicationIds}
            onToggleSavePost={toggleSavedSocialPost}
            onRefresh={() => loadPublicationFeedPage({ append: false })}
          />
        </div>

        {socialActiveTab === "profile" && (
          <SocialCompanyProfile
            company={selectedSocialCompany}
            posts={selectedSocialCompanyPosts}
            isOwner={selectedSocialCompany.id === activeSocialCompany.id}
            onBack={() => setSocialActiveTab("feed")}
            onOpenPost={openSocialPost}
            onOpenCreatePost={handleOpenNewProduct}
            onEditCompany={() => setIsEditePerfilOpen(true)}
            onKeywordClick={(keyword) => {
              setSearchQuery(keyword);
              setSocialActiveTab("search");
            }}
            onDeletePost={(postId) => {
              void deleteSocialPost(postId);
            }}
          />
        )}

        <div style={{ display: socialActiveTab === "search" ? "block" : "none" }}>
          <SocialCompanySearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            companies={socialCompanies}
            posts={socialPosts}
            onSelectCompany={selectSocialCompany}
            onOpenPost={openSocialPost}
          />
        </div>
      </main>

      <footer className="border-t border-neutral-900 py-6 mb-16 sm:mb-0 text-center text-xs text-neutral-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <SocialTempleSaleLogo className="w-5 h-5" />
            <span className="text-xs font-medium tracking-tight">
              <span className="text-amber-400 font-medium">Temple</span>
              <span className="text-emerald-400 font-semibold ml-0.5">Sale</span>
            </span>
            <span>•</span>
            <span>Rede de Descoberta de Empresas</span>
          </div>
          <span className="text-[11px] text-neutral-500">Empresa -&gt; Foto -&gt; Legenda</span>
        </div>
      </footer>

      <SocialCompanyProfileDrawer
        isOpen={isUserOpen}
        onClose={() => setIsUserOpen(false)}
        company={activeSocialCompany}
        user={socialUser}
        savedPosts={socialPosts.filter((post) => savedPublicationIds.includes(post.id))}
        onOpenPost={(post) => {
          openSocialPost(post);
          setIsUserOpen(false);
        }}
        onToggleSavePost={toggleSavedSocialPost}
        onOpenEditCompany={() => {
          setIsUserOpen(false);
          setProfileCompletionMessage("");
          setIsEditePerfilOpen(true);
        }}
        onOpenListings={() => {
          setIsMeusAnunciosOpen(true);
        }}
        onOpenFavorites={() => {
          setIsCurtidasOpen(true);
        }}
        onLogout={() => {
          void handleLogout();
        }}
        onViewPublicProfile={(companyId) => {
          setSocialSelectedCompanyId(companyId);
          setSocialActiveTab("profile");
          setIsUserOpen(false);
        }}
        currentLanguage={locale as SocialSupportedLanguage}
        onChangeLanguage={(language) => {
          if (language === "pt-BR" || language === "it-IT") {
            handleLocaleChange(language);
          }
        }}
      />

      <SocialNotificationsPopover
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={socialNotifications}
        onSelectNotification={(notification) => {
          const originalNotification = notificationsToDisplay.find((item) => item.id === notification.id);
          if (originalNotification) {
            void handleNotificationClick(originalNotification);
            return;
          }
          const post = socialPosts.find((item) => item.id === notification.postId);
          if (post) {
            openSocialPost(post);
          }
        }}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onSimulateComment={() => null}
      />

      <AnimatePresence>
        {selectedPublication && selectedEstablishment && (
          <PublicationViewer
            publication={selectedPublication}
            establishment={selectedEstablishment}
            currentUser={currentUser}
            focusCommentId={focusedPublicationCommentId}
            onClose={() => {
              setSelectedPublication(null);
              setFocusedPublicationCommentId(null);
            }}
            onRequireAuth={() => {
              setAuthModalMode("register");
              setIsAuthModalOpen(true);
            }}
            onCommentsChanged={(publicationId, comments) => {
              setPublicationCommentsById((current) => ({
                ...current,
                [publicationId]: comments,
              }));
            }}
            onUpdated={(publication) => {
              setSelectedPublication(publication);
              setSelectedEstablishmentPublications((current) =>
                current.map((item) => (item.id === publication.id ? publication : item)),
              );
              setPublicationFeed((current) =>
                current.map((item) => (item.id === publication.id ? publication : item)),
              );
            }}
            onDeleted={(publicationId) => {
              setSelectedPublication(null);
              setFocusedPublicationCommentId(null);
              setSelectedEstablishmentPublications((current) =>
                current.filter((item) => item.id !== publicationId),
              );
              setPublicationFeed((current) => current.filter((item) => item.id !== publicationId));
              setMyEstablishment((current) =>
                current
                  ? { ...current, publicationCount: Math.max(0, (current.publicationCount ?? 1) - 1) }
                  : current,
              );
              void api.getEstablishments({ search: debouncedSearchQuery, category: activeCategory, limit: 80 })
                .then(setEstablishments)
                .catch(() => null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(hasMemberAccess && isNewProductOpen && myEstablishment) && (
          <NewPublication
            establishment={myEstablishment}
            onClose={() => setIsNewProductOpen(false)}
            onPublished={(publication) => {
              const publicationWithEstablishment: PublicationDto = {
                ...publication,
                establishmentName: myEstablishment.name,
                establishmentSlug: myEstablishment.slug,
                establishmentCategory: myEstablishment.category,
                establishmentCity: myEstablishment.city,
                establishmentLogoUrl: myEstablishment.logoUrl,
                establishmentCoverUrl: myEstablishment.coverUrl,
              };
              setSelectedEstablishmentPublications((current) => [publicationWithEstablishment, ...current]);
              setPublicationFeed((current) => [publicationWithEstablishment, ...current]);
              setMyEstablishment((current) =>
                current
                  ? { ...current, publicationCount: (current.publicationCount ?? 0) + 1 }
                  : current,
              );
              void api.getMyEstablishment().then(setMyEstablishment).catch(() => null);
              void api.getEstablishments({ search: debouncedSearchQuery, category: activeCategory, limit: 80 })
                .then(setEstablishments)
                .catch(() => null);
            }}
          />
        )}
      </AnimatePresence>

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
            onOpenEstablishment={(idOrSlug) => {
              handleProductDetailsClose();
              void openEstablishmentPage(idOrSlug);
            }}
            currentUser={currentUser}
            focusCommentId={focusedCommentId}
            onRequireAuth={() => {
              setAuthModalMode("register");
              setIsAuthModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(hasMemberAccess && editingProduct) && (
          <NewProduct
            mode="edit"
            initialProduct={editingProduct}
            establishment={myEstablishment}
            sections={myEstablishment?.sections ?? []}
            onCreateSection={async (name) => {
              const establishment = myEstablishment ?? (await api.getMyEstablishment());
              const section = await api.createStorefrontSection(establishment.id, name);
              setMyEstablishment((current) =>
                current
                  ? { ...current, sections: [...(current.sections ?? []), section] }
                  : { ...establishment, sections: [...(establishment.sections ?? []), section] },
              );
              return section;
            }}
            onDeleteSection={async (sectionId) => {
              const establishment = myEstablishment ?? (await api.getMyEstablishment());
              await api.deleteStorefrontSection(establishment.id, sectionId);
              setMyEstablishment((current) =>
                current
                  ? {
                      ...current,
                      sections: (current.sections ?? []).filter((section) => section.id !== sectionId),
                    }
                  : current,
              );
            }}
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
        {(hasMemberAccess && isEditePerfilOpen) && (
          <EditePerfil
            onClose={() => setIsEditePerfilOpen(false)}
            onSave={handleProfileSave}
            initialData={currentUser}
            initialEstablishment={myEstablishment}
            initialErrorMessage={profileCompletionMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );

}
