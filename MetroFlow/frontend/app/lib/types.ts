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
}

export interface CrowdDistributionItem {
  name: string;
  value: number;
  color: string;
}
