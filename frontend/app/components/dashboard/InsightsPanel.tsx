"use client";
import React from "react";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import { Brain, CheckCircle2, AlertTriangle } from "lucide-react";
import { Anomaly, Insight } from "../../lib/types";

export default function InsightsPanel({ insights, anomalies }: { insights: Insight[]; anomalies: Anomaly[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <SectionTitle
          icon={Brain}
          title="Automated Transit Intelligence Insights"
          subtitle="Algorithmic operational observations derived from live transit movement operations"
        />
        <div className="space-y-3">
          {insights.map((ins, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800/80 flex items-start gap-3"
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

      <Card>
        <SectionTitle
          icon={AlertTriangle}
          title="Statistical Anomaly Detection (Z-Score)"
          subtitle="Stations exhibiting passenger surges (&gt;2.0σ from baseline)"
        />
        {anomalies.length > 0 ? (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {anomalies.map((a, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-white">{a.station}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Observed: <span className="text-white font-semibold">{a.current_ridership}</span> | Hist. Avg: {a.historical_avg}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold ${a.type === "surge" ? "text-red-400" : "text-emerald-400"}`}>
                    {a.type === "surge" ? "▲ Surge" : "▼ Dip"} ({Math.abs(a.z_score).toFixed(1)}σ)
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 text-xs">
            No active ridership anomalies detected in network.
          </div>
        )}
      </Card>
    </div>
  );
}
