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
    """Ensure every dataset station exists without replacing user-managed records."""
    dataset = pd.read_csv(_find_station_dataset(), sep=";")
    station_names = list(dict.fromkeys(str(name).strip() for name in dataset["Station"].dropna() if str(name).strip()))
    if not station_names:
        raise ValueError("Station dataset contains no station names")

    with Session(engine) as session:
        existing_stations = session.scalars(select(Station)).all()
        stations_by_name = {station.name: station for station in existing_stations}
        changed_count = 0

        for station in existing_stations:
            if station.line not in (None, "", "Unknown"):
                continue
            line, is_interchange = classify(station.name)
            if station.line != line or station.is_interchange != is_interchange:
                station.line = line
                station.is_interchange = is_interchange
                changed_count += 1

        for name in station_names:
            line, is_interchange = classify(name)
            if name not in stations_by_name:
                session.add(
                    Station(
                        name=name,
                        location=f"{name}, Bengaluru",
                        line=line,
                        latitude=None,
                        longitude=None,
                        capacity=5000,
                        is_interchange=is_interchange,
                    )
                )
                changed_count += 1

        if changed_count:
            session.commit()

        return changed_count
