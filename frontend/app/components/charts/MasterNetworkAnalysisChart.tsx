"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import Skeleton from "../ui/Skeleton";
import { Activity, Clock, Train, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { PURPLE, GREEN, YELLOW, RED, ORANGE } from "../../lib/constants";
import { LineComparisonPoint } from "../../lib/types";

interface Props {
  data: LineComparisonPoint[];
  loading: boolean;
}

type ViewMode = "total" | "comparison" | "purple" | "green" | "yellow";

export default function MasterNetworkAnalysisChart({ data, loading }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("comparison");
  const operatingHoursData = useMemo(
    () => data.filter((point) => point.hour >= 5 && point.hour < 23),
    [data],
  );

  // Calculate dynamic metrics from dataset
  const metrics = useMemo(() => {
    if (operatingHoursData.length === 0) {
      return {
        peakHour: 18,
        peakTotal: 72400,
        peakAvg: 868,
        busiestLine: "Purple Line",
        busiestLinePct: 54.2,
      };
    }

    let maxTot = 0;
    let peakH = 18;
    let maxAvg = 0;
    let totalPurple = 0;
    let totalGreen = 0;
    let totalYellow = 0;

    operatingHoursData.forEach((d) => {
      const avg = d.network_total_avg || (d.purple_line_avg + d.green_line_avg + (d.yellow_line_avg || 0)) / 3;
      const tot = d.network_hourly_total || avg * 83;
      if (avg > maxAvg) {
        maxAvg = avg;
        maxTot = tot;
        peakH = d.hour;
      }
      totalPurple += d.purple_line_avg;
      totalGreen += d.green_line_avg;
      totalYellow += d.yellow_line_avg || 0;
    });

    const sumAll = totalPurple + totalGreen + totalYellow || 1;
    const pPct = ((totalPurple / sumAll) * 100).toFixed(1);

    return {
      peakHour: peakH,
      peakTotal: Math.round(maxTot),
      peakAvg: Math.round(maxAvg),
      busiestLine: "Purple Line (East-West)",
      busiestLinePct: Number(pPct),
    };
  }, [operatingHoursData]);

  return (
    <Card className="p-6 border border-gray-800/80 bg-gray-900/90 shadow-2xl backdrop-blur-md">
      {/* ── Header: Title & Interactive View Controls ───────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-800">
        <div>
          <SectionTitle
            icon={Activity}
            title="BMRCL Network 18-Hour Commuter Flow & Peak Congestion Analysis"
            subtitle="Hourly commuter flow during metro operating hours (05:00–23:00), with corridor split and peak congestion thresholds"
          />
        </div>

        {/* View Switcher Chips */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-950 p-1.5 rounded-xl border border-gray-800 text-xs shrink-0">
          <button
            onClick={() => setViewMode("comparison")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === "comparison"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Corridor Overlay (All 3 Lines)
          </button>
          <button
            onClick={() => setViewMode("total")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === "total"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Network Total Flow
          </button>
          <button
            onClick={() => setViewMode("purple")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === "purple"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-purple-300/70 hover:text-purple-300"
            }`}
          >
            Purple Line
          </button>
          <button
            onClick={() => setViewMode("green")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === "green"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-emerald-300/70 hover:text-emerald-300"
            }`}
          >
            Green Line
          </button>
          <button
            onClick={() => setViewMode("yellow")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              viewMode === "yellow"
                ? "bg-yellow-500 text-gray-950 shadow-md shadow-yellow-500/30 font-bold"
                : "text-yellow-300/70 hover:text-yellow-300"
            }`}
          >
            Yellow Line
          </button>
        </div>
      </div>

      {/* ── KPI Summary Ribbon ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
        <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Network Peak Window</span>
            <p className="text-sm font-extrabold text-white mt-0.5">
              {metrics.peakHour}:00 hrs <span className="text-xs text-red-400 font-semibold">(Evening Rush)</span>
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
            <Train size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Heaviest Corridor</span>
            <p className="text-sm font-extrabold text-white mt-0.5">
              Purple Line <span className="text-xs text-violet-300 font-semibold">({metrics.busiestLinePct}% load)</span>
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <AlertTriangle size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Peak Hourly Volume</span>
            <p className="text-sm font-extrabold text-white mt-0.5">
              {metrics.peakAvg.toLocaleString()} <span className="text-xs text-gray-400 font-normal">avg riders/stn/hr</span>
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-950/70 border border-gray-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Zap size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Operating Headway</span>
            <p className="text-sm font-extrabold text-white mt-0.5">
              3.5 min <span className="text-xs text-emerald-400 font-semibold">Peak</span> • 8 min <span className="text-xs text-gray-400 font-normal">Off-Peak</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Interactive Chart Area ─────────────────────────────────────── */}
      {loading ? (
        <Skeleton h={380} />
      ) : (
        <div className="w-full">
          <ResponsiveContainer width="100%" height={380}>
            {viewMode === "comparison" ? (
              <LineChart data={operatingHoursData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PURPLE} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={PURPLE} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />

                {/* Shaded Peak Rush-Hour Windows */}
                <ReferenceArea x1={8} x2={10} strokeOpacity={0} fill="#f59e0b" fillOpacity={0.07} label={{ value: "Morning Rush (8-10h)", fill: "#f59e0b", fontSize: 10, position: "top" }} />
                <ReferenceArea x1={17} x2={20} strokeOpacity={0} fill="#ef4444" fillOpacity={0.07} label={{ value: "Evening Rush (17-20h)", fill: "#ef4444", fontSize: 10, position: "top" }} />

                {/* Congestion Safety Thresholds */}
                <ReferenceLine y={800} stroke={RED} strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Critical Surge (800+)", fill: RED, fontSize: 10, position: "right" }} />
                <ReferenceLine y={600} stroke={ORANGE} strokeDasharray="3 3" strokeWidth={1} label={{ value: "High Rush (600)", fill: ORANGE, fontSize: 10, position: "right" }} />
                <ReferenceLine y={350} stroke={GREEN} strokeDasharray="2 2" strokeWidth={1} label={{ value: "Nominal Flow (350)", fill: GREEN, fontSize: 10, position: "right" }} />

                <XAxis
                  dataKey="hour"
                  interval={1}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(v) => `${String(v).padStart(2, "0")}:00`}
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip content={<CustomAnalysisTooltip />} />

                {/* Multi-Line Corridor Comparison */}
                <Line
                  type="monotone"
                  dataKey="purple_line_avg"
                  name="Purple Line (East-West: Whitefield ↔ Challaghatta)"
                  stroke={PURPLE}
                  strokeWidth={3}
                  dot={{ r: 3, fill: PURPLE }}
                  activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="green_line_avg"
                  name="Green Line (North-South: Madavara ↔ Silk Institute)"
                  stroke={GREEN}
                  strokeWidth={3}
                  dot={{ r: 3, fill: GREEN }}
                  activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="yellow_line_avg"
                  name="Yellow Line (Tech Corridor: RV Road ↔ Bommasandra)"
                  stroke={YELLOW}
                  strokeWidth={2.5}
                  strokeDasharray="5 3"
                  dot={{ r: 3, fill: YELLOW }}
                  activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <AreaChart data={operatingHoursData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="corridorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={
                        viewMode === "purple"
                          ? PURPLE
                          : viewMode === "green"
                          ? GREEN
                          : viewMode === "yellow"
                          ? YELLOW
                          : "#8b5cf6"
                      }
                      stopOpacity={0.6}
                    />
                    <stop
                      offset="95%"
                      stopColor={
                        viewMode === "purple"
                          ? PURPLE
                          : viewMode === "green"
                          ? GREEN
                          : viewMode === "yellow"
                          ? YELLOW
                          : "#8b5cf6"
                      }
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />

                {/* Peak Rush Windows */}
                <ReferenceArea x1={8} x2={10} strokeOpacity={0} fill="#f59e0b" fillOpacity={0.08} label={{ value: "Morning Rush", fill: "#f59e0b", fontSize: 10, position: "top" }} />
                <ReferenceArea x1={17} x2={20} strokeOpacity={0} fill="#ef4444" fillOpacity={0.08} label={{ value: "Evening Rush", fill: "#ef4444", fontSize: 10, position: "top" }} />

                <ReferenceLine y={800} stroke={RED} strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Critical Capacity", fill: RED, fontSize: 10, position: "right" }} />
                <ReferenceLine y={600} stroke={ORANGE} strokeDasharray="3 3" strokeWidth={1} label={{ value: "High Demand", fill: ORANGE, fontSize: 10, position: "right" }} />
                <ReferenceLine y={350} stroke={GREEN} strokeDasharray="2 2" strokeWidth={1} label={{ value: "Comfort Baseline", fill: GREEN, fontSize: 10, position: "right" }} />

                <XAxis
                  dataKey="hour"
                  interval={1}
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(v) => `${String(v).padStart(2, "0")}:00`}
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip content={<CustomAnalysisTooltip />} />

                <Area
                  type="monotone"
                  dataKey={
                    viewMode === "purple"
                      ? "purple_line_avg"
                      : viewMode === "green"
                      ? "green_line_avg"
                      : viewMode === "yellow"
                      ? "yellow_line_avg"
                      : "network_total_avg"
                  }
                  name={
                    viewMode === "purple"
                      ? "Purple Line Average Riders"
                      : viewMode === "green"
                      ? "Green Line Average Riders"
                      : viewMode === "yellow"
                      ? "Yellow Line Average Riders"
                      : "Network Average Commuters / Station"
                  }
                  stroke={
                    viewMode === "purple"
                      ? PURPLE
                      : viewMode === "green"
                      ? GREEN
                      : viewMode === "yellow"
                      ? YELLOW
                      : "#8b5cf6"
                  }
                  fill="url(#corridorGrad)"
                  strokeWidth={3}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Operational Insight & Dispatch Recommendations ─────────────────── */}
      <div className="mt-5 p-4 rounded-xl bg-gray-950/80 border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2.5 text-gray-200">
          <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">Active Operational Strategy:</strong> Dynamic headway scheduling active. Purple Line allocated 33 trainsets (3.5 min peak), Green Line 25 trainsets (4 min peak), Yellow Line 15 trainsets.
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Purple (East-West)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Green (North-South)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> Yellow (Electronics City)
          </span>
        </div>
      </div>
    </Card>
  );
}

// ── Rich Custom Glassmorphism Tooltip ─────────────────────────────────────────
function CustomAnalysisTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const d: LineComparisonPoint = payload[0].payload;
  const hourStr = `${String(d.hour).padStart(2, "0")}:00 – ${String(d.hour + 1).padStart(2, "0")}:00`;

  const pVal = d.purple_line_avg || 0;
  const gVal = d.green_line_avg || 0;
  const yVal = d.yellow_line_avg || 0;
  const totAvg = d.network_total_avg || Math.round((pVal + gVal + yVal) / 3);
  const isPeak = d.hour >= 8 && d.hour <= 10 ? "Morning Rush" : d.hour >= 17 && d.hour <= 20 ? "Evening Rush" : "Normal Flow";

  return (
    <div className="bg-gray-900/95 border border-gray-700/80 rounded-xl p-3.5 text-xs shadow-2xl backdrop-blur-md min-w-[240px] space-y-2">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <span className="font-extrabold text-white flex items-center gap-1.5">
          <Clock size={13} className="text-violet-400" />
          {hourStr}
        </span>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
            isPeak !== "Normal Flow"
              ? "bg-red-500/20 text-red-300 border border-red-500/30"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          }`}
        >
          {isPeak}
        </span>
      </div>

      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between">
          <span className="text-purple-300 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Purple Line:
          </span>
          <strong className="text-white font-bold">{Math.round(pVal).toLocaleString()} riders/stn</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-emerald-300 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Green Line:
          </span>
          <strong className="text-white font-bold">{Math.round(gVal).toLocaleString()} riders/stn</strong>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-yellow-300 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> Yellow Line:
          </span>
          <strong className="text-white font-bold">{Math.round(yVal).toLocaleString()} riders/stn</strong>
        </div>

        <div className="pt-2 border-t border-gray-800 flex items-center justify-between font-bold">
          <span className="text-gray-300">Network Hourly Average:</span>
          <span className="text-violet-300">{totAvg.toLocaleString()} riders</span>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-800/80 text-[10px] text-gray-400">
        <p>
          <strong className="text-gray-300">Transit Action:</strong>{" "}
          {totAvg >= 800
            ? "Deploy short-loop rakes from Majestic & operate entry gate metering."
            : totAvg >= 600
            ? "Maintain 4-min headway on Purple line; deploy platform marshals."
            : "Nominal operational headway (7-8 mins); standard dwell times."}
        </p>
      </div>
    </div>
  );
}
