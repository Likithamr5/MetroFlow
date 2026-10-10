"use client";
import React from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import Skeleton from "../ui/Skeleton";
import DarkTooltip from "../ui/DarkTooltip";
import { Clock } from "lucide-react";
import { GREEN, ORANGE, RED } from "../../lib/constants";
import { HourlyRidershipPoint } from "../../lib/types";

export default function NetworkHourlyChart({ data, loading }: { data: HourlyRidershipPoint[]; loading: boolean }) {
  return (
    <Card>
      <SectionTitle
        icon={Clock}
        title="Network Hourly Profile (24-Hour Curve)"
        subtitle="Color-coded: Green (Off-peak), Amber (Moderate), Red (Rush hour)"
      />
      {loading ? (
        <Skeleton h={220} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ left: -10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              tickFormatter={(v) => `${v}h`}
            />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="avg_ridership" name="Avg Riders" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.avg_ridership > 600
                      ? RED
                      : entry.avg_ridership > 350
                      ? ORANGE
                      : GREEN
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
