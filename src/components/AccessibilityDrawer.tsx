import { Contrast, RotateCcw, Type, X } from 'lucide-react';
import type { AccessibilityPrefs } from '../types';

interface AccessibilityDrawerProps {
  open: boolean;
  prefs: AccessibilityPrefs;
  onChange: (next: AccessibilityPrefs) => void;
  onClose: () => void;
}

const DEFAULT_PREFS: AccessibilityPrefs = {
  theme: 'light',
  fontSize: 'default',
  reduceMotion: false,
  extraSpacing: false,
};

export function AccessibilityDrawer({
  open,
  prefs,
  onChange,
  onClose,
}: AccessibilityDrawerProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#3B202C]/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-title"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-[#FFFBFD] dark:bg-[#1E1319] text-[#3B202C] dark:text-[#FCEEF4] shadow-2xl border-l border-[#F5D0DF] dark:border-[#3A232E]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F5D0DF] dark:border-[#3A232E] bg-[#FFF4F8] dark:bg-[#24171E] px-6 py-5">
          <div>
            <h2 id="a11y-title" className="font-display text-xl font-semibold text-[#C92C65] dark:text-[#FF9AC0]">
              Acessibilidade
            </h2>
            <p className="mt-0.5 text-xs text-[#8C6173] dark:text-[#CBA8B8]">
              Ajuste leitura, contraste e movimento para sua preferência.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#F5D0DF] dark:border-[#3A232E] bg-white dark:bg-[#170F14] text-[#6E4455] dark:text-[#E5C5D2] hover:bg-[#FFEAF3] dark:hover:bg-[#2E1D25] cursor-pointer"
            aria-label="Fechar painel de acessibilidade"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Theme */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Contrast className="h-4 w-4 text-[#E03E78] dark:text-[#FF8FB8]" aria-hidden="true" />
              <span>Contraste e Aparência</span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#FFF0F6] dark:bg-[#2A1B23]">
              <button
                type="button"
                onClick={() => onChange({ ...prefs, theme: 'light' })}
                className={`py-2 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                  prefs.theme === 'light'
                    ? 'bg-white text-[#C92C65] shadow-xs'
                    : 'text-[#6E4455] dark:text-[#CBA8B8]'
                }`}
              >
                Modo Claro
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...prefs, theme: 'dark' })}
                className={`py-2 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                  prefs.theme === 'dark'
                    ? 'bg-[#170F14] text-[#FF9AC0] shadow-xs'
                    : 'text-[#6E4455] dark:text-[#CBA8B8]'
                }`}
              >
                Modo Escuro
              </button>
            </div>
          </div>

          {/* Font size */}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Type className="h-4 w-4 text-[#E03E78] dark:text-[#FF8FB8]" aria-hidden="true" />
              <span>Tamanho da Fonte</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-[#FFF0F6] dark:bg-[#2A1B23]">
              {(
                [
                  { id: 'default', label: 'Padrão' },
                  { id: 'md', label: 'Médio' },
                  { id: 'lg', label: 'Grande' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...prefs, fontSize: opt.id })}
                  className={`py-2 px-3 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                    prefs.fontSize === opt.id
                      ? 'bg-white dark:bg-[#170F14] text-[#C92C65] dark:text-[#FF9AC0] shadow-xs'
                      : 'text-[#6E4455] dark:text-[#CBA8B8]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-3 border-t border-[#F5D0DF] dark:border-[#3A232E]">
            <label className="flex items-start justify-between gap-4 py-2 cursor-pointer">
              <div>
                <p className="text-sm font-medium">Espaçamento Ampliado</p>
                <p className="text-xs text-[#8C6173] dark:text-[#CBA8B8] mt-0.5">
                  Aumenta a distância entre letras e linhas para facilitar a leitura.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.extraSpacing}
                onChange={(e) => onChange({ ...prefs, extraSpacing: e.target.checked })}
                className="mt-1 h-4 w-4 accent-[#E03E78] cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between gap-4 py-2 cursor-pointer">
              <div>
                <p className="text-sm font-medium">Reduzir Animações</p>
                <p className="text-xs text-[#8C6173] dark:text-[#CBA8B8] mt-0.5">
                  Desativa transições suaves e efeitos de movimento na tela.
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefs.reduceMotion}
                onChange={(e) => onChange({ ...prefs, reduceMotion: e.target.checked })}
                className="mt-1 h-4 w-4 accent-[#E03E78] cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="border-t border-[#F5D0DF] dark:border-[#3A232E] px-6 py-4 flex items-center justify-between gap-3 bg-[#FFF4F8] dark:bg-[#24171E]">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_PREFS)}
            className="inline-flex items-center gap-2 rounded-full border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#170F14] px-4 py-2 text-sm font-medium text-[#6E4455] dark:text-[#E5C5D2] hover:bg-[#FFEAF3] dark:hover:bg-[#2E1D25] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Restaurar</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#E03E78] px-6 py-2 text-sm font-medium text-white hover:bg-[#C92C65] cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
