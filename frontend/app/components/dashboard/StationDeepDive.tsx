"use client";
import React, { useEffect, useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import Skeleton from "../ui/Skeleton";
import DarkTooltip from "../ui/DarkTooltip";
import StatusBadge from "../ui/StatusBadge";
import { MapPin, Train } from "lucide-react";
import { PURPLE, GREEN, BLUE } from "../../lib/constants";
import { api, StationWeekdayResponse } from "../../lib/api";
import { ForecastPoint, HourlyRidershipPoint, TrainMovementPoint } from "../../lib/types";

export default function StationDeepDive({
  stationList,
  selectedStation,
  onStationChange,
}: {
  stationList: string[];
  selectedStation: string;
  onStationChange: (station: string) => void;
}) {
  const [stHourly, setStHourly] = useState<HourlyRidershipPoint[]>([]);
  const [stMovements, setStMovements] = useState<TrainMovementPoint[]>([]);
  const [stWeekday, setStWeekday] = useState<StationWeekdayResponse["data"]>([]);
  const [stPredictions, setStPredictions] = useState<ForecastPoint[]>([]);
  const [stLoading, setStLoading] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<"15min" | "hourly">("15min");

  useEffect(() => {
    if (stationList.length > 0 && !selectedStation) {
      onStationChange(stationList[0]);
    }
  }, [stationList, selectedStation, onStationChange]);

  useEffect(() => {
    if (!selectedStation) return;
    let isCurrent = true;
    setStLoading(true);

    Promise.all([
      api.getStationHourly(selectedStation),
      api.getStationMovements(selectedStation),
      api.getStationWeekday(selectedStation),
      api.getStationPredict(selectedStation, 6),
    ])
      .then(([h, m, w, p]) => {
        if (!isCurrent) return;
        setStHourly(h.data || []);
        setStMovements(m.data || []);
        setStWeekday(w.data || []);
        setStPredictions(p.predictions || []);
      })
      .catch((err) => console.error("Error loading station drilldown:", err))
      .finally(() => {
        if (isCurrent) setStLoading(false);
      });

    return () => { isCurrent = false; };
  }, [selectedStation]);

  return (
    <Card className="h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
        <SectionTitle
          icon={MapPin}
          title="Station Deep-Dive Analytics"
          subtitle="Detailed multi-factor analysis and 15-minute train movement counts"
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs">
            <button
              onClick={() => setActiveView("15min")}
              className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                activeView === "15min" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              15-Min Train Moves
            </button>
            <button
              onClick={() => setActiveView("hourly")}
              className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                activeView === "hourly" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Hourly Curve
            </button>
          </div>
          <select
            value={selectedStation}
            onChange={(e) => onStationChange(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-violet-500"
          >
            {stationList.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {stLoading ? (
        <Skeleton h={320} />
      ) : (
        <div className="space-y-6">
          {activeView === "15min" ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
                  <Train size={13} className="text-violet-400" />
                  Every Train Movement Ridership Count (15-Min Slots)
                </p>
                <span className="text-[10px] text-gray-400">
                  Recorded per train departure
                </span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={stMovements} margin={{ left: -10 }}>
                  <defs>
                    <linearGradient id="stMoveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PURPLE} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="time" tick={{ fill: "#6b7280", fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload as TrainMovementPoint;
                      return (
                        <div className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-xs shadow-xl space-y-1">
                          <p className="font-bold text-violet-400">{d.train_id} at {d.time}</p>
                          <p className="text-white">Ridership: <strong className="font-bold">{d.ridership?.toLocaleString()} passengers</strong></p>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="ridership" stroke={PURPLE} fill="url(#stMoveGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-2">Hourly Pattern Curve</p>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={stHourly} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={(v) => `${v}h`} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Area type="monotone" dataKey="avg_ridership" stroke={BLUE} fill={`${BLUE}30`} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 font-semibold mb-2">Day-of-Week Distribution</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={stWeekday} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 10 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="avg_ridership" fill={GREEN} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <p className="text-xs text-gray-400 font-semibold mb-2">Upcoming 6-Hour Projected Footfall</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {stPredictions.map((p) => (
                <div key={p.datetime} className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-center">
                  <p className="text-[10px] text-gray-500">{p.datetime.split(" ")[1]}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{Math.round(p.predicted_ridership)}</p>
                  <div className="mt-1">
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
