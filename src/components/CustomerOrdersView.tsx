import { ArrowLeft, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, formatCurrency, formatDateTime } from '../lib/api';
import type { Order } from '../types';

interface CustomerOrdersViewProps {
  onBackToStore: () => void;
}

export function CustomerOrdersView({ onBackToStore }: CustomerOrdersViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getOrders()
      .then((res) => {
        if (active) setOrders(res.orders);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBackToStore}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#6E4455] dark:text-[#E5C5D2] hover:text-[#C92C65] dark:hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Voltar à vitrine</span>
          </button>
          <h1 className="font-display text-3xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
            Meus Pedidos
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-32 animate-pulse rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-6 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-12 text-center sweet-shadow">
          <Package className="mx-auto h-10 w-10 text-[#E03E78] dark:text-[#FF8FB8] mb-3" aria-hidden="true" />
          <h2 className="font-display text-xl font-semibold">Você ainda não fez pedidos</h2>
          <p className="mt-1.5 text-sm text-[#8C6173] dark:text-[#CBA8B8]">
            Escolha seus doces favoritos na vitrine para acompanhar seus pedidos por aqui.
          </p>
          <button
            type="button"
            onClick={onBackToStore}
            className="mt-6 rounded-full bg-[#E03E78] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#C92C65] cursor-pointer"
          >
            Explorar Vitrine
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-6 sweet-shadow"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F5D0DF] dark:border-[#3A232E] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#8C6173] dark:text-[#CBA8B8]">
                    <span className="font-mono-num font-semibold text-[#3B202C] dark:text-white">
                      Pedido #{order.orderNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDateTime(order.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-[#6E4455] dark:text-[#E5C5D2]">
                    {order.deliveryAddress}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-[#C92C65] dark:text-[#FF8FB8]">
                    {order.status}
                  </span>
                  <span className="font-mono-num text-lg font-semibold">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-[#6E4455] dark:text-[#E5C5D2]">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="font-mono-num">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
