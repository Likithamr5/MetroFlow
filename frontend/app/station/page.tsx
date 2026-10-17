"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Train, ArrowLeft } from "lucide-react";
import LiveStationDashboard from "../components/dashboard/LiveStationDashboard";
import { api } from "../lib/api";

export default function StationPage() {
  const [stationList, setStationList] = useState<string[]>([]);

  useEffect(() => {
    api.getStations()
      .then((res) => {
        if (res && res.length > 0) setStationList(res);
      })
      .catch((err) => console.error("Error fetching station list:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800/80 bg-gray-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700 transition-all font-medium"
            >
              <ArrowLeft size={14} />
              <span>Network Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-gray-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-violet-600/90 p-2 shadow-lg shadow-violet-600/30">
                <Train size={18} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold text-white tracking-tight">MetroFlow</h1>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Live Stream
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Bengaluru Namma Metro • 2-Second Live Telemetry</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        <LiveStationDashboard stationList={stationList} />
      </main>

      <footer className="border-t border-gray-800/60 py-6 bg-gray-950 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-400">MetroFlow</span>
            <span>• Real-Time Station Operational Stream</span>
          </div>
          <p>WebSocket streaming via /ws/station/:id • Auto-reconnect enabled</p>
        </div>
      </footer>
    </div>
  );
}
