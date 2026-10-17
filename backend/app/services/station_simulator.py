"""
Station real-time simulator and analytics service for MetroFlow.
Generates dynamic live streams based on historical DB ridership plus realistic noise,
and provides today's footfall history alongside multi-hour forecasting.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Union
import random
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.station import Station
from app.services.analytics import _get_df, _crowd_status
from app.services.station_lines import classify


# Station destination profiles by metro line
LINE_PLATFORM_CONFIG = {
    "Purple": [
        {"platform_id": 1, "name": "Platform 1", "direction": "Towards Whitefield (Kadugodi)", "line": "Purple Line"},
        {"platform_id": 2, "name": "Platform 2", "direction": "Towards Challaghatta", "line": "Purple Line"},
    ],
    "Green": [
        {"platform_id": 1, "name": "Platform 1", "direction": "Towards Madavara / Nagasandra", "line": "Green Line"},
        {"platform_id": 2, "name": "Platform 2", "direction": "Towards Silk Institute", "line": "Green Line"},
    ],
    "Yellow": [
        {"platform_id": 1, "name": "Platform 1", "direction": "Towards Bommasandra", "line": "Yellow Line"},
        {"platform_id": 2, "name": "Platform 2", "direction": "Towards RV Road", "line": "Yellow Line"},
    ],
    "Purple/Green": [
        {"platform_id": 1, "name": "Platform 1 (Purple Line)", "direction": "Towards Whitefield (Kadugodi)", "line": "Purple Line"},
        {"platform_id": 2, "name": "Platform 2 (Purple Line)", "direction": "Towards Challaghatta", "line": "Purple Line"},
        {"platform_id": 3, "name": "Platform 3 (Green Line)", "direction": "Towards Madavara / Nagasandra", "line": "Green Line"},
        {"platform_id": 4, "name": "Platform 4 (Green Line)", "direction": "Towards Silk Institute", "line": "Green Line"},
    ],
    "Green/Yellow": [
        {"platform_id": 1, "name": "Platform 1 (Green Line)", "direction": "Towards Madavara / Nagasandra", "line": "Green Line"},
        {"platform_id": 2, "name": "Platform 2 (Green Line)", "direction": "Towards Silk Institute", "line": "Green Line"},
        {"platform_id": 3, "name": "Platform 3 (Yellow Line)", "direction": "Towards Bommasandra", "line": "Yellow Line"},
    ],
}

DEFAULT_PLATFORMS = [
    {"platform_id": 1, "name": "Platform 1", "direction": "Eastbound / Northbound", "line": "Metro Line 1"},
    {"platform_id": 2, "name": "Platform 2", "direction": "Westbound / Southbound", "line": "Metro Line 2"},
]


def resolve_station(station_id_or_name: Union[str, int], db: Optional[Session] = None) -> Dict[str, Any]:
    """
    Resolve station metadata from database by ID or name, with fallback to dataset.
    """
    station_record = None
    query_str = str(station_id_or_name).strip()

    if db is not None:
        try:
            if query_str.isdigit():
                station_record = db.query(Station).filter(Station.id == int(query_str)).first()
                if station_record and station_record.name.lower() in ("string", "demo station"):
                    station_record = None
            if not station_record:
                station_record = db.query(Station).filter(func.lower(Station.name) == query_str.lower()).first()
            if not station_record:
                station_record = db.query(Station).filter(Station.name.ilike(f"%{query_str}%")).first()
        except Exception as e:
            print(f"Station resolution DB error: {e}")

    if station_record:
        line, is_interchange = classify(station_record.name)
        return {
            "id": station_record.id,
            "name": station_record.name,
            "location": station_record.location,
            "line": station_record.line or line or "Purple Line",
            "capacity": station_record.capacity or 5000,
            "is_interchange": bool(station_record.is_interchange or is_interchange),
        }

    # Fallback to finding name in historical dataframe
    df = _get_df()
    unique_stations = df["Station"].unique().tolist()
    matched_name = None

    if query_str.isdigit():
        idx = (int(query_str) - 1) % len(unique_stations)
        matched_name = unique_stations[idx]
    else:
        for s in unique_stations:
            if s.lower() == query_str.lower() or query_str.lower() in s.lower():
                matched_name = s
                break

    if not matched_name:
        matched_name = unique_stations[0] if unique_stations else "Nadaprabhu Kempegowda Station, Majestic"

    line, is_interchange = classify(matched_name)
    fake_id = (unique_stations.index(matched_name) + 1) if matched_name in unique_stations else 1

    return {
        "id": fake_id,
        "name": matched_name,
        "location": f"{matched_name}, Bengaluru",
        "line": line or "Purple Line",
        "capacity": 5000,
        "is_interchange": is_interchange,
    }


def get_station_hourly_baseline(station_name: str, hour: int) -> float:
    """Return historical average ridership for a station at a given hour."""
    df = _get_df()
    station_data = df[(df["Station"] == station_name) & (df["Hour"] == hour)]
    if not station_data.empty:
        mean_val = float(station_data["Ridership"].mean())
        if mean_val > 0:
            return mean_val

    # Fallback to general station average or network average for hour
    all_station = df[df["Station"] == station_name]
    if not all_station.empty:
        return max(50.0, float(all_station["Ridership"].mean()))

    network_hour = df[df["Hour"] == hour]
    if not network_hour.empty:
        return max(100.0, float(network_hour["Ridership"].mean()))

    return 350.0


def generate_station_snapshot(
    station_id_or_name: Union[str, int],
    db: Optional[Session] = None
) -> Dict[str, Any]:
    """
    Generate a dynamic real-time snapshot for a station based on historical baseline
    for the current hour plus stochastic realistic simulation noise.
    """
    station = resolve_station(station_id_or_name, db)
    station_name = station["name"]
    now = datetime.now()
    hour = now.hour
    minute = now.minute
    capacity = station.get("capacity", 5000) or 5000

    # 1. Base historical hourly volume
    base_hourly = get_station_hourly_baseline(station_name, hour)

    # Off-peak night adjustment (metro closed or minimal maintenance flow)
    is_operating = 5 <= hour <= 23
    operating_factor = 1.0 if is_operating else 0.05

    # 2. Add realistic stochastic variation
    noise_factor = np.random.uniform(0.92, 1.14)
    simulated_hourly = max(10.0, base_hourly * operating_factor * noise_factor)

    # 15-minute slice volume (roughly 25% of hourly volume with minute intra-slot variation)
    slot_factor = 0.25 * np.random.uniform(0.93, 1.08)
    volume_15m = simulated_hourly * slot_factor

    # Entry vs Exit split (morning has higher entries at residential, evening higher at commercial)
    is_morning_rush = 7 <= hour <= 10
    is_evening_rush = 17 <= hour <= 21
    if is_morning_rush:
        entry_ratio = np.random.uniform(0.55, 0.65)
    elif is_evening_rush:
        entry_ratio = np.random.uniform(0.40, 0.50)
    else:
        entry_ratio = np.random.uniform(0.48, 0.53)

    entries_last_15m = max(5, int(volume_15m * entry_ratio))
    exits_last_15m = max(4, int(volume_15m * (1.0 - entry_ratio)))

    # Active people in station (concourse + platforms)
    dwell_active = int((entries_last_15m + exits_last_15m) * np.random.uniform(0.70, 0.95))
    crowd_fraction = dwell_active / (capacity * 0.40)  # calibrated operational density
    crowd_percentage = round(float(np.clip(crowd_fraction * 100.0, 5.0, 98.5)), 1)

    # Average wait time (mins): base headway plus congestion queueing delay
    base_wait = 2.5 if (is_morning_rush or is_evening_rush) else 4.0
    congestion_delay = max(0.0, (crowd_percentage - 65.0) * 0.08)
    jitter = np.random.uniform(-0.3, 0.4)
    avg_wait = round(float(np.clip(base_wait + congestion_delay + jitter, 1.5, 12.0)), 1)

    # 3. Platform breakdown
    line_name = station.get("line", "Purple")
    platforms_config = []
    if station.get("is_interchange"):
        # Combine Purple and Green
        p1 = LINE_PLATFORM_CONFIG.get("Purple", DEFAULT_PLATFORMS)
        p2 = LINE_PLATFORM_CONFIG.get("Green", DEFAULT_PLATFORMS)
        platforms_config = [
            {"platform_id": 1, "name": "Platform 1", "direction": p1[0]["direction"], "line": "Purple Line"},
            {"platform_id": 2, "name": "Platform 2", "direction": p1[1]["direction"], "line": "Purple Line"},
            {"platform_id": 3, "name": "Platform 3", "direction": p2[0]["direction"], "line": "Green Line"},
            {"platform_id": 4, "name": "Platform 4", "direction": p2[1]["direction"], "line": "Green Line"},
        ]
    elif "green" in line_name.lower():
        platforms_config = LINE_PLATFORM_CONFIG.get("Green", DEFAULT_PLATFORMS)
    else:
        platforms_config = LINE_PLATFORM_CONFIG.get("Purple", DEFAULT_PLATFORMS)

    platform_data = []
    num_platforms = len(platforms_config)
    passengers_per_platform = dwell_active // max(1, num_platforms)

    for p in platforms_config:
        p_noise = np.random.uniform(0.85, 1.15)
        p_crowd = round(float(np.clip(crowd_percentage * p_noise, 4.0, 99.0)), 1)
        p_status = (
            "Critical" if p_crowd >= 85
            else "High" if p_crowd >= 70
            else "Moderate" if p_crowd >= 40
            else "Low"
        )
        p_waiting = max(3, int(passengers_per_platform * p_noise))
        platform_data.append({
            "platform_id": p["platform_id"],
            "name": p["name"],
            "direction": p["direction"],
            "line": p["line"],
            "crowd_percentage": p_crowd,
            "status": p_status,
            "waiting_passengers": p_waiting,
        })

    # 4. Next trains
    next_trains = []
    train_count = 3
    base_train_num = (hour * 4 + minute // 15) + 1
    destinations = [p["direction"].replace("Towards ", "") for p in platforms_config]

    for i in range(train_count):
        t_id = f"TR-{(base_train_num + i) % 120 + 1:03d}"
        target_p = platforms_config[i % len(platforms_config)]
        eta = (i * 4) + max(1, int(4 - (minute % 4)))
        t_status = "Approaching" if eta <= 2 else "Boarding" if eta == 0 else "On Time"
        occ = round(float(np.clip(crowd_percentage * np.random.uniform(0.88, 1.10), 15.0, 95.0)), 0)
        next_trains.append({
            "train_id": t_id,
            "platform": target_p["platform_id"],
            "platform_name": target_p["name"],
            "line": target_p["line"],
            "destination": target_p["direction"].replace("Towards ", ""),
            "eta_minutes": eta,
            "occupancy_percentage": int(occ),
            "status": t_status,
        })

    # 5. Dynamic Alerts
    alerts = []
    if crowd_percentage >= 85.0:
        alerts.append({
            "id": f"alt-crowd-{now.strftime('%H%M%S')}",
            "severity": "critical",
            "type": "OVERCROWDING_HAZARD",
            "title": "Platform Overcrowding Alert",
            "message": f"Passenger density exceeds 85% at {station_name}. Gate flow control & rapid transit marshals deployed.",
            "timestamp": now.strftime("%H:%M:%S"),
        })
    elif crowd_percentage >= 70.0:
        alerts.append({
            "id": f"alt-surge-{now.strftime('%H%M%S')}",
            "severity": "warning",
            "type": "PEAK_COMMUTER_SURGE",
            "title": "Peak Commuter Rush Detected",
            "message": f"High commuter throughput. Train headway synchronized to 3.5 minutes.",
            "timestamp": now.strftime("%H:%M:%S"),
        })

    if avg_wait >= 5.0:
        alerts.append({
            "id": f"alt-wait-{now.strftime('%H%M%S')}",
            "severity": "warning",
            "type": "BOARDING_DELAY",
            "title": "Extended Platform Wait Time",
            "message": f"Average wait time currently {avg_wait} mins due to high platform dwell time.",
            "timestamp": now.strftime("%H:%M:%S"),
        })

    if not alerts:
        alerts.append({
            "id": "alt-info",
            "severity": "info",
            "type": "NORMAL_OPERATIONS",
            "title": "Nominal Timetable Adherence",
            "message": "Automated transit signaling normal. All platforms operating within safety capacity limits.",
            "timestamp": now.strftime("%H:%M:%S"),
        })

    overall_status = (
        "critical" if crowd_percentage >= 85
        else "high" if crowd_percentage >= 70
        else "moderate" if crowd_percentage >= 40
        else "low"
    )

    return {
        "station_id": station["id"],
        "station_name": station_name,
        "location": station.get("location", ""),
        "line": station.get("line", "Purple Line"),
        "is_interchange": station.get("is_interchange", False),
        "capacity": capacity,
        "crowd_percentage": crowd_percentage,
        "entries_last_15m": entries_last_15m,
        "exits_last_15m": exits_last_15m,
        "net_flow_15m": entries_last_15m - exits_last_15m,
        "avg_wait_minutes": avg_wait,
        "status": overall_status,
        "platforms": platform_data,
        "next_trains": next_trains,
        "alerts": alerts,
        "timestamp": now.isoformat(),
        "time_display": now.strftime("%H:%M:%S"),
    }


def get_station_today_history_and_forecast(
    station_id_or_name: Union[str, int],
    db: Optional[Session] = None
) -> Dict[str, Any]:
    """
    Returns today's recorded hourly footfall history from service start (05:00)
    up to the current hour, combined with a 3-hour machine learning / trend forecast.
    """
    station = resolve_station(station_id_or_name, db)
    station_name = station["name"]
    now = datetime.now()
    current_hour = now.hour

    df = _get_df()
    s_df = df[df["Station"] == station_name]
    hourly_means = s_df.groupby("Hour")["Ridership"].mean().to_dict()

    history = []
    forecast = []
    combined = []

    # 1. Historical hourly footfall for today from 05:00 up to current hour
    # (If before 05:00, show up to current hour or at least 05:00-08:00 default)
    start_hour = 5
    effective_hour = max(start_hour, min(23, current_hour))

    for h in range(start_hour, effective_hour + 1):
        base = hourly_means.get(h, 200.0)
        # Add slight intra-day variation to simulate real counted sensors
        noise = 1.0 + (np.sin(h * 0.7) * 0.05)
        ridership = max(10, int(base * noise))
        entries = int(ridership * 0.52)
        exits = int(ridership * 0.48)
        time_label = f"{h:02d}:00"

        point = {
            "hour": h,
            "time": time_label,
            "ridership": ridership,
            "entries": entries,
            "exits": exits,
            "is_forecast": False,
        }
        history.append(point)

        # In combined series, past points have actual value and forecast null
        # (At the current hour, forecast bridges seamlessly from actual)
        combined.append({
            "hour": h,
            "time": time_label,
            "actual": ridership,
            "forecast": ridership if h == effective_hour else None,
            "entries": entries,
            "exits": exits,
            "is_forecast": False,
        })

    # 2. Simple forecast for the next 3 hours
    for step in range(1, 4):
        f_hour = (effective_hour + step) % 24
        base = hourly_means.get(f_hour, 150.0)
        # Forecast trend projection with slight attenuation
        trend_mult = 1.03 if (7 <= f_hour <= 10 or 17 <= f_hour <= 20) else 0.96
        pred_ridership = max(5, int(base * trend_mult))
        pred_entries = int(pred_ridership * 0.51)
        pred_exits = int(pred_ridership * 0.49)
        confidence = round(max(0.75, 0.94 - (step * 0.04)), 2)
        time_label = f"{f_hour:02d}:00"

        f_point = {
            "hour": f_hour,
            "time": time_label,
            "predicted_ridership": pred_ridership,
            "entries": pred_entries,
            "exits": pred_exits,
            "confidence": confidence,
            "status": _crowd_status(pred_ridership),
            "is_forecast": True,
        }
        forecast.append(f_point)

        combined.append({
            "hour": f_hour,
            "time": time_label,
            "actual": None,
            "forecast": pred_ridership,
            "entries": pred_entries,
            "exits": pred_exits,
            "confidence": confidence,
            "is_forecast": True,
        })

    total_today = sum(p["ridership"] for p in history)
    total_entries = sum(p["entries"] for p in history)
    total_exits = sum(p["exits"] for p in history)
    peak_past = max(history, key=lambda x: x["ridership"]) if history else {"time": "18:00", "ridership": 0}
    peak_forecast = max(forecast, key=lambda x: x["predicted_ridership"]) if forecast else {"time": "22:00", "predicted_ridership": 0}

    return {
        "station_id": station["id"],
        "station_name": station_name,
        "line": station.get("line", "Purple Line"),
        "date": now.strftime("%Y-%m-%d"),
        "current_hour": current_hour,
        "history": history,
        "forecast": forecast,
        "combined_series": combined,
        "summary": {
            "total_today_footfall": total_today,
            "total_today_entries": total_entries,
            "total_today_exits": total_exits,
            "peak_hour_today": peak_past["time"],
            "peak_footfall_today": peak_past["ridership"],
            "forecast_peak_hour": peak_forecast["time"],
            "forecast_peak_ridership": peak_forecast["predicted_ridership"],
        },
    }
