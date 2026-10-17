"use client";
import React, { useEffect, useState } from "react";
import Card from "../ui/Card";
import SectionTitle from "../ui/SectionTitle";
import Skeleton from "../ui/Skeleton";
import { Train, Plus, Trash2, X, Check, Search, Users } from "lucide-react";
import { api, CongestionResponse, StationResponse } from "../../lib/api";

export default function StationManager({
  onStationChange,
  selectedStation,
  congestionData,
}: {
  onStationChange: (station: string) => void;
  selectedStation: string;
  congestionData: CongestionResponse | null;
}) {
  const [stations, setStations] = useState<StationResponse[]>([]);
  const [internalCongestion, setInternalCongestion] = useState<CongestionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStation, setNewStation] = useState({
    name: "",
    location: "",
    line: "Purple",
    capacity: 5000,
    ridership: 1000,
    is_interchange: false,
    latitude: 12.9716,
    longitude: 77.5946,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadStations = async () => {
    setLoading(true);
    try {
      setStations(await api.getStationsFromDB());
    } catch (err) {
      console.error("Station DB load error:", err);
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStations();
  }, []);

  useEffect(() => {
    if (!congestionData) {
      api.getStationCongestion()
        .then((data) => setInternalCongestion(data))
        .catch((err) => console.error("Congestion load error:", err));
    }
  }, [congestionData]);

  const activeCongestion = congestionData || internalCongestion;

  const getStationRidership = (st: StationResponse): { count: number; level: string | null } => {
    const congItem = activeCongestion?.stations.find(
      (station) => station.station.trim().toLowerCase() === st.name.trim().toLowerCase()
    );
    if (congItem && congItem.ridership != null) {
      return { count: congItem.ridership, level: congItem.congestion_level };
    }
    if (st.ridership != null && st.ridership > 0) {
      const lvl =
        st.ridership > 14000
          ? "Critical"
          : st.ridership > 8000
          ? "High"
          : st.ridership > 3000
          ? "Medium"
          : "Low";
      return { count: st.ridership, level: lvl };
    }
    return { count: 0, level: null };
  };

  const handleAdd = async () => {
    if (!newStation.name || !newStation.location) {
      setError("Name and location are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await api.createStation(newStation);
      setShowAddForm(false);
      setNewStation({
        name: "",
        location: "",
        line: "Purple",
        capacity: 5000,
        ridership: 1000,
        is_interchange: false,
        latitude: 12.9716,
        longitude: 77.5946,
      });
      setStations((current) => [...current, created]);
      onStationChange(created.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add station");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete station "${name}"?`)) return;
    try {
      await api.deleteStation(id);
      setStations((current) => current.filter((station) => station.id !== id));
      if (selectedStation === name) {
        onStationChange("");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filtered = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.line || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRidership = stations.reduce((acc, st) => acc + getStationRidership(st).count, 0);

  if (loading) {
    return (
      <Card>
        <SectionTitle icon={Train} title="Station Management DB" subtitle="Database-backed station registry" />
        <Skeleton h={300} />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <SectionTitle
            icon={Train}
            title="Station Management DB"
            subtitle={`${stations.length} stations registered • Total Ridership: ${totalRidership.toLocaleString()} commuters`}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
            <Users size={13} />
            <span>Network: {totalRidership.toLocaleString()}</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2 text-gray-500" />
            <input
              type="text"
              placeholder="Search stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-xs text-gray-200 rounded-lg pl-8 pr-3 py-1.5 outline-none focus:border-violet-500 w-44"
            />
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            <span>{showAddForm ? "Cancel" : "Add Station"}</span>
          </button>
        </div>
      </div>

      {/* Add Station Form */}
      {showAddForm && (
        <div className="mb-4 p-4 rounded-xl bg-gray-900/80 border border-gray-700 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              placeholder="Station Name *"
              value={newStation.name}
              onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-xs text-white rounded-lg px-3 py-2 outline-none focus:border-violet-500"
            />
            <input
              placeholder="Location *"
              value={newStation.location}
              onChange={(e) => setNewStation({ ...newStation, location: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-xs text-white rounded-lg px-3 py-2 outline-none focus:border-violet-500"
            />
            <select
              value={newStation.line}
              onChange={(e) => setNewStation({ ...newStation, line: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-xs text-white rounded-lg px-3 py-2 outline-none focus:border-violet-500"
            >
              <option value="Purple">Purple Line</option>
              <option value="Green">Green Line</option>
              <option value="Yellow">Yellow Line</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="number"
              placeholder="Ridership Count"
              value={newStation.ridership}
              onChange={(e) => setNewStation({ ...newStation, ridership: Number(e.target.value) })}
              className="bg-gray-800 border border-gray-700 text-xs text-white rounded-lg px-3 py-2 outline-none focus:border-violet-500"
              title="Station Ridership Count"
            />
            <input
              type="number"
              placeholder="Capacity"
              value={newStation.capacity}
              onChange={(e) => setNewStation({ ...newStation, capacity: Number(e.target.value) })}
              className="bg-gray-800 border border-gray-700 text-xs text-white rounded-lg px-3 py-2 outline-none focus:border-violet-500"
            />
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={newStation.is_interchange}
                onChange={(e) => setNewStation({ ...newStation, is_interchange: e.target.checked })}
                className="accent-violet-500"
              />
              Interchange Station
            </label>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center justify-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 cursor-pointer"
            >
              <Check size={14} />
              <span>{saving ? "Saving..." : "Save Station"}</span>
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-900/80 text-gray-400">
            <tr>
              <th className="px-3 py-2 rounded-tl-lg">#</th>
              <th className="px-3 py-2">Station Name</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Line</th>
              <th className="px-3 py-2">Ridership Count</th>
              <th className="px-3 py-2">Capacity</th>
              <th className="px-3 py-2 text-center">Interchange</th>
              <th className="px-3 py-2 text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.map((st) => {
              const { count: ridership, level: congestionLevel } = getStationRidership(st);
              const isSelected = selectedStation === st.name;
              return (
                <tr
                  key={st.id}
                  onClick={() => onStationChange(st.name)}
                  className={`transition-colors cursor-pointer ${
                    isSelected ? "bg-violet-950/40 border-l-2 border-violet-500" : "hover:bg-gray-800/30"
                  }`}
                >
                  <td className="px-3 py-2.5 text-gray-500">{st.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-gray-200 font-semibold flex items-center gap-1.5">
                      <span>{st.name}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400">{st.location}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        !st.line || st.line === "Unknown"
                          ? "bg-gray-700/50 text-gray-400"
                          : st.line.includes("/")
                          ? "bg-violet-500/20 text-violet-300"
                          : st.line === "Purple"
                          ? "bg-purple-500/20 text-purple-400"
                          : st.line === "Green"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {st.line || "Unknown"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-violet-400 shrink-0" />
                      <span className="font-bold text-gray-100">
                        {ridership.toLocaleString()}
                      </span>
                    </div>
                    {congestionLevel && (
                      <span
                        className={`inline-block mt-0.5 px-1.5 py-0.2 text-[9px] font-semibold rounded border ${
                          congestionLevel.toLowerCase() === "critical"
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : congestionLevel.toLowerCase() === "high"
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                            : congestionLevel.toLowerCase() === "medium"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {congestionLevel}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-gray-300">{st.capacity.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-center">
                    {st.is_interchange ? (
                      <span className="text-violet-400 text-[10px] font-bold bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                        YES
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      className="text-gray-400 hover:text-red-400 p-1 transition-colors cursor-pointer"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(st.id, st.name);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  {stations.length === 0
                    ? "No station records in database. Run the seed script or add stations manually."
                    : "No stations match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
