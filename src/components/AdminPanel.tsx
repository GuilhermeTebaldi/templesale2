import React from "react";
import {
  LoaderCircle,
  LogOut,
  Package,
  RefreshCcw,
  Search,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  api,
  type AdminSessionDto,
  type AdminUserDto,
  type ProductDto,
} from "../lib/api";
import { formatEuroFromUnknown } from "../lib/currency";

const ADMIN_DEFAULT_EMAIL = "templesale@admin.com";

function formatDateLabel(value?: string): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AdminPanel() {
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [session, setSession] = React.useState<AdminSessionDto | null>(null);
  const [email, setEmail] = React.useState(ADMIN_DEFAULT_EMAIL);
  const [password, setPassword] = React.useState("");
  const [authError, setAuthError] = React.useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = React.useState(false);

  const [users, setUsers] = React.useState<AdminUserDto[]>([]);
  const [usersError, setUsersError] = React.useState("");
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const [selectedUser, setSelectedUser] = React.useState<AdminUserDto | null>(null);
  const [selectedUserProducts, setSelectedUserProducts] = React.useState<ProductDto[]>([]);
  const [isProductsDrawerOpen, setIsProductsDrawerOpen] = React.useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(false);
  const [productsError, setProductsError] = React.useState("");

  const [deletingUserId, setDeletingUserId] = React.useState<number | null>(null);
  const [deletingProductId, setDeletingProductId] = React.useState<number | null>(null);

  const loadUsers = React.useCallback(async () => {
    setIsLoadingUsers(true);
    setUsersError("");
    try {
      const payload = await api.admin.getUsers();
      setUsers(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao carregar usuários.";
      setUsersError(message);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        const currentSession = await api.admin.getCurrent();
        if (cancelled) {
          return;
        }
        setSession(currentSession);
        await loadUsers();
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, [loadUsers]);

  const filteredUsers = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        (user.city ?? "").toLowerCase().includes(normalizedQuery) ||
        (user.country ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, users]);

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setAuthError("Preencha email e senha do administrador.");
      return;
    }

    setAuthError("");
    setIsAuthSubmitting(true);
    try {
      const currentSession = await api.admin.login(normalizedEmail, normalizedPassword);
      setSession(currentSession);
      setPassword("");
      await loadUsers();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao autenticar administrador.";
      setAuthError(message);
      setSession(null);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await api.admin.logout();
    } catch {
      // Ignore logout failures and clear UI state anyway.
    } finally {
      setSession(null);
      setUsers([]);
      setSelectedUser(null);
      setSelectedUserProducts([]);
      setIsProductsDrawerOpen(false);
      setAuthError("");
    }
  };

  const handleOpenUserProducts = async (user: AdminUserDto) => {
    setSelectedUser(user);
    setIsProductsDrawerOpen(true);
    setIsLoadingProducts(true);
    setProductsError("");
    setSelectedUserProducts([]);

    try {
      const products = await api.admin.getUserProducts(user.id);
      setSelectedUserProducts(products);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao carregar produtos do usuário.";
      setProductsError(message);
      setSelectedUserProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleDeleteProduct = async (product: ProductDto) => {
    if (!selectedUser) {
      return;
    }

    const confirmation = window.confirm(
      `Excluir o produto "${product.name}" do usuário ${selectedUser.email}?`,
    );
    if (!confirmation) {
      return;
    }

    setDeletingProductId(product.id);
    setProductsError("");
    try {
      await api.admin.deleteProduct(product.id);
      setSelectedUserProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
      setUsers((current) =>
        current.map((item) =>
          item.id === selectedUser.id
            ? { ...item, productCount: Math.max(0, item.productCount - 1) }
            : item,
        ),
      );
      setSelectedUser((current) =>
        current
          ? { ...current, productCount: Math.max(0, current.productCount - 1) }
          : current,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao excluir produto.";
      setProductsError(message);
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleDeleteUser = async (user: AdminUserDto) => {
    const confirmation = window.confirm(
      `Excluir o usuário ${user.email} e todos os produtos dele?`,
    );
    if (!confirmation) {
      return;
    }

    setDeletingUserId(user.id);
    setUsersError("");
    try {
      await api.admin.deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
        setSelectedUserProducts([]);
        setIsProductsDrawerOpen(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir usuário.";
      setUsersError(message);
    } finally {
      setDeletingUserId(null);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-600 text-sm uppercase tracking-[0.2em]">
          <LoaderCircle className="w-4 h-4 animate-spin" />
          Verificando sessão admin
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-stone-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-stone-700" />
            <h1 className="text-lg font-semibold text-stone-900">Admin TempleSale</h1>
          </div>
          <p className="text-xs text-stone-500 mb-6">
            Acesso administrativo em <code>/admin</code>.
          </p>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.15em] text-stone-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                placeholder={ADMIN_DEFAULT_EMAIL}
                autoComplete="username"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.15em] text-stone-500">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {authError && <p className="text-sm text-red-600">{authError}</p>}

            <button
              type="submit"
              disabled={isAuthSubmitting}
              className="w-full bg-stone-900 text-white py-3 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-black transition-colors disabled:opacity-60"
            >
              {isAuthSubmitting ? "Entrando..." : "Entrar no admin"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-stone-700" />
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-stone-900">
                Painel Administrativo TempleSale
              </h1>
              <p className="text-[11px] text-stone-500">{session.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="inline-flex items-center gap-2 border border-stone-300 px-3 py-2 text-xs uppercase tracking-[0.15em] text-stone-700 hover:border-stone-800"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Atualizar
            </button>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-black"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 border border-stone-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-4 h-4 text-stone-600" />
            <h2 className="text-sm font-semibold text-stone-900">
              Usuários cadastrados ({users.length})
            </h2>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrar por nome, email, cidade ou país"
              className="w-full border border-stone-300 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-stone-900"
            />
          </div>
        </div>

        {usersError && (
          <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {usersError}
          </div>
        )}

        {isLoadingUsers ? (
          <div className="py-16 text-center text-sm text-stone-500">Carregando usuários...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-500">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <article
                key={user.id}
                className="border border-stone-200 bg-white p-4 sm:p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">
                      {user.name || user.email}
                    </h3>
                    <p className="text-xs text-stone-600">{user.email}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] px-2 py-1 border border-stone-300 text-stone-600">
                    ID {user.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-stone-600">
                  <span>Produtos: {user.productCount}</span>
                  <span>Cidade: {user.city || "-"}</span>
                  <span>País: {user.country || "-"}</span>
                  <span>Criado em: {formatDateLabel(user.createdAt)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleOpenUserProducts(user);
                    }}
                    className="inline-flex items-center gap-2 border border-stone-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-stone-700 hover:border-stone-800"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Ver produtos
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteUser(user);
                    }}
                    disabled={deletingUserId === user.id}
                    className="inline-flex items-center gap-2 border border-red-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingUserId === user.id ? "Excluindo..." : "Excluir usuário"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {isProductsDrawerOpen && selectedUser && (
        <section className="fixed bottom-4 left-4 right-4 md:left-auto md:w-[540px] z-50 border border-stone-300 bg-white shadow-2xl">
          <header className="px-4 py-3 border-b border-stone-200 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Produtos de {selectedUser.name}
              </h3>
              <p className="text-xs text-stone-500">{selectedUser.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsProductsDrawerOpen(false)}
              className="p-1.5 hover:bg-stone-100"
              aria-label="Fechar barra de produtos"
            >
              <X className="w-4 h-4 text-stone-700" />
            </button>
          </header>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
            {productsError && (
              <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {productsError}
              </div>
            )}

            {isLoadingProducts ? (
              <div className="py-8 text-center text-sm text-stone-500">Carregando produtos...</div>
            ) : selectedUserProducts.length === 0 ? (
              <div className="py-8 text-center text-sm text-stone-500">
                Este usuário não possui produtos.
              </div>
            ) : (
              selectedUserProducts.map((product) => (
                <article
                  key={product.id}
                  className="border border-stone-200 p-3 flex gap-3 items-start"
                >
                  <div className="w-16 h-16 shrink-0 bg-stone-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 grow">
                    <h4 className="text-sm font-medium text-stone-900 truncate">
                      {product.name}
                    </h4>
                    <p className="text-xs text-stone-500 truncate">{product.category}</p>
                    <p className="text-xs text-stone-700 mt-1">
                      {formatEuroFromUnknown(product.price, "pt-BR")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteProduct(product);
                    }}
                    disabled={deletingProductId === product.id}
                    className="inline-flex items-center gap-1 border border-red-300 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="w-3 h-3" />
                    {deletingProductId === product.id ? "..." : "Excluir"}
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
