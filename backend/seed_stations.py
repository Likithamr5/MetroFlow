"""Compatibility entry point for the CSV-backed station seeder."""

from app.services.station_seed import seed_stations


if __name__ == "__main__":
    print(f"Seeded {seed_stations()} stations.")
