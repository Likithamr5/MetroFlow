"use client";
import React, { useEffect, useState, useMemo } from "react";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import Skeleton from "../ui/Skeleton";
import { Activity } from "lucide-react";
import { api } from "../../lib/api";

interface HeatmapPoint {
  station: string;
  hour: number;
  avg_ridership: number;
}

function getColor(value: number): string {
  if (value >= 1500) return "#ef4444";
  if (value >= 1000) return "#f97316";
  if (value >= 500) return "#f59e0b";
  if (value >= 200) return "#22c55e";
  return "#10b981";
}

export default function HeatmapChart() {
  const [rawData, setRawData] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHeatmap()
      .then((res) => {
        setRawData(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Heatmap load error:", err);
        setLoading(false);
      });
  }, []);

  // Rank stations by their average hourly ridership so uneven observation counts do not distort the result.
  const { stations, grid } = useMemo(() => {
    if (rawData.length === 0) return { stations: [] as string[], grid: [] as { station: string; hour: number; value: number }[] };

    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};
    rawData.forEach((d) => {
      totals[d.station] = (totals[d.station] || 0) + d.avg_ridership;
      counts[d.station] = (counts[d.station] || 0) + 1;
    });

    const top20 = Object.entries(totals)
      .sort((a, b) => b[1] / counts[a[0]] - b[1] / counts[b[0]])
      .slice(0, 20)
      .map(([s]) => s);

    const filtered = rawData
      .filter((d) => top20.includes(d.station))
      .map((d) => ({ station: d.station, hour: d.hour, value: d.avg_ridership }));

    return { stations: top20, grid: filtered };
  }, [rawData]);

  if (loading) {
    return (
      <Card>
        <SectionTitle icon={Activity} title="Ridership Intensity Heatmap" subtitle="Top 20 stations vs Hour of Day" />
        <Skeleton h={400} />
      </Card>
    );
  }

  if (stations.length === 0) return null;

  const CELL_W = 28;
  const CELL_H = 20;
  const LEFT_PAD = 220;
  const TOP_PAD = 30;
  const chartWidth = LEFT_PAD + 24 * CELL_W + 20;
  const chartHeight = TOP_PAD + stations.length * CELL_H + 20;

  // Build lookup for fast access
  const lookup: Record<string, number> = {};
  grid.forEach((g) => {
    lookup[`${g.station}|${g.hour}`] = g.value;
  });

  return (
    <Card>
      <SectionTitle
        icon={Activity}
        title="Ridership Intensity Heatmap"
        subtitle="Top 20 busiest stations × 24-hour ridership density"
      />
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="text-gray-400">
          {/* Hour labels */}
          {Array.from({ length: 24 }, (_, h) => (
            <text
              key={`h-${h}`}
              x={LEFT_PAD + h * CELL_W + CELL_W / 2}
              y={TOP_PAD - 8}
              textAnchor="middle"
              fill="#6b7280"
              fontSize={10}
            >
              {h}h
            </text>
          ))}

          {/* Station rows */}
          {stations.map((st, si) => (
            <g key={st}>
              {/* Station label */}
              <text
                x={LEFT_PAD - 8}
                y={TOP_PAD + si * CELL_H + CELL_H / 2 + 4}
                textAnchor="end"
                fill="#d1d5db"
                fontSize={10}
              >
                {st.length > 28 ? st.slice(0, 26) + "…" : st}
              </text>

              {/* Hour cells */}
              {Array.from({ length: 24 }, (_, h) => {
                const val = lookup[`${st}|${h}`] || 0;
                return (
                  <g key={`${st}-${h}`}>
                    <rect
                      x={LEFT_PAD + h * CELL_W}
                      y={TOP_PAD + si * CELL_H}
                      width={CELL_W - 1}
                      height={CELL_H - 1}
                      fill={getColor(val)}
                      opacity={0.75 + Math.min(val / 2000, 0.25)}
                      rx={2}
                    >
                      <title>{`${st} @ ${h}:00 — ${Math.round(val).toLocaleString()} avg riders`}</title>
                    </rect>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400 justify-center">
        {[
          { label: "< 200", color: "#10b981" },
          { label: "200–500", color: "#22c55e" },
          { label: "500–1K", color: "#f59e0b" },
          { label: "1K–1.5K", color: "#f97316" },
          { label: "> 1.5K", color: "#ef4444" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: l.color }} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
