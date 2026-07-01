import { useEffect } from "react";

interface ErrorDialogProps {
  message: string | null;
  onClose: () => void;
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

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        className="bg-k8s-surface border border-red-500/30 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-k8s-border/50">
          <span className="text-2xl">⚠️</span>
          <h2 className="text-lg font-semibold text-red-400">Error</h2>
        </div>
        <div className="px-6 py-4 max-h-64 overflow-y-auto">
          <p className="text-k8s-text text-sm leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>
        <div className="px-6 py-3 border-t border-k8s-border/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
