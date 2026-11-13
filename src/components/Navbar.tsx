import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import type { User } from '../types';

export type AppView = 'store' | 'auth' | 'admin' | 'orders';

interface NavbarProps {
  user: User | null;
  activeView: AppView;
  cartCount: number;
  onNavigate: (view: AppView, authMode?: 'login' | 'register') => void;
  onOpenCart: () => void;
  onOpenA11y: () => void;
  onLogout: () => void;
}

export function Navbar({
  user,
  activeView,
  cartCount,
  onNavigate,
  onOpenCart,
  onOpenA11y,
  onLogout,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = (isActive: boolean) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 underline-offset-8 ${
      isActive
        ? 'text-[#C92C65] dark:text-[#FF8FB8] underline decoration-2'
        : 'text-[#6E4455] dark:text-[#E5C5D2] hover:text-[#C92C65] dark:hover:text-white hover:underline'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#F7CFE0] dark:border-[#3A232E] bg-[#FFEAF3]/95 dark:bg-[#1E1319]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element Brand wordmark */}
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            onNavigate('store');
          }}
          className="font-display italic text-2xl sm:text-[1.65rem] font-semibold tracking-tight text-[#C92C65] dark:text-[#FF9AC0] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E03E78] cursor-pointer"
        >
          Doce Essência
        </button>

        {/* Zone 2: Concise single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navegação principal">
          <button
            type="button"
            onClick={() => onNavigate('store')}
            className={`${linkClass(activeView === 'store')} cursor-pointer`}
          >
            Vitrine
          </button>

          <button
            type="button"
            onClick={onOpenA11y}
            className={`${linkClass(false)} cursor-pointer`}
          >
            Acessibilidade
          </button>

          {user ? (
            <>
              {user.role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className={`${linkClass(activeView === 'admin')} cursor-pointer`}
                >
                  Painel Admin
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate('orders')}
                  className={`${linkClass(activeView === 'orders')} cursor-pointer`}
                >
                  Meus Pedidos
                </button>
              )}
              <button
                type="button"
                onClick={onLogout}
                className={`${linkClass(false)} cursor-pointer`}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('auth', 'login')}
                className={`${linkClass(activeView === 'auth')} cursor-pointer`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => onNavigate('auth', 'register')}
                className={`${linkClass(false)} cursor-pointer`}
              >
                Criar Conta
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 rounded-full bg-[#E03E78] px-5 py-2 text-sm font-medium text-white shadow-xs transition-all hover:bg-[#C92C65] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E03E78] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span>Carrinho</span>
            {cartCount > 0 && (
              <span className="font-mono-num text-xs opacity-95">· {cartCount}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-full border border-[#F3C4D7] dark:border-[#3A232E] bg-white/80 dark:bg-[#24171E] text-[#3B202C] dark:text-[#FCEEF4]"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#F7CFE0] dark:border-[#3A232E] bg-[#FFF4F8] dark:bg-[#1E1319] px-4 py-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onNavigate('store');
            }}
            className="block w-full text-left py-2.5 px-2 text-sm font-medium text-[#3B202C] dark:text-[#FCEEF4]"
          >
            Vitrine
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenA11y();
            }}
            className="block w-full text-left py-2.5 px-2 text-sm font-medium text-[#3B202C] dark:text-[#FCEEF4]"
          >
            Acessibilidade
          </button>
          {user ? (
            <>
              {user.role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onNavigate('admin');
                  }}
                  className="block w-full text-left py-2.5 px-2 text-sm font-medium text-[#C92C65] dark:text-[#FF8FB8]"
                >
                  Painel Admin
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onNavigate('orders');
                  }}
                  className="block w-full text-left py-2.5 px-2 text-sm font-medium text-[#3B202C] dark:text-[#FCEEF4]"
                >
                  Meus Pedidos
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onLogout();
                }}
                className="block w-full text-left py-2.5 px-2 text-sm font-medium text-[#8C6173] dark:text-[#CBA8B8]"
              >
                Sair ({user.email})
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onNavigate('auth', 'login');
                }}
                className="block w-full text-left py-2.5 px-2 text-sm font-medium text-[#3B202C] dark:text-[#FCEEF4]"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onNavigate('auth', 'register');
                }}
                className="block w-full text-left py-2.5 px-2 text-sm font-medium text-[#C92C65] dark:text-[#FF8FB8]"
              >
                Criar Conta
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
