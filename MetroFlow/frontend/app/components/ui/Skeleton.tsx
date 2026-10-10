import React from "react";

export default function Skeleton({ h = 200 }: { h?: number }) {
  return <div className="skeleton w-full rounded-lg" style={{ height: h }} />;
}
