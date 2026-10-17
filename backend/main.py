import asyncio
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
import joblib
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

from app.database import Base, engine, SessionLocal
from app.routes.station import router as station_router
from app.routes.analytics import router as analytics_router
from app.services.station_seed import seed_stations
from app.services.station_lines import get_bangalore_station_details
from app.services.station_simulator import (
    generate_station_snapshot,
    get_station_today_history_and_forecast,
)

# ── Helper to resolve project files across varied execution paths ─────────────
def resolve_file(*relative_path_segments: str) -> Path:
    rel_path = Path(*relative_path_segments)
    candidates = [
        Path(__file__).resolve().parent.parent / rel_path,
        Path(__file__).resolve().parent / rel_path,
        Path(__file__).resolve().parents[2] / rel_path,
        Path(__file__).resolve().parents[3] / rel_path,
        Path(".") / rel_path,
        Path("..") / rel_path,
        Path("MetroFlow") / rel_path,
    ]
    for c in candidates:
        if c.exists():
            return c.resolve()
    # Default to expected root location
    return (Path(__file__).resolve().parent.parent / rel_path).resolve()


# ── Lazy-loaded ML model and cached predictions dataset ───────────────────────
_model = None
_predictions_df = None
_weather_df = None

def get_ml_model():
    global _model
    if _model is None:
        model_path = resolve_file("models", "metroflow_final_ridership_model.pkl")
        if not model_path.exists():
            # Try alternate file name
            alt_path = resolve_file("models", "xgboost_ridership_model.pkl")
            if alt_path.exists():
                model_path = alt_path
        if model_path.exists():
            try:
                _model = joblib.load(model_path)
            except Exception as e:
                print(f"Warning: Could not load ML model from {model_path}: {e}")
    return _model

def get_predictions_df() -> Optional[pd.DataFrame]:
    global _predictions_df
    if _predictions_df is None:
        pred_path = resolve_file("datasets", "processed", "metroflow_predictions.csv")
        if pred_path.exists():
            try:
                _predictions_df = pd.read_csv(pred_path)
            except Exception as e:
                print(f"Warning: Could not load predictions CSV: {e}")
    return _predictions_df


class PredictionInput(BaseModel):
    station: str = Field(..., example="Attiguppe")
    hour: int = Field(..., ge=0, le=23, example=18)
    day_of_week: int = Field(..., ge=0, le=6, example=1)
    current_ridership: float = Field(..., ge=0, example=100.0)


app = FastAPI(
    title="MetroFlow – AI Public Transit Intelligent Platform",
    description="AI-powered Bangalore Metro Crowd Management, Schedule Optimization & Live Analytics",
    version="2.0.0",
)

# Allow Next.js dev server & local network
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    try:
        with engine.connect() as conn:
            if str(engine.url).startswith("postgresql"):
                conn.execute(text("ALTER TABLE stations ADD COLUMN IF NOT EXISTS line VARCHAR(100);"))
                conn.execute(text("ALTER TABLE stations ADD COLUMN IF NOT EXISTS is_interchange BOOLEAN DEFAULT FALSE;"))
                conn.execute(text("ALTER TABLE stations ADD COLUMN IF NOT EXISTS ridership INTEGER DEFAULT 0;"))
                conn.execute(text("ALTER TABLE stations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();"))
                conn.commit()
            elif str(engine.url).startswith("sqlite"):
                try:
                    conn.execute(text("ALTER TABLE stations ADD COLUMN ridership INTEGER DEFAULT 0;"))
                    conn.commit()
                except Exception:
                    pass
    except Exception as e:
        print(f"Note: Column migration check passed/skipped: {e}")

    # Ensure tables exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Database table initialization warning: {e}")

    try:
        seed_count = seed_stations()
        print(f"Seeded or classified {seed_count} stations from the dataset")
    except Exception as e:
        print(f"Station seeding warning: {e}")


# ── System Endpoints ─────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "platform": "MetroFlow AI Public Transit Intelligence Platform",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "ml_prediction": "/predict",
            "congestion": "/stations/congestion",
            "weather": "/weather-summary",
            "analytics_summary": "/analytics",
            "live_feed": "/analytics/live",
            "stations_crud": "/stations",
        }
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "MetroFlow API"}


@app.get("/database-test")
def database_test():
    try:
        with engine.connect() as connection:
            if str(engine.url).startswith("sqlite"):
                return {
                    "status": "success",
                    "message": "Database connected successfully (SQLite local engine)",
                    "database": "sqlite_local",
                }
            result = connection.execute(text("SELECT current_database();"))
            database_name = result.fetchone()[0]
        return {
            "status": "success",
            "message": "Database connected successfully",
            "database": database_name,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ── Core Machine Learning Prediction Endpoint ─────────────────────────────────

@app.post("/predict")
def predict_ridership(data: PredictionInput):
    model = get_ml_model()
    is_weekend = int(data.day_of_week >= 5)
    is_peak_hour = int(data.hour in [7, 8, 9, 17, 18, 19, 20])

    prediction_val = 0.0
    if model is not None:
        try:
            input_df = pd.DataFrame([{
                "Station": data.station,
                "Hour": data.hour,
                "DayOfWeek": data.day_of_week,
                "IsWeekend": is_weekend,
                "IsPeakHour": is_peak_hour,
                "Ridership": data.current_ridership,
            }])
            prediction_val = float(model.predict(input_df)[0])
        except Exception as e:
            print(f"Model prediction warning: {e}, falling back to weighted heuristic")
            prediction_val = data.current_ridership * (1.2 if is_peak_hour else 0.95)
    else:
        # Fallback if model binary is not loaded
        prediction_val = data.current_ridership * (1.25 if is_peak_hour else 0.9)

    prediction_val = max(0.0, prediction_val)

    # Station-specific crowd threshold evaluation
    results_df = get_predictions_df()
    crowd_level = "Low"
    recommendation = "Normal/off-peak operations"

    if results_df is not None:
        station_data = results_df[results_df["Station"] == data.station]
        if not station_data.empty:
            med = float(station_data["Medium_Threshold"].iloc[0])
            hi = float(station_data["High_Threshold"].iloc[0])
            vhi = float(station_data["Very_High_Threshold"].iloc[0])

            if prediction_val >= vhi:
                crowd_level = "Very High"
                recommendation = "Deploy maximum train frequency, activate crowd control marshals, and adjust dwell times."
            elif prediction_val >= hi:
                crowd_level = "High"
                recommendation = "Increase train frequency and closely monitor platform passenger density."
            elif prediction_val >= med:
                crowd_level = "Medium"
                recommendation = "Maintain regular timetable and monitor passenger interchange flow."
            else:
                crowd_level = "Low"
                recommendation = "Normal off-peak service; energy conservation operations active."
        else:
            if prediction_val >= 1000:
                crowd_level = "Very High"
                recommendation = "Deploy additional train sets and activate station crowd management."
            elif prediction_val >= 500:
                crowd_level = "High"
                recommendation = "Maintain high frequency service and monitor entry gates."
            elif prediction_val >= 200:
                crowd_level = "Medium"
                recommendation = "Standard operating schedule."
            else:
                crowd_level = "Low"
                recommendation = "Normal off-peak schedule."

    # Enrich with Bangalore Metro transit intelligence
    meta = get_bangalore_station_details(data.station)
    line = meta["line"]
    is_interchange = meta["is_interchange"]
    is_terminal = meta["is_terminal"]
    corridor = meta["corridor"]
    capacity = meta["design_capacity"]
    capacity_utilization_pct = round(min(100.0, (prediction_val / max(1, capacity)) * 100), 1)

    if crowd_level in ("Very High", "High"):
        if "Purple" in line:
            headway_directive = "Inject 3.5-min short-loop headway between Baiyappanahalli & Majestic. Prepare turnaround rake at Challaghatta."
        elif "Green" in line:
            headway_directive = "Compress Green Line headway to 4.0 min. Regulate interchange connection at Majestic."
        elif "Yellow" in line:
            headway_directive = "Deploy 4.5-min interval for Electronic City IT corridor. Synchronize RV Road connection."
        else:
            headway_directive = "Compress line headway to 3.5 - 4.0 min and position reserve rake."

        platform_action = "BMRCL Station Marshals deployed to Platforms 1 & 2. Gate pulsing active on AFC entry turnstiles."
        passenger_advisory = "Heavy platform passenger surge. Commuters advised to board middle coaches or defer departure by 15 mins."
    elif crowd_level == "Medium":
        headway_directive = "Maintain standard 5-6 min operational headway with standby rake on readiness at depot."
        platform_action = "Normal platform operations; monitor interchange transfer concourse flow."
        passenger_advisory = "Moderate commuter volume; regular boarding protocol in effect."
    else:
        headway_directive = "Off-peak 8-10 min headway; coasting energy conservation mode active."
        platform_action = "Standard station concourse flow; regular security monitoring."
        passenger_advisory = "Optimal travel conditions with low dwell times and high seating availability."

    return {
        "station": data.station,
        "line": line,
        "is_interchange": is_interchange,
        "is_terminal": is_terminal,
        "corridor": corridor,
        "capacity": capacity,
        "capacity_utilization_pct": capacity_utilization_pct,
        "hour": data.hour,
        "current_ridership": round(data.current_ridership, 1),
        "predicted_next_hour_ridership": round(prediction_val, 2),
        "crowd_level": crowd_level,
        "recommendation": recommendation,
        "headway_directive": headway_directive,
        "platform_action": platform_action,
        "passenger_advisory": passenger_advisory,
    }


# ── Station Congestion Monitoring Endpoint ───────────────────────────────────

@app.get("/stations/congestion")
def get_station_congestion(hour: Optional[int] = None, date: Optional[str] = None):
    if hour is not None and not 0 <= hour <= 23:
        raise HTTPException(status_code=422, detail="hour must be between 0 and 23")

    data_path = resolve_file("datasets", "raw", "station-hourly.csv")
    if not data_path.exists():
        data_path = resolve_file("datasets", "raw", "raw", "station-hourly.csv")

    if not data_path.exists():
        raise HTTPException(status_code=404, detail="Dataset station-hourly.csv not found")

    df = pd.read_csv(data_path, sep=";")
    target_date = date if date else str(df["Date"].max())
    target_hour = hour if hour is not None else 18

    subset = df[(df["Date"] == target_date) & (df["Hour"] == target_hour)].copy()
    if subset.empty:
        raise HTTPException(status_code=404, detail="No station data found for the requested date and hour")

    pred_df = get_predictions_df()
    if pred_df is not None:
        thresholds = pred_df[["Station", "Medium_Threshold", "High_Threshold", "Very_High_Threshold"]].drop_duplicates()
        merged = subset.merge(thresholds, on="Station", how="left")
    else:
        merged = subset.copy()
        merged["Medium_Threshold"] = None
        merged["High_Threshold"] = None
        merged["Very_High_Threshold"] = None

    def classify_congestion(row):
        r = row["Ridership"]
        vh = row.get("Very_High_Threshold")
        h = row.get("High_Threshold")
        m = row.get("Medium_Threshold")

        if pd.notna(vh) and r >= vh:
            return "Critical"
        elif pd.notna(h) and r >= h:
            return "High"
        elif pd.notna(m) and r >= m:
            return "Medium"
        elif pd.notna(vh):
            return "Low"
        else:
            if r >= 1000:
                return "Critical"
            elif r >= 500:
                return "High"
            elif r >= 200:
                return "Medium"
            return "Low"

    merged["congestion_level"] = merged.apply(classify_congestion, axis=1)
    merged = merged.sort_values(by="Ridership", ascending=False)

    station_list = [
        {
            "station": str(row["Station"]),
            "ridership": int(row["Ridership"]),
            "congestion_level": str(row["congestion_level"]),
        }
        for _, row in merged.iterrows()
    ]

    now = datetime.now()
    slot_min = (now.minute // 15) * 15
    train_id = f"TR-{(target_hour * 4 + slot_min // 15) + 1:03d}"
    time_slot = f"{target_hour:02d}:{slot_min:02d}"
    next_train_in = 15 - (now.minute % 15)

    return {
        "date": target_date,
        "hour": target_hour,
        "time_slot": time_slot,
        "train_movement_id": train_id,
        "interval_minutes": 15,
        "next_train_in_minutes": next_train_in,
        "total_stations": len(station_list),
        "stations": station_list,
    }


# ── Analytics KPI Summary Endpoint ───────────────────────────────────────────

@app.get("/analytics")
def get_analytics():
    data_path = resolve_file("datasets", "raw", "station-hourly.csv")
    if not data_path.exists():
        data_path = resolve_file("datasets", "raw", "raw", "station-hourly.csv")

    df = pd.read_csv(data_path, sep=";")
    total_ridership = int(df["Ridership"].sum())
    total_stations = int(df["Station"].nunique())

    busiest_station = str(
        df.groupby("Station")["Ridership"]
        .sum()
        .idxmax()
    )

    peak_hour = int(
        df.groupby("Hour")["Ridership"]
        .sum()
        .idxmax()
    )

    return {
        "total_ridership": total_ridership,
        "total_stations": total_stations,
        "busiest_station": busiest_station,
        "peak_hour": peak_hour,
    }


# ── Weather Summary Endpoint ─────────────────────────────────────────────────

@app.get("/weather-summary")
def get_weather_summary():
    weather_path = resolve_file("datasets", "raw", "bengaluru-weather-2026.csv")
    if not weather_path.exists():
        weather_path = resolve_file("datasets", "raw", "bengaluru-weather-2025.csv")
    if not weather_path.exists():
        return {
            "average_temperature": 23.3,
            "average_humidity": 82.8,
            "total_rainfall": 218.4,
            "average_wind_speed": 11.6,
        }

    df = pd.read_csv(weather_path)
    if "month" in df.columns:
        df = df[df["month"].isin([8, 9, 10])].copy()

    return {
        "average_temperature": round(float(df["temp"].mean()), 2) if "temp" in df.columns else 23.3,
        "average_humidity": round(float(df["rhum"].mean()), 2) if "rhum" in df.columns else 82.8,
        "total_rainfall": round(float(df["prcp"].sum()), 2) if "prcp" in df.columns else 218.4,
        "average_wind_speed": round(float(df["wspd"].mean()), 2) if "wspd" in df.columns else 11.6,
    }


# Also expose congestion on /analytics/congestion for convenience
@app.get("/analytics/congestion")
def get_analytics_congestion(hour: Optional[int] = None, date: Optional[str] = None):
    return get_station_congestion(hour=hour, date=date)


# ── WebSocket Real-Time Station Stream ────────────────────────────────────────
@app.websocket("/ws/station/{station_id}")
async def websocket_station_stream(websocket: WebSocket, station_id: str):
    await websocket.accept()
    try:
        while True:
            with SessionLocal() as db:
                snapshot = generate_station_snapshot(station_id, db)
            await websocket.send_json(snapshot)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket station {station_id} connection terminated: {e}")


# ── REST Footfall History & Forecast ──────────────────────────────────────────
@app.get("/stations/{station_id}/history-forecast")
def get_station_history_forecast_route(station_id: str):
    with SessionLocal() as db:
        return get_station_today_history_and_forecast(station_id, db)


@app.get("/stations/{station_id}/footfall")
def get_station_footfall_route(station_id: str):
    with SessionLocal() as db:
        return get_station_today_history_and_forecast(station_id, db)


@app.get("/stations/{station_id}/bangalore-metadata")
def get_station_bangalore_metadata_route(station_id: str):
    return get_bangalore_station_details(station_id)


# Include modular routers at bottom so specific top-level routes match first
app.include_router(station_router)
app.include_router(analytics_router)