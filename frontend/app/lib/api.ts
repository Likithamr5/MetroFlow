import {
  ActiveTrainMovement,
  Anomaly,
  Insight,
  PeakAnalysisData,
  StationFootfallForecastResponse,
  TrainMovementPoint,
} from "./types";

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
  });
  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || `API error: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

export interface PredictionPayload {
  station: string;
  hour: number;
  day_of_week: number;
  current_ridership: number;
}

export interface PredictionResult {
  station: string;
  line?: string;
  is_interchange?: boolean;
  is_terminal?: boolean;
  corridor?: string;
  capacity?: number;
  capacity_utilization_pct?: number;
  hour: number;
  current_ridership: number;
  predicted_next_hour_ridership: number;
  crowd_level: string;
  recommendation: string;
  headway_directive?: string;
  platform_action?: string;
  passenger_advisory?: string;
}

export interface AnalyticsSummary {
  total_ridership: number;
  total_stations: number;
  busiest_station: string;
  peak_hour: number;
}

export interface WeatherSummary {
  average_temperature: number;
  average_humidity: number;
  total_rainfall: number;
  average_wind_speed: number;
}

export interface StationCongestionItem {
  station: string;
  ridership: number;
  congestion_level: string;
}

export interface CongestionResponse {
  date: string;
  hour: number;
  time_slot?: string;
  train_movement_id?: string;
  interval_minutes?: number;
  next_train_in_minutes?: number;
  total_stations: number;
  stations: StationCongestionItem[];
}

export interface StationCreate {
  name: string;
  location: string;
  line?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  capacity: number;
  ridership?: number | null;
  is_interchange: boolean;
}

export interface StationResponse extends StationCreate {
  id: number;
  line: string | null;
  latitude: number | null;
  longitude: number | null;
  ridership?: number | null;
}

export interface StationUpdate {
  name?: string;
  location?: string;
  line?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  capacity?: number;
  ridership?: number | null;
  is_interchange?: boolean;
}

export interface StationHourlyResponse {
  station: string;
  data: Array<{ hour: number; avg_ridership: number }>;
}

export interface StationDailyResponse {
  station: string;
  data: Array<{ date: string; total_ridership: number }>;
}

export interface StationWeekdayResponse {
  station: string;
  data: Array<{ day: string; avg_ridership: number }>;
}

export interface StationPredictionResponse {
  station: string;
  predictions: Array<{
    hour: number;
    datetime: string;
    predicted_ridership: number;
    confidence: number;
    status: "low" | "moderate" | "high" | "critical";
  }>;
}

export interface LiveResponse {
  active_movement?: ActiveTrainMovement;
  data: Array<{
    station: string;
    ridership: number;
    movement_ridership?: number;
    hourly_equivalent?: number;
    avg_historical: number;
    hour: number;
    train_id?: string;
    movement_time?: string;
    interval_minutes?: number;
    status: "low" | "moderate" | "high" | "critical";
  }>;
}

export interface TrainMovementsResponse {
  active_movement: ActiveTrainMovement;
  data: TrainMovementPoint[];
}

export interface NetworkDataResponse {
  data: Array<{
    date: string;
    total_ridership: number;
  }>;
}

export interface NetworkHourlyResponse {
  data: Array<{
    hour: number;
    avg_ridership: number;
  }>;
}

export interface TopStationsResponse {
  data: Array<{
    station: string;
    avg_ridership: number;
  }>;
}

export interface HeatmapResponse {
  data: Array<{
    station: string;
    hour: number;
    avg_ridership: number;
  }>;
}

export interface LineComparisonResponse {
  data: Array<{
    hour: number;
    purple_line_avg: number;
    green_line_avg: number;
  }>;
}

export interface ForecastResponse {
  forecasts: Array<{
    hour: number;
    datetime: string;
    predicted_ridership: number;
    status: "low" | "moderate" | "high" | "critical";
  }>;
  generated_at: string;
}

export const api = {
  // Summary KPIs & Environment
  getAnalyticsSummary: (): Promise<AnalyticsSummary> => fetchAPI<AnalyticsSummary>("/analytics"),
  getWeatherSummary: (): Promise<WeatherSummary> => fetchAPI<WeatherSummary>("/weather-summary"),

  // ML Next-Hour Prediction
  predictDemand: (data: PredictionPayload): Promise<PredictionResult> =>
    fetchAPI<PredictionResult>("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // Congestion Matrix
  getStationCongestion: (hour?: number, date?: string): Promise<CongestionResponse> => {
    const params = new URLSearchParams();
    if (hour !== undefined) params.append("hour", hour.toString());
    if (date) params.append("date", date);
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchAPI<CongestionResponse>(`/stations/congestion${query}`);
  },

  // Live Simulation
  getLive: (): Promise<LiveResponse> => fetchAPI<LiveResponse>("/analytics/live"),

  // Station Level
  getStations: async (): Promise<string[]> => {
    const response = await fetchAPI<{ stations: string[] }>("/analytics/stations/list");
    return response.stations;
  },
  getStationHourly: (s: string): Promise<StationHourlyResponse> =>
    fetchAPI<StationHourlyResponse>(`/analytics/stations/${encodeURIComponent(s)}/hourly`),
  getStationDaily: (s: string): Promise<StationDailyResponse> =>
    fetchAPI<StationDailyResponse>(`/analytics/stations/${encodeURIComponent(s)}/daily`),
  getStationMovements: (s: string, date?: string): Promise<{ station: string; data: TrainMovementPoint[] }> =>
    fetchAPI<{ station: string; data: TrainMovementPoint[] }>(`/analytics/stations/${encodeURIComponent(s)}/movements${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  getStationWeekday: (s: string): Promise<StationWeekdayResponse> =>
    fetchAPI<StationWeekdayResponse>(`/analytics/stations/${encodeURIComponent(s)}/weekday`),
  getStationPredict: (s: string, hours = 6): Promise<StationPredictionResponse> =>
    fetchAPI<StationPredictionResponse>(`/analytics/stations/${encodeURIComponent(s)}/predict?hours=${hours}`),

  // Network Analytics
  getTrainMovements: (date?: string): Promise<TrainMovementsResponse> =>
    fetchAPI<TrainMovementsResponse>(`/analytics/network/movements${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  getNetworkDaily: (): Promise<NetworkDataResponse> => fetchAPI<NetworkDataResponse>("/analytics/network/daily"),
  getNetworkHourly: (): Promise<NetworkHourlyResponse> => fetchAPI<NetworkHourlyResponse>("/analytics/network/hourly"),
  getTopStations: (n = 10, hour?: number): Promise<TopStationsResponse> =>
    fetchAPI<TopStationsResponse>(`/analytics/network/top-stations?n=${n}${hour !== undefined ? `&hour=${hour}` : ""}`),
  getHeatmap: (): Promise<HeatmapResponse> => fetchAPI<HeatmapResponse>("/analytics/network/heatmap"),
  getLineComparison: (): Promise<LineComparisonResponse> => fetchAPI<LineComparisonResponse>("/analytics/network/line-comparison"),

  // AI Intelligence
  getPeakAnalysis: (): Promise<PeakAnalysisData> => fetchAPI<PeakAnalysisData>("/analytics/ai/peak-analysis"),
  getAnomalies: (date?: string): Promise<{ anomalies: Anomaly[] }> =>
    fetchAPI<{ anomalies: Anomaly[] }>(`/analytics/ai/anomalies${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  getInsights: (): Promise<{ insights: Insight[] }> => fetchAPI<{ insights: Insight[] }>("/analytics/ai/insights"),
  getForecast: (): Promise<ForecastResponse> => fetchAPI<ForecastResponse>("/analytics/ai/forecast"),

  // Real-time Station Footfall & Forecast
  getStationFootfallForecast: (stationId: string | number): Promise<StationFootfallForecastResponse> =>
    fetchAPI<StationFootfallForecastResponse>(`/stations/${encodeURIComponent(stationId)}/history-forecast`),

  // Database Station CRUD
  getStationsFromDB: (): Promise<StationResponse[]> => fetchAPI<StationResponse[]>("/stations"),
  getStationFromDB: (stationId: number): Promise<StationResponse> =>
    fetchAPI<StationResponse>(`/stations/${stationId}`),
  createStation: (station: StationCreate): Promise<StationResponse> =>
    fetchAPI<StationResponse>("/stations/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(station),
    }),
  updateStation: (stationId: number, station: StationUpdate): Promise<StationResponse> =>
    fetchAPI<StationResponse>(`/stations/${stationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(station),
    }),
  deleteStation: (stationId: number): Promise<void> =>
    fetchAPI<void>(`/stations/${stationId}`, { method: "DELETE" }),
};
