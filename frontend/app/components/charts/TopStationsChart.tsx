"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import Skeleton from "../ui/Skeleton";
import DarkTooltip from "../ui/DarkTooltip";
import { BarChart2 } from "lucide-react";
import { BLUE } from "../../lib/constants";
import { TopStationPoint } from "../../lib/types";

export default function TopStationsChart({ data, loading }: { data: TopStationPoint[]; loading: boolean }) {
  return (
    <Card>
      <SectionTitle
        icon={BarChart2}
        title="Top 10 Busiest Metro Stations"
        subtitle="Ranked by mean hourly ridership across all operating days"
      />
      {loading ? (
        <Skeleton h={240} />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="station"
              tick={{ fill: "#d1d5db", fontSize: 10 }}
              tickFormatter={(s) => {
                const str = String(s || "");
                return str.length > 22 ? str.slice(0, 20) + "…" : str;
              }}
              width={140}
            />
            <Tooltip content={<DarkTooltip />} />
            <Bar
              dataKey="avg_ridership"
              name="Avg Riders/Hr"
              fill={BLUE}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
