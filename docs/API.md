# MetroFlow API Documentation

## System Endpoints

### `GET /`
Check API root.
**Response**: `{"message": "Welcome to MetroFlow API"}`

### `GET /health`
Check API health.
**Response**: `{"status": "ok", "timestamp": "2023-10-10T10:00:00Z"}`

### `GET /database-test`
Test database connection.
**Response**: `{"status": "connected", "database": "metroflow_db"}`

---

## Stations CRUD

### `POST /stations/`
Create a station.
**Request**:
```json
{
  "name": "Kengeri",
  "location": "Kengeri, Bangalore",
  "line": "Purple",
  "capacity": 5000,
  "is_interchange": false
}
```

### `GET /stations/`
Get all stations.

### `GET /stations/{station_id}`
Get a station by ID.

### `PUT /stations/{station_id}`
Update a station.
**Request**:
```json
{
  "capacity": 6000
}
```

### `DELETE /stations/{station_id}`
Delete a station.

---

## Analytics & ML Endpoints

### `POST /predict`
Predict crowd congestion for a station.
**Request**:
```json
{
  "station_id": 1,
  "timestamp": "2023-10-10T10:00:00Z"
}
```

### `GET /stations/congestion`
Get current congestion levels for all stations.

### `GET /analytics`
Get analytics KPIs.

### `GET /weather-summary`
Get the latest weather summary affecting transit.

---

## General Analytics (Router `/analytics`)
Various endpoints for historical and real-time transit analytics.
