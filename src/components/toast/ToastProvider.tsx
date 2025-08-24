"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info" | "warning";
export type Toast = {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms, default 3500
};

interface toastTypes {
  toasts: Toast[];
  show: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  clear: () => void;
  // helpers
  success: (
    message: string,
    opts?: Omit<Toast, "id" | "message" | "variant">
  ) => string;
  error: (
    message: string,
    opts?: Omit<Toast, "id" | "message" | "variant">
  ) => string;
  info: (
    message: string,
    opts?: Omit<Toast, "id" | "message" | "variant">
  ) => string;
  warning: (
    message: string,
    opts?: Omit<Toast, "id" | "message" | "variant">
  ) => string;
  promise: <T>(
    p: Promise<T>,
    msgs: { loading: string; success: string; error: string }
  ) => Promise<T>;
};

const ToastContext = createContext<toastTypes | null>(null);
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = makeId();
      const duration = t.duration ?? 3500;
      setToasts((curr) => [...curr, { id, ...t }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const variantHelper =
    (variant: ToastVariant) =>
    (message: string, opts: Omit<Toast, "id" | "message" | "variant"> = {}) =>
      show({ message, variant, ...opts });

  const clear = useCallback(() => setToasts([]), []);

  const promise = useCallback(
    async <T,>(
      p: Promise<T>,
      msgs: { loading: string; success: string; error: string }
    ) => {
      const id = show({ message: msgs.loading, variant: "info", duration: 0 });
      try {
        const res = await p;
        dismiss(id);
        show({ message: msgs.success, variant: "success" });
        return res;
      } catch (e) {
        dismiss(id);
        show({ message: msgs.error, variant: "error" });
        throw e;
      }
    },
    [show, dismiss]
  );

  const value: toastTypes = useMemo(
    () => ({
      toasts,
      show,
      dismiss,
      clear,
      success: variantHelper("success"),
      error: variantHelper("error"),
      info: variantHelper("info"),
      warning: variantHelper("warning"),
      promise,
    }),
    [toasts, show, dismiss, clear, promise]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  // Accessible live region
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed z-50 bottom-4 right-4 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const getColor = (variant?: ToastVariant) => {
    switch (variant) {
      case "success":
        return "bg-green-600";
      case "error":
        return "bg-red-600";
      case "warning":
        return "bg-yellow-600";
      default:
        return "bg-gray-800";
    }
  };

  const color = getColor(toast.variant);

  return (
    <div
      role="status"
      className={`text-white ${color} shadow-lg rounded-xl px-4 py-3 min-w-[260px] max-w-sm`}
    >
      {toast.title && (
        <div className="text-sm font-semibold">{toast.title}</div>
      )}
      <div className="text-sm">{toast.message}</div>
      <button
        onClick={onClose}
        className="absolute top-1 right-2 text-white/80 hover:text-white"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
