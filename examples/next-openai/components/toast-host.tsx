'use client';

import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

// Global event name used by lib/toast.ts
const TOAST_EVENT = 'app:toast';

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<{ message: string; type?: ToastType }>).detail;
      if (!detail?.message) return;
      const id = Date.now() + Math.random();
      const type: ToastType = detail.type ?? 'info';
      const item: ToastItem = { id, message: detail.message, type };
      setToasts(prev => [...prev, item]);
      const timeout = setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
      return () => clearTimeout(timeout);
    }

    window.addEventListener(TOAST_EVENT, onToast as EventListener);
    return () => window.removeEventListener(TOAST_EVENT, onToast as EventListener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2">
      {toasts.map(t => (
        <Toast key={t.id} item={t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
      ))}
    </div>
  );
}

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const color =
    item.type === 'success'
      ? 'border-green-300 bg-green-50 text-green-900'
      : item.type === 'error'
      ? 'border-red-300 bg-red-50 text-red-900'
      : 'border-neutral-300 bg-white text-neutral-900';

  return (
    <div className={`min-w-[260px] max-w-[360px] shadow-sm rounded-md border px-3 py-2 ${color}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 text-sm leading-5">{item.message}</div>
        <button
          aria-label="Stäng"
          onClick={onClose}
          className="ml-2 shrink-0 text-xs text-neutral-500 hover:text-neutral-700"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
