import os
import unittest

os.environ.setdefault("DATABASE_URL", "sqlite:///./metroflow_test.db")

from fastapi.testclient import TestClient
from main import app
from app.database import Base, engine
from app.services.station_seed import seed_stations
from app.services.analytics import get_anomaly_stations


class LiveStationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        seed_stations()
        cls.client = TestClient(app)

    def test_station_history_forecast_endpoint(self):
        response = self.client.get("/stations/1/history-forecast")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("history", data)
        self.assertIn("forecast", data)
        self.assertIn("combined_series", data)
        self.assertEqual(len(data["forecast"]), 3)
        self.assertGreater(len(data["history"]), 0)

    def test_station_footfall_alias_endpoint(self):
        response = self.client.get("/stations/Attiguppe/footfall")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["station_name"], "Attiguppe")
        self.assertEqual(len(data["forecast"]), 3)

    def test_station_websocket_stream(self):
        with self.client.websocket_connect("/ws/station/1") as websocket:
            data = websocket.receive_json()
            self.assertIn("crowd_percentage", data)
            self.assertIn("entries_last_15m", data)
            self.assertIn("exits_last_15m", data)
            self.assertIn("avg_wait_minutes", data)
            self.assertIn("platforms", data)
            self.assertIn("next_trains", data)
            self.assertGreaterEqual(len(data["platforms"]), 2)
            self.assertGreaterEqual(len(data["next_trains"]), 1)
            self.assertIn(data["status"], ["low", "moderate", "high", "critical"])

    def test_fixed_anomaly_detection(self):
        anomalies = get_anomaly_stations()
        self.assertIsInstance(anomalies, list)
        for a in anomalies:
            self.assertIn("station", a)
            self.assertIn("z_score", a)
            self.assertIn("severity", a)
            self.assertIn("confidence", a)
            self.assertIn("recommendation", a)
            # Z-scores should not be absurd values like 35+
            self.assertLess(abs(a["z_score"]), 10.0)


if __name__ == "__main__":
    unittest.main()
