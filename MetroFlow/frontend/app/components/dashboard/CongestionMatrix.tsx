"use client";
import React, { useState } from "react";
import Card from "../ui/Card";
import StatusBadge from "../ui/StatusBadge";
import { Users, Search } from "lucide-react";
import { CongestionResponse } from "../../lib/api";

export default function CongestionMatrix({ congestionData, onSelectStation }: { congestionData: CongestionResponse | null; onSelectStation: (s: string, ridership: number) => void }) {
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredCongestion = (congestionData?.stations || []).filter((s) => {
    const matchSearch = s.station.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterLevel === "ALL" || s.congestion_level.toUpperCase() === filterLevel;
    return matchSearch && matchFilter;
  });

  const congestionCounts = {
    ALL: congestionData?.stations?.length || 0,
    CRITICAL: congestionData?.stations?.filter((s) => s.congestion_level.toUpperCase() === "CRITICAL").length || 0,
    HIGH: congestionData?.stations?.filter((s) => s.congestion_level.toUpperCase() === "HIGH").length || 0,
    MEDIUM: congestionData?.stations?.filter((s) => s.congestion_level.toUpperCase() === "MEDIUM").length || 0,
    LOW: congestionData?.stations?.filter((s) => s.congestion_level.toUpperCase() === "LOW").length || 0,
  };

  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-violet-400" />
            <h3 className="text-base font-bold text-white">Network-Wide Station Congestion Matrix</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {congestionData
              ? `Active density monitoring for ${congestionData.total_stations} stations (Operational Hour: ${congestionData.hour}:00 • 15-Min Train Movement Active)`
              : "Live passenger density tracking across Bengaluru Metro stations"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              placeholder="Filter station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-violet-500 w-44"
            />
          </div>

          <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs">
            {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                  filterLevel === lvl
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {lvl} ({congestionCounts[lvl]})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
        {filteredCongestion.slice(0, 48).map((st) => (
          <button
            type="button"
            key={st.station}
            onClick={() => onSelectStation(st.station, st.ridership)}
            className={`p-3.5 rounded-xl bg-gray-900/60 border hover:border-violet-500/60 hover:bg-gray-800/40 transition-all cursor-pointer group text-left ${
              st.congestion_level === "Critical" ? "border-red-500/40" :
              st.congestion_level === "High" ? "border-orange-500/40" :
              st.congestion_level === "Medium" ? "border-amber-500/40" :
              "border-emerald-500/40"
            }`}
            title="Click to load station into AI Prediction Console"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-violet-300">
                {st.station}
              </h4>
              <StatusBadge status={st.congestion_level} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-gray-500">Ridership</span>
              <span className="font-extrabold text-white">{st.ridership.toLocaleString()}</span>
            </div>
          </button>
        ))}
        {filteredCongestion.length === 0 && (
          <div className="col-span-full py-8 text-center text-gray-500 text-xs">
            No stations match the selected filter or query.
          </div>
        )}
      </div>
    </Card>
  );
}
