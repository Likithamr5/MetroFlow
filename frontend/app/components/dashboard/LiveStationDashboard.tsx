"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Train,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Radio,
  CheckCircle2,
  RefreshCw,
  Compass,
  Layers,
  Sparkles,
} from "lucide-react";

import { useLiveStation } from "../../hooks/useLiveStation";
import { api } from "../../lib/api";
import { StationFootfallForecastResponse } from "../../lib/types";
import { PURPLE, BLUE, GREEN, ORANGE, RED } from "../../lib/constants";

import Card from "../ui/Card";
import StatCard from "../ui/StatCard";
import Skeleton from "../ui/Skeleton";
import StationActualVsForecastChart from "../charts/StationActualVsForecastChart";

interface Props {
  initialStation?: string;
  stationList?: string[];
}

export default function LiveStationDashboard({
  initialStation = "Attiguppe",
  stationList = [],
}: Props) {
  const [selectedStation, setSelectedStation] = useState<string>(initialStation);
  const [stations, setStations] = useState<string[]>(stationList);
  const [footfallData, setFootfallData] = useState<StationFootfallForecastResponse | null>(null);
  const [loadingFootfall, setLoadingFootfall] = useState<boolean>(true);

  // Hook connecting to the real-time WebSocket stream with auto-reconnect
  const { data: liveData, isLive, status: connStatus, reconnect, lastPing } = useLiveStation(selectedStation);

  // Load available stations if not passed via props
  useEffect(() => {
    if (stations.length === 0) {
      api.getStations()
        .then((list) => {
          if (list && list.length > 0) {
            setStations(list);
            if (!list.includes(selectedStation)) {
              setSelectedStation(list[0]);
            }
          }
        })
        .catch((err) => console.error("Error loading stations for live dashboard:", err));
    }
  }, [stations.length, selectedStation]);

  // Load footfall history & 3-hour forecast for the selected station
  const loadFootfall = useCallback(async (stName: string) => {
    setLoadingFootfall(true);
    try {
      const res = await api.getStationFootfallForecast(stName);
      setFootfallData(res);
    } catch (err) {
      console.error("Failed to load station footfall & forecast:", err);
    } finally {
      setLoadingFootfall(false);
    }
  }, []);

  useEffect(() => {
    if (selectedStation) {
      loadFootfall(selectedStation);
    }
  }, [selectedStation, loadFootfall]);

  const handleStationChange = (newStation: string) => {
    setSelectedStation(newStation);
  };

  // Crowd level helper
  const getCrowdColor = (pct: number) => {
    if (pct >= 85) return RED;
    if (pct >= 70) return ORANGE;
    if (pct >= 40) return BLUE;
    return GREEN;
  };

  const crowdPct = liveData ? liveData.crowd_percentage : 0;
  const crowdColor = getCrowdColor(crowdPct);

  return (
    <div className="space-y-6">
      {/* ── Top Bar: Station Selector, Badges & Connection Status ─────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-900/90 border border-gray-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
            <Radio size={22} className={isLive ? "animate-pulse" : ""} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Real-Time Station Intelligence</h2>
              {/* LIVE Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isLive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : connStatus === "reconnecting"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive
                      ? "bg-emerald-400 animate-ping"
                      : connStatus === "reconnecting"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-red-400"
                  }`}
                />
                <span>{isLive ? "LIVE • 2s STREAM" : connStatus.toUpperCase()}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-400">
                Live telemetry snapshot for <span className="text-gray-200 font-semibold">{liveData?.station_name || selectedStation}</span> • {liveData?.line || "Purple Line"}
              </p>
              {liveData?.is_interchange && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  🔄 Interchange Hub
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {lastPing && (
            <span className="text-[11px] text-gray-500 hidden md:inline">
              Tick: {lastPing.toLocaleTimeString()}
            </span>
          )}

          {/* Station Selector */}
          <div className="flex items-center gap-2 bg-gray-950 p-1 rounded-xl border border-gray-800">
            <span className="text-xs text-gray-400 pl-2 font-medium">Station:</span>
            <select
              value={selectedStation}
              onChange={(e) => handleStationChange(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-violet-500 font-semibold cursor-pointer"
            >
              {stations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={reconnect}
            title="Reconnect stream"
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={connStatus === "reconnecting" ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── 4 KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {!liveData ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} h={100} />)
        ) : (
          <>
            {/* KPI 1: Crowd Percentage */}
            <Card className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Crowd Density</p>
                  <h3 className="text-2xl font-extrabold text-white mt-1">
                    {crowdPct}%
                  </h3>
                </div>
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${crowdColor}20`, color: crowdColor }}
                >
                  <Users size={20} />
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${crowdPct}%`, backgroundColor: crowdColor }}
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
                <span>Status: <strong className="capitalize" style={{ color: crowdColor }}>{liveData.status}</strong></span>
                <span>Cap: {liveData.capacity?.toLocaleString() || "5,000"}</span>
              </div>
            </Card>

            {/* KPI 2: 15-Min Entries */}
            <StatCard
              label="15-Min Entries"
              value={liveData.entries_last_15m.toLocaleString()}
              icon={ArrowUpRight}
              color={GREEN}
              sub={`Net Flow: ${liveData.net_flow_15m >= 0 ? `+${liveData.net_flow_15m}` : liveData.net_flow_15m} commuters`}
            />

            {/* KPI 3: 15-Min Exits */}
            <StatCard
              label="15-Min Exits"
              value={liveData.exits_last_15m.toLocaleString()}
              icon={ArrowDownRight}
              color={BLUE}
              sub="Platform turnstile clears"
            />

            {/* KPI 4: Avg Wait Time */}
            <StatCard
              label="Avg Platform Wait"
              value={`${liveData.avg_wait_minutes} min`}
              icon={Clock}
              color={liveData.avg_wait_minutes > 4.5 ? ORANGE : PURPLE}
              sub={liveData.avg_wait_minutes > 4.5 ? "Boarding queue delay" : "Nominal headway interval"}
            />
          </>
        )}
      </div>

      {/* ── Platform Panel & Next Trains ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Platform Crowd Breakdown */}
        <div className="lg:col-span-7">
          <Card className="h-full border-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-violet-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Platform Passenger Density
                </h3>
              </div>
              <span className="text-xs text-gray-500">
                {liveData?.platforms.length || 2} Platforms Active
              </span>
            </div>

            {!liveData ? (
              <Skeleton h={180} />
            ) : (
              <div className="space-y-4">
                {liveData.platforms.map((p) => {
                  const pColor = getCrowdColor(p.crowd_percentage);
                  return (
                    <div
                      key={p.platform_id}
                      className="p-4 rounded-xl bg-gray-900/70 border border-gray-800/80 hover:border-gray-700 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-gray-800 text-xs font-bold text-violet-300 border border-gray-700">
                            {p.name}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-white">{p.direction}</p>
                            <p className="text-[11px] text-gray-500">{p.line}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className="text-xs font-extrabold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${pColor}20`, color: pColor }}
                          >
                            {p.crowd_percentage}% • {p.status}
                          </span>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Waiting: <strong className="text-white font-semibold">{p.waiting_passengers}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Density bar */}
                      <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${p.crowd_percentage}%`,
                            backgroundColor: pColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Next Trains Panel */}
        <div className="lg:col-span-5">
          <Card className="h-full border-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <div className="flex items-center gap-2">
                <Train size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Upcoming Train Arrivals
                </h3>
              </div>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-Tracking
              </span>
            </div>

            {!liveData ? (
              <Skeleton h={180} />
            ) : (
              <div className="space-y-3">
                {liveData.next_trains.map((t, idx) => (
                  <div
                    key={t.train_id + idx}
                    className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300">
                        <Train size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{t.train_id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-medium">
                            {t.platform_name}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{t.destination}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-emerald-400">
                        {t.eta_minutes === 0 ? "Boarding" : `${t.eta_minutes} min`}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Occupancy: <strong className="text-gray-300">{t.occupancy_percentage}%</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Line Chart: Actual vs Forecast ───────────────────────────────── */}
      <StationActualVsForecastChart
        data={footfallData?.combined_series || []}
        loading={loadingFootfall}
        stationName={selectedStation}
        summary={footfallData?.summary}
      />

      {/* ── Real-Time Alerts ─────────────────────────────────────────────── */}
      <Card className="border-gray-800">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Station Dispatch & Safety Alerts
            </h3>
          </div>
          <span className="text-xs text-gray-500">Real-time dynamic monitoring</span>
        </div>

        {!liveData ? (
          <Skeleton h={80} />
        ) : liveData.alerts.length === 0 ? (
          <p className="text-xs text-gray-500 py-3 text-center">No active alerts for this station.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {liveData.alerts.map((alt) => {
              const isCrit = alt.severity === "critical";
              const isWarn = alt.severity === "warning";
              const borderColor = isCrit ? "border-red-500/30 bg-red-950/20" : isWarn ? "border-amber-500/30 bg-amber-950/20" : "border-emerald-500/20 bg-emerald-950/10";
              const iconColor = isCrit ? "text-red-400" : isWarn ? "text-amber-400" : "text-emerald-400";
              return (
                <div
                  key={alt.id}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${borderColor}`}
                >
                  <div className={`p-2 rounded-lg bg-gray-900 shrink-0 mt-0.5 ${iconColor}`}>
                    {isCrit || isWarn ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white">{alt.title}</h4>
                      <span className="text-[10px] text-gray-500">{alt.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">{alt.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
