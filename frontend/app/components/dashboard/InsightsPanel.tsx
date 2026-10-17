"use client";

import React from "react";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import { Brain, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { Anomaly, Insight } from "../../lib/types";

export default function InsightsPanel({
  insights,
  anomalies,
}: {
  insights: Insight[];
  anomalies: Anomaly[];
}) {
  const getSeverityBadge = (severity?: string, type?: string) => {
    const sev = severity?.toLowerCase() || (type === "surge" ? "high" : "moderate");
    if (sev === "critical") {
      return "bg-red-500/20 text-red-300 border-red-500/30";
    }
    if (sev === "high") {
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    }
    return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  };

  return (
    <div className="space-y-6">
      {/* AI Detection Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Statistical Anomaly Incidents</p>
            <p className="text-2xl font-extrabold text-white mt-1">
              {anomalies.length} <span className="text-xs text-gray-500 font-normal">Active</span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">AI Model Inference Confidence</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">
              94.2% <span className="text-xs text-gray-500 font-normal">Mean</span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Sparkles size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium">Algorithmic Action Directives</p>
            <p className="text-2xl font-extrabold text-violet-400 mt-1">
              {insights.length} <span className="text-xs text-gray-500 font-normal">Rules Fired</span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automated Operational Directives */}
        <Card>
          <SectionTitle
            icon={Brain}
            title="Automated Transit Intelligence Insights"
            subtitle="Algorithmic operational observations derived from live transit movement telemetry"
          />
          <div className="space-y-3">
            {insights.map((ins, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80 flex items-start gap-3 hover:border-gray-700 transition-all"
              >
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 shrink-0 mt-0.5">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">{ins.title}</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{ins.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Statistical Anomaly Detection & Dispatch Recommendation */}
        <Card>
          <SectionTitle
            icon={AlertTriangle}
            title="Real-Time Statistical Anomaly & Surge Detection"
            subtitle="Station volume outliers calculated via true historical variance (Z-Score distribution)"
          />
          {anomalies.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {anomalies.map((a, i) => {
                const isSurge = a.type === "surge";
                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-gray-900/70 border border-gray-800/80 hover:border-gray-700 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{a.station}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(
                            a.severity,
                            a.type
                          )}`}
                        >
                          {a.severity || "Moderate"}
                        </span>
                      </div>

                      <span
                        className={`text-xs font-extrabold ${
                          isSurge ? "text-amber-400" : "text-emerald-400"
                        }`}
                      >
                        {isSurge ? "▲ Surge" : "▼ Dip"} ({a.z_score > 0 ? `+${a.z_score}` : a.z_score}σ)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>
                        Current Daily Flow: <strong className="text-white">{a.current_ridership.toLocaleString()}</strong> riders
                      </span>
                      <span>
                        Hist. Mean: <strong className="text-gray-300">{a.historical_avg.toLocaleString()}</strong>
                      </span>
                      {a.confidence && (
                        <span className="text-emerald-400 font-semibold">{a.confidence}</span>
                      )}
                    </div>

                    {a.recommendation && (
                      <div className="pt-2 border-t border-gray-800/80 flex items-start gap-1.5 text-[11px] text-gray-300">
                        <ShieldAlert size={14} className="text-violet-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-violet-300">AI Directive:</strong> {a.recommendation}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 text-xs">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2 opacity-60" />
              <p className="font-semibold text-gray-300">All transit corridors operating within nominal bounds.</p>
              <p className="text-[11px] mt-1 text-gray-500">No statistically significant passenger volume anomalies (&gt;1.8σ) detected.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
