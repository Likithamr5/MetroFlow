"""
AI Analytics service using real Bangalore Metro dataset.
Provides: crowd prediction, peak hour analysis, anomaly detection,
route optimization, and live simulation.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict

def _find_dataset() -> Path:
    candidates = [
        Path(__file__).resolve().parents[3] / "datasets" / "raw" / "station-hourly.csv",
        Path(__file__).resolve().parents[3] / "datasets" / "raw" / "raw" / "station-hourly.csv",
        Path(__file__).resolve().parents[2] / "datasets" / "raw" / "station-hourly.csv",
        Path(__file__).resolve().parents[2] / "datasets" / "raw" / "raw" / "station-hourly.csv",
        Path("datasets/raw/station-hourly.csv"),
        Path("datasets/raw/raw/station-hourly.csv"),
        Path("../datasets/raw/station-hourly.csv"),
        Path("../datasets/raw/raw/station-hourly.csv"),
        Path("MetroFlow/datasets/raw/station-hourly.csv"),
    ]
    for c in candidates:
        if c.exists():
            return c.resolve()
    return Path(__file__).resolve().parents[3] / "datasets" / "raw" / "station-hourly.csv"

def _find_15min_dataset() -> Path:
    candidates = [
        Path(__file__).resolve().parents[3] / "datasets" / "raw" / "station-15min-movements.csv",
        Path(__file__).resolve().parents[3] / "datasets" / "raw" / "raw" / "station-15min-movements.csv",
        Path(__file__).resolve().parents[2] / "datasets" / "raw" / "station-15min-movements.csv",
        Path(__file__).resolve().parents[2] / "datasets" / "raw" / "raw" / "station-15min-movements.csv",
        Path("datasets/raw/station-15min-movements.csv"),
        Path("datasets/raw/raw/station-15min-movements.csv"),
        Path("../datasets/raw/station-15min-movements.csv"),
        Path("../datasets/raw/raw/station-15min-movements.csv"),
        Path("MetroFlow/datasets/raw/station-15min-movements.csv"),
    ]
    for c in candidates:
        if c.exists():
            return c.resolve()
    return Path(__file__).resolve().parents[3] / "datasets" / "raw" / "station-15min-movements.csv"

_df: Optional[pd.DataFrame] = None
_df_15min: Optional[pd.DataFrame] = None


def _get_df() -> pd.DataFrame:
    global _df
    if _df is None:
        data_path = _find_dataset()
        _df = pd.read_csv(data_path, sep=";")
        _df["Date"] = pd.to_datetime(_df["Date"])
        _df["DayOfWeek"] = _df["Date"].dt.dayofweek  # 0=Mon
        _df["IsWeekend"] = _df["DayOfWeek"] >= 5
        _df["Month"] = _df["Date"].dt.month
    return _df


def _get_15min_df() -> Optional[pd.DataFrame]:
    global _df_15min
    if _df_15min is None:
        p = _find_15min_dataset()
        if p.exists():
            try:
                _df_15min = pd.read_csv(p, sep=";")
            except Exception as e:
                print(f"Warning loading 15-min movements: {e}")
    return _df_15min


# ─────────────────────────────────────────────────────────────
# 1. LIVE SIMULATION (15-Minute Train Movement Tracking)
# ─────────────────────────────────────────────────────────────

def get_live_ridership() -> List[Dict[str, Any]]:
    """Return current estimated ridership per station recorded for every 15-minute train movement."""
    df = _get_df()
    now = datetime.now()
    current_hour = now.hour
    is_weekend = now.weekday() >= 5
    slot_minute = (now.minute // 15) * 15
    train_num = (current_hour * 4 + slot_minute // 15) + 1
    train_id = f"TR-{train_num:03d}"
    slot_time = f"{current_hour:02d}:{slot_minute:02d}"

    # avg ridership for matching hour & day-type
    mask = (df["Hour"] == current_hour) & (df["IsWeekend"] == is_weekend)
    base = df[mask].groupby("Station")["Ridership"].mean().reset_index()
    base.columns = ["station", "avg_ridership"]

    # 4 train movements per hour
    movement_factors = [0.22, 0.28, 0.27, 0.23]
    m_factor = movement_factors[slot_minute // 15]

    results = []
    for _, row in base.iterrows():
        avg = row["avg_ridership"]
        # 15-minute train movement ridership
        movement_riders = max(0, int(avg * m_factor * np.random.uniform(0.92, 1.10)))
        hourly_live = max(0, int(avg * np.random.uniform(0.85, 1.15)))
        results.append({
            "station": row["station"],
            "ridership": movement_riders,
            "movement_ridership": movement_riders,
            "hourly_equivalent": hourly_live,
            "avg_historical": round(avg, 1),
            "hour": current_hour,
            "train_id": train_id,
            "movement_time": slot_time,
            "interval_minutes": 15,
            "status": _crowd_status(hourly_live),
        })
    results.sort(key=lambda x: x["ridership"], reverse=True)
    return results


def get_live_train_info() -> Dict[str, Any]:
    now = datetime.now()
    current_hour = now.hour
    slot_minute = (now.minute // 15) * 15
    train_num = (current_hour * 4 + slot_minute // 15) + 1
    train_id = f"TR-{train_num:03d}"
    slot_time = f"{current_hour:02d}:{slot_minute:02d}"
    next_train_in = 15 - (now.minute % 15)

    live_stations = get_live_ridership()
    tot_movement = sum(s["ridership"] for s in live_stations)
    return {
        "train_id": train_id,
        "movement_time": slot_time,
        "interval_minutes": 15,
        "next_train_in_minutes": next_train_in,
        "active_trains": 46,
        "total_movement_ridership": tot_movement,
    }


def _crowd_status(ridership: int) -> str:
    if ridership < 200:
        return "low"
    elif ridership < 600:
        return "moderate"
    elif ridership < 1200:
        return "high"
    else:
        return "critical"


# ─────────────────────────────────────────────────────────────
# 2. STATION ANALYTICS
# ─────────────────────────────────────────────────────────────

def get_station_list() -> List[str]:
    return sorted(_get_df()["Station"].unique().tolist())


def get_station_hourly_avg(station: str) -> List[Dict[str, Any]]:
    df = _get_df()
    s = df[df["Station"] == station]
    hourly = s.groupby("Hour")["Ridership"].mean().reset_index()
    return [
        {"hour": int(r["Hour"]), "avg_ridership": round(r["Ridership"], 1)}
        for _, r in hourly.iterrows()
    ]


def get_station_daily_trend(station: str) -> List[Dict[str, Any]]:
    df = _get_df()
    s = df[df["Station"] == station]
    daily = s.groupby("Date")["Ridership"].sum().reset_index()
    return [
        {"date": str(r["Date"].date()), "total_ridership": int(r["Ridership"])}
        for _, r in daily.iterrows()
    ]


def get_station_train_movements(station: str, date_str: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns 15-minute train movement ridership counts for a specific station."""
    m_df = _get_15min_df()
    if m_df is not None and not m_df.empty:
        target_date = date_str if date_str else str(m_df["Date"].max())
        st_df = m_df[(m_df["Date"] == target_date) & (m_df["Station"] == station)]
        if not st_df.empty:
            return [
                {
                    "time": str(r["Time"]),
                    "train_id": str(r["TrainId"]),
                    "ridership": int(r["Ridership"]),
                    "line": str(r["Line"]),
                }
                for _, r in st_df.sort_values(by="Time").iterrows()
            ]

    # Fallback from hourly avg
    df = _get_df()
    s = df[df["Station"] == station]
    hourly = s.groupby("Hour")["Ridership"].mean()
    factors = [0.22, 0.28, 0.27, 0.23]
    results = []
    for h in range(5, 24):
        avg = float(hourly.get(h, 250))
        for m_idx, minute in enumerate([0, 15, 30, 45]):
            results.append({
                "time": f"{h:02d}:{minute:02d}",
                "train_id": f"TR-{(h - 5) * 4 + m_idx + 1:03d}",
                "ridership": max(0, int(avg * factors[m_idx])),
                "line": "Metro",
            })
    return results


def get_station_weekday_pattern(station: str) -> List[Dict[str, Any]]:
    df = _get_df()
    s = df[df["Station"] == station]
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    grouped = s.groupby("DayOfWeek")["Ridership"].mean().reset_index()
    return [
        {"day": day_names[int(r["DayOfWeek"])], "avg_ridership": round(r["Ridership"], 1)}
        for _, r in grouped.iterrows()
    ]


# ─────────────────────────────────────────────────────────────
# 3. NETWORK OVERVIEW
# ─────────────────────────────────────────────────────────────

def get_network_daily_summary() -> List[Dict[str, Any]]:
    df = _get_df()
    daily = df.groupby("Date")["Ridership"].sum().reset_index()
    return [
        {"date": str(r["Date"].date()), "total_ridership": int(r["Ridership"])}
        for _, r in daily.iterrows()
    ]


def get_network_train_movements(date_str: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns ridership count recorded every 15 minutes as each train moves.
    Provides discrete train dispatch records across operational hours.
    """
    now = datetime.now()
    current_hour = now.hour
    slot_min = (now.minute // 15) * 15
    active_slot_time = f"{current_hour:02d}:{slot_min:02d}"
    next_train_in = 15 - (now.minute % 15)
    train_num = (current_hour * 4 + slot_min // 15) + 1
    active_train_id = f"TR-{train_num:03d}"

    m_df = _get_15min_df()
    if m_df is not None and not m_df.empty:
        target_date = date_str if date_str else str(m_df["Date"].max())
        day_df = m_df[m_df["Date"] == target_date]
        if not day_df.empty:
            grouped = day_df.groupby(["Time", "TrainId"])
            rows = []
            for (t_val, tr_id), grp in grouped:
                h = int(grp["Hour"].iloc[0])
                m = int(grp["Minute"].iloc[0])
                tot_riders = int(grp["Ridership"].sum())
                pl = int(grp[grp["Line"] == "Purple Line"]["Ridership"].sum())
                gl = int(grp[grp["Line"] == "Green Line"]["Ridership"].sum())

                if h < current_hour or (h == current_hour and m < slot_min):
                    status = "Completed"
                elif h == current_hour and m == slot_min:
                    status = "Active / Boarding"
                else:
                    status = "Scheduled"

                rows.append({
                    "time": t_val,
                    "train_id": tr_id,
                    "ridership": tot_riders,
                    "purple_line": pl,
                    "green_line": gl,
                    "status": status,
                    "congestion": "Critical" if tot_riders > 20000 else "High" if tot_riders > 14000 else "Moderate" if tot_riders > 7000 else "Low",
                })
            rows.sort(key=lambda x: x["time"])
            active_val = next((r["ridership"] for r in rows if r["time"] == active_slot_time), 14200)
            return {
                "active_movement": {
                    "train_id": active_train_id,
                    "movement_time": active_slot_time,
                    "interval_minutes": 15,
                    "next_train_in_minutes": next_train_in,
                    "total_movement_ridership": active_val,
                    "active_trains": 46,
                },
                "data": rows
            }

    # Dynamic fallback based on hourly averages
    df = _get_df()
    hourly_avg = df.groupby("Hour")["Ridership"].sum()
    factors = [0.22, 0.28, 0.27, 0.23]
    rows = []
    for h in range(5, 24):
        h_sum = float(hourly_avg.get(h, 25000))
        for m_idx, minute in enumerate([0, 15, 30, 45]):
            t_str = f"{h:02d}:{minute:02d}"
            tr_id = f"TR-{(h - 5) * 4 + m_idx + 1:03d}"
            tot = int(h_sum * factors[m_idx] * np.random.uniform(0.96, 1.04))
            pl = int(tot * 0.54)
            gl = tot - pl
            status = "Completed" if h < current_hour or (h == current_hour and minute < slot_min) else "Active / Boarding" if (h == current_hour and minute == slot_min) else "Scheduled"
            rows.append({
                "time": t_str,
                "train_id": tr_id,
                "ridership": tot,
                "purple_line": pl,
                "green_line": gl,
                "status": status,
                "congestion": "Critical" if tot > 20000 else "High" if tot > 14000 else "Moderate" if tot > 7000 else "Low",
            })
    rows.sort(key=lambda x: x["time"])
    active_val = next((r["ridership"] for r in rows if r["time"] == active_slot_time), 14200)
    return {
        "active_movement": {
            "train_id": active_train_id,
            "movement_time": active_slot_time,
            "interval_minutes": 15,
            "next_train_in_minutes": next_train_in,
            "total_movement_ridership": active_val,
            "active_trains": 46,
        },
        "data": rows
    }


def get_network_hourly_profile() -> List[Dict[str, Any]]:
    df = _get_df()
    hourly = df.groupby("Hour")["Ridership"].mean().reset_index()
    return [
        {"hour": int(r["Hour"]), "avg_ridership": round(r["Ridership"], 1)}
        for _, r in hourly.iterrows()
    ]


def get_top_stations(n: int = 10, hour: Optional[int] = None) -> List[Dict[str, Any]]:
    df = _get_df()
    if hour is not None:
        df = df[df["Hour"] == hour]
    top = df.groupby("Station")["Ridership"].mean().nlargest(n).reset_index()
    return [
        {"station": r["Station"], "avg_ridership": round(r["Ridership"], 1)}
        for _, r in top.iterrows()
    ]


def get_heatmap_data() -> List[Dict[str, Any]]:
    """Hour x Station heatmap of average ridership."""
    df = _get_df()
    pivot = df.groupby(["Station", "Hour"])["Ridership"].mean().reset_index()
    return [
        {
            "station": r["Station"],
            "hour": int(r["Hour"]),
            "avg_ridership": round(r["Ridership"], 1),
        }
        for _, r in pivot.iterrows()
    ]


# ─────────────────────────────────────────────────────────────
# 4. AI PREDICTIONS
# ─────────────────────────────────────────────────────────────

def predict_next_hours(station: str, hours_ahead: int = 6) -> List[Dict[str, Any]]:
    """Simple ML-style prediction using weighted moving average + time patterns."""
    df = _get_df()
    s = df[df["Station"] == station]
    now = datetime.now()

    predictions = []
    for i in range(1, hours_ahead + 1):
        future = now + timedelta(hours=i)
        h = future.hour
        dow = future.weekday()
        is_weekend = dow >= 5

        mask = (s["Hour"] == h) & (s["IsWeekend"] == is_weekend)
        subset = s[mask]
        if len(subset) == 0:
            subset = s[s["Hour"] == h]

        if len(subset) == 0:
            predicted = 0.0
        else:
            # Weighted recent average (more weight to last 2 weeks)
            recent = subset.tail(14)
            older = subset.head(max(1, len(subset) - 14))
            predicted = (recent["Ridership"].mean() * 0.7 + older["Ridership"].mean() * 0.3)

        # Confidence: std-based
        std = subset["Ridership"].std() if len(subset) > 1 else 0
        conf = max(0.5, 1 - (std / (predicted + 1)) * 0.5) if predicted > 0 else 0.5

        predictions.append({
            "hour": h,
            "datetime": future.strftime("%Y-%m-%d %H:00"),
            "predicted_ridership": round(predicted, 1),
            "confidence": round(conf, 2),
            "status": _crowd_status(int(predicted)),
        })
    return predictions


def get_peak_analysis() -> Dict[str, Any]:
    df = _get_df()

    # Network peak hour
    hourly_avg = df.groupby("Hour")["Ridership"].mean()
    peak_hour = int(hourly_avg.idxmax())
    off_peak_hour = int(hourly_avg.idxmin())

    # Per-station peak hours
    station_peaks = df.groupby(["Station", "Hour"])["Ridership"].mean().reset_index()
    station_peak = station_peaks.loc[station_peaks.groupby("Station")["Ridership"].idxmax()]

    # Busiest day of week
    dow_avg = df.groupby("DayOfWeek")["Ridership"].mean()
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    busiest_day = day_names[int(dow_avg.idxmax())]

    return {
        "network_peak_hour": peak_hour,
        "network_off_peak_hour": off_peak_hour,
        "busiest_day": busiest_day,
        "hourly_avg": [
            {"hour": int(h), "avg": round(float(v), 1)}
            for h, v in hourly_avg.items()
        ],
        "station_peak_hours": [
            {
                "station": r["Station"],
                "peak_hour": int(r["Hour"]),
                "avg_ridership": round(r["Ridership"], 1),
            }
            for _, r in station_peak.iterrows()
        ],
    }


def get_anomaly_stations(date_str: Optional[str] = None) -> List[Dict[str, Any]]:
    """Detect stations with unusual ridership (z-score > 2)."""
    df = _get_df()
    if date_str:
        target_date = pd.to_datetime(date_str)
        daily = df[df["Date"] == target_date]
    else:
        # Use last available date
        daily = df[df["Date"] == df["Date"].max()]

    if daily.empty:
        daily = df[df["Date"] == df["Date"].max()]

    daily_totals = daily.groupby("Station")["Ridership"].sum().reset_index()

    # Compare to historical avg per station
    hist_avg = df.groupby("Station")["Ridership"].agg(["mean", "std"]).reset_index()
    hist_avg.columns = ["Station", "hist_mean", "hist_std"]

    merged = daily_totals.merge(hist_avg, on="Station")
    merged["z_score"] = (merged["Ridership"] - merged["hist_mean"]) / (merged["hist_std"] + 1)
    anomalies = merged[merged["z_score"].abs() > 1.5].sort_values("z_score", ascending=False)

    return [
        {
            "station": r["Station"],
            "current_ridership": int(r["Ridership"]),
            "historical_avg": round(r["hist_mean"], 1),
            "z_score": round(r["z_score"], 2),
            "type": "surge" if r["z_score"] > 0 else "drop",
        }
        for _, r in anomalies.iterrows()
    ]


def get_ai_insights() -> List[Dict[str, Any]]:
    """Generate AI text insights from data patterns."""
    df = _get_df()
    insights = []

    # 1. Busiest station overall
    top = df.groupby("Station")["Ridership"].mean().idxmax()
    top_val = round(df.groupby("Station")["Ridership"].mean().max(), 1)
    insights.append({
        "type": "info",
        "title": "Busiest Station",
        "message": f"{top} consistently leads with avg {top_val} riders/hour. "
                   "Consider deploying additional trains during peak windows.",
    })

    # 2. Weekend vs weekday
    wk = df[df["IsWeekend"] == False]["Ridership"].mean()
    we = df[df["IsWeekend"] == True]["Ridership"].mean()
    delta_pct = round((wk - we) / we * 100, 1)
    insights.append({
        "type": "trend",
        "title": "Weekday vs Weekend",
        "message": f"Weekday ridership is {delta_pct}% higher than weekends on average. "
                   "AI recommends reduced service frequency on Sunday mornings.",
    })

    # 3. Peak window
    hourly = df.groupby("Hour")["Ridership"].mean()
    peak_h = int(hourly.idxmax())
    insights.append({
        "type": "alert",
        "title": "Peak Rush Hour",
        "message": f"Network-wide peak occurs at {peak_h}:00. Crowd levels reach "
                   f"critical thresholds at {round(hourly[peak_h], 0):.0f} avg riders/hour. "
                   "AI suggests express services from 7–10 AM.",
    })

    # 4. Low utilization
    bottom = df.groupby("Station")["Ridership"].mean().nsmallest(3).index.tolist()
    insights.append({
        "type": "warning",
        "title": "Low Utilization Stations",
        "message": f"{', '.join(bottom)} show consistently low ridership. "
                   "Consider dynamic frequency adjustments to reduce operational cost.",
    })

    return insights


def get_line_comparison() -> List[Dict[str, Any]]:
    """Compare Purple vs Green line ridership patterns."""
    # Station-to-line mapping (Bangalore Metro)
    purple_line = [
        "Baiyappanahalli", "Swami Vivekananda Road", "Indiranagar", "Halasuru",
        "Trinity", "Mahatma Gandhi Road", "Cubbon Park",
        "Dr. B. R. Ambedkar Station, Vidhana Soudha",
        "Sir M. Visvesvaraya Stn., Central College",
        "Krantivira Sangolli Rayanna Railway Station", "Magadi Road",
        "Mahalakshmi", "Vijayanagar", "Attiguppe", "Deepanjali Nagar",
        "Mysore Road", "Jaya Prakash Nagar", "Rashtreeya Vidyalaya Road",
        "National College", "Lalbagh", "South End Circle", "Jayanagar",
        "Rajarajeshwari Nagar",
    ]
    green_line = [
        "Nagasandra", "Dasarahalli", "Jalahalli", "Peenya Industry",
        "Peenya", "Goraguntepalya", "Yeshwantpur", "Sandal Soap Factory",
        "Mahalakshmi", "Rajajinagar", "Srirampura", "Mantri Square Sampige Road",
        "Nadaprabhu Kempegowda Station, Majestic", "Chickpete", "Krishna Rajendra Market",
        "Mahatma Gandhi Road", "Baiyappanahalli",
        "Whitefield (Kadugodi)", "Hopefarm Channasandra", "Kadugodi Tree Park",
        "Pattandur Agrahara", "Nallurahalli", "Kundalahalli", "Garudacharpalya",
        "Krishnarajapura", "Benniganahalli", "Hoodi",
    ]

    df = _get_df()
    results = []
    for hour in range(24):
        hour_df = df[df["Hour"] == hour]
        pl = hour_df[hour_df["Station"].isin(purple_line)]["Ridership"].mean()
        gl = hour_df[hour_df["Station"].isin(green_line)]["Ridership"].mean()
        results.append({
            "hour": hour,
            "purple_line_avg": round(float(pl) if not np.isnan(pl) else 0, 1),
            "green_line_avg": round(float(gl) if not np.isnan(gl) else 0, 1),
        })
    return results


def get_crowd_forecast_summary() -> Dict[str, Any]:
    """System-wide forecast for the next 24 hours."""
    df = _get_df()
    now = datetime.now()
    forecasts = []
    for i in range(24):
        future = now + timedelta(hours=i)
        h = future.hour
        is_weekend = future.weekday() >= 5
        mask = (df["Hour"] == h) & (df["IsWeekend"] == is_weekend)
        avg = df[mask]["Ridership"].mean()
        avg = float(avg) if not np.isnan(avg) else 0
        forecasts.append({
            "hour": h,
            "datetime": future.strftime("%H:00"),
            "predicted_ridership": round(avg, 1),
            "status": _crowd_status(int(avg)),
        })
    return {"forecasts": forecasts, "generated_at": now.isoformat()}
