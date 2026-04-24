import { ReactNode } from 'react';
import { AlertCircle, X } from 'lucide-react';

type AppModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  loading?: boolean;
  onClose: () => void;
  onConfirm?: () => void;
};

export default function AppModal({
  open,
  title,
  description,
  children,
  confirmLabel = 'Батлах',
  cancelLabel = 'Болих',
  tone = 'default',
  loading,
  onClose,
  onConfirm,
}: AppModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6">
      <button type="button" aria-label="Close modal" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl border border-surface-200 overflow-hidden">
        <div className="flex items-start gap-3 p-5 border-b border-surface-100">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
            <AlertCircle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-base text-surface-900">{title}</h2>
            {description && <p className="text-sm text-surface-500 mt-1 leading-relaxed">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100">
            <X size={16} />
          </button>
        </div>
        {children && <div className="p-5">{children}</div>}
        <div className="flex justify-end gap-2 px-5 py-4 bg-surface-50">
          <button type="button" onClick={onClose} className="btn-ghost text-sm" disabled={loading}>{cancelLabel}</button>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`text-sm ${tone === 'danger' ? 'btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'btn-primary'}`}
            >
              {loading ? 'Уншиж байна...' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
