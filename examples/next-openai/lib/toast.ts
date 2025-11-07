'use client';

export type ToastType = 'success' | 'error' | 'info';

const TOAST_EVENT = 'app:toast';

export function toast(message: string, type: ToastType = 'info') {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent(TOAST_EVENT, { detail: { message, type } });
  window.dispatchEvent(event);
}
