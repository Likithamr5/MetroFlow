import React from "react";

export default function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass p-5 transition-all duration-200 ${className}`}>{children}</div>
  );
}
