"use client";
import React, { useState } from "react";
import { AlertCircle, X, RefreshCw } from "lucide-react";

export default function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/30 backdrop-blur-md rounded-xl p-4 flex items-center justify-between mb-6 shadow-lg shadow-red-500/10">
      <div className="flex items-center gap-3">
        <AlertCircle className="text-red-400" size={24} />
        <div>
          <h4 className="text-sm font-bold text-white">Connection Error</h4>
          <p className="text-xs text-red-200/80 mt-0.5">{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20"
        >
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
