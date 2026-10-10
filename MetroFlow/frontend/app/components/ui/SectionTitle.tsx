import React from "react";

export default function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
          <Icon size={18} />
        </div>
        <h2 className="text-base font-bold text-white tracking-wide">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-1 ml-8">{subtitle}</p>}
    </div>
  );
}
