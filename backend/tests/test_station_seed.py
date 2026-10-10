import os
import unittest
from unittest.mock import patch

os.environ.setdefault("DATABASE_URL", "sqlite:///./metroflow_test.db")

import pandas as pd

from app.services.station_lines import classify
from app.services.station_seed import _find_station_dataset, seed_stations


class StationSeedTests(unittest.TestCase):
    def test_classifies_lines_and_interchanges(self):
        self.assertEqual(classify("Attiguppe"), ("Purple", False))
        self.assertEqual(classify("Nagasandra"), ("Green", False))
        self.assertEqual(classify("Bommasandra"), ("Yellow", False))
        self.assertEqual(classify("Majestic"), ("Purple/Green", True))
        self.assertEqual(classify("Rashtreeya Vidyalaya Road"), ("Green/Yellow", True))
        self.assertEqual(classify("Nallurahalli"), ("Purple", False))
        self.assertEqual(classify("Yeshwantpur"), ("Green", False))
        self.assertEqual(
            classify("Krantivira Sangolli Rayanna Railway Station"),
            ("Purple", False),
        )
        self.assertEqual(classify("Demo Station"), ("Unknown", False))

    def test_dataset_contains_all_expected_stations(self):
        dataset_path = _find_station_dataset()
        self.assertTrue(dataset_path.exists())

        stations = pd.read_csv(dataset_path, sep=";")["Station"].dropna().astype(str).str.strip()
        self.assertEqual(stations.nunique(), 83)
        self.assertEqual(len(stations.drop_duplicates().tolist()), 83)

    @patch("app.services.station_seed.Session")
    def test_seed_uses_exact_csv_names_and_classifies_them(self, session_factory):
        session = session_factory.return_value.__enter__.return_value
        session.scalars.return_value.all.return_value = []

        with patch("app.services.station_seed.pd.read_csv") as read_csv:
            read_csv.return_value = pd.DataFrame(
                {"Station": ["Attiguppe", "Nagasandra", "Mahalakshmi"]}
            )
            seeded = seed_stations()

        self.assertEqual(seeded, 3)
        created_stations = [call.args[0] for call in session.add.call_args_list]
        self.assertEqual(
            [station.name for station in created_stations],
            ["Attiguppe", "Nagasandra", "Mahalakshmi"],
        )
        self.assertEqual(
            [station.line for station in created_stations],
            ["Purple", "Green", "Green"],
        )
        self.assertTrue(all(station.latitude is None for station in created_stations))
        self.assertTrue(all(station.longitude is None for station in created_stations))
        session.commit.assert_called_once()

    @patch("app.services.station_seed.Session")
    def test_seed_is_idempotent(self, session_factory):
        session = session_factory.return_value.__enter__.return_value
        session.scalars.return_value.all.return_value = [
            type("ExistingStation", (), {"name": "Attiguppe", "line": "Purple"})(),
            type("ExistingStation", (), {"name": "Nagasandra", "line": "Green"})(),
        ]

        with patch("app.services.station_seed.pd.read_csv") as read_csv:
            read_csv.return_value = pd.DataFrame(
                {"Station": ["Attiguppe", "Nagasandra", "Mahalakshmi"]}
            )
            seeded = seed_stations()

        self.assertEqual(seeded, 1)
        session.add.assert_called_once()
        session.commit.assert_called_once()

    @patch("app.services.station_seed.Session")
    def test_seed_backfills_existing_unknown_stations(self, session_factory):
        session = session_factory.return_value.__enter__.return_value
        existing_station = type(
            "ExistingStation",
            (),
            {"name": "Attiguppe", "line": "Unknown", "is_interchange": False},
        )()
        session.scalars.return_value.all.return_value = [existing_station]

        with patch("app.services.station_seed.pd.read_csv") as read_csv:
            read_csv.return_value = pd.DataFrame({"Station": ["Attiguppe"]})
            seeded = seed_stations()

        self.assertEqual(seeded, 1)
        self.assertEqual(existing_station.line, "Purple")
        self.assertFalse(existing_station.is_interchange)
        session.add.assert_not_called()
        session.commit.assert_called_once()


if __name__ == "__main__":
    unittest.main()
