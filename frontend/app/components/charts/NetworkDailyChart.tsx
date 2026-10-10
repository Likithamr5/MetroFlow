"use client";
import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import Skeleton from "../ui/Skeleton";
import { Train, Clock, ArrowRight } from "lucide-react";
import { PURPLE, GREEN } from "../../lib/constants";
import { ActiveTrainMovement, DailyRidershipPoint, TrainMovementPoint } from "../../lib/types";

interface Props {
  data: DailyRidershipPoint[];
  trainMovements?: TrainMovementPoint[];
  activeMovement?: ActiveTrainMovement | null;
  loading: boolean;
}

export default function NetworkDailyChart({
  data,
  trainMovements = [],
  activeMovement,
  loading,
}: Props) {
  const [viewMode, setViewMode] = useState<"15min" | "daily">("15min");

  const hasMovements = trainMovements && trainMovements.length > 0;
  const currentMode = hasMovements ? viewMode : "daily";

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <SectionTitle
          icon={Train}
          title={
            currentMode === "15min"
              ? "Train Movement Passenger Volume (Every 15 Mins)"
              : "Network Daily Passenger Volume"
          }
          subtitle={
            currentMode === "15min"
              ? "Real-time ridership recorded as each train moves across the transit network"
              : "Aggregated daily commuter volume across all monitored stations"
          }
        />

        {hasMovements && (
          <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("15min")}
              className={`px-3 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                currentMode === "15min"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              15-Min Train Moves
            </button>
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                currentMode === "daily"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Daily Aggregate
            </button>
          </div>
        )}
      </div>

      {currentMode === "15min" && activeMovement && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-2.5 rounded-lg bg-gray-900/80 border border-violet-500/20 text-xs">
          <div className="flex items-center gap-2 text-violet-300 font-semibold">
            <span className="live-dot" />
            <span>Active Train Movement: {activeMovement.train_id}</span>
          </div>
          <span className="text-gray-500">•</span>
          <span className="text-gray-300">
            Dispatch Slot: <strong className="text-white">{activeMovement.movement_time}</strong> (15-min frequency)
          </span>
          <span className="text-gray-500">•</span>
          <span className="text-emerald-400">
            Next Train Moves In: <strong>{activeMovement.next_train_in_minutes} min</strong>
          </span>
          <span className="text-gray-500 hidden md:inline">•</span>
          <span className="text-gray-400 hidden md:inline">
            Active Fleet: <strong>{activeMovement.active_trains} trains</strong>
          </span>
        </div>
      )}

      {loading ? (
        <Skeleton h={220} />
      ) : currentMode === "15min" && hasMovements ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trainMovements} margin={{ left: -10, right: 10 }}>
            <defs>
              <linearGradient id="movementGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PURPLE} stopOpacity={0.45} />
                <stop offset="95%" stopColor={PURPLE} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="time"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              interval={3}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as TrainMovementPoint;
                return (
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs shadow-xl space-y-1">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-800 pb-1.5">
                      <span className="font-bold text-violet-400 flex items-center gap-1.5">
                        <Train size={13} />
                        {d.train_id}
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock size={11} />
                        {d.time}
                      </span>
                    </div>
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-gray-400">Total Train Ridership:</span>
                        <strong className="text-white font-bold">{d.ridership?.toLocaleString()}</strong>
                      </div>
                      {d.purple_line !== undefined && (
                        <div className="flex items-center justify-between gap-4 text-[11px]">
                          <span className="text-purple-300">Purple Line:</span>
                          <span className="text-gray-200">{d.purple_line.toLocaleString()}</span>
                        </div>
                      )}
                      {d.green_line !== undefined && (
                        <div className="flex items-center justify-between gap-4 text-[11px]">
                          <span className="text-emerald-300">Green Line:</span>
                          <span className="text-gray-200">{d.green_line.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-gray-800 text-[10px]">
                        <span className="text-gray-400">Dispatch Status:</span>
                        <span className="font-semibold text-emerald-400">{d.status || "Completed"}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="ridership"
              name="Train Ridership"
              stroke={PURPLE}
              fill="url(#movementGrad)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ left: -10, right: 10 }}>
            <defs>
              <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={PURPLE} stopOpacity={0.4} />
                <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickFormatter={(v) => v.slice(5)}
              interval={6}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload as DailyRidershipPoint;
                return (
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-xs shadow-xl">
                    <p className="text-gray-400">{d.date}</p>
                    <p className="text-white font-bold mt-1">{d.total_ridership?.toLocaleString()} riders</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="total_ridership"
              name="Daily Riders"
              stroke={PURPLE}
              fill="url(#dailyGrad)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
