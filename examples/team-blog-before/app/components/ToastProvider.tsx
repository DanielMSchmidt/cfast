import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Alert from "@mui/joy/Alert";
import IconButton from "@mui/joy/IconButton";
import Box from "@mui/joy/Box";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  addToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

const toastTypeToColor: Record<ToastType, "success" | "danger" | "warning" | "primary"> = {
  success: "success",
  error: "danger",
  warning: "warning",
  info: "primary",
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = String(++nextId);
      setToasts((prev) => [...prev, { id, message, type }]);

      const timer = setTimeout(() => {
        removeToast(id);
      }, 4000);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <Box
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          maxWidth: 400,
          "@keyframes slideIn": {
            from: {
              transform: "translateX(100%)",
              opacity: 0,
            },
            to: {
              transform: "translateX(0)",
              opacity: 1,
            },
          },
        }}
      >
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            color={toastTypeToColor[toast.type]}
            variant="soft"
            sx={{
              animation: "slideIn 0.3s ease-out",
              boxShadow: "md",
            }}
            endDecorator={
              <IconButton
                variant="plain"
                size="sm"
                color={toastTypeToColor[toast.type]}
                onClick={() => removeToast(toast.id)}
              >
                &#10005;
              </IconButton>
            }
          >
            {toast.message}
          </Alert>
        ))}
      </Box>
    </ToastContext.Provider>
  );
}
