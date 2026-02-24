import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ShoppingBag, Menu, ArrowRight, Instagram, Twitter, Facebook, X, User, Package, CreditCard, Settings, LogOut, ChevronRight, Heart, Plus, Minus, Share2, Bell, Filter, Globe, MapPin, RotateCcw, Map, Store, Languages, FileText, Shield, HelpCircle, ChevronDown } from "lucide-react";
import ProductCard, { type Product } from "./components/ProductCard";
import ProductDetails from "./components/ProductDetails";
import NewProduct from "./components/NewProduct";
import Auth, { type AuthMode, type AuthSubmitPayload } from "./components/Auth";
import MeusAnuncios from "./components/MeusAnuncios";
import EditePerfil from "./components/EditePerfil";
import ProductMap from "./components/ProductMap";
import Curtidas from "./components/Curtidas";
import { api, type SessionUser, type UpdateProfileInput } from "./lib/api";

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

export default function App() {
  const [activeCategory, setActiveCategory] = React.useState("All");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserOpen, setIsUserOpen] = React.useState(false);
  const [isMapOpen, setIsMapOpen] = React.useState(false);
  const [isNewProductOpen, setIsNewProductOpen] = React.useState(false);
  const [isMeusAnunciosOpen, setIsMeusAnunciosOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isCurtidasOpen, setIsCurtidasOpen] = React.useState(false);
  const [isEditePerfilOpen, setIsEditePerfilOpen] = React.useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState<AuthMode>("register");
  const [currentUser, setCurrentUser] = React.useState<SessionUser | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [myProducts, setMyProducts] = React.useState<Product[]>([]);
  const [likedProducts, setLikedProducts] = React.useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const hasMemberAccess = Boolean(currentUser);
  const memberName = currentUser?.name || "Membro";
  const memberAvatar = "https://picsum.photos/seed/avatar/200/200";

  React.useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        const data = await api.getProducts();
        if (!cancelled) {
          setProducts(data);
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
    let cancelled = false;

    const fetchMyProducts = async () => {
      if (!currentUser) {
        setMyProducts([]);
        return;
      }

      try {
        const data = await api.getMyProducts();
        if (!cancelled) {
          setMyProducts(data);
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

    const fetchLikedProducts = async () => {
      if (!currentUser) {
        setLikedProducts([]);
        return;
      }

      try {
        const data = await api.getLikedProducts();
        if (!cancelled) {
          setLikedProducts(data);
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
      setIsUserOpen(false);
      setIsMapOpen(false);
      setIsNewProductOpen(false);
      setIsMeusAnunciosOpen(false);
      setEditingProduct(null);
      setIsCurtidasOpen(false);
      setIsEditePerfilOpen(false);
      setIsNotificationsOpen(false);
      setIsAccountSettingsOpen(false);
    }
  }, [hasMemberAccess]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Error logging out:", err);
    }

    setCurrentUser(null);
    setMyProducts([]);
    setLikedProducts([]);
    setEditingProduct(null);
    setIsUserOpen(false);
    setIsMenuOpen(false);
    setIsMapOpen(false);
    setIsCurtidasOpen(false);
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

  const handleProfileSave = async (profileData: UpdateProfileInput) => {
    const updatedUser = await api.updateProfile(profileData);
    setCurrentUser(updatedUser);
    syncSellerProfileAcrossProducts(updatedUser);
  };

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

      {hasMemberAccess && (
        <>
      {/* Side Menu Overlay */}
      <motion.div
        initial={false}
        animate={isMenuOpen || isUserOpen ? { opacity: 1 } : { opacity: 0 }}
        className={`fixed inset-0 z-70 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
          isMenuOpen || isUserOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={() => {
          setIsMenuOpen(false);
          setIsUserOpen(false);
        }}
      />
      
      {/* User Dashboard Overlay */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isUserOpen ? 0 : "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm z-80 bg-[#fdfcfb] shadow-2xl flex flex-col"
      >
        <div className="p-8 flex justify-between items-center border-b border-stone-100">
          <h2 className="text-xl font-serif tracking-widest uppercase">Dashboard</h2>
          <button onClick={() => setIsUserOpen(false)} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>
        
        <div className="grow overflow-y-auto p-8 flex flex-col gap-10">
          {/* User Profile Summary */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-100 border border-stone-200">
              <img 
                src={memberAvatar} 
                alt="User Avatar" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-serif italic text-xl text-stone-800">{memberName}</h3>
              <p className="text-[10px] uppercase tracking-widest text-stone-400">
                Membro cadastrado
              </p>
            </div>
          </div>

          {/* Dashboard Links */}
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => {
                setIsUserOpen(false);
                setIsNewProductOpen(true);
              }}
              className="flex items-center justify-between p-4 bg-stone-900 text-white hover:bg-black transition-colors group mb-4 rounded-sm"
            >
              <div className="flex items-center gap-4">
                <Plus className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                <span className="text-xs uppercase tracking-widest font-bold">
                  New Product
                </span>
              </div>
              <ArrowRight className="w-3 h-3 text-white/50 group-hover:text-white transition-colors" />
            </button>

            {[
              { 
                icon: User, 
                label: 'Editar perfil',
                onClick: () => {
                  setIsUserOpen(false);
                  setIsEditePerfilOpen(true);
                }
              },
              {
                icon: Heart,
                label: 'Curtidas',
                count: likedProducts.length,
                onClick: () => {
                  setIsUserOpen(false);
                  setIsCurtidasOpen(true);
                }
              },
              { 
                icon: Package, 
                label: 'Meus anúncios', 
                count: myProducts.length,
                onClick: () => {
                  setIsUserOpen(false);
                  setIsMeusAnunciosOpen(true);
                }
              },
              { icon: Languages, label: 'Idioma' },
              { 
                icon: Settings, 
                label: 'Account Settings', 
                isExpandable: true,
                subItems: [
                  { icon: FileText, label: 'Termos' },
                  { icon: Shield, label: 'Privacidade' },
                  { icon: HelpCircle, label: 'Suporte' },
                ]
              },
            ].map((item) => (
              <div key={item.label}>
                <button 
                  onClick={() => {
                    if (item.isExpandable) {
                      setIsAccountSettingsOpen(!isAccountSettingsOpen);
                    } else if (item.onClick) {
                      item.onClick();
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <item.icon className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-colors" />
                    <span className="text-xs uppercase tracking-widest font-medium text-stone-600 group-hover:text-stone-800 transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.count !== undefined && (
                      <span className="text-[10px] font-mono text-stone-400">{item.count}</span>
                    )}
                    {item.isExpandable ? (
                      <ChevronDown className={`w-3 h-3 text-stone-300 transition-transform duration-300 ${isAccountSettingsOpen ? 'rotate-180' : ''}`} />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-stone-300 group-hover:text-stone-500 transition-colors" />
                    )}
                  </div>
                </button>
                
                {item.isExpandable && (
                  <AnimatePresence>
                    {isAccountSettingsOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-stone-50/50"
                      >
                        {item.subItems?.map((sub) => (
                          <button 
                            key={sub.label}
                            className="w-full flex items-center gap-4 pl-12 py-3 hover:bg-stone-100 transition-colors group"
                          >
                            <sub.icon className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-800 transition-colors" />
                            <span className="text-[10px] uppercase tracking-widest font-medium text-stone-500 group-hover:text-stone-800 transition-colors">
                              {sub.label}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </nav>

          <div className="mt-auto">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-4 border border-stone-100 text-stone-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50/30 transition-all text-xs uppercase tracking-[0.2em] font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </motion.div>
        </>
      )}

      <AnimatePresence>
        {(hasMemberAccess && isMapOpen) && (
          <ProductMap
            products={products}
            onClose={() => setIsMapOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Product Details View */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetails 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)}
            isLiked={likedProductIds.has(selectedProduct.id)}
            onToggleLike={() => {
              void handleToggleLike(selectedProduct);
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
              const published = await api.createProduct(newProd);
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
              const updated = await api.updateProduct(editingProduct.id, updatedInput);
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
              setSelectedProduct(product);
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
          />
        )}
      </AnimatePresence>

      {hasMemberAccess && (
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isMenuOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm z-80 bg-[#fdfcfb] shadow-2xl flex flex-col"
      >
        <div className="p-8 flex justify-between items-center border-b border-stone-100">
          <h2 className="text-xl font-serif tracking-widest uppercase">Menu</h2>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>
        
        <div className="grow overflow-y-auto p-8 flex flex-col gap-8">
          <nav className="flex flex-col gap-4">
            {[
              { label: 'Filtro', icon: Filter },
           
          
              
              {
                label: 'Mapa',
                icon: Map,
                onClick: () => {
                  setIsMenuOpen(false);
                  setIsMapOpen(true);
                }
              },
              
             
              { label: 'Vendedor', icon: Store },
            ].map((item) => (
              <button
                key={item.label} 
                className="flex items-center gap-4 text-xl font-serif italic text-stone-800 hover:translate-x-2 transition-transform duration-300 group"
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                    return;
                  }
                  setIsMenuOpen(false);
                }}
              >
                <item.icon className="w-5 h-5 text-stone-300 group-hover:text-stone-800 transition-colors" />
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="h-px bg-stone-100 my-4" />
          
          <div className="flex flex-col gap-4 text-[10px] uppercase tracking-[0.2em] font-medium text-stone-400">
            <a href="#" className="hover:text-black transition-colors">Archive</a>
            <a href="#" className="hover:text-black transition-colors">Journal</a>
            <a href="#" className="hover:text-black transition-colors">About Us</a>
            <a href="#" className="hover:text-black transition-colors">Contact</a>
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
      )}

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
              placeholder="Search our collection..."
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
              Results for "{searchQuery}"
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {products.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category.toLowerCase().includes(searchQuery.toLowerCase())
              ).slice(0, 6).map(product => (
                <div key={product.id} className="flex flex-col gap-2 group cursor-pointer" onClick={() => setIsSearchOpen(false)}>
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
          <div className="flex items-center gap-2 sm:gap-8 w-1/3">
            {hasMemberAccess && (
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 hover:bg-stone-50 rounded-full transition-colors"
              >
                <Menu className="w-5 h-5 text-stone-600" />
              </button>
            )}
         
          </div>

          <h1 className="text-base sm:text-2xl font-serif tracking-widest sm:tracking-[0.15em] uppercase text-center grow px-2 truncate">
            Templesale
          </h1>

          <div className="flex items-center justify-end gap-1 sm:gap-4 w-1/3">
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
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-2 hover:bg-stone-50 rounded-full transition-colors relative"
                  >
                    <Bell className="w-5 h-5 text-stone-600" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#fdfcfb]" />
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
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ type: "spring", damping: 20, stiffness: 300 }}
                          className="absolute -right-2.5 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-white border border-stone-100 shadow-xl rounded-xl z-100 overflow-hidden"
                        >
                          <div className="p-4 border-b border-stone-50 flex items-center justify-between">
                            <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-800">Notifications</h3>
                            <button className="text-[10px] text-stone-400 hover:text-stone-800 transition-colors">Mark all as read</button>
                          </div>
                          <div className="max-h-100 overflow-y-auto">
                            {[
                              { id: 1, title: "New Collection", message: "Discover our latest ceramics collection.", time: "2h ago", read: false },
                              { id: 2, title: "Order Shipped", message: "Your order #1234 has been shipped.", time: "5h ago", read: true },
                              { id: 3, title: "Price Drop", message: "Um item das suas curtidas está com 20% de desconto.", time: "1d ago", read: false },
                            ].map((notif) => (
                              <div 
                                key={notif.id} 
                                className={`p-4 border-b border-stone-50 last:border-0 hover:bg-stone-50 transition-colors cursor-pointer relative ${!notif.read ? "bg-stone-50/50" : ""}`}
                              >
                                {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-stone-900" />}
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="text-xs font-bold text-stone-800">{notif.title}</h4>
                                  <span className="text-[9px] text-stone-400">{notif.time}</span>
                                </div>
                                <p className="text-xs text-stone-500 leading-relaxed">{notif.message}</p>
                              </div>
                            ))}
                          </div>
                          <div className="p-3 bg-stone-50 text-center">
                            <button className="text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-stone-800 transition-colors">
                              View all notifications
                            </button>
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
                    alt="User Profile" 
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
                Cadastrar
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="grow pt-20">
        {/* Hero Section */}
        <section className="relative h-[80vh] overflow-hidden">
          <img
            src="https://i.pinimg.com/736x/fc/a6/78/fca6780a97728d0f9f5e2f8adb9677c3.jpg"
            alt="Hero"
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
              Collection 01 / 2024
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-8xl font-serif italic mb-8 max-w-4xl leading-tight"
            >
              Sanctuary of Form & Function
            </motion.h2>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="group flex items-center gap-3 px-8 py-4 bg-white text-black text-xs uppercase tracking-[0.2em] font-medium hover:bg-stone-100 transition-all"
            >
              Explore Collection
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
            
            <div className="flex items-center md:justify-center gap-6 sm:gap-10 overflow-x-auto no-scrollbar px-6 sm:px-10 h-14 sm:h-16 scroll-smooth">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] uppercase tracking-[0.2em] font-medium transition-all whitespace-nowrap relative py-2 ${
                    activeCategory === cat 
                      ? "text-black" 
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {cat}
                  {activeCategory === cat && (
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
              Carregando produtos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                Nenhum produto real publicado ainda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-10 sm:gap-y-16">
              {filteredProducts.map((product) => (
                <div key={product.id}>
                  <ProductCard 
                    product={product} 
                    onClick={() => setSelectedProduct(product)}
                    isLiked={likedProductIds.has(product.id)}
                    onToggleLike={() => {
                      void handleToggleLike(product);
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
            <h3 className="text-3xl md:text-5xl font-serif italic mb-6">Join the Temple</h3>
            <p className="text-stone-500 mb-10 text-sm tracking-wide leading-relaxed">
              Subscribe to receive early access to new collections, exclusive archive releases, and stories from our artisans.
            </p>
            <form className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Email Address"
                className="grow bg-white border-none px-6 py-4 text-sm focus:ring-1 focus:ring-stone-400 outline-none transition-all"
              />
              <button className="px-10 py-4 bg-stone-900 text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-100 py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-xl font-serif tracking-[0.15em] uppercase mb-6">Templesale</h2>
            <p className="text-stone-400 text-sm max-w-sm leading-relaxed">
              A curated vitrine of objects that define the modern sanctuary. We believe in the enduring beauty of natural materials and the soul of the handmade.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6">Information</h4>
            <ul className="space-y-4 text-stone-500 text-sm">
              <li><a href="#" className="hover:text-black transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-black transition-colors">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-6">Social</h4>
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
            © 2024 Templesale. All Rights Reserved.
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
            Designed with Intention
          </span>
        </div>
      </footer>
    </div>
  );
}
