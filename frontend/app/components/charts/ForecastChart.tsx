"use client";
import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import Skeleton from "../ui/Skeleton";
import DarkTooltip from "../ui/DarkTooltip";
import { Brain } from "lucide-react";
import { CYAN } from "../../lib/constants";
import { ForecastPoint } from "../../lib/types";

export default function ForecastChart({ data, loading }: { data: ForecastPoint[]; loading: boolean }) {
  return (
    <Card>
      <SectionTitle
        icon={Brain}
        title="AI 24-Hour Network Forecast"
        subtitle="Projected network ridership trend for the next full operational cycle"
      />
      {loading ? (
        <Skeleton h={240} />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ left: -10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="datetime" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
            />
            <Tooltip content={<DarkTooltip />} />
            <Area
              type="monotone"
              dataKey="predicted_ridership"
              name="Forecast"
              stroke={CYAN}
              fill={`${CYAN}30`}
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
