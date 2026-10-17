"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import Skeleton from "../ui/Skeleton";
import { TrendingUp, Clock, Sparkles } from "lucide-react";
import { PURPLE, CYAN } from "../../lib/constants";
import { CombinedFootfallPoint } from "../../lib/types";

interface Props {
  data: CombinedFootfallPoint[];
  loading?: boolean;
  stationName: string;
  summary?: {
    total_today_footfall?: number;
    peak_hour_today?: string;
    peak_footfall_today?: number;
    forecast_peak_hour?: string;
    forecast_peak_ridership?: number;
  };
}

export default function StationActualVsForecastChart({
  data,
  loading = false,
  stationName,
  summary,
}: Props) {
  if (loading) {
    return (
      <Card>
        <SectionTitle
          icon={TrendingUp}
          title="Today's Footfall History & 3-Hour Forecast"
          subtitle={`Hourly passenger count curve and predictive model for ${stationName}`}
        />
        <Skeleton h={280} />
      </Card>
    );
  }

  return (
    <Card className="border-gray-800 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <SectionTitle
          icon={TrendingUp}
          title="Today's Footfall History & 3-Hour Forecast"
          subtitle={`Continuous hourly flow & predictive horizon for ${stationName}`}
        />

        {summary && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {summary.peak_hour_today && (
              <span className="px-2.5 py-1 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center gap-1.5 font-medium">
                <Clock size={12} />
                Today&apos;s Peak: <strong>{summary.peak_hour_today}</strong> ({summary.peak_footfall_today?.toLocaleString()} riders)
              </span>
            )}
            {summary.forecast_peak_hour && (
              <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-1.5 font-medium">
                <Sparkles size={12} />
                Forecasted Peak: <strong>{summary.forecast_peak_hour}</strong> ({summary.forecast_peak_ridership?.toLocaleString()} riders)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-500">
            No footfall records available for {stationName} today.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="actualFlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PURPLE} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={PURPLE} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="forecastFlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CYAN} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CYAN} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />

              <XAxis
                dataKey="time"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                interval="preserveStartEnd"
              />

              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`)}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as CombinedFootfallPoint;
                  const isFc = item.is_forecast && item.actual == null;
                  return (
                    <div className="bg-gray-900 border border-gray-700/80 rounded-xl p-3 text-xs shadow-2xl space-y-1.5 min-w-44">
                      <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Clock size={12} className="text-gray-400" />
                          {item.time} hrs
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isFc
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                          }`}
                        >
                          {isFc ? "AI Forecast" : "Recorded"}
                        </span>
                      </div>

                      <div className="space-y-1 pt-0.5">
                        {item.actual != null && (
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Actual Footfall:</span>
                            <span className="font-bold text-violet-300">{item.actual.toLocaleString()} riders</span>
                          </div>
                        )}
                        {item.forecast != null && (
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Projected Demand:</span>
                            <span className="font-bold text-cyan-300">{item.forecast.toLocaleString()} riders</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-4 text-[11px] text-gray-500 pt-1 border-t border-gray-800/60">
                          <span>Entries / Exits:</span>
                          <span>{item.entries.toLocaleString()} / {item.exits.toLocaleString()}</span>
                        </div>
                        {item.confidence && (
                          <div className="flex justify-between gap-4 text-[10px] text-gray-500">
                            <span>Confidence:</span>
                            <span className="text-emerald-400 font-semibold">{Math.round(item.confidence * 100)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />

              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                formatter={(val) => <span className="text-gray-300 font-medium">{val}</span>}
              />

              {/* Area fill for actual */}
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Footfall"
                stroke={PURPLE}
                strokeWidth={2.5}
                fill="url(#actualFlowGrad)"
                connectNulls={false}
                dot={{ r: 2, fill: PURPLE }}
                activeDot={{ r: 5, fill: "#fff", stroke: PURPLE, strokeWidth: 2 }}
              />

              {/* Line & Area for forecast */}
              <Line
                type="monotone"
                dataKey="forecast"
                name="3-Hour AI Forecast"
                stroke={CYAN}
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: CYAN }}
                activeDot={{ r: 6, fill: "#fff", stroke: CYAN, strokeWidth: 2 }}
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
