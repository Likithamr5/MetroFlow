export interface StationRidershipPoint {
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
}

export interface TrainMovementPoint {
  time: string;
  train_id: string;
  ridership: number;
  purple_line?: number;
  green_line?: number;
  status?: string;
  congestion?: string;
}

export interface ActiveTrainMovement {
  train_id: string;
  movement_time: string;
  interval_minutes: number;
  next_train_in_minutes: number;
  total_movement_ridership: number;
  active_trains: number;
}

export interface DailyRidershipPoint {
  date: string;
  total_ridership: number;
}

export interface HourlyRidershipPoint {
  hour: number;
  avg_ridership: number;
}

export interface TopStationPoint {
  station: string;
  avg_ridership: number;
}

export interface LineComparisonPoint {
  hour: number;
  purple_line_avg: number;
  green_line_avg: number;
  yellow_line_avg?: number;
  network_total_avg?: number;
  purple_line_total?: number;
  green_line_total?: number;
  yellow_line_total?: number;
  network_hourly_total?: number;
  congestion_status?: string;
}

export interface ForecastPoint {
  hour: number;
  datetime: string;
  predicted_ridership: number;
  status: "low" | "moderate" | "high" | "critical";
}

export interface PeakAnalysisData {
  network_peak_hour: number;
  network_off_peak_hour: number;
  busiest_day: string;
  hourly_avg: HourlyRidershipPoint[];
  station_peak_hours: Array<{
    station: string;
    peak_hour: number;
    avg_ridership: number;
  }>;
}

export interface Insight {
  type: string;
  title: string;
  message: string;
}

export interface Anomaly {
  station: string;
  current_ridership: number;
  historical_avg: number;
  z_score: number;
  type: "surge" | "drop";
  severity?: "Critical" | "High" | "Moderate" | "Low";
  confidence?: string;
  recommendation?: string;
}

export interface CrowdDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface PlatformDetail {
  platform_id: number;
  name: string;
  direction: string;
  line: string;
  crowd_percentage: number;
  status: "Low" | "Moderate" | "High" | "Critical";
  waiting_passengers: number;
}

export interface NextTrainArrival {
  train_id: string;
  platform: number;
  platform_name: string;
  line: string;
  destination: string;
  eta_minutes: number;
  occupancy_percentage: number;
  status: string;
}

export interface LiveStationAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  type: string;
  title: string;
  message: string;
  timestamp: string;
}

export interface LiveStationSnapshot {
  station_id: number | string;
  station_name: string;
  location?: string;
  line?: string;
  is_interchange?: boolean;
  capacity?: number;
  crowd_percentage: number;
  entries_last_15m: number;
  exits_last_15m: number;
  net_flow_15m: number;
  avg_wait_minutes: number;
  status: "low" | "moderate" | "high" | "critical";
  platforms: PlatformDetail[];
  next_trains: NextTrainArrival[];
  alerts: LiveStationAlert[];
  timestamp: string;
  time_display: string;
}

export interface FootfallHistoryPoint {
  hour: number;
  time: string;
  ridership: number;
  entries: number;
  exits: number;
  is_forecast: boolean;
}

export interface FootfallForecastPoint {
  hour: number;
  time: string;
  predicted_ridership: number;
  entries: number;
  exits: number;
  confidence: number;
  status: "low" | "moderate" | "high" | "critical";
  is_forecast: boolean;
}

export interface CombinedFootfallPoint {
  hour: number;
  time: string;
  actual?: number | null;
  forecast?: number | null;
  entries: number;
  exits: number;
  confidence?: number;
  is_forecast?: boolean;
}

export interface StationFootfallForecastResponse {
  station_id: number | string;
  station_name: string;
  line: string;
  date: string;
  current_hour: number;
  history: FootfallHistoryPoint[];
  forecast: FootfallForecastPoint[];
  combined_series: CombinedFootfallPoint[];
  summary: {
    total_today_footfall: number;
    total_today_entries: number;
    total_today_exits: number;
    peak_hour_today: string;
    peak_footfall_today: number;
    forecast_peak_hour: string;
    forecast_peak_ridership: number;
  };
}
