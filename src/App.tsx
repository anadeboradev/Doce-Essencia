import { Check, Heart, Plus, Search, ShoppingBag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityDrawer } from './components/AccessibilityDrawer';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthView, type AuthMode } from './components/AuthView';
import { CartDrawer } from './components/CartDrawer';
import { CustomerOrdersView } from './components/CustomerOrdersView';
import { Navbar, type AppView } from './components/Navbar';
import { ProductModal } from './components/ProductModal';
import { api, formatCurrency, getStoredToken, setStoredToken } from './lib/api';
import { HERO_IMAGE, resolveProductImage } from './lib/images';
import type { AccessibilityPrefs, CartItem, Product, User } from './types';

const A11Y_STORAGE_KEY = 'doce_essencia_a11y';
const CART_STORAGE_KEY = 'doce_essencia_cart';

const DEFAULT_A11Y: AccessibilityPrefs = {
  theme: 'light',
  fontSize: 'default',
  reduceMotion: false,
  extraSpacing: false,
};

function loadInitialA11y(): AccessibilityPrefs {
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_A11Y, ...(JSON.parse(raw) as Partial<AccessibilityPrefs>) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_A11Y;
}

function loadInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as CartItem[];
    }
  } catch {
    // ignore
  }
  return [];
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeView, setActiveView] = useState<AppView>('store');
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [cart, setCart] = useState<CartItem[]>(loadInitialCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [a11yPrefs, setA11yPrefs] = useState<AccessibilityPrefs>(loadInitialA11y);
  const [toastText, setToastText] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});

  // Sync Accessibility Preferences to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', a11yPrefs.theme === 'dark');
    root.classList.toggle('a11y-font-md', a11yPrefs.fontSize === 'md');
    root.classList.toggle('a11y-font-lg', a11yPrefs.fontSize === 'lg');
    root.classList.toggle('a11y-reduce-motion', a11yPrefs.reduceMotion);
    root.classList.toggle('a11y-spacing', a11yPrefs.extraSpacing);

    try {
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(a11yPrefs));
    } catch {
      // ignore
    }
  }, [a11yPrefs]);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.getProducts(false);
      setProducts(res.products);
    } catch {
      // keep existing state on transient error
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Hydrate auth & products on mount
  useEffect(() => {
    void loadProducts();
    if (getStoredToken()) {
      api
        .getMe()
        .then((res) => {
          if (res.user) setUser(res.user);
          else setStoredToken(null);
        })
        .catch(() => {
          setStoredToken(null);
        });
    }
  }, [loadProducts]);

  // Auto-clear toast
  useEffect(() => {
    if (!toastText) return;
    const t = window.setTimeout(() => setToastText(null), 3200);
    return () => window.clearTimeout(t);
  }, [toastText]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return ['Todos', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalCartItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  function handleNavigate(view: AppView, nextAuthMode?: 'login' | 'register') {
    if (view === 'auth' && nextAuthMode) {
      setAuthMode(nextAuthMode);
    }
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAddToCart(product: Product, quantity = 1) {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, product, quantity: nextQty } : i
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
    setToastText(`${product.name} adicionado ao carrinho`);
  }

  function handleUpdateCartQty(productId: number, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.min(i.product.stock, qty) }
          : i
      )
    );
  }

  function handleLogout() {
    setStoredToken(null);
    setUser(null);
    if (activeView === 'admin' || activeView === 'orders') {
      setActiveView('store');
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#FFF2F7] via-[#FFF8FB] to-[#FFFDFB] dark:from-[#170F14] dark:via-[#170F14] dark:to-[#170F14] text-[#3B202C] dark:text-[#FCEEF4]">
      <Navbar
        user={user}
        activeView={activeView}
        cartCount={totalCartItems}
        onNavigate={handleNavigate}
        onOpenCart={() => setCartOpen(true)}
        onOpenA11y={() => setA11yOpen(true)}
        onLogout={() => setLogoutConfirmOpen(true)}
      />

      <main className="flex-1">
        {activeView === 'auth' && (
          <AuthView
            initialMode={authMode}
            onSuccess={(token, loggedUser) => {
              setStoredToken(token);
              setUser(loggedUser);
              setActiveView(loggedUser.role === 'admin' ? 'admin' : 'store');
            }}
            onCancel={() => setActiveView('store')}
          />
        )}

        {activeView === 'orders' && user && (
          <CustomerOrdersView onBackToStore={() => setActiveView('store')} />
        )}

        {activeView === 'admin' && user?.role === 'admin' && (
          <AdminDashboard
            currentUser={user}
            onProductsChanged={() => void loadProducts()}
            onBackToStore={() => setActiveView('store')}
          />
        )}

        {activeView === 'store' && (
          <>
            {/* Welcome notice when logged in */}
            {user && (
              <div className="border-b border-[#F7CFE0] dark:border-[#3A232E] bg-[#FFF4F8] dark:bg-[#1E1319]">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E4455] dark:text-[#E5C5D2]">
                  <span>
                    Bem-vindo(a), <strong className="font-semibold text-[#C92C65] dark:text-[#FF9AC0]">{user.email}</strong>
                  </span>
                  {user.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setActiveView('admin')}
                      className="font-semibold text-[#C92C65] dark:text-[#FF8FB8] hover:underline cursor-pointer"
                    >
                      Abrir Painel Administrativo
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Storefront Hero (Soft Cute Patisserie Showcase) */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16">
              <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white/90 dark:bg-[#1E1319] p-6 sm:p-10 sweet-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                  <div className="lg:col-span-6 flex flex-col justify-center">
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#C92C65] dark:text-[#FF8FB8]">
                      <Heart className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                      <span>Doceria Artesanal</span>
                    </p>
                    <h1 className="font-display mt-3 text-[clamp(2.1rem,3.8vw,3.25rem)] leading-[1.12] font-semibold tracking-tight text-[#3B202C] dark:text-[#FCEEF4] text-balance">
                      Doces deliciosos feitos com <span className="italic text-[#C92C65] dark:text-[#FF9AC0]">muito carinho</span>.
                    </h1>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-[#6E4455] dark:text-[#E5C5D2]">
                      Bem-vindo à Doceria Doce Essência! Brigadeiros gourmet enrolados no dia, beijinhos de coco fresco, brownies fofinhos e bolos caseiros preparados para adoçar o seu momento.
                    </p>

                    <div className="mt-7 flex flex-wrap items-center gap-3.5">
                      <a
                        href="#vitrine"
                        className="inline-flex items-center gap-2 rounded-full bg-[#E03E78] px-6 py-3 text-sm font-medium text-white shadow-xs transition-all hover:bg-[#C92C65] hover:-translate-y-0.5"
                      >
                        Explorar Doces
                      </a>
                      {!user && (
                        <button
                          type="button"
                          onClick={() => handleNavigate('auth', 'login')}
                          className="inline-flex items-center rounded-full border border-[#F3C4D7] dark:border-[#3A232E] bg-[#FFF4F8] dark:bg-[#24171E] px-5 py-3 text-sm font-medium text-[#C92C65] dark:text-[#FF9AC0] transition-colors hover:bg-[#FFEAF3] dark:hover:bg-[#2E1D25] cursor-pointer"
                        >
                          Entrar na Conta
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-6">
                    <div className="relative h-full min-h-[260px] sm:min-h-[320px] overflow-hidden rounded-2xl border border-[#F5D0DF] dark:border-[#3A232E] bg-[#FFF0F6] dark:bg-[#2A1B23]">
                      <img
                        src={HERO_IMAGE}
                        alt="Mesa artesanal da Doceria Doce Essência com caixa de brigadeiros gourmet, beijinhos de coco e brownies"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Collection */}
            <section
              id="vitrine"
              className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-7">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    Nossa Vitrine de Doces
                  </h2>
                  <p className="mt-1 text-sm text-[#8C6173] dark:text-[#CBA8B8]">
                    Clique em qualquer doce para ver a descrição completa e a informação nutricional.
                  </p>
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-80">
                  <Search
                    className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-[#C92C65] dark:text-[#FF8FB8]"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar doces..."
                    aria-label="Buscar doces"
                    className="w-full rounded-full border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] pl-11 pr-4 py-2.5 text-sm shadow-xs focus:border-[#E03E78] focus:outline-none"
                  />
                </div>
              </div>

              {/* Category Segmented Controls */}
              <div className="mb-8 flex flex-wrap items-center gap-1.5 rounded-full bg-[#FFEAF3] dark:bg-[#24171E] p-1.5 w-fit max-w-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-white dark:bg-[#170F14] text-[#C92C65] dark:text-[#FF9AC0] shadow-xs'
                        : 'text-[#6E4455] dark:text-[#CBA8B8] hover:text-[#C92C65] dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              {loadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="h-96 animate-pulse rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319]"
                    />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-12 text-center sweet-shadow">
                  <h3 className="font-display text-lg font-semibold">Nenhum doce encontrado</h3>
                  <p className="mt-1.5 text-sm text-[#8C6173] dark:text-[#CBA8B8]">
                    Tente buscar por outro termo ou limpar o filtro de categoria.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('Todos');
                    }}
                    className="mt-5 rounded-full border border-[#F3C4D7] dark:border-[#3A232E] px-5 py-2 text-sm font-medium text-[#C92C65] dark:text-[#FF9AC0] hover:bg-[#FFEAF3] dark:hover:bg-[#2A1B23] cursor-pointer"
                  >
                    Mostrar todos os doces
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                  {filteredProducts.map((product) => {
                    const outOfStock = product.stock <= 0;
                    const imgBroken = brokenImages[product.id];

                    return (
                      <article
                        key={product.id}
                        className="group flex flex-col overflow-hidden rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] sweet-shadow transition-transform duration-150 hover:-translate-y-1"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className="relative aspect-[4/3] w-full overflow-hidden bg-[#FFF0F6] dark:bg-[#2A1B23] text-left cursor-pointer"
                        >
                          {!imgBroken ? (
                            <img
                              src={resolveProductImage(product.imageUrl)}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setBrokenImages((prev) => ({ ...prev, [product.id]: true }))
                              }
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm font-medium text-[#8C6173] dark:text-[#CBA8B8]">
                              {product.name}
                            </div>
                          )}
                        </button>

                        <div className="flex flex-1 flex-col justify-between p-5">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-[#8C6173] dark:text-[#CBA8B8]">
                              <span className="uppercase tracking-wider">{product.category}</span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  outOfStock
                                    ? 'text-red-600 dark:text-red-400 font-medium'
                                    : 'text-[#6E4455] dark:text-[#E5C5D2]'
                                }
                              >
                                {outOfStock ? 'Esgotado' : `${product.stock} un.`}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedProduct(product)}
                              className="mt-2 block text-left cursor-pointer"
                            >
                              <h3 className="font-display text-lg font-semibold text-[#3B202C] dark:text-[#FCEEF4] group-hover:text-[#C92C65] dark:group-hover:text-[#FF9AC0] transition-colors">
                                {product.name}
                              </h3>
                            </button>

                            <p className="mt-1.5 text-sm leading-relaxed text-[#6E4455] dark:text-[#E5C5D2] line-clamp-2">
                              {product.description}
                            </p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-[#F7CFE0] dark:border-[#3A232E] flex items-center justify-between gap-3">
                            <span className="font-mono-num text-lg font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                              {formatCurrency(product.price)}
                            </span>

                            <button
                              type="button"
                              disabled={outOfStock}
                              onClick={() => handleAddToCart(product, 1)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#E03E78] px-4 py-2 text-xs font-medium text-white transition-all hover:bg-[#C92C65] disabled:bg-neutral-400 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{outOfStock ? 'Esgotado' : 'Adicionar'}</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Story / Craftsmanship Section */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 border-t border-[#F5D0DF] dark:border-[#3A232E]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    Ingredientes Selecionados
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6E4455] dark:text-[#E5C5D2]">
                    Trabalhamos com chocolate belga, manteiga de primeira qualidade, frutas frescas e zero conservantes artificiais.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    Transparência Nutricional
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6E4455] dark:text-[#E5C5D2]">
                    Cada doce da nossa vitrine informa porção, calorias e alergênicos antes mesmo de você adicionar ao carrinho.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    Retirada na Loja
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6E4455] dark:text-[#E5C5D2]">
                    Pedidos confirmados são preparados fresquinhos para você retirar diretamente na loja. No momento não realizamos entregas.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#F7CFE0] dark:border-[#3A232E] bg-[#FFEAF3]/60 dark:bg-[#1E1319]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#8C6173] dark:text-[#CBA8B8]">
          <div>
            <span className="font-display italic text-sm font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
              Doce Essência
            </span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Terça a Domingo, 9h às 19h</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} Doceria Doce Essência. Feito com carinho.</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastText && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full border border-[#F5D0DF] dark:border-[#3A232E] bg-[#3B202C] dark:bg-[#FCEEF4] px-5 py-3 text-sm text-white dark:text-[#3B202C] shadow-xl"
        >
          <Check className="h-4 w-4 text-[#FF8FB8] dark:text-[#C92C65] shrink-0" aria-hidden="true" />
          <span>{toastText}</span>
          <button
            type="button"
            onClick={() => {
              setToastText(null);
              setCartOpen(true);
            }}
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 ml-1 cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ver carrinho</span>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={cartOpen}
        items={cart}
        user={user}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={(id) => setCart((prev) => prev.filter((i) => i.product.id !== id))}
        onClearCart={() => setCart([])}
        onOrderCreated={() => void loadProducts()}
        onGoToStore={() => setActiveView('store')}
      />

      <AccessibilityDrawer
        open={a11yOpen}
        prefs={a11yPrefs}
        onChange={setA11yPrefs}
        onClose={() => setA11yOpen(false)}
      />

      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B202C]/45 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-[#FFFBFD] dark:bg-[#1E1319] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="logout-confirm-title"
              className="font-display text-xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]"
            >
              Sair da conta?
            </h2>
            <p className="mt-2 text-sm text-[#6E4455] dark:text-[#E5C5D2]">
              Tem certeza de que deseja sair da sua conta{user ? ` (${user.email})` : ''}?
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-full border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#170F14] px-4 py-2 text-sm font-medium text-[#6E4455] dark:text-[#E5C5D2] hover:bg-[#FFEAF3] dark:hover:bg-[#2A1B23] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  handleLogout();
                }}
                className="rounded-full bg-[#E03E78] px-5 py-2 text-sm font-medium text-white hover:bg-[#C92C65] cursor-pointer"
              >
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
