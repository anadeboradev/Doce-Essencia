import { ArrowLeft, Lock, Mail, MapPin, Phone, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { User } from '../types';

export type AuthMode = 'login' | 'register' | 'forgot';

interface AuthViewProps {
  initialMode: AuthMode;
  onSuccess: (token: string, user: User) => void;
  onCancel: () => void;
}

export function AuthView({ initialMode, onSuccess, onCancel }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
  }, [initialMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        onSuccess(res.token, res.user);
      } else if (mode === 'register') {
        const res = await api.register({ email, password, name, phone, address });
        onSuccess(res.token, res.user);
      } else {
        const res = await api.resetPassword(email, password);
        setSuccessMsg(res.message);
        setPassword('');
        setMode('login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <button
        type="button"
        onClick={onCancel}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#6E4455] dark:text-[#E5C5D2] hover:text-[#C92C65] dark:hover:text-white cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Voltar à vitrine</span>
      </button>

      <div className="rounded-3xl border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#1E1319] p-6 sm:p-8 sweet-shadow">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
            {mode === 'login' && 'Entrar na sua conta'}
            {mode === 'register' && 'Criar nova conta'}
            {mode === 'forgot' && 'Redefinir senha'}
          </h1>
          <p className="mt-1.5 text-sm text-[#8C6173] dark:text-[#CBA8B8]">
            {mode === 'login' && 'Acesse seus pedidos ou gerencie a doceria como administrador.'}
            {mode === 'register' && 'Cadastre-se para fazer suas encomendas rapidinho e acompanhar seus pedidos.'}
            {mode === 'forgot' && 'Informe o e-mail cadastrado e defina uma nova senha de acesso.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5">
                Nome Completo
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#A6788C]" aria-hidden="true" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-[#FFF9FB] dark:bg-[#170F14] pl-10 pr-3.5 py-2.5 text-sm focus:border-[#E03E78] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#A6788C]" aria-hidden="true" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-[#FFF9FB] dark:bg-[#170F14] pl-10 pr-3.5 py-2.5 text-sm focus:border-[#E03E78] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5">
              {mode === 'forgot' ? 'Nova Senha' : 'Senha'}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#A6788C]" aria-hidden="true" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-[#FFF9FB] dark:bg-[#170F14] pl-10 pr-3.5 py-2.5 text-sm focus:border-[#E03E78] focus:outline-none"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5">
                  Telefone (Opcional)
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#A6788C]" aria-hidden="true" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(XX) XXXXX-XXXX"
                    className="w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-[#FFF9FB] dark:bg-[#170F14] pl-10 pr-3.5 py-2.5 text-sm focus:border-[#E03E78] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5">
                  Endereço (Opcional)
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#A6788C]" aria-hidden="true" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Seu endereço (opcional)"
                    className="w-full rounded-xl border border-[#F3C4D7] dark:border-[#3A232E] bg-[#FFF9FB] dark:bg-[#170F14] pl-10 pr-3.5 py-2.5 text-sm focus:border-[#E03E78] focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#E03E78] py-2.5 text-sm font-medium text-white transition-all hover:bg-[#C92C65] hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
          >
            {loading
              ? 'Processando...'
              : mode === 'login'
              ? 'Entrar'
              : mode === 'register'
              ? 'Criar Conta'
              : 'Salvar Nova Senha'}
          </button>
        </form>

        {/* Mode switchers */}
        <div className="mt-6 pt-5 border-t border-[#F5D0DF] dark:border-[#3A232E] space-y-2 text-center text-sm">
          {mode === 'login' && (
            <>
              <p className="text-[#8C6173] dark:text-[#CBA8B8]">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('register');
                  }}
                  className="font-medium text-[#C92C65] dark:text-[#FF8FB8] hover:underline cursor-pointer"
                >
                  Crie uma aqui
                </button>
              </p>
              <p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('forgot');
                  }}
                  className="text-xs text-[#8C6173] dark:text-[#CBA8B8] hover:text-[#C92C65] dark:hover:text-white hover:underline cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </p>
            </>
          )}

          {mode === 'register' && (
            <p className="text-[#8C6173] dark:text-[#CBA8B8]">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="font-medium text-[#C92C65] dark:text-[#FF8FB8] hover:underline cursor-pointer"
              >
                Faça login
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode('login');
                }}
                className="font-medium text-[#C92C65] dark:text-[#FF8FB8] hover:underline cursor-pointer"
              >
                Voltar ao login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
