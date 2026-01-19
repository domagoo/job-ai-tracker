// app/components/ToastProvider.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  timeoutMs: number;
};

type ToastApi = {
  show: (
    message: string,
    opts?: { type?: ToastType; title?: string; timeoutMs?: number }
  ) => void;
  success: (message: string, opts?: { title?: string; timeoutMs?: number }) => void;
  error: (message: string, opts?: { title?: string; timeoutMs?: number }) => void;
  info: (message: string, opts?: { title?: string; timeoutMs?: number }) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// single polite live region for the stack
function getLiveProps(type: ToastType) {
  // errors should interrupt (assertive), others can be polite
  return type === "error"
    ? { role: "alert", "aria-live": "assertive" as const }
    : { role: "status", "aria-live": "polite" as const };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current[id];
    if (timer) window.clearTimeout(timer);
    delete timers.current[id];
  }, []);

  const show = useCallback(
    (message: string, opts?: { type?: ToastType; title?: string; timeoutMs?: number }) => {
      const id = makeId();
      const item: ToastItem = {
        id,
        type: opts?.type ?? "info",
        title: opts?.title,
        message,
        timeoutMs: opts?.timeoutMs ?? 2600,
      };

      setToasts((prev) => [item, ...prev].slice(0, 4)); // keep max 4 visible

      timers.current[id] = window.setTimeout(() => remove(id), item.timeoutMs);
    },
    [remove]
  );

  const api: ToastApi = useMemo(
    () => ({
      show,
      success: (message, opts) => show(message, { ...opts, type: "success" }),
      error: (message, opts) => show(message, { ...opts, type: "error" }),
      info: (message, opts) => show(message, { ...opts, type: "info" }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Toasts UI */}
      <div
        className="fixed right-4 top-4 z-[9999] grid gap-3"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const heading =
            t.title ??
            (t.type === "success"
              ? "Success"
              : t.type === "error"
              ? "Something went wrong"
              : "Notice");

          const liveProps = getLiveProps(t.type);

          return (
            <div
              key={t.id}
              className={[
                "glass-card !p-4 w-[min(360px,92vw)] animate-scale-in",
                t.type === "success" ? "border-emerald-300/25" : "",
                t.type === "error" ? "border-red-300/25" : "",
              ].join(" ")}
              {...liveProps}
              aria-atomic="true"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white/90">
                      {heading}
                    </span>

                    <span
                      className={[
                        "pill !py-0.5 !px-2 text-[11px]",
                        t.type === "success"
                          ? "bg-emerald-500/10 text-emerald-100 border-emerald-300/20"
                          : "",
                        t.type === "error"
                          ? "bg-red-500/10 text-red-100 border-red-300/20"
                          : "",
                      ].join(" ")}
                    >
                      {t.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-sm text-white/75 leading-relaxed">
                    {t.message}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-glass btn-ghost !px-3 !py-1.5 text-xs"
                  onClick={() => remove(t.id)}
                  aria-label={`Dismiss notification: ${heading}`}
                >
                  Close
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider />");
  return ctx;
}
