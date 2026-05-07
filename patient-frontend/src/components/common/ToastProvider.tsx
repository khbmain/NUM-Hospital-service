import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-brand-200 bg-brand-50 text-brand-800',
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

let nextToastId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = nextToastId++;
    setToasts((items) => [...items, { id, message, variant }].slice(-4));
    window.setTimeout(() => removeToast(id), variant === 'error' ? 6000 : 4200);
  }, [removeToast]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:right-5">
        {toasts.map((item) => {
          const Icon = icons[item.variant];
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-lg border p-3 text-sm shadow-lg shadow-surface-900/10 ${variantStyles[item.variant]}`}
              role="status"
            >
              <Icon size={17} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1 leading-5">{item.message}</span>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="shrink-0 rounded-md p-0.5 opacity-70 transition hover:bg-white/60 hover:opacity-100"
                aria-label="Мэдэгдэл хаах"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used within ToastProvider');
  return value;
}
