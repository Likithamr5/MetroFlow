"""
Official Bengaluru Namma Metro station line and interchange definitions.
Encompasses the operational Phase 1 and Phase 2 network:
- Purple Line (Line 1): Challaghatta to Whitefield (Kadugodi) (37 stations)
- Green Line (Line 2): Madavara (BIEC) to Silk Institute (32 stations, sharing Majestic & RV Road)
- Yellow Line (Line 3): Rashtreeya Vidyalaya Road to Bommasandra (16 stations)
- Major Interchanges: Majestic (Purple/Green), RV Road (Green/Yellow), Jayadeva, Silk Board, etc.
"""

from typing import Tuple, Set, Dict

# Exact canonical station names for Purple Line (37 stations)
PURPLE_STATIONS: Set[str] = {
    "Challaghatta",
    "Kengeri",
    "Kengeri Bus Terminal",
    "Pattanagere",
    "Jnanabharathi",
    "Rajarajeshwari Nagar",
    "Pantharapalya - Nayandahalli",
    "Mysore Road",
    "Deepanjali Nagar",
    "Attiguppe",
    "Vijayanagar",
    "Sri Balagangadharanatha Swamiji Station, Hosahalli",
    "Magadi Road",
    "Krantivira Sangolli Rayanna Railway Station",
    "Nadaprabhu Kempegowda Station, Majestic",
    "Sir M. Visvesvaraya Stn., Central College",
    "Dr. B. R. Ambedkar Station, Vidhana Soudha",
    "Cubbon Park",
    "Mahatma Gandhi Road",
    "Trinity",
    "Halasuru",
    "Indiranagar",
    "Swami Vivekananda Road",
    "Baiyappanahalli",
    "Benniganahalli",
    "Krishnarajapura",
    "Singayyanapalya",
    "Garudacharpalya",
    "Hoodi",
    "Seetharampalya",
    "Kundalahalli",
    "Nallurahalli",
    "Sri Sathya Sai Hospital",
    "Pattandur Agrahara",
    "Kadugodi Tree Park",
    "Hopefarm Channasandra",
    "Whitefield (Kadugodi)",
}

# Exact canonical station names for Green Line (32 stations)
GREEN_STATIONS: Set[str] = {
    "Madavara",
    "Chikkabidarakallu",
    "Manjunathanagara",
    "Nagasandra",
    "Dasarahalli",
    "Jalahalli",
    "Peenya Industry",
    "Peenya",
    "Goraguntepalya",
    "Yeshwantpur",
    "Sandal Soap Factory",
    "Mahalakshmi",
    "Rajajinagar",
    "Mahakavi Kuvempu Road",
    "Srirampura",
    "Mantri Square Sampige Road",
    "Nadaprabhu Kempegowda Station, Majestic",
    "Chickpete",
    "Krishna Rajendra Market",
    "National College",
    "Lalbagh",
    "South End Circle",
    "Jayanagar",
    "Rashtreeya Vidyalaya Road",
    "Banashankari",
    "Jaya Prakash Nagar",
    "Yelachenahalli",
    "Konanakunte Cross",
    "Doddakallasandra",
    "Vajarahalli",
    "Thalaghattapura",
    "Silk Institute",
}

# Exact canonical station names for Yellow Line (16 stations)
YELLOW_STATIONS: Set[str] = {
    "Rashtreeya Vidyalaya Road",
    "Ragigudda",
    "Jayadeva Hospital",
    "BTM Layout",
    "Central Silk Board",
    "Bommanahalli",
    "Hongasandra",
    "Kudlu Gate",
    "Singasandra",
    "Hosa Road",
    "Beratena Agrahara",
    "Electronic City",
    "Infosys Foundation Konappana Agrahara",
    "Huskur Road",
    "Biocon Hebbagodi",
    "Delta Electronics Bommasandra",
}

# Designated major interchange hubs
INTERCHANGES: Dict[str, Tuple[str, bool]] = {
    "Nadaprabhu Kempegowda Station, Majestic": ("Purple/Green", True),
    "Rashtreeya Vidyalaya Road": ("Green/Yellow", True),
    "Jayadeva Hospital": ("Yellow/Pink", True),
    "Central Silk Board": ("Yellow/Blue", True),
    "Mahatma Gandhi Road": ("Purple/Pink", True),
    "Krishnarajapura": ("Purple/Blue", True),
}

# Terminal stations
TERMINALS: Set[str] = {
    "Challaghatta",
    "Whitefield (Kadugodi)",
    "Madavara",
    "Silk Institute",
    "Delta Electronics Bommasandra",
}

# Substring fallback keywords for fuzzy matches (carefully bounded)
PURPLE_KEYWORDS = [
    "whitefield", "hopefarm", "channasandra", "tree park", "pattandur",
    "sathya sai", "nallurhalli", "nallurahalli", "kundalahalli", "seetharam", "hoodi",
    "garudacharpalya", "singayyanapalya", "krishnarajapura", "k r pura",
    "benniganahalli", "baiyappanahalli", "swami vivekananda", "indiranagar",
    "halasuru", "trinity", "mg road", "cubbon park",
    "vidhana soudha", "central college", "city railway", "rayanna",
    "magadi road", "hosahalli", "vijayanagar", "attiguppe", "deepanjali",
    "mysuru road", "mysore road", "nayandahalli", "rajarajeshwari",
    "jnanabharathi", "pattanagere", "kengeri", "challaghatta",
]

GREEN_KEYWORDS = [
    "madavara", "chikkabidarakallu", "manjunatha", "nagasandra", "dasarahalli",
    "jalahalli", "peenya", "goraguntepalya", "yeshwanthpur", "yeshwantpur",
    "sandal soap", "mahalakshmi", "rajajinagar", "kuvempu", "srirampura",
    "sampige road", "mantri square", "chickpete", "kr market", "krishna rajendra",
    "national college", "lalbagh", "south end", "banashankari",
    "jp nagar", "jaya prakash", "yelachenahalli", "konanakunte",
    "doddakallasandra", "vajarahalli", "thalaghattapura", "silk institute",
]

YELLOW_KEYWORDS = [
    "ragigudda", "jayadeva", "btm layout", "central silk board", "silk board",
    "bommanahalli", "hongasandra", "kudlu gate", "singasandra", "hosa road",
    "beratena", "electronic city", "konappana", "huskur", "biocon",
    "hebbagodi", "bommasandra",
]


def classify(name: str) -> Tuple[str, bool]:
    """
    Return the metro line(s) matched by a station name and interchange status.
    Prioritizes exact matching against canonical Bangalore Metro network definitions.
    """
    clean_name = str(name).strip()

    # 1. Check known interchange hubs
    if clean_name in INTERCHANGES:
        return INTERCHANGES[clean_name]

    # 2. Check exact canonical membership
    lines = []
    if clean_name in PURPLE_STATIONS:
        lines.append("Purple")
    if clean_name in GREEN_STATIONS:
        lines.append("Green")
    if clean_name in YELLOW_STATIONS:
        lines.append("Yellow")

    if lines:
        return ("/".join(lines), len(lines) > 1)

    # 3. Normalized fuzzy fallback (case-insensitive)
    norm = clean_name.casefold()

    # Avoid Vijayanagar matching Jayanagar
    if "vijayanagar" in norm:
        return ("Purple", False)
    if "jayanagar" in norm and "vijayanagar" not in norm:
        return ("Green", False)
    if "majestic" in norm or "kempegowda" in norm:
        return ("Purple/Green", True)
    if "rv road" in norm or "rashtreeya vidyalaya" in norm:
        return ("Green/Yellow", True)

    fuzzy_lines = []
    if any(kw in norm for kw in PURPLE_KEYWORDS):
        fuzzy_lines.append("Purple")
    if any(kw in norm for kw in GREEN_KEYWORDS):
        fuzzy_lines.append("Green")
    if any(kw in norm for kw in YELLOW_KEYWORDS):
        fuzzy_lines.append("Yellow")

    if fuzzy_lines:
        return ("/".join(fuzzy_lines), len(fuzzy_lines) > 1)

    return ("Unknown", False)


def is_terminal_station(name: str) -> bool:
    """Return whether the station is an operational line terminus."""
    return str(name).strip() in TERMINALS


def get_station_corridor(name: str) -> str:
    """Return the geographical and commercial Bangalore transit corridor."""
    norm = str(name).strip().casefold()
    if any(k in norm for k in ["whitefield", "kadugodi", "hoodi", "kundalahalli", "garudacharpalya", "seetharam", "nallurahalli", "channasandra", "hopefarm"]):
        return "East Bengaluru IT Corridor (Whitefield / Tech Parks)"
    if any(k in norm for k in ["indiranagar", "baiyappanahalli", "benniganahalli", "krishnarajapura", "halasuru", "trinity"]):
        return "East-Central Transit & Commercial Corridor"
    if any(k in norm for k in ["vidhana", "cubbon", "mg road", "mahatma gandhi", "central college", "majestic", "kempegowda", "railway"]):
        return "Central CBD, Heritage & Administrative Corridor"
    if any(k in norm for k in ["attiguppe", "vijayanagar", "hosahalli", "magadi", "deepanjali", "mysore", "mysuru", "kengeri", "challaghatta", "rajarajeshwari", "pattanagere", "jnanabharathi"]):
        return "West Bengaluru & Mysore Road Radial Corridor"
    if any(k in norm for k in ["peenya", "dasarahalli", "jalahalli", "nagasandra", "madavara", "chikkabidarakallu", "goraguntepalya", "yeshwanthpur", "yeshwantpur", "sandal soap", "rajajinagar", "kuvempu", "srirampura", "sampige"]):
        return "North Bengaluru Industrial & Transit Corridor"
    if any(k in norm for k in ["chickpete", "kr market", "krishna rajendra", "national college", "lalbagh"]):
        return "Historic Bengaluru & Market Heritage Corridor"
    if any(k in norm for k in ["jayanagar", "south end", "rv road", "rashtreeya vidyalaya", "banashankari", "jp nagar", "jaya prakash", "yelachenahalli", "konanakunte", "doddakallasandra", "vajarahalli", "thalaghattapura", "silk institute"]):
        return "South Bengaluru Residential & Cultural Corridor"
    if any(k in norm for k in ["electronic city", "silk board", "jayadeva", "btm", "bommanahalli", "hongasandra", "kudlu", "singasandra", "hosa road", "konappana", "huskur", "hebbagodi", "bommasandra", "ragigudda"]):
        return "Electronic City Tech & Manufacturing Corridor"
    return "Bengaluru Metro Urban Network Corridor"


def get_station_capacity(name: str) -> int:
    """Return nominal hourly design capacity for Bangalore metro station."""
    norm = str(name).strip().casefold()
    if any(k in norm for k in ["majestic", "kempegowda"]):
        return 12000
    if any(k in norm for k in ["whitefield", "indiranagar", "mg road", "yeshwanthpur", "krishnarajapura", "silk board"]):
        return 8000
    if any(k in norm for k in ["rv road", "jayadeva", "baiyappanahalli", "banashankari", "jayanagar", "electronic city", "cubbon"]):
        return 6500
    return 5000


def get_bangalore_station_details(name: str) -> dict:
    """Consolidated Bangalore Metro station intelligence metadata."""
    line, is_interchange = classify(name)
    return {
        "station": name,
        "line": line,
        "is_interchange": is_interchange,
        "is_terminal": is_terminal_station(name),
        "corridor": get_station_corridor(name),
        "design_capacity": get_station_capacity(name),
    }
