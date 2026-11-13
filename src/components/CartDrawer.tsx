import { ArrowLeft, CheckCircle2, Heart, Minus, Plus, Store, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, formatCurrency } from '../lib/api';
import { resolveProductImage } from '../lib/images';
import type { CartItem, Order, PaymentMethod, User } from '../types';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  user: User | null;
  onClose: () => void;
  onUpdateQty: (productId: number, qty: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onOrderCreated: (order: Order) => void;
  onGoToStore: () => void;
}

export function CartDrawer({
  open,
  items,
  user,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOrderCreated,
  onGoToStore,
}: CartDrawerProps) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.name || '');
      setCustomerEmail((prev) => prev || user.email || '');
      setCustomerPhone((prev) => prev || user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    if (!open && step === 'confirmed') {
      setStep('cart');
      setConfirmedOrder(null);
    }
  }, [open, step]);

  if (!open) return null;

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const total = subtotal;

  async function handleConfirmOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { order } = await api.createOrder({
        customerName,
        customerEmail,
        customerPhone,
        deliveryMethod: 'retirada',
        deliveryAddress: 'Retirada na loja',
        paymentMethod,
        notes,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });
      setConfirmedOrder(order);
      onOrderCreated(order);
      onClearCart();
      setStep('confirmed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir o pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#3B202C]/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-lg flex-col bg-[#FFFBFD] dark:bg-[#1E1319] text-[#3B202C] dark:text-[#FCEEF4] shadow-2xl border-l border-[#F5D0DF] dark:border-[#3A232E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F5D0DF] dark:border-[#3A232E] bg-[#FFF4F8] dark:bg-[#24171E] px-6 py-5">
          <div className="flex items-center gap-3">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('cart');
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#170F14] hover:bg-[#FFEAF3] dark:hover:bg-[#2E1D25] cursor-pointer"
                aria-label="Voltar ao carrinho"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h2 id="cart-title" className="font-display text-xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
                {step === 'cart' && 'Meu Carrinho de Compras'}
                {step === 'checkout' && 'Finalizar Pedido'}
                {step === 'confirmed' && 'Pedido Confirmado'}
              </h2>
              {step === 'cart' && items.length > 0 && (
                <p className="text-xs text-[#8C6173] dark:text-[#CBA8B8] mt-0.5">
                  Somente retirada na loja (não realizamos entregas).
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#170F14] text-[#6E4455] dark:text-[#E5C5D2] hover:bg-[#FFEAF3] dark:hover:bg-[#2E1D25] cursor-pointer"
            aria-label="Fechar carrinho"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 'confirmed' && confirmedOrder ? (
            <div className="py-6 space-y-6">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                    Pedido #{confirmedOrder.orderNumber} confirmado — Em preparação
                  </p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                    Obrigado, {confirmedOrder.customerName}. Seus docinhos estarão prontos para retirada na loja.
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t border-[#F5D0DF] dark:border-[#3A232E] pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8C6173] dark:text-[#CBA8B8]">Recebimento</span>
                  <span className="font-medium text-right max-w-[260px]">
                    Retirada na loja
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C6173] dark:text-[#CBA8B8]">Pagamento</span>
                  <span className="font-medium">
                    {confirmedOrder.paymentMethod === 'pix'
                      ? 'Pix'
                      : confirmedOrder.paymentMethod === 'cartao_retirada'
                      ? 'Cartão na retirada'
                      : 'Dinheiro na retirada'}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#F5D0DF] dark:border-[#3A232E] pt-4 space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8]">
                  Resumo dos itens
                </h3>
                {confirmedOrder.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="font-mono-num">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 border-t border-[#F5D0DF] dark:border-[#3A232E] font-semibold">
                  <span>Total</span>
                  <span className="font-mono-num text-[#C92C65] dark:text-[#FF8FB8]">
                    {formatCurrency(confirmedOrder.total)}
                  </span>
                </div>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFEAF3] dark:bg-[#2A1B23] text-[#E03E78] dark:text-[#FF8FB8] mb-4">
                <Heart className="h-7 w-7" aria-hidden="true" />
              </div>
              <h3 className="font-display text-xl font-semibold">Seu carrinho está vazio</h3>
              <p className="mt-1.5 max-w-xs text-sm text-[#8C6173] dark:text-[#CBA8B8]">
                Escolha seus brigadeiros, brownies e bolos favoritos para retirar na loja.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToStore();
                }}
                className="mt-6 rounded-full bg-[#E03E78] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#C92C65] cursor-pointer"
              >
                Ver Doces
              </button>
            </div>
          ) : step === 'cart' ? (
            <div className="divide-y divide-[#F5D0DF] dark:divide-[#3A232E]">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-4 py-4 first:pt-0">
                  <img
                    src={resolveProductImage(product.imageUrl)}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="h-20 w-24 shrink-0 rounded-2xl object-cover bg-[#FFF0F6] dark:bg-[#2A1B23]"
                  />
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{product.name}</h3>
                        <p className="font-mono-num text-xs text-[#8C6173] dark:text-[#CBA8B8] mt-0.5">
                          {formatCurrency(product.price)} cada
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(product.id)}
                        className="p-1.5 text-[#8C6173] hover:text-red-600 dark:text-[#CBA8B8] dark:hover:text-red-400 cursor-pointer"
                        aria-label={`Remover ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#170F14]">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, quantity - 1)}
                          className="inline-flex h-8 w-8 items-center justify-center hover:text-[#C92C65] cursor-pointer"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-mono-num w-8 text-center text-xs font-medium">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          disabled={quantity >= product.stock}
                          onClick={() => onUpdateQty(product.id, quantity + 1)}
                          className="inline-flex h-8 w-8 items-center justify-center hover:text-[#C92C65] disabled:opacity-40 cursor-pointer"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-mono-num text-sm font-semibold text-[#C92C65] dark:text-[#FF8FB8]">
                        {formatCurrency(product.price * quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleConfirmOrder} className="space-y-4">
              {error && (
                <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex items-start gap-3 rounded-2xl border border-[#F5D0DF] dark:border-[#3A232E] bg-[#FFF4F8] dark:bg-[#24171E] p-3.5 text-xs text-[#6E4455] dark:text-[#E5C5D2]">
                <Store className="h-4 w-4 text-[#C92C65] dark:text-[#FF8FB8] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <span className="block font-semibold text-[#3B202C] dark:text-white">
                    Somente retirada na loja
                  </span>
                  <span className="block mt-0.5">
                    Não realizamos entregas. Seu pedido ficará separado para retirada no balcão.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Seu nome para a retirada"
                  className="w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#170F14] px-3.5 py-2.5 text-sm focus:border-[#E03E78] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#170F14] px-3.5 py-2.5 text-sm focus:border-[#E03E78] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#170F14] px-3.5 py-2.5 text-sm focus:border-[#E03E78] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#170F14] px-3.5 py-2.5 text-sm focus:border-[#E03E78] focus:outline-none"
                >
                  <option value="pix">Pix (aprovação imediata)</option>
                  <option value="cartao_retirada">Cartão na retirada</option>
                  <option value="dinheiro">Dinheiro na retirada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: horário previsto para retirada, embalagem para presente..."
                  className="w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#170F14] px-3.5 py-2.5 text-sm focus:border-[#E03E78] focus:outline-none"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && step !== 'confirmed' && (
          <div className="border-t border-[#F5D0DF] dark:border-[#3A232E] px-6 py-5 space-y-4 bg-[#FFF4F8] dark:bg-[#24171E]">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#6E4455] dark:text-[#E5C5D2]">
                <span>Recebimento</span>
                <span>Retirada na loja</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#F5D0DF] dark:border-[#3A232E] text-base font-semibold">
                <span>Total</span>
                <span className="font-mono-num text-[#C92C65] dark:text-[#FF8FB8]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full rounded-full bg-[#E03E78] py-3 text-sm font-medium text-white transition-all hover:bg-[#C92C65] cursor-pointer"
              >
                Continuar para Finalização
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="w-full rounded-full bg-[#E03E78] py-3 text-sm font-medium text-white transition-all hover:bg-[#C92C65] disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Confirmando Pedido...' : 'Confirmar Pedido'}
              </button>
            )}
          </div>
        )}

        {step === 'confirmed' && (
          <div className="border-t border-[#F5D0DF] dark:border-[#3A232E] px-6 py-4 bg-[#FFF4F8] dark:bg-[#24171E]">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full bg-[#E03E78] py-2.5 text-sm font-medium text-white hover:bg-[#C92C65] cursor-pointer"
            >
              Continuar Navegando
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
