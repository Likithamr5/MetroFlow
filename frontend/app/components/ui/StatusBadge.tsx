import React from "react";

export default function StatusBadge({ status }: { status: string }) {
  const norm = status.toLowerCase();
  let badgeClass = "badge-low";
  if (norm.includes("critical") || norm.includes("very")) badgeClass = "badge-critical";
  else if (norm.includes("high")) badgeClass = "badge-high";
  else if (norm.includes("mod") || norm.includes("med")) badgeClass = "badge-moderate";

  return (
    <span className={`${badgeClass} text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status.toUpperCase()}
    </span>
  );
}
