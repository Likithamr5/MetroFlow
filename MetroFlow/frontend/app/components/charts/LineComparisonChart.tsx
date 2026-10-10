"use client";
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import Skeleton from "../ui/Skeleton";
import DarkTooltip from "../ui/DarkTooltip";
import { Train } from "lucide-react";
import { PURPLE, GREEN } from "../../lib/constants";
import { LineComparisonPoint } from "../../lib/types";

export default function LineComparisonChart({ data, loading }: { data: LineComparisonPoint[]; loading: boolean }) {
  return (
    <Card>
      <SectionTitle
        icon={Train}
        title="Purple Line vs Green Line Hourly Comparison"
        subtitle="Average hourly ridership comparison across major transit corridors"
      />
      {loading ? (
        <Skeleton h={240} />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ left: -10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickFormatter={(v) => `${v}h`}
            />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
            <Tooltip content={<DarkTooltip />} />
            <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="purple_line_avg"
              name="Purple Line (East-West)"
              stroke={PURPLE}
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="green_line_avg"
              name="Green Line (North-South)"
              stroke={GREEN}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
