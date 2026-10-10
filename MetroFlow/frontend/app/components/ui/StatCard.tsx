import React from "react";

export default function StatCard({
  label, value, icon: Icon, color, sub,
}: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <div className="glass p-5 flex items-center gap-4 hover:border-gray-700 transition-colors">
      <div className="rounded-xl p-3.5 shrink-0" style={{ background: `${color}15`, color }}>
        <Icon size={24} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5 truncate">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}
