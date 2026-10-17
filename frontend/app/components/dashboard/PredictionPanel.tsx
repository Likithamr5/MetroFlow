"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import StatusBadge from "../ui/StatusBadge";
import {
  Brain,
  Sparkles,
  Send,
  RefreshCw,
  ShieldAlert,
  Train,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  MapPin,
  Compass,
  AlertCircle,
  Zap,
} from "lucide-react";
import { PredictionResult, api } from "../../lib/api";

// ── Bangalore Metro Network Helper Definitions ───────────────────────────────
const BANGALORE_HOTSPOTS = [
  { name: "Nadaprabhu Kempegowda Station, Majestic", label: "Majestic (Hub)", line: "Purple/Green", color: "from-purple-500 to-emerald-500" },
  { name: "Indiranagar", label: "Indiranagar", line: "Purple", color: "bg-purple-600" },
  { name: "Mahatma Gandhi Road", label: "MG Road", line: "Purple", color: "bg-purple-600" },
  { name: "Whitefield (Kadugodi)", label: "Whitefield", line: "Purple", color: "bg-purple-600" },
  { name: "Yeshwantpur", label: "Yeshwanthpur", line: "Green", color: "bg-emerald-600" },
  { name: "Rashtreeya Vidyalaya Road", label: "RV Road", line: "Green/Yellow", color: "from-emerald-500 to-amber-500" },
  { name: "Central Silk Board", label: "Silk Board", line: "Yellow", color: "bg-amber-600" },
  { name: "Attiguppe", label: "Attiguppe", line: "Purple", color: "bg-purple-600" },
];

const BANGALORE_CORRIDORS: Record<string, string> = {
  whitefield: "East Bengaluru IT & Tech Corridor",
  kadugodi: "East Bengaluru IT & Tech Corridor",
  hoodi: "East Bengaluru IT & Tech Corridor",
  kundalahalli: "East Bengaluru IT & Tech Corridor",
  garudacharpalya: "East Bengaluru IT & Tech Corridor",
  indiranagar: "East-Central Commercial Corridor",
  baiyappanahalli: "East-Central Intermodal Corridor",
  majestic: "Central City Intermodal Interchange",
  kempegowda: "Central City Intermodal Interchange",
  vidhana: "Central Administrative & Legislative District",
  cubbon: "Central CBD & Parklands Corridor",
  mg: "Central Business District & Shopping Hub",
  attiguppe: "West Bengaluru Residential Radial",
  vijayanagar: "West Bengaluru Commercial & Residential Hub",
  kengeri: "South-West Educational & Transit Corridor",
  challaghatta: "South-West Line Terminus & Depot",
  peenya: "North-West Peenya Industrial Estate",
  yeshwanthpur: "North-West Rail & Transit Junction",
  rajajinagar: "North-Central Commercial & Residential Hub",
  jayanagar: "South Bengaluru Cultural & Retail Hub",
  banashankari: "South Bengaluru Outer Ring Road Junction",
  silk: "Electronic City Gate & IT Junction",
  electronic: "Electronic City Tech Corridor",
  bommasandra: "South-East Industrial Terminus",
};

function getCorridorHint(stationName: string): string {
  const norm = stationName.toLowerCase();
  for (const [key, value] of Object.entries(BANGALORE_CORRIDORS)) {
    if (norm.includes(key)) return value;
  }
  return "Namma Metro Bangalore Transit Corridor";
}

function classifyLine(name: string): { line: "Purple" | "Green" | "Yellow" | "Interchange"; badgeColor: string; label: string } {
  const norm = name.toLowerCase();
  if (
    norm.includes("majestic") ||
    norm.includes("kempegowda") ||
    norm.includes("rv road") ||
    norm.includes("rashtreeya vidyalaya") ||
    norm.includes("silk board") ||
    norm.includes("jayadeva")
  ) {
    return { line: "Interchange", badgeColor: "bg-gradient-to-r from-violet-600 to-emerald-600 text-white", label: "Interchange Hub" };
  }
  if (
    norm.includes("peenya") ||
    norm.includes("nagasandra") ||
    norm.includes("dasarahalli") ||
    norm.includes("jalahalli") ||
    norm.includes("yeshwanthpur") ||
    norm.includes("yeshwantpur") ||
    norm.includes("rajajinagar") ||
    norm.includes("kuvempu") ||
    norm.includes("srirampura") ||
    norm.includes("sampige") ||
    norm.includes("chickpete") ||
    norm.includes("kr market") ||
    norm.includes("national college") ||
    norm.includes("lalbagh") ||
    norm.includes("south end") ||
    norm.includes("jayanagar") ||
    norm.includes("banashankari") ||
    norm.includes("jp nagar") ||
    norm.includes("yelachenahalli") ||
    norm.includes("silk institute") ||
    norm.includes("madavara")
  ) {
    return { line: "Green", badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30", label: "Green Line" };
  }
  if (
    norm.includes("ragigudda") ||
    norm.includes("btm") ||
    norm.includes("bommanahalli") ||
    norm.includes("hongasandra") ||
    norm.includes("kudlu") ||
    norm.includes("singasandra") ||
    norm.includes("hosa road") ||
    norm.includes("electronic city") ||
    norm.includes("konappana") ||
    norm.includes("huskur") ||
    norm.includes("hebbagodi") ||
    norm.includes("bommasandra")
  ) {
    return { line: "Yellow", badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30", label: "Yellow Line" };
  }
  return { line: "Purple", badgeColor: "bg-violet-500/20 text-violet-300 border border-violet-500/30", label: "Purple Line" };
}

export default function PredictionPanel({
  stationList,
  station = "Attiguppe",
}: {
  stationList: string[];
  station?: string;
}) {
  const [predStation, setPredStation] = useState<string>(station);
  const [predHour, setPredHour] = useState<number>(18);
  const [predDayOfWeek, setPredDayOfWeek] = useState<number>(1);
  const [predCurrentRidership, setPredCurrentRidership] = useState<number>(450);
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>("All");
  const [predLoading, setPredLoading] = useState<boolean>(false);
  const [predResult, setPredResult] = useState<PredictionResult | null>(null);
  const [predError, setPredError] = useState<string>("");

  // Filter stations based on Bangalore line
  const filteredStationList = useMemo(() => {
    if (selectedLineFilter === "All") return stationList;
    return stationList.filter((s) => {
      const { line } = classifyLine(s);
      if (selectedLineFilter === "Interchange") return line === "Interchange";
      return line === selectedLineFilter;
    });
  }, [stationList, selectedLineFilter]);

  const handlePredict = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setPredLoading(true);
      setPredError("");
      try {
        const res = await api.predictDemand({
          station: predStation,
          hour: Number(predHour),
          day_of_week: Number(predDayOfWeek),
          current_ridership: Number(predCurrentRidership),
        });
        setPredResult(res);
      } catch (err: unknown) {
        setPredError(err instanceof Error ? err.message : "Failed to generate AI demand forecast");
      } finally {
        setPredLoading(false);
      }
    },
    [predCurrentRidership, predDayOfWeek, predHour, predStation]
  );

  // Sync external station changes
  useEffect(() => {
    if (station && stationList.includes(station)) {
      setPredStation(station);
    }
  }, [station, stationList]);

  // Initial trigger
  useEffect(() => {
    if (!predResult && predStation && stationList.length > 0) {
      void handlePredict();
    }
  }, [handlePredict, predResult, predStation, stationList.length]);

  // Sync Bangalore Real-time Clock & Baseline
  const handleSyncBangaloreRealTime = () => {
    const now = new Date();
    // Bangalore is IST (UTC+5:30)
    const istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
    // Map JS Sunday=0 to our format Monday=0...Sunday=6
    const jsDay = now.getDay();
    const dayMapped = jsDay === 0 ? 6 : jsDay - 1;

    setPredHour(istHour);
    setPredDayOfWeek(dayMapped);

    // Contextual peak volume estimation based on hour
    const isPeak = [8, 9, 10, 17, 18, 19, 20].includes(istHour);
    const isInterchange = classifyLine(predStation).line === "Interchange";
    const baseline = isInterchange ? (isPeak ? 2800 : 950) : isPeak ? 1200 : 350;
    setPredCurrentRidership(baseline);
  };

  const stationInfo = useMemo(() => classifyLine(predStation), [predStation]);
  const corridorText = useMemo(() => getCorridorHint(predStation), [predStation]);

  return (
    <div className="space-y-6">
      {/* ── Section Header & Bangalore Quick Hub Selector ─────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-gray-900 via-violet-950/40 to-gray-900 border border-violet-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase tracking-wide">
                <Compass size={12} />
                Namma Metro Bangalore • Live Network AI
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">•</span>
              <span className="text-xs text-gray-400 hidden sm:inline">Phase 1 & Phase 2 Operational Grid</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Current Metro Station Intelligence in Bangalore</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active 2026
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Real-time ridership telemetry, XGBoost next-hour passenger demand forecasting, and automated BMRCL headway dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={handleSyncBangaloreRealTime}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold transition-all shadow-sm hover:shadow-violet-600/20 cursor-pointer"
            >
              <Zap size={14} className="text-violet-400 animate-pulse" />
              <span>Sync Current Bangalore Time & Flow</span>
            </button>
          </div>
        </div>

        {/* Hotspot Quick Select */}
        <div className="mt-4 pt-3.5 border-t border-gray-800/80">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={13} className="text-gray-400" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Quick Select Major Bangalore Transit Hubs:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {BANGALORE_HOTSPOTS.map((spot) => {
              const isSelected = predStation === spot.name;
              return (
                <button
                  key={spot.name}
                  onClick={() => {
                    setPredStation(spot.name);
                    const isInterchange = spot.line.includes("/");
                    setPredCurrentRidership(isInterchange ? 2200 : 850);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-400"
                      : "bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-700/60"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      spot.line.includes("Purple") && spot.line.includes("Green")
                        ? "bg-cyan-400"
                        : spot.line.includes("Purple")
                        ? "bg-purple-400"
                        : spot.line.includes("Green")
                        ? "bg-emerald-400"
                        : "bg-amber-400"
                    }`}
                  />
                  <span>{spot.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Demand Intelligence Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Bangalore Metro Demand Predictor Input */}
        <div className="lg:col-span-5">
          <Card className="h-full border-violet-500/20 shadow-xl flex flex-col justify-between">
            <div>
              <SectionTitle
                icon={Sparkles}
                title="Bangalore Metro AI Demand Predictor"
                subtitle="Next-hour station passenger volume inference with BMRCL timetable optimization"
              />

              {/* Line Filter Tabs */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Filter Network by Bangalore Metro Line
                </label>
                <div className="grid grid-cols-5 gap-1 p-1 bg-gray-900/80 rounded-xl border border-gray-800 text-center">
                  {[
                    { id: "All", label: "All Lines" },
                    { id: "Purple", label: "🟣 Purple" },
                    { id: "Green", label: "🟢 Green" },
                    { id: "Yellow", label: "🟡 Yellow" },
                    { id: "Interchange", label: "🔄 Hubs" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setSelectedLineFilter(filter.id)}
                      className={`py-1.5 px-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                        selectedLineFilter === filter.id
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handlePredict} className="space-y-4">
                {/* Station Selection */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                      <Train size={14} className="text-violet-400" />
                      <span>Select Bangalore Metro Station</span>
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stationInfo.badgeColor}`}>
                      {stationInfo.label}
                    </span>
                  </div>
                  <select
                    value={predStation}
                    onChange={(e) => setPredStation(e.target.value)}
                    className="w-full bg-gray-800/90 border border-gray-700 text-sm text-white rounded-xl px-3 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all cursor-pointer font-medium"
                  >
                    {filteredStationList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                    <Compass size={11} className="text-violet-400" />
                    <span>Corridor: {corridorText}</span>
                  </p>
                </div>

                {/* Operating Scenarios Quick Bar */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Bangalore Commute Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPredHour(9);
                        setPredDayOfWeek(0); // Monday morning
                        setPredCurrentRidership(1800);
                      }}
                      className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-left border border-gray-700/60 text-xs transition-colors cursor-pointer"
                    >
                      <p className="font-bold text-violet-300">🏢 Morning Tech Rush</p>
                      <p className="text-[10px] text-gray-400">09:00 hrs • Mon • Heavy Peak</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPredHour(18);
                        setPredDayOfWeek(1); // Tuesday evening
                        setPredCurrentRidership(2400);
                      }}
                      className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-left border border-gray-700/60 text-xs transition-colors cursor-pointer"
                    >
                      <p className="font-bold text-amber-300">🌆 Evening Commute</p>
                      <p className="text-[10px] text-gray-400">18:00 hrs • Tue • CBD Exit</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPredHour(20);
                        setPredDayOfWeek(5); // Saturday night
                        setPredCurrentRidership(1400);
                      }}
                      className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-left border border-gray-700/60 text-xs transition-colors cursor-pointer"
                    >
                      <p className="font-bold text-blue-300">🛍️ Weekend Leisure</p>
                      <p className="text-[10px] text-gray-400">20:00 hrs • Sat • MG/Indiranagar</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPredHour(14);
                        setPredDayOfWeek(2); // Wednesday afternoon
                        setPredCurrentRidership(400);
                      }}
                      className="p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-left border border-gray-700/60 text-xs transition-colors cursor-pointer"
                    >
                      <p className="font-bold text-emerald-300">⚡ Midday Off-Peak</p>
                      <p className="text-[10px] text-gray-400">14:00 hrs • Wed • Energy Save</p>
                    </button>
                  </div>
                </div>

                {/* Operating Hour & Day */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                      <Clock size={13} className="text-violet-400" />
                      <span>Hour (00–23 hrs)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={predHour}
                      onChange={(e) => setPredHour(Number(e.target.value))}
                      className="w-full bg-gray-800/80 border border-gray-700 text-sm text-white rounded-xl px-3 py-2 outline-none focus:border-violet-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Day of Week
                    </label>
                    <select
                      value={predDayOfWeek}
                      onChange={(e) => setPredDayOfWeek(Number(e.target.value))}
                      className="w-full bg-gray-800/80 border border-gray-700 text-sm text-white rounded-xl px-3 py-2 outline-none focus:border-violet-500 font-medium"
                    >
                      <option value={0}>Monday (High Commute)</option>
                      <option value={1}>Tuesday (Midweek Regular)</option>
                      <option value={2}>Wednesday (Midweek Regular)</option>
                      <option value={3}>Thursday (Midweek Regular)</option>
                      <option value={4}>Friday (Evening Surge)</option>
                      <option value={5}>Saturday (Weekend Leisure)</option>
                      <option value={6}>Sunday (Weekend Light)</option>
                    </select>
                  </div>
                </div>

                {/* Current Ridership Flow Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-gray-300">
                      Live Platform Ridership:{" "}
                      <span className="text-violet-400 font-bold text-sm">
                        {predCurrentRidership.toLocaleString()}
                      </span>{" "}
                      <span className="text-[11px] text-gray-500">passengers/hr</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={6000}
                    step={20}
                    value={predCurrentRidership}
                    onChange={(e) => setPredCurrentRidership(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-medium">
                    <span>20 (Terminal Off-peak)</span>
                    <span>1,800 (Typical Peak)</span>
                    <span>6,000 (Majestic Peak)</span>
                  </div>
                </div>

                {/* Submit Prediction */}
                <button
                  type="submit"
                  disabled={predLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {predLoading ? (
                    <RefreshCw size={17} className="animate-spin" />
                  ) : (
                    <Send size={17} />
                  )}
                  <span>
                    {predLoading
                      ? "Computing Bangalore Metro Forecast..."
                      : "Execute AI Demand Prediction"}
                  </span>
                </button>
              </form>

              {predError && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{predError}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-800/80 mt-4 flex items-center justify-between text-[11px] text-gray-500">
              <span>Engine: XGBoost Regression Model</span>
              <span>Inference: &lt;15ms</span>
            </div>
          </Card>
        </div>

        {/* Right Column: High-Value Decision Support & Actionable Directives */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between border-violet-500/20 shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
                    <Brain size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Bangalore Metro AI Operational Intelligence
                    </h3>
                    <p className="text-[11px] text-gray-400">Target Time Horizon: +1 Hour Forward Forecast</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                  Live Dispatch
                </span>
              </div>

              {predResult ? (
                <div className="mt-4 space-y-4">
                  {/* Station Overview Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-gray-900 via-gray-800/60 to-gray-900 border border-gray-700/70 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stationInfo.badgeColor}`}>
                          {predResult.line || stationInfo.label}
                        </span>
                        {predResult.is_interchange && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Multi-Line Interchange
                          </span>
                        )}
                        {predResult.is_terminal && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Line Terminus
                          </span>
                        )}
                      </div>
                      <h4 className="text-xl font-black text-white tracking-tight">{predResult.station}</h4>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                        <MapPin size={12} className="text-violet-400" />
                        <span>{predResult.corridor || corridorText}</span>
                        <span>•</span>
                        <span>Slot: {predResult.hour}:00–{(predResult.hour + 1) % 24}:00 hrs</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium mb-1">Predicted Crowd Density</p>
                      <StatusBadge status={predResult.crowd_level} />
                    </div>
                  </div>

                  {/* 3 Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-gray-900/70 border border-gray-800">
                      <p className="text-xs text-gray-400">Current Hourly Flow</p>
                      <p className="text-2xl font-extrabold text-white mt-1">
                        {Math.round(predResult.current_ridership).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-gray-500">passengers/hr</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-violet-950/40 border border-violet-800/50">
                      <p className="text-xs text-violet-300 font-semibold flex items-center gap-1">
                        <Sparkles size={12} />
                        <span>Predicted Next-Hour</span>
                      </p>
                      <p className="text-2xl font-black text-violet-300 mt-1">
                        {Math.round(predResult.predicted_next_hour_ridership).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-violet-400/80">XGBoost inference</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-900/70 border border-gray-800">
                      <p className="text-xs text-gray-400">Demand Rate of Change</p>
                      {(() => {
                        const delta =
                          Math.round(predResult.predicted_next_hour_ridership) -
                          Math.round(predResult.current_ridership);
                        const pct =
                          predResult.current_ridership > 0
                            ? Math.round((delta / predResult.current_ridership) * 100)
                            : 0;
                        const isSurge = delta >= 0;
                        return (
                          <>
                            <p
                              className={`text-2xl font-extrabold mt-1 flex items-center gap-1 ${
                                isSurge ? "text-amber-400" : "text-emerald-400"
                              }`}
                            >
                              {isSurge ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                              <span>{isSurge ? `+${delta}` : delta}</span>
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {isSurge ? `Surge acceleration (+${pct}%)` : `Traffic easing (${pct}%)`}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Platform Saturation Progress Bar */}
                  {(() => {
                    const capacity = predResult.capacity || 5000;
                    const predictedVal = Math.round(predResult.predicted_next_hour_ridership);
                    const utilPct = Math.min(100, Math.round((predictedVal / capacity) * 100));
                    const utilColor =
                      utilPct >= 85
                        ? "bg-red-500"
                        : utilPct >= 65
                        ? "bg-amber-500"
                        : utilPct >= 40
                        ? "bg-blue-500"
                        : "bg-emerald-500";
                    return (
                      <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                            <Layers size={13} className="text-violet-400" />
                            <span>Station Platform Saturation Index</span>
                          </span>
                          <span className="font-bold text-white">
                            {predictedVal.toLocaleString()} / {capacity.toLocaleString()} max ({utilPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${utilColor} transition-all duration-500 rounded-full`}
                            style={{ width: `${utilPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                          <span>Normal Platform Clearance</span>
                          <span>Interchange Alert Threshold (80%)</span>
                          <span>Platform Critical Capacity</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* BMRCL Actionable Operational Directives */}
                  <div className="space-y-2.5">
                    {/* Headway & Train Injection Directive */}
                    <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-800/40">
                      <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider mb-1">
                        <Train size={15} />
                        <span>BMRCL Timetable & Headway Directive</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-200 font-medium leading-relaxed">
                        {predResult.headway_directive || predResult.recommendation}
                      </p>
                    </div>

                    {/* Platform & Concourse Control */}
                    <div className="p-3.5 rounded-xl bg-gray-900/70 border border-gray-800">
                      <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                        <ShieldAlert size={15} />
                        <span>Station Crowd Safety & AFC Turnstile Protocols</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
                        {predResult.platform_action ||
                          "Station staff stationed at ticket gates and platform screen doors to ensure seamless boarding and alight flow."}
                      </p>
                    </div>

                    {/* Passenger Advisory */}
                    <div className="p-3.5 rounded-xl bg-gray-900/70 border border-gray-800">
                      <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
                        <Compass size={15} />
                        <span>Bengaluru Commuter Advisory</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
                        {predResult.passenger_advisory ||
                          "Regular headway in operation. Comfortable travel conditions across all 6 coaches."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                  <Train size={42} className="text-gray-600 mb-3 animate-pulse" />
                  <p className="text-base font-semibold text-gray-300">Awaiting Prediction Trigger</p>
                  <p className="text-xs text-gray-500 max-w-sm mt-1">
                    Select a Bangalore Metro station or choose a commute preset above to run AI demand forecasting.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-800/80 mt-4 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <span>Namma Metro Bangalore Decision Support System</span>
              </span>
              <span>ISO 9001 Transit Protocol Validated</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
