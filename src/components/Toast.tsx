import { useEffect } from 'react';
import { useTodoStore } from '../store/todoStore';

export function Toast() {
  const toast = useTodoStore((s) => s.toast);
  const dismissToast = useTodoStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismissToast(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {toast && (
        <div className="pointer-events-auto flex max-w-md items-center gap-4 rounded-xl bg-zinc-900 py-2.5 pl-4 pr-2 text-sm text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          <span className="min-w-0">{toast.message}</span>
          {toast.undo ? (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                dismissToast(toast.id);
              }}
              className="shrink-0 rounded-md px-2 py-1 font-semibold text-blue-400 hover:bg-white/10 dark:text-blue-600 dark:hover:bg-black/5"
            >
              Undo
            </button>
          ) : (
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-md px-2 py-1 text-zinc-400 hover:bg-white/10 dark:text-zinc-500 dark:hover:bg-black/5"
            >
              OK
            </button>
          )}
        </div>
      )}
    </div>
  );
}
