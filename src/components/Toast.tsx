"use client";

import React, { useEffect, useState, useCallback } from "react";

export interface ToastItem {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

export type ToastOptions = Omit<ToastItem, "id">;

const TOAST_EVENT = "cn-toast-event";

export function showToast(options: ToastOptions) {
  if (typeof window === "undefined") return;
  const id = "toast-" + Math.random().toString(36).substring(2, 9);
  const detail: ToastItem = { ...options, id };
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleNewToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (!customEvent.detail) return;
      const newToast = customEvent.detail;

      setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts

      const timer = setTimeout(() => {
        removeToast(newToast.id);
      }, newToast.durationMs ?? 5000);

      return () => clearTimeout(timer);
    };

    window.addEventListener(TOAST_EVENT, handleNewToast);
    return () => window.removeEventListener(TOAST_EVENT, handleNewToast);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded border border-[#8A5A2B]/40 bg-[#1B1A17] text-[#FAF5EC] px-4 py-3 shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-ui transition-all duration-300 animate-fade-up"
        >
          <span className="flex-1 font-medium leading-snug">{toast.message}</span>

          <div className="flex items-center gap-1 shrink-0">
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  removeToast(toast.id);
                }}
                className="min-h-[44px] min-w-[44px] px-3 py-1 font-bold uppercase tracking-wider text-amber-300 hover:text-white underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded transition"
              >
                {toast.actionLabel}
              </button>
            )}

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[#D9CFBF] hover:text-white text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded transition"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </aside>
  );
}
export default ToastContainer;
