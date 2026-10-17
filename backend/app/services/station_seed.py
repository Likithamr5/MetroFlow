from pathlib import Path
import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import engine
from app.models.station import Station
from app.services.station_lines import classify


def _find_station_dataset() -> Path:
    candidates = [
        Path(__file__).resolve().parents[2] / "datasets" / "raw" / "station-hourly.csv",
        Path(__file__).resolve().parents[2] / "datasets" / "raw" / "raw" / "station-hourly.csv",
        Path(__file__).resolve().parents[3] / "datasets" / "raw" / "station-hourly.csv",
        Path(__file__).resolve().parents[3] / "datasets" / "raw" / "raw" / "station-hourly.csv",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("station-hourly.csv was not found")


def seed_stations() -> int:
    """Ensure every dataset station exists with canonical line and interchange assignments."""
    dataset = pd.read_csv(_find_station_dataset(), sep=";")
    station_names = list(dict.fromkeys(str(name).strip() for name in dataset["Station"].dropna() if str(name).strip()))
    if not station_names:
        raise ValueError("Station dataset contains no station names")

    ridership_by_station = {}
    if "Ridership" in dataset.columns:
        try:
            if "Date" in dataset.columns and "Hour" in dataset.columns:
                latest_date = dataset["Date"].max()
                subset = dataset[(dataset["Date"] == latest_date) & (dataset["Hour"] == 18)]
                for _, row in subset.iterrows():
                    ridership_by_station[str(row["Station"]).strip()] = int(row["Ridership"])
            if not ridership_by_station and "Station" in dataset.columns:
                avg_dict = dataset.groupby("Station")["Ridership"].mean().round().astype(int).to_dict()
                ridership_by_station = {str(k).strip(): int(v) for k, v in avg_dict.items()}
        except Exception:
            pass

    with Session(engine) as session:
        existing_stations = session.scalars(select(Station)).all()
        stations_by_name = {station.name: station for station in existing_stations}
        changed_count = 0

        # Backfill existing stations that have missing or unknown line info
        for station in existing_stations:
            current_line = getattr(station, "line", None)
            if current_line not in (None, "", "Unknown"):
                continue
            line, is_interchange = classify(station.name)
            current_interchange = getattr(station, "is_interchange", None)
            if current_line != line or current_interchange != is_interchange:
                station.line = line
                if hasattr(station, "is_interchange"):
                    station.is_interchange = is_interchange
                changed_count += 1

        # Insert missing stations from dataset
        for name in station_names:
            line, is_interchange = classify(name)
            if name not in stations_by_name:
                r_val = ridership_by_station.get(name, 0)
                session.add(
                    Station(
                        name=name,
                        location=f"{name}, Bengaluru",
                        line=line,
                        latitude=None,
                        longitude=None,
                        capacity=5000,
                        ridership=r_val,
                        is_interchange=is_interchange,
                    )
                )
                changed_count += 1

        if changed_count:
            session.commit()

        return changed_count
