import re
from typing import List, Dict

FINANCIAL_PATTERNS = [
    ("EBITDA Mention", r'(?i)\bEBITDA\b'),
    ("Balance Sheet Mention", r'(?i)\bbalance\s+sheet\b'),
    ("Quarterly Revenue", r'(?i)\bquarterly\s+revenue\b'),
    ("Acquisition Target", r'(?i)\bacquisition\s+target\b'),
    ("Financial Amount Pattern", r'(?i)(?:\$|€|£|USD|EUR|GBP)?\s?\d+(?:\.\d+)?\s*(?:million|billion|trillion|k|M|B)\b'),
    ("Currency Amount", r'\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b')
]

def detect_financial(text: str) -> List[Dict[str, str]]:
    """
    Detect sensitive financial metrics, statements, and currency figures.
    """
    entities: List[Dict[str, str]] = []
    seen = set()

    for label, pattern in FINANCIAL_PATTERNS:
        for m in re.finditer(pattern, text):
            match_str = m.group(0)
            if match_str.lower() not in seen:
                seen.add(match_str.lower())
                entities.append({
                    "type": "Financial",
                    "match": f"{label}: {match_str}"
                })

    return entities
