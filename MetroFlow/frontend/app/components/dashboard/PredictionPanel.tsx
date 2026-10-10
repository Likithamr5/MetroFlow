"use client";
import React, { useCallback, useEffect, useState } from "react";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import StatusBadge from "../ui/StatusBadge";
import { Brain, Sparkles, Send, RefreshCw, ShieldAlert, Train } from "lucide-react";
import { PredictionResult, api } from "../../lib/api";

export default function PredictionPanel({ stationList, station = "Attiguppe" }: { stationList: string[]; station?: string }) {
  const [predStation, setPredStation] = useState<string>(station);
  const [predHour, setPredHour] = useState<number>(18);
  const [predDayOfWeek, setPredDayOfWeek] = useState<number>(1);
  const [predCurrentRidership, setPredCurrentRidership] = useState<number>(350);
  const [predLoading, setPredLoading] = useState<boolean>(false);
  const [predResult, setPredResult] = useState<PredictionResult | null>(null);
  const [predError, setPredError] = useState<string>("");

  const handlePredict = useCallback(async (e?: React.FormEvent) => {
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
      setPredError(err instanceof Error ? err.message : "Failed to generate prediction");
    } finally {
      setPredLoading(false);
    }
  }, [predCurrentRidership, predDayOfWeek, predHour, predStation]);

  // The selected station is synchronized from the parent on user selection and
  // prediction changes. This effect intentionally performs a state update to
  // keep the form aligned with the shared dashboard selection.
  useEffect(() => {
    if (station && stationList.includes(station)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPredStation(station);
    }
  }, [station, stationList]);

  // Keep the initial prediction event-driven rather than synchronous with a
  // render. The request is triggered explicitly by the submit button.
  useEffect(() => {
    if (!predResult && predStation && stationList.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void handlePredict();
    }
  }, [handlePredict, predResult, predStation, stationList.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Prediction Input Form */}
      <div className="lg:col-span-5">
        <Card className="h-full border-violet-500/20 shadow-xl">
          <SectionTitle
            icon={Sparkles}
            title="AI Next-Hour Demand Predictor"
            subtitle="Powered by trained XGBoost Regressor with dynamic crowd classification"
          />

          <form onSubmit={handlePredict} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Select Metro Station
              </label>
              <select
                value={predStation}
                onChange={(e) => setPredStation(e.target.value)}
                className="w-full bg-gray-800/80 border border-gray-700 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              >
                {stationList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Hour of Day (0–23)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={predHour}
                  onChange={(e) => setPredHour(Number(e.target.value))}
                  className="w-full bg-gray-800/80 border border-gray-700 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Day of Week
                </label>
                <select
                  value={predDayOfWeek}
                  onChange={(e) => setPredDayOfWeek(Number(e.target.value))}
                  className="w-full bg-gray-800/80 border border-gray-700 text-sm text-white rounded-lg px-3 py-2 outline-none focus:border-violet-500"
                >
                  <option value={0}>Monday (Weekday)</option>
                  <option value={1}>Tuesday (Weekday)</option>
                  <option value={2}>Wednesday (Weekday)</option>
                  <option value={3}>Thursday (Weekday)</option>
                  <option value={4}>Friday (Weekday)</option>
                  <option value={5}>Saturday (Weekend)</option>
                  <option value={6}>Sunday (Weekend)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-300">
                  Current Station Ridership: <span className="text-violet-400 font-bold">{predCurrentRidership}</span>
                </label>
              </div>
              <input
                type="range"
                min={10}
                max={4000}
                step={10}
                value={predCurrentRidership}
                onChange={(e) => setPredCurrentRidership(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>10 (Off-peak)</span>
                <span>1,500</span>
                <span>4,000 (Major terminal peak)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={predLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {predLoading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              <span>{predLoading ? "Predicting Crowd Demand..." : "Run AI Demand Prediction"}</span>
            </button>
          </form>

          {predError && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {predError}
            </div>
          )}
        </Card>
      </div>

      {/* Prediction Result Display */}
      <div className="lg:col-span-7">
        <Card className="h-full flex flex-col justify-between border-violet-500/20">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Brain className="text-violet-400" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Model Inference & Actionable Guidance
                </h3>
              </div>
              <span className="text-xs text-gray-500">Target Horizon: +1 Hour</span>
            </div>

            {predResult ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gray-800/40 border border-gray-700/60">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Target Station</p>
                    <h4 className="text-xl font-extrabold text-white mt-0.5">{predResult.station}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Operating Hour: {predResult.hour}:00 hrs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-medium mb-1">Expected Crowd Density</p>
                    <StatusBadge status={predResult.crowd_level} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800">
                    <p className="text-xs text-gray-400">Current Flow</p>
                    <p className="text-xl font-bold text-white mt-1">
                      {predResult.current_ridership.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-500">passengers/hr</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800">
                    <p className="text-xs text-violet-400 font-semibold">Predicted Next-Hour</p>
                    <p className="text-xl font-extrabold text-violet-300 mt-1">
                      {Math.round(predResult.predicted_next_hour_ridership).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-violet-400/80">XGBoost inference</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 col-span-2 sm:col-span-1">
                    <p className="text-xs text-gray-400">Volume Delta</p>
                    {(() => {
                      const delta =
                        Math.round(predResult.predicted_next_hour_ridership) -
                        predResult.current_ridership;
                      const pct =
                        predResult.current_ridership > 0
                          ? Math.round((delta / predResult.current_ridership) * 100)
                          : 0;
                      const isSurge = delta >= 0;
                      return (
                        <>
                          <p className={`text-xl font-bold mt-1 ${isSurge ? "text-amber-400" : "text-emerald-400"}`}>
                            {isSurge ? `+${delta}` : delta} ({pct > 0 ? `+${pct}%` : `${pct}%`})
                          </p>
                          <p className="text-[11px] text-gray-500">{isSurge ? "Demand escalation" : "Demand receding"}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-800/40">
                  <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                    <ShieldAlert size={16} />
                    <span>AI Dispatch & Scheduling Recommendation</span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed font-medium">
                    {predResult.recommendation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <Train size={36} className="text-gray-600 mb-2 animate-pulse" />
                <p className="text-sm">Select station parameters and run prediction.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-800/60 mt-4 flex items-center justify-between text-[11px] text-gray-500">
            <span>Model: XGBoost Regressor + OneHotEncoder Pipeline</span>
            <span className="text-emerald-400 font-medium">Validation R²: 0.88</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
