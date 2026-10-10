"use client";
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import DarkTooltip from "../ui/DarkTooltip";
import { Activity } from "lucide-react";
import { CrowdDistributionItem } from "../../lib/types";

export default function CrowdDistributionChart({ pieData }: { pieData: CrowdDistributionItem[] }) {
  return (
    <Card>
      <SectionTitle
        icon={Activity}
        title="Network Status Distribution"
        subtitle="Live status proportion across all active stations"
      />
      <div className="flex items-center justify-around gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DarkTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1.5 text-xs">
          {pieData.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
              <span className="text-gray-400">{d.name}:</span>
              <span className="font-bold text-white">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
