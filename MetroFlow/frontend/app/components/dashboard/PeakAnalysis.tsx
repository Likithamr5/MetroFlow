"use client";
import React, { useEffect, useState } from "react";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import Skeleton from "../ui/Skeleton";
import { Clock } from "lucide-react";
import { api } from "../../lib/api";
import { PeakAnalysisData } from "../../lib/types";

export default function PeakAnalysis() {
  const [data, setData] = useState<PeakAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPeakAnalysis().then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <Card>
      <SectionTitle icon={Clock} title="Peak Hour Analysis" subtitle="Network & Station specific peaks" />
      <Skeleton h={300} />
    </Card>
  );

  if (!data) {
    return (
      <Card>
        <SectionTitle icon={Clock} title="Peak Hour Analysis" subtitle="Network & Station specific peaks" />
        <p className="text-sm text-gray-400">Peak analysis is unavailable.</p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle icon={Clock} title="Peak Hour Analysis" subtitle="Network & Station specific peaks" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 text-center">
          <p className="text-xs text-gray-400 font-semibold mb-1">Network Peak Hour</p>
          <p className="text-2xl font-bold text-red-400">{data.network_peak_hour}:00</p>
        </div>
        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 text-center">
          <p className="text-xs text-gray-400 font-semibold mb-1">Off-Peak Hour</p>
          <p className="text-2xl font-bold text-emerald-400">{data.network_off_peak_hour}:00</p>
        </div>
        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 text-center">
          <p className="text-xs text-gray-400 font-semibold mb-1">Busiest Day</p>
          <p className="text-2xl font-bold text-blue-400 capitalize">{data.busiest_day}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-white mb-3">Top 10 Station Peaks</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-900/80 text-gray-400">
              <tr>
                <th className="px-3 py-2 rounded-tl-lg">Station</th>
                <th className="px-3 py-2">Peak Hour</th>
                <th className="px-3 py-2 rounded-tr-lg">Avg Ridership</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {(data.station_peak_hours || []).slice(0, 10).map((st: { station: string; peak_hour: number; avg_ridership: number }, i: number) => (
                <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-2 text-gray-200">{st.station}</td>
                  <td className="px-3 py-2 font-bold text-red-400">{st.peak_hour}:00</td>
                  <td className="px-3 py-2">{Math.round(st.avg_ridership).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
