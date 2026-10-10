from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.station import Station


def test_root_endpoint(client: TestClient):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "operational"
    assert response.json()["endpoints"] == {
        "ml_prediction": "/predict",
        "congestion": "/stations/congestion",
        "weather": "/weather-summary",
        "analytics_summary": "/analytics",
        "live_feed": "/analytics/live",
        "stations_crud": "/stations",
    }


def test_health_endpoint(client: TestClient):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "MetroFlow API"}


def test_database_test_endpoint_uses_local_sqlite(client: TestClient):
    response = client.get("/database-test")

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["database"] == "sqlite_local"


def test_startup_seeds_dataset_stations(client: TestClient):
    response = client.get("/analytics/stations/list")

    assert response.status_code == 200
    stations = response.json()["stations"]
    assert len(stations) > 0
    assert "Attiguppe" in stations
    assert "BTM Layout" in stations


def test_predict_endpoint_returns_validation_and_prediction(client: TestClient):
    response = client.post(
        "/predict",
        json={
            "station": "Attiguppe",
            "hour": 18,
            "day_of_week": 1,
            "current_ridership": 350,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["station"] == "Attiguppe"
    assert body["hour"] == 18
    assert body["current_ridership"] == 350.0
    assert body["predicted_next_hour_ridership"] >= 0
    assert body["crowd_level"] in {"Low", "Medium", "High", "Very High"}
    assert isinstance(body["recommendation"], str) and body["recommendation"]

    invalid = client.post(
        "/predict",
        json={"station": "Attiguppe", "hour": 24, "day_of_week": 1, "current_ridership": 350},
    )
    assert invalid.status_code == 422


def test_congestion_endpoint_returns_dataset_rows(client: TestClient):
    response = client.get("/stations/congestion", params={"date": "2025-08-01", "hour": 18})

    assert response.status_code == 200
    body = response.json()
    assert body["date"] == "2025-08-01"
    assert body["hour"] == 18
    assert body["total_stations"] == len(body["stations"])
    assert body["total_stations"] > 0
    assert all(
        station["station"] and station["ridership"] >= 0
        for station in body["stations"]
    )
    assert body["stations"] == sorted(
        body["stations"], key=lambda station: station["ridership"], reverse=True
    )


def test_congestion_endpoint_rejects_invalid_hour(client: TestClient):
    response = client.get("/stations/congestion", params={"hour": 24})

    assert response.status_code == 422
    assert "between 0 and 23" in response.json()["detail"]


def test_congestion_endpoint_rejects_missing_data(client: TestClient):
    response = client.get("/stations/congestion", params={"date": "2099-01-01", "hour": 18})

    assert response.status_code == 404
    assert "No station data found" in response.json()["detail"]


def test_analytics_summary_endpoint(client: TestClient):
    response = client.get("/analytics")

    assert response.status_code == 200
    body = response.json()
    assert body["total_ridership"] > 0
    assert body["total_stations"] > 0
    assert body["busiest_station"]
    assert 0 <= body["peak_hour"] <= 23


def test_weather_summary_endpoint(client: TestClient):
    response = client.get("/weather-summary")

    assert response.status_code == 200
    body = response.json()
    assert body["average_temperature"] > 0
    assert body["average_humidity"] >= 0
    assert body["total_rainfall"] >= 0
    assert body["average_wind_speed"] >= 0


def test_analytics_congestion_alias(client: TestClient):
    response = client.get("/analytics/congestion", params={"date": "2025-08-01", "hour": 18})

    assert response.status_code == 200
    assert response.json()["total_stations"] > 0


def test_station_crud_endpoint(client: TestClient):
    create_response = client.post(
        "/stations/",
        json={
            "name": "Endpoint Test Station",
            "location": "Test Location",
            "line": "Test Line",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "capacity": 100,
            "is_interchange": False,
        },
    )

    assert create_response.status_code == 200
    created = create_response.json()
    assert created["name"] == "Endpoint Test Station"
    assert created["id"] > 0

    get_response = client.get(f"/stations/{created['id']}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Endpoint Test Station"

    list_response = client.get("/stations/")
    assert list_response.status_code == 200
    assert any(station["id"] == created["id"] for station in list_response.json())

    update_response = client.put(
        f"/stations/{created['id']}",
        json={"name": "Endpoint Renamed Station", "capacity": 250},
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Endpoint Renamed Station"
    assert update_response.json()["capacity"] == 250

    delete_response = client.delete(f"/stations/{created['id']}")
    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Station deleted successfully"

    missing_response = client.get(f"/stations/{created['id']}")
    assert missing_response.status_code == 404
    assert missing_response.json()["detail"] == "Station not found"


def test_station_crud_validation_and_not_found(client: TestClient):
    invalid = client.post("/stations/", json={"name": ""})
    assert invalid.status_code == 422

    missing = client.get("/stations/999999")
    assert missing.status_code == 404

    update_missing = client.put("/stations/999999", json={"capacity": 100})
    assert update_missing.status_code == 404

    delete_missing = client.delete("/stations/999999")
    assert delete_missing.status_code == 404


def test_analytics_station_endpoints(client: TestClient):
    station = "Attiguppe"
    endpoints = [
        ("/analytics/stations/list", None),
        ("/analytics/stations/Attiguppe/hourly", None),
        ("/analytics/stations/Attiguppe/daily", None),
        ("/analytics/stations/Attiguppe/movements", None),
        ("/analytics/stations/Attiguppe/weekday", None),
        ("/analytics/stations/Attiguppe/predict", {"hours": 6}),
    ]

    for path, params in endpoints:
        response = client.get(path, params=params)
        assert response.status_code == 200
        body = response.json()
        if path.endswith("/list"):
            assert body["stations"]
        elif path.endswith("/predict"):
            assert len(body["predictions"]) == 6
            assert body["station"] == station
        else:
            assert body["station"] == station
            assert body["data"]


def test_network_analytics_endpoints(client: TestClient):
    endpoints = [
        ("/analytics/network/daily", None),
        ("/analytics/network/movements", None),
        ("/analytics/network/hourly", None),
        ("/analytics/network/top-stations", {"n": 5, "hour": 18}),
        ("/analytics/network/heatmap", None),
        ("/analytics/network/line-comparison", None),
    ]

    for path, params in endpoints:
        response = client.get(path, params=params)
        assert response.status_code == 200
        body = response.json()
        assert body["data"]


def test_ai_analytics_endpoints(client: TestClient):
    endpoints = [
        ("/analytics/ai/peak-analysis", None),
        ("/analytics/ai/anomalies", None),
        ("/analytics/ai/insights", None),
        ("/analytics/ai/forecast", None),
    ]

    for path, params in endpoints:
        response = client.get(path, params=params)
        assert response.status_code == 200
        body = response.json()
        if path.endswith("/peak-analysis"):
            assert body["network_peak_hour"] >= 0
            assert body["station_peak_hours"]
        elif path.endswith("/anomalies"):
            assert isinstance(body["anomalies"], list)
        elif path.endswith("/insights"):
            assert body["insights"]
        else:
            assert body["forecasts"]


def test_analytics_query_validation(client: TestClient):
    invalid_hours = client.get("/analytics/stations/Attiguppe/predict", params={"hours": 25})
    assert invalid_hours.status_code == 422

    invalid_top_stations = client.get("/analytics/network/top-stations", params={"n": 85})
    assert invalid_top_stations.status_code == 422
