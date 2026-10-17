"use client";

import { useEffect, useState, useCallback } from "react";
import { Train, RefreshCw, Users, Activity, Clock } from "lucide-react";
import {
  api,
  AnalyticsSummary,
  CongestionResponse,
} from "./lib/api";
import { PURPLE, BLUE, ORANGE, RED, STATUS_COLOR } from "./lib/constants";
import { Anomaly, DailyRidershipPoint, ForecastPoint, HourlyRidershipPoint, Insight, LineComparisonPoint, StationRidershipPoint, TopStationPoint, ActiveTrainMovement, TrainMovementPoint } from "./lib/types";

// UI Components
import StatCard from "./components/ui/StatCard";
import Skeleton from "./components/ui/Skeleton";
import ErrorBanner from "./components/ui/ErrorBanner";

// Chart Components
import MasterNetworkAnalysisChart from "./components/charts/MasterNetworkAnalysisChart";
import ForecastChart from "./components/charts/ForecastChart";
import CrowdDistributionChart from "./components/charts/CrowdDistributionChart";
import HeatmapChart from "./components/charts/HeatmapChart";

// Dashboard Components
import LiveStationDashboard from "./components/dashboard/LiveStationDashboard";
import PredictionPanel from "./components/dashboard/PredictionPanel";
import CongestionMatrix from "./components/dashboard/CongestionMatrix";
import StationDeepDive from "./components/dashboard/StationDeepDive";
import PeakAnalysis from "./components/dashboard/PeakAnalysis";
import InsightsPanel from "./components/dashboard/InsightsPanel";
import StationManager from "./components/dashboard/StationManager";

export default function Home() {
  // Data States
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [congestionData, setCongestionData] = useState<CongestionResponse | null>(null);
  const [liveData, setLiveData] = useState<StationRidershipPoint[]>([]);
  const [trainMovements, setTrainMovements] = useState<TrainMovementPoint[]>([]);
  const [activeMovement, setActiveMovement] = useState<ActiveTrainMovement | null>(null);
  const [networkDaily, setNetworkDaily] = useState<DailyRidershipPoint[]>([]);
  const [networkHourly, setNetworkHourly] = useState<HourlyRidershipPoint[]>([]);
  const [topStations, setTopStations] = useState<TopStationPoint[]>([]);
  const [lineData, setLineData] = useState<LineComparisonPoint[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [stationList, setStationList] = useState<string[]>([]);
  
  // App States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation State - Live Station is featured prominently
  const [activeTab, setActiveTab] = useState("Live Station");
  const [selectedStation, setSelectedStation] = useState<string>("");
  const tabs = ["Live Station", "Dashboard", "Analytics", "Stations", "Current Metro Station in Bangalore"];

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [
        sumRes,
        congRes,
        liveRes,
        movRes,
        dailyRes,
        hourlyRes,
        topRes,
        lineRes,
        insRes,
        anoRes,
        foreRes,
        stRes,
      ] = await Promise.allSettled([
        api.getAnalyticsSummary(),
        api.getStationCongestion(),
        api.getLive(),
        api.getTrainMovements(),
        api.getNetworkDaily(),
        api.getNetworkHourly(),
        api.getTopStations(10),
        api.getLineComparison(),
        api.getInsights(),
        api.getAnomalies(),
        api.getForecast(),
        api.getStations(),
      ]);

      if (sumRes.status === "fulfilled") setSummary(sumRes.value);
      if (congRes.status === "fulfilled") setCongestionData(congRes.value);
      if (liveRes.status === "fulfilled") {
        setLiveData(liveRes.value.data || []);
        if (liveRes.value.active_movement) setActiveMovement(liveRes.value.active_movement);
      }
      if (movRes.status === "fulfilled") {
        setTrainMovements(movRes.value.data || []);
        if (movRes.value.active_movement) setActiveMovement(movRes.value.active_movement);
      }
      if (dailyRes.status === "fulfilled") setNetworkDaily(dailyRes.value.data || []);
      if (hourlyRes.status === "fulfilled") setNetworkHourly(hourlyRes.value.data || []);
      if (topRes.status === "fulfilled") setTopStations(topRes.value.data || []);
      if (lineRes.status === "fulfilled") setLineData(lineRes.value.data || []);
      if (insRes.status === "fulfilled") setInsights(insRes.value.insights || []);
      if (anoRes.status === "fulfilled") setAnomalies(anoRes.value.anomalies || []);
      if (foreRes.status === "fulfilled") setForecast(foreRes.value.forecasts || []);

      if (stRes.status === "fulfilled") {
        setStationList(stRes.value);
        if (stRes.value.length > 0 && !selectedStation) {
          setSelectedStation(stRes.value[0]);
        }
      } else {
        throw new Error("Failed to load core data.");
      }

      setLastUpdate(new Date());
    } catch (e: unknown) {
      console.error("Dashboard data load error:", e);
      setError(e instanceof Error ? e.message : "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStation]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
    const interval = window.setInterval(() => {
      void loadData();
    }, 60000); // 1 min auto refresh
    return () => window.clearInterval(interval);
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSelectStation = (station: string) => {
    setSelectedStation(station);
    setActiveTab("Live Station");
  };

  const statusPieCounts = { low: 0, moderate: 0, high: 0, critical: 0 };
  liveData.forEach((d) => {
    statusPieCounts[d.status as keyof typeof statusPieCounts] = (statusPieCounts[d.status as keyof typeof statusPieCounts] || 0) + 1;
  });
  const pieData = Object.entries(statusPieCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1),
      value: v,
      color: STATUS_COLOR[k],
    }));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800/80 bg-gray-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-600/90 p-2.5 shadow-lg shadow-violet-600/30">
              <Train size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">MetroFlow</h1>
                <span className="text-[10px] bg-violet-500/20 text-violet-300 font-semibold px-2 py-0.5 rounded-full border border-violet-500/30">
                  AI v2.0
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Predictive Public Transit Intelligence & Crowd Optimization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeMovement && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
                <Train size={13} />
                <span>Train {activeMovement.train_id} ({activeMovement.movement_time}) • Next: {activeMovement.next_train_in_minutes}m</span>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="live-dot" />
              <span className="ml-2">Live Train Movement Active</span>
            </div>

            {lastUpdate && (
              <span className="text-xs text-gray-500 hidden md:inline">
                Synced {lastUpdate.toLocaleTimeString("en-IN")}
              </span>
            )}

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3.5 py-1.5 rounded-lg transition-all font-medium disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
          <div className="flex items-center gap-6 border-b border-gray-800">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${activeTab === tab ? 'text-violet-400' : 'text-gray-400 hover:text-gray-200'}`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500 rounded-t-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {error && (
          <ErrorBanner message={error} onRetry={loadData} />
        )}

        {/* --- Live Station Tab --- */}
        {activeTab === "Live Station" && (
          <LiveStationDashboard
            initialStation={selectedStation || (stationList[0] || "Attiguppe")}
            stationList={stationList}
          />
        )}

        {/* --- Dashboard Tab --- */}
        {activeTab === "Dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} h={100} />)
              ) : (
                <>
                  <StatCard label="Total Network Ridership" value={summary ? summary.total_ridership.toLocaleString() : "-"} icon={Users} color={PURPLE} sub="Live 2026 Real-Time Flow • 15-Min Intervals" />
                  <StatCard label="Monitored Stations" value={summary ? summary.total_stations : "-"} icon={Train} color={BLUE} sub="Purple & Green Line" />
                  <StatCard label="Busiest Terminal" value={summary ? summary.busiest_station.replace("Nadaprabhu Kempegowda Station, ", "") : "-"} icon={Activity} color={ORANGE} sub="Highest footfall" />
                  <StatCard label="Peak Operational Hour" value={summary ? `${summary.peak_hour}:00 hrs` : "-"} icon={Clock} color={RED} sub="Commuter rush window" />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <CongestionMatrix congestionData={congestionData} onSelectStation={handleSelectStation} />
              </div>
              <div className="lg:col-span-5">
                <CrowdDistributionChart pieData={pieData} />
              </div>
            </div>
            
            <HeatmapChart />
          </div>
        )}

        {/* --- Analytics Tab (Dedicated Single Master Analysis Graph) --- */}
        {activeTab === "Analytics" && (
          <div className="space-y-6">
            <MasterNetworkAnalysisChart data={lineData} loading={loading} />
          </div>
        )}

        {/* --- Stations Tab --- */}
        {activeTab === "Stations" && (
          <div className="space-y-6">
            <StationManager onStationChange={setSelectedStation} selectedStation={selectedStation} congestionData={congestionData} />
            <StationDeepDive stationList={stationList} selectedStation={selectedStation} onStationChange={setSelectedStation} />
          </div>
        )}

        {/* --- Current Metro Station in Bangalore (AI Transit Intelligence) Tab --- */}
        {(activeTab === "Current Metro Station in Bangalore" || activeTab === "AI Intelligence") && (
          <div className="space-y-6">
            <PredictionPanel stationList={stationList} station={selectedStation} />
            <div className="grid grid-cols-1 gap-6">
              <ForecastChart data={forecast} loading={loading} />
            </div>
            <PeakAnalysis />
            <InsightsPanel insights={insights} anomalies={anomalies} />
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800/60 py-6 bg-gray-950 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-400">MetroFlow</span>
            <span>• Predictive Public Transit Intelligence Platform</span>
          </div>
          <p>Bengaluru Namma Metro • 2026 Live Train Movement Engine • FastAPI & Next.js</p>
        </div>
      </footer>
    </div>
  );
}
