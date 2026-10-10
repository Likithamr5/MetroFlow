"use client";
import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="glass max-w-md w-full p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">System Error</h2>
        <p className="text-gray-400 mb-8 text-sm">
          MetroFlow encountered a critical error processing analytics data. Our systems have been notified.
        </p>
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl transition-colors border border-gray-700 font-medium w-full justify-center"
        >
          <RefreshCw size={18} />
          <span>Retry Connection</span>
        </button>
      </div>
    </div>
  );
}
