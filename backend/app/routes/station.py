from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.station import Station
from app.schemas.station import StationCreate, StationResponse, StationUpdate


router = APIRouter(
    prefix="/stations",
    tags=["Stations"]
)


@router.post("/", response_model=StationResponse)
def create_station(station: StationCreate, db: Session = Depends(get_db)):
    new_station = Station(
        name=station.name,
        location=station.location,
        line=station.line,
        latitude=station.latitude,
        longitude=station.longitude,
        capacity=station.capacity,
        is_interchange=station.is_interchange
    )

    db.add(new_station)
    db.commit()
    db.refresh(new_station)

    return new_station

@router.get("/", response_model=list[StationResponse])
def get_stations(db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    return stations

@router.get("/{station_id}", response_model=StationResponse)
def get_station(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()

    if not station:
        raise HTTPException(
            status_code=404,
            detail="Station not found"
        )

    return station

@router.put("/{station_id}", response_model=StationResponse)
def update_station(station_id: int, station_update: StationUpdate, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()

    if not station:
        raise HTTPException(
            status_code=404,
            detail="Station not found"
        )

    update_data = station_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(station, key, value)

    db.commit()
    db.refresh(station)

    return station

@router.delete("/{station_id}")
def delete_station(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()

    if not station:
        raise HTTPException(
            status_code=404,
            detail="Station not found"
        )

    db.delete(station)
    db.commit()

    return {"message": "Station deleted successfully"}