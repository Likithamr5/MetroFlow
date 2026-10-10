import React from "react";

type TooltipPayloadItem = {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  fill?: string;
};

type DarkTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
};

export default function DarkTooltip({ active, payload, label }: DarkTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-2xl text-xs backdrop-blur-md">
      <p className="text-gray-400 mb-1.5 font-medium">{label}</p>
      {payload.map((item, index) => (
        <p key={`${String(item.name)}-${index}`} style={{ color: item.color || item.fill || "#fff" }} className="font-semibold flex items-center justify-between gap-4">
          <span>{String(item.name)}:</span>
          <span>{typeof item.value === "number" ? item.value.toLocaleString() : String(item.value)}</span>
        </p>
      ))}
    </div>
  );
}
