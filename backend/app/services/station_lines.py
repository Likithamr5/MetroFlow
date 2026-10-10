PURPLE = [
    "whitefield", "hopefarm", "channasandra", "tree park", "pattandur",
    "sathya sai", "nallurhalli", "nallurahalli", "kundalahalli", "seetharam", "hoodi",
    "garudacharpalya", "singayyanapalya", "krishnarajapura", "k r pura",
    "benniganahalli", "baiyappanahalli", "swami vivekananda", "indiranagar",
    "halasuru", "trinity", "mahatma gandhi road", "mg road", "cubbon park",
    "vidhana soudha", "central college", "majestic", "city railway",
    "magadi road", "city railway", "rayanna railway", "hosahalli", "vijayanagar",
    "attiguppe", "deepanjali",
    "mysuru road", "mysore road", "nayandahalli", "rajarajeshwari",
    "jnanabharathi", "pattanagere", "kengeri", "challaghatta",
]

GREEN = [
    "nagasandra", "dasarahalli", "jalahalli", "peenya", "goraguntepalya",
    "yeshwanthpur", "yeshwantpur", "sandal soap", "mahalakshmi", "rajajinagar", "kuvempu",
    "srirampura", "sampige road", "mantri square", "majestic", "chickpete",
    "krishna rajendra", "kr market", "national college", "lalbagh",
    "south end", "jayanagar", "rashtreeya vidyalaya", "rv road",
    "banashankari", "jaya prakash", "jp nagar", "yelachenahalli",
    "konanakunte", "doddakallasandra", "vajarahalli", "thalaghattapura",
    "silk institute", "chikkabidarakallu", "manjunatha", "madavara",
]

YELLOW = [
    "rashtreeya vidyalaya", "rv road", "ragigudda", "jayadeva", "btm layout",
    "central silk board", "bommanahalli", "hongasandra", "kudlu gate",
    "singasandra", "hosa road", "beratena", "electronic city", "konappana",
    "huskur", "hebbagodi", "bommasandra",
]


def classify(name: str) -> tuple[str, bool]:
    """Return the metro line(s) matched by a station name and interchange status."""
    normalized_name = name.casefold()
    lines = [
        line
        for line, keywords in (
            ("Purple", PURPLE),
            ("Green", GREEN),
            ("Yellow", YELLOW),
        )
        if any(keyword in normalized_name for keyword in keywords)
    ]
    return ("/".join(lines) if lines else "Unknown", len(lines) > 1)
