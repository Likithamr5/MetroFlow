import os
import unittest

os.environ.setdefault("DATABASE_URL", "sqlite:///./metroflow_test.db")

from fastapi.testclient import TestClient

from main import app


class ApiValidationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_endpoint_is_available(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_congestion_rejects_invalid_hour(self):
        response = self.client.get("/stations/congestion?hour=24")
        self.assertEqual(response.status_code, 422)
        self.assertIn("between 0 and 23", response.json()["detail"])

    def test_congestion_rejects_unknown_date_and_hour(self):
        response = self.client.get("/stations/congestion?date=2099-01-01&hour=18")
        self.assertEqual(response.status_code, 404)
        self.assertIn("No station data", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
