import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Candy,
  ClipboardList,
  LayoutDashboard,
  Package,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, formatCurrency, formatDateTime } from '../lib/api';
import { PRESET_IMAGE_OPTIONS, resolveProductImage } from '../lib/images';
import type {
  Order,
  OrderStatus,
  Product,
  StockMovement,
  StockMovementType,
  User,
  UserRole,
} from '../types';

type AdminTab = 'overview' | 'products' | 'users' | 'stock' | 'orders';

interface AdminDashboardProps {
  currentUser: User;
  onProductsChanged: () => void;
  onBackToStore: () => void;
}

const CATEGORIES = ['Brigadeiros & Docinhos', 'Bolos & Brownies', 'Tortas & Sobremesas', 'Especiais'];
const ORDER_STATUSES: OrderStatus[] = ['Pendente', 'Em Preparo', 'Pronto para Retirada', 'Concluído'];

export function AdminDashboard({
  currentUser,
  onProductsChanged,
  onBackToStore,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Product Form State
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState(CATEGORIES[0]);
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('20');
  const [prodDesc, setProdDesc] = useState('');
  const [prodNutrition, setProdNutrition] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('preset:brigadeiro');
  const [prodSaving, setProdSaving] = useState(false);
  const [confirmDeleteProdId, setConfirmDeleteProdId] = useState<number | null>(null);

  // User Form State
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('cliente');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userSaving, setUserSaving] = useState(false);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<number | null>(null);

  // Stock Movement State
  const [entryProductId, setEntryProductId] = useState<number>(0);
  const [entryQty, setEntryQty] = useState('');
  const [entryObs, setEntryObs] = useState('');
  const [exitProductId, setExitProductId] = useState<number>(0);
  const [exitQty, setExitQty] = useState('');
  const [exitObs, setExitObs] = useState('');
  const [movementFilter, setMovementFilter] = useState<'all' | StockMovementType>('all');
  const [stockSaving, setStockSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, userRes, movRes, ordRes] = await Promise.all([
        api.getProducts(true),
        api.getUsers(),
        api.getMovements(),
        api.getOrders(),
      ]);
      setProducts(prodRes.products);
      setUsers(userRes.users);
      setMovements(movRes.movements);
      setOrders(ordRes.orders);

      if (prodRes.products.length > 0) {
        setEntryProductId((prev) => prev || prodRes.products[0].id);
        setExitProductId((prev) => prev || prodRes.products[0].id);
      }
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erro ao carregar dados do painel.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  function showNotice(type: 'ok' | 'err', text: string) {
    setFeedback({ type, text });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showNotice('err', 'A imagem deve ter no máximo 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProdImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function startEditProduct(p: Product) {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdPrice(String(p.price));
    setProdDesc(p.description);
    setProdNutrition(p.nutritionalInfo);
    setProdImageUrl(p.imageUrl);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProdName('');
    setProdCategory(CATEGORIES[0]);
    setProdPrice('');
    setProdStock('20');
    setProdDesc('');
    setProdNutrition('');
    setProdImageUrl('preset:brigadeiro');
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setProdSaving(true);
    setFeedback(null);
    try {
      const normalizedPrice = Number(prodPrice.replace(',', '.'));
      if (editingProductId) {
        await api.updateProduct(editingProductId, {
          name: prodName,
          category: prodCategory,
          price: normalizedPrice,
          description: prodDesc,
          nutritionalInfo: prodNutrition,
          imageUrl: prodImageUrl,
        });
        showNotice('ok', 'Doce atualizado com sucesso.');
      } else {
        await api.createProduct({
          name: prodName,
          category: prodCategory,
          price: normalizedPrice,
          description: prodDesc,
          nutritionalInfo: prodNutrition,
          imageUrl: prodImageUrl,
          stock: Number(prodStock) || 0,
        });
        showNotice('ok', 'Novo doce adicionado à vitrine.');
      }
      resetProductForm();
      await loadAll();
      onProductsChanged();
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Erro ao salvar doce.');
    } finally {
      setProdSaving(false);
    }
  }

  async function handleToggleProductActive(p: Product) {
    try {
      await api.updateProduct(p.id, { active: !p.active });
      await loadAll();
      onProductsChanged();
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Erro ao atualizar status.');
    }
  }

  async function handleDeleteProduct(id: number) {
    try {
      await api.deleteProduct(id);
      setConfirmDeleteProdId(null);
      showNotice('ok', 'Doce removido do catálogo.');
      await loadAll();
      onProductsChanged();
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Erro ao remover doce.');
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserSaving(true);
    setFeedback(null);
    try {
      await api.createUser({
        name: userName,
        email: userEmail,
        password: userPassword,
        role: userRole,
        phone: userPhone,
        address: userAddress,
      });
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setUserRole('cliente');
      setUserPhone('');
      setUserAddress('');
      showNotice('ok', 'Usuário criado com sucesso.');
      await loadAll();
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Erro ao criar usuário.');
    } finally {
      setUserSaving(false);
    }
  }

  async function handleRoleChange(u: User, nextRole: UserRole) {
    try {
      await api.updateUserRole(u.id, nextRole);
      showNotice('ok', `Permissão de ${u.email} alterada para ${nextRole}.`);
      await loadAll();
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Erro ao alterar permissão.');
    }
  }

  async function handleDeleteUser(id: number) {
    try {
      await api.deleteUser(id);
      setConfirmDeleteUserId(null);
      showNotice('ok', 'Usuário removido.');
      await loadAll();
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Erro ao excluir usuário.');
    }
  }

  async function handleStockSubmit(type: StockMovementType, e: React.FormEvent) {
    e.preventDefault();
    setStockSaving(true);
    setFeedback(null);
    try {
      const productId = type === 'entrada' ? entryProductId : exitProductId;
      const quantity = Number(type === 'entrada' ? entryQty : exitQty);
      const observation = type === 'entrada' ? entryObs : exitObs;

      await api.createMovement({ productId, type, quantity, observation });

      if (type === 'entrada') {
        setEntryQty('');
        setEntryObs('');
      } else {
        setExitQty('');
        setExitObs('');
      }

      showNotice(
        'ok',
        type === 'entrada'
          ? 'Entrada de estoque registrada.'
          : 'Saída de estoque registrada.'
      );
      await loadAll();
      onProductsChanged();
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Erro ao movimentar estoque.');
    } finally {
      setStockSaving(false);
    }
  }

  async function handleOrderStatusChange(orderId: number, status: OrderStatus) {
    try {
      await api.updateOrderStatus(orderId, status);
      showNotice('ok', `Status do pedido atualizado para "${status}".`);
      await loadAll();
    } catch (err) {
      showNotice('err', err instanceof Error ? err.message : 'Erro ao atualizar pedido.');
    }
  }

  const totalStockUnits = useMemo(
    () => products.reduce((sum, p) => sum + p.stock, 0),
    [products]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock <= 10),
    [products]
  );

  const filteredMovements = useMemo(() => {
    if (movementFilter === 'all') return movements;
    return movements.filter((m) => m.type === movementFilter);
  }, [movements, movementFilter]);

  const tabs: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'products', label: 'Gerenciar Doces', icon: Candy },
    { id: 'users', label: 'Gerenciar Usuários', icon: Users },
    { id: 'stock', label: 'Movimentar Estoque', icon: Package },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
  ];

  const inputCls =
    'w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-[#FFF9FB] dark:bg-[#170F14] px-3.5 py-2.5 text-sm focus:border-[#E03E78] focus:outline-none';
  const labelCls =
    'block text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5';

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#F5D0DF] dark:border-[#3A232E] pb-6">
        <div>
          <button
            type="button"
            onClick={onBackToStore}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#8C6173] dark:text-[#CBA8B8] hover:text-[#C92C65] dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Voltar à vitrine</span>
          </button>
          <h1 className="font-display text-3xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
            Painel Administrativo
          </h1>
          <p className="mt-1 text-sm text-[#8C6173] dark:text-[#CBA8B8]">
            Conectado como {currentUser.email}. Gerencie doces, usuários, estoque e pedidos.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-2xl bg-[#FFEAF3] dark:bg-[#24171E] p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFeedback(null);
                setActiveTab(tab.id);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#170F14] text-[#C92C65] dark:text-[#FF9AC0] shadow-xs'
                  : 'text-[#6E4455] dark:text-[#CBA8B8] hover:text-[#C92C65] dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notice Banner */}
      {feedback && (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'ok'
              ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
              : 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 animate-pulse rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319]"
            />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-5 sweet-shadow">
                  <span className="text-xs font-medium text-[#8C6173] dark:text-[#CBA8B8]">
                    Doces no Catálogo
                  </span>
                  <p className="font-mono-num mt-2 text-2xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    {products.length}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-5 sweet-shadow">
                  <span className="text-xs font-medium text-[#8C6173] dark:text-[#CBA8B8]">
                    Unidades em Estoque
                  </span>
                  <p className="font-mono-num mt-2 text-2xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    {totalStockUnits}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-5 sweet-shadow">
                  <span className="text-xs font-medium text-[#8C6173] dark:text-[#CBA8B8]">
                    Pedidos Registrados
                  </span>
                  <p className="font-mono-num mt-2 text-2xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    {orders.length}
                  </p>
                </div>
                <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-5 sweet-shadow">
                  <span className="text-xs font-medium text-[#8C6173] dark:text-[#CBA8B8]">
                    Usuários Cadastrados
                  </span>
                  <p className="font-mono-num mt-2 text-2xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    {users.length}
                  </p>
                </div>
              </div>

              {/* Action cards matching original 3 admin pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="text-left rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-6 sweet-shadow hover:border-[#E03E78] hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <Candy className="h-6 w-6 text-[#E03E78] dark:text-[#FF8FB8] mb-3" aria-hidden="true" />
                  <h2 className="font-display text-lg font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    Gerenciar Doces
                  </h2>
                  <p className="mt-1.5 text-sm text-[#8C6173] dark:text-[#CBA8B8]">
                    Adicionar, editar, ocultar ou remover os produtos da vitrine.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="text-left rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-6 sweet-shadow hover:border-[#E03E78] hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <Users className="h-6 w-6 text-[#E03E78] dark:text-[#FF8FB8] mb-3" aria-hidden="true" />
                  <h2 className="font-display text-lg font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    Gerenciar Usuários
                  </h2>
                  <p className="mt-1.5 text-sm text-[#8C6173] dark:text-[#CBA8B8]">
                    Visualizar e gerenciar as contas de clientes e administradores.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('stock')}
                  className="text-left rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-6 sweet-shadow hover:border-[#E03E78] hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <Package className="h-6 w-6 text-[#E03E78] dark:text-[#FF8FB8] mb-3" aria-hidden="true" />
                  <h2 className="font-display text-lg font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    Movimentar Estoque
                  </h2>
                  <p className="mt-1.5 text-sm text-[#8C6173] dark:text-[#CBA8B8]">
                    Registrar entradas e saídas de produtos e acompanhar o histórico.
                  </p>
                </button>
              </div>

              {lowStockProducts.length > 0 && (
                <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 p-5">
                  <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-200">
                    Atenção: Doces com estoque baixo (≤ 10 unidades)
                  </h3>
                  <div className="mt-3 divide-y divide-amber-200/70 dark:divide-amber-900/40">
                    {lowStockProducts.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                        <span>{p.name}</span>
                        <span className="font-mono-num font-semibold text-amber-900 dark:text-amber-300">
                          {p.stock} un.
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form */}
              <div className="lg:col-span-5 rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-6 sweet-shadow">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    {editingProductId ? 'Editar Doce' : 'Adicionar Novo Doce'}
                  </h2>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="text-xs font-medium text-[#8C6173] hover:text-[#C92C65] cursor-pointer"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div>
                    <label className={labelCls}>Nome do Doce</label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Ex: Brigadeiro de Pistache (25 un.)"
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Categoria</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className={inputCls}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Preço (R$)</label>
                      <input
                        type="text"
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        placeholder="45,00"
                        className={`font-mono-num ${inputCls}`}
                      />
                    </div>
                  </div>

                  {!editingProductId && (
                    <div>
                      <label className={labelCls}>Estoque Inicial (Unidades)</label>
                      <input
                        type="number"
                        min={0}
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        className={`font-mono-num ${inputCls}`}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelCls}>Descrição</label>
                    <textarea
                      rows={3}
                      required
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="Ingredientes, sabor e diferenciais artesanais..."
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Imagem do Doce</label>
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveProductImage(prodImageUrl)}
                        alt="Prévia do doce"
                        className="h-14 w-16 rounded-2xl object-cover border border-[#F5D0DF] dark:border-[#3A232E] shrink-0"
                      />
                      <div className="flex-1 space-y-2">
                        <label className="inline-flex items-center gap-2 rounded-full border border-[#F3C4D7] dark:border-[#3A232E] px-3.5 py-1.5 text-xs font-medium hover:bg-[#FFEAF3] dark:hover:bg-[#2A1B23] cursor-pointer">
                          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Enviar arquivo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="sr-only"
                          />
                        </label>
                        <select
                          value={prodImageUrl.startsWith('preset:') ? prodImageUrl : ''}
                          onChange={(e) => {
                            if (e.target.value) setProdImageUrl(e.target.value);
                          }}
                          className="w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-[#FFF9FB] dark:bg-[#170F14] px-2.5 py-1.5 text-xs focus:border-[#E03E78] focus:outline-none"
                        >
                          <option value="">Ou escolha uma foto da galeria...</option>
                          {PRESET_IMAGE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Informação Nutricional</label>
                    <textarea
                      rows={2}
                      value={prodNutrition}
                      onChange={(e) => setProdNutrition(e.target.value)}
                      placeholder="Calorias: 100kcal, Carboidratos: 12g..."
                      className={inputCls}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={prodSaving}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#E03E78] py-2.5 text-sm font-medium text-white hover:bg-[#C92C65] disabled:opacity-60 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {prodSaving
                        ? 'Salvando...'
                        : editingProductId
                        ? 'Salvar Alterações'
                        : 'Adicionar Doce'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Catalog list */}
              <div className="lg:col-span-7 rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] overflow-hidden sweet-shadow">
                <div className="border-b border-[#F5D0DF] dark:border-[#3A232E] bg-[#FFF4F8] dark:bg-[#24171E] px-6 py-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    Doces Cadastrados ({products.length})
                  </h2>
                </div>

                <div className="divide-y divide-[#F5D0DF] dark:divide-[#3A232E]">
                  {products.map((p) => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                      <div className="flex items-start gap-4 min-w-0">
                        <img
                          src={resolveProductImage(p.imageUrl)}
                          alt={p.name}
                          className="h-16 w-20 shrink-0 rounded-2xl object-cover bg-[#FFF0F6] dark:bg-[#2A1B23]"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs text-[#8C6173] dark:text-[#CBA8B8]">
                            <span>{p.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{p.active ? 'Ativo' : 'Oculto'}</span>
                          </div>
                          <h3 className="text-sm font-semibold truncate mt-0.5">{p.name}</h3>
                          <div className="mt-1 flex items-center gap-3 text-xs">
                            <span className="font-mono-num font-semibold text-[#C92C65] dark:text-[#FF8FB8]">
                              {formatCurrency(p.price)}
                            </span>
                            <span className="font-mono-num text-[#8C6173] dark:text-[#CBA8B8]">
                              Estoque: {p.stock} un.
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleProductActive(p)}
                          className="rounded-full border border-[#F3C4D7] dark:border-[#3A232E] px-3 py-1.5 text-xs font-medium hover:bg-[#FFEAF3] dark:hover:bg-[#2A1B23] cursor-pointer"
                        >
                          {p.active ? 'Ocultar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditProduct(p)}
                          className="inline-flex items-center gap-1 rounded-full border border-[#F3C4D7] dark:border-[#3A232E] px-3 py-1.5 text-xs font-medium hover:bg-[#FFEAF3] dark:hover:bg-[#2A1B23] cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Editar</span>
                        </button>
                        {confirmDeleteProdId === p.id ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 cursor-pointer"
                          >
                            Confirmar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProdId(p.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#F3C4D7] dark:border-[#3A232E] text-[#8C6173] hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                            aria-label={`Remover ${p.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-8">
              <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-6 sweet-shadow">
                <h2 className="font-display text-xl font-semibold text-[#C92C65] dark:text-[#FF9AC0] mb-5">
                  Adicionar Novo Usuário
                </h2>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Nome</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Nome completo"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>E-mail</label>
                    <input
                      type="email"
                      required
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="usuario@exemplo.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Senha</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tipo de Usuário</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as UserRole)}
                      className={inputCls}
                    >
                      <option value="cliente">Cliente</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Telefone</label>
                    <input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="(XX) XXXXX-XXXX"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Endereço</label>
                    <input
                      type="text"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      placeholder="Rua, número e bairro"
                      className={inputCls}
                    />
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={userSaving}
                      className="rounded-full bg-[#E03E78] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#C92C65] disabled:opacity-60 cursor-pointer"
                    >
                      {userSaving ? 'Criando...' : 'Criar Usuário'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] overflow-hidden sweet-shadow">
                <div className="border-b border-[#F5D0DF] dark:border-[#3A232E] bg-[#FFF4F8] dark:bg-[#24171E] px-6 py-4">
                  <h2 className="font-display text-lg font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    Lista de Usuários
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#F5D0DF] dark:border-[#3A232E] text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8]">
                        <th className="py-3 px-6">ID</th>
                        <th className="py-3 px-4">E-mail</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Telefone</th>
                        <th className="py-3 px-4">Endereço</th>
                        <th className="py-3 px-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5D0DF] dark:divide-[#3A232E]">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-[#FFF9FB] dark:hover:bg-[#24171E]">
                          <td className="py-3.5 px-6 font-mono-num text-xs text-[#8C6173] dark:text-[#CBA8B8]">
                            #{u.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium">{u.email}</div>
                            {u.name && (
                              <div className="text-xs text-[#8C6173] dark:text-[#CBA8B8]">{u.name}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={u.role}
                              disabled={u.id === currentUser.id}
                              onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                              className="rounded-lg border border-[#F3C4D7] dark:border-[#3A232E] bg-transparent px-2.5 py-1 text-xs font-medium disabled:opacity-60"
                            >
                              <option value="cliente">cliente</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 font-mono-num text-xs">
                            {u.phone || 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#6E4455] dark:text-[#E5C5D2] max-w-[240px] truncate">
                            {u.address || 'N/A'}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            {u.id === currentUser.id ? (
                              <span className="text-xs text-[#8C6173] dark:text-[#CBA8B8]">Você</span>
                            ) : confirmDeleteUserId === u.id ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 cursor-pointer"
                              >
                                Confirmar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteUserId(u.id)}
                                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                              >
                                Remover
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STOCK MOVEMENTS */}
          {activeTab === 'stock' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Entrada */}
                <form
                  onSubmit={(e) => handleStockSubmit('entrada', e)}
                  className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-6 space-y-4 sweet-shadow"
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <h2 className="font-display text-lg font-semibold">Registrar Entrada</h2>
                  </div>

                  <div>
                    <label className={labelCls}>Doce</label>
                    <select
                      value={entryProductId}
                      onChange={(e) => setEntryProductId(Number(e.target.value))}
                      className={inputCls}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Atual: {p.stock} un.)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={entryQty}
                      onChange={(e) => setEntryQty(e.target.value)}
                      placeholder="Ex: 15"
                      className={`font-mono-num ${inputCls}`}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Observação</label>
                    <input
                      type="text"
                      value={entryObs}
                      onChange={(e) => setEntryObs(e.target.value)}
                      placeholder="Ex: Compra do fornecedor X / Produção do dia"
                      className={inputCls}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={stockSaving || products.length === 0}
                    className="w-full rounded-full bg-emerald-700 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
                  >
                    Confirmar Entrada
                  </button>
                </form>

                {/* Saída */}
                <form
                  onSubmit={(e) => handleStockSubmit('saida', e)}
                  className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-6 space-y-4 sweet-shadow"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-[#E03E78] dark:text-[#FF8FB8]" aria-hidden="true" />
                    <h2 className="font-display text-lg font-semibold">Registrar Saída</h2>
                  </div>

                  <div>
                    <label className={labelCls}>Doce</label>
                    <select
                      value={exitProductId}
                      onChange={(e) => setExitProductId(Number(e.target.value))}
                      className={inputCls}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Atual: {p.stock} un.)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Quantidade</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={exitQty}
                      onChange={(e) => setExitQty(e.target.value)}
                      placeholder="Ex: 3"
                      className={`font-mono-num ${inputCls}`}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Observação</label>
                    <input
                      type="text"
                      value={exitObs}
                      onChange={(e) => setExitObs(e.target.value)}
                      placeholder="Ex: Perda, Uso interno, Degustação"
                      className={inputCls}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={stockSaving || products.length === 0}
                    className="w-full rounded-full bg-[#E03E78] py-2.5 text-sm font-medium text-white hover:bg-[#C92C65] disabled:opacity-60 cursor-pointer"
                  >
                    Confirmar Saída
                  </button>
                </form>
              </div>

              {/* Histórico */}
              <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] overflow-hidden sweet-shadow">
                <div className="border-b border-[#F5D0DF] dark:border-[#3A232E] bg-[#FFF4F8] dark:bg-[#24171E] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <h2 className="font-display text-lg font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                    Histórico de Movimentações
                  </h2>
                  <div className="flex items-center gap-1 rounded-full bg-white dark:bg-[#170F14] p-1 border border-[#F3C4D7] dark:border-[#3A232E]">
                    {(
                      [
                        { id: 'all', label: 'Todas' },
                        { id: 'entrada', label: 'Entradas' },
                        { id: 'saida', label: 'Saídas' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setMovementFilter(f.id)}
                        className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          movementFilter === f.id
                            ? 'bg-[#FFEAF3] dark:bg-[#2A1B23] text-[#C92C65] dark:text-[#FF9AC0]'
                            : 'text-[#6E4455] dark:text-[#CBA8B8]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#F5D0DF] dark:border-[#3A232E] text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8]">
                        <th className="py-3 px-6">Data</th>
                        <th className="py-3 px-4">Doce</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4 text-right">Quantidade</th>
                        <th className="py-3 px-6">Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F5D0DF] dark:divide-[#3A232E]">
                      {filteredMovements.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-sm text-[#8C6173] dark:text-[#CBA8B8]">
                            Nenhuma movimentação registrada neste filtro.
                          </td>
                        </tr>
                      ) : (
                        filteredMovements.map((m) => (
                          <tr key={m.id} className="hover:bg-[#FFF9FB] dark:hover:bg-[#24171E]">
                            <td className="py-3 px-6 font-mono-num text-xs text-[#8C6173] dark:text-[#CBA8B8] whitespace-nowrap">
                              {formatDateTime(m.createdAt)}
                            </td>
                            <td className="py-3 px-4 font-medium">{m.productName}</td>
                            <td className="py-3 px-4 text-xs font-semibold">
                              <span
                                className={
                                  m.type === 'entrada'
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-[#C92C65] dark:text-[#FF8FB8]'
                                }
                              >
                                {m.type === 'entrada' ? 'Entrada (+)' : 'Saída (-)'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono-num font-semibold">
                              {m.type === 'entrada' ? `+${m.quantity}` : `-${m.quantity}`}
                            </td>
                            <td className="py-3 px-6 text-xs text-[#6E4455] dark:text-[#E5C5D2]">
                              {m.observation}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] overflow-hidden sweet-shadow">
              <div className="border-b border-[#F5D0DF] dark:border-[#3A232E] bg-[#FFF4F8] dark:bg-[#24171E] px-6 py-4">
                <h2 className="font-display text-lg font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                  Pedidos Recebidos ({orders.length})
                </h2>
              </div>

              {orders.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#8C6173] dark:text-[#CBA8B8]">
                  Nenhum pedido recebido ainda.
                </div>
              ) : (
                <div className="divide-y divide-[#F5D0DF] dark:divide-[#3A232E]">
                  {orders.map((order) => (
                    <div key={order.id} className="p-6 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-[#8C6173] dark:text-[#CBA8B8]">
                            <span className="font-mono-num font-semibold text-[#3B202C] dark:text-white">
                              #{order.orderNumber}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-num">{formatDateTime(order.createdAt)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{order.customerName} ({order.customerPhone})</span>
                          </div>
                          <p className="mt-1 text-xs text-[#6E4455] dark:text-[#E5C5D2]">
                            {order.deliveryAddress}
                          </p>
                          {order.notes && (
                            <p className="mt-1 text-xs italic text-[#8C6173] dark:text-[#CBA8B8]">
                              Obs: {order.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono-num text-base font-semibold text-[#C92C65] dark:text-[#FF8FB8]">
                            {formatCurrency(order.total)}
                          </span>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleOrderStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            className="rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-[#FFF9FB] dark:bg-[#170F14] px-3 py-1.5 text-xs font-medium"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#6E4455] dark:text-[#E5C5D2]">
                        {order.items.map((item) => (
                          <span key={item.productId} className="font-mono-num">
                            {item.quantity}x {item.productName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
