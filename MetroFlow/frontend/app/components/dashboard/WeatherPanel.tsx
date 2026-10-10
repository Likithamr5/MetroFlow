"use client";
import React from "react";
import Card from "../ui/Card";
import Skeleton from "../ui/Skeleton";
import { CloudRain, Thermometer, Droplets, Wind } from "lucide-react";
import { WeatherSummary } from "../../lib/api";

export default function WeatherPanel({ weather, loading }: { weather: WeatherSummary | null; loading: boolean }) {
  if (loading) return (
    <Card className="bg-gradient-to-r from-blue-950/40 via-gray-900/60 to-purple-950/40 border-blue-900/30">
      <Skeleton h={100} />
    </Card>
  );

  return (
    <Card className="bg-gradient-to-r from-blue-950/40 via-gray-900/60 to-purple-950/40 border-blue-900/30">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <CloudRain className="text-cyan-400" size={20} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Bengaluru Weather & Transit Environment
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Monsoon operational correlation: heavy rain (&gt;15mm) triggers 18–25% surges in metro commuter demand.
          </p>
        </div>
        <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-medium">
          Live Bengaluru Climate Index
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <Thermometer size={15} className="text-amber-400" />
            <span>Avg Temperature</span>
          </div>
          <p className="text-xl font-bold text-white mt-1">
            {weather ? `${weather.average_temperature} °C` : "23.3 °C"}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Mild monsoon climate</p>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <Droplets size={15} className="text-blue-400" />
            <span>Relative Humidity</span>
          </div>
          <p className="text-xl font-bold text-white mt-1">
            {weather ? `${weather.average_humidity}%` : "82.8%"}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">High moisture levels</p>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <CloudRain size={15} className="text-cyan-400" />
            <span>Cumulative Rainfall</span>
          </div>
          <p className="text-xl font-bold text-white mt-1">
            {weather ? `${weather.total_rainfall} mm` : "294.4 mm"}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Monsoon season total</p>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <Wind size={15} className="text-emerald-400" />
            <span>Avg Wind Velocity</span>
          </div>
          <p className="text-xl font-bold text-white mt-1">
            {weather ? `${weather.average_wind_speed} km/h` : "14.4 km/h"}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Moderate surface breeze</p>
        </div>
      </div>
    </Card>
  );
}
