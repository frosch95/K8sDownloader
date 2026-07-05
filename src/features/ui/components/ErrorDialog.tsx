import { useEffect } from "react";

interface ErrorDialogProps {
  message: string | null;
  onClose: () => void;
}

function formatMessage(message: string | null): string {
  if (!message) return "";

  const normalized = message.toLowerCase();
  if (normalized.includes("kubectl") || normalized.includes("kubeconfig")) {
    return `${message}\n\nSuggested next steps:\n• Install kubectl and make sure it is available on PATH.\n• Set KUBECTL_PATH or KUBECTL_BIN to the full kubectl executable path.\n• Verify your kubeconfig with kubectl config view.`;
  }

  return message;
}

export function ErrorDialog({ message, onClose }: ErrorDialogProps) {
  useEffect(() => {
    if (!message) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [message, onClose]);

  const dialogMessage = formatMessage(message);

  if (!dialogMessage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div
        role="alertdialog"
        aria-modal="true"
        className="bg-k8s-surface/90 backdrop-blur-xl border border-red-500/30 rounded-xl shadow-2xl shadow-red-500/5 w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-k8s-border/50 bg-gradient-to-r from-red-500/5 to-transparent">
          <span className="text-2xl">⚠️</span>
          <h2 className="text-lg font-semibold text-red-400">Error</h2>
        </div>
        <div className="px-6 py-4 max-h-64 overflow-y-auto">
          <p className="text-k8s-text text-sm leading-relaxed whitespace-pre-wrap">
            {dialogMessage}
          </p>
        </div>
        <div className="px-6 py-3 border-t border-k8s-border/50 flex justify-end bg-gradient-to-r from-transparent to-red-500/5">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-all hover-lift focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
