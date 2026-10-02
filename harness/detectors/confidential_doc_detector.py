import re
from typing import List, Dict

# Note: Embedding-similarity vector scanning can be added as a future enhancement;
# keyword-based matching is used for MVP as per design specifications.

CONFIDENTIAL_PATTERNS = [
    ("Attorney-Client Privilege", r'(?i)\battorney[- ]client\s+privileged?\b'),
    ("Board Meeting Minutes", r'(?i)\bboard\s+meeting\s+minutes\b'),
    ("Product Roadmap", r'(?i)\bproduct\s+roadmap\b'),
    ("Strictly Confidential", r'(?i)\bstrictly\s+confidential\b'),
    ("Internal Use Only", r'(?i)\binternal\s+use\s+only\b'),
    # Requests for employee/HR records are confidential access attempts even when
    # the prompt does not contain an actual secret or numeric value.
    ("Employee Compensation", r'(?i)\b(?:employee|employees|staff|worker|workers)\s+(?:salary|salaries|pay|payroll|compensation|wages|bonus(?:es)?|remuneration)\b'),
    ("HR Records", r'(?i)\b(?:employee|employees|staff|worker|workers)\s+(?:records?|files?|performance|appraisal|disciplinary|leave|attendance|benefits)\b'),
    ("Employee Personal Data", r'(?i)\b(?:employee|employees|staff|worker|workers)(?:\'s|s\')?\s+(?:personal|private|confidential)\s+(?:information|data|details)\b'),
    ("Employee Contact Data", r'(?i)\b(?:employee|employees|staff|worker|workers)(?:\'s|s\')?\s+(?:phone|telephone|mobile|email|e-mail|home\s+address|address)\s+(?:number|address|details?|information|data)?\b'),
    ("Banking Information", r'(?i)\b(?:employee|employees|staff|worker|workers)?(?:\'s|s\')?\s*(?:bank(?:ing)?|account|salary\s+account)\s+(?:details?|information|number|data)\b'),
    ("Customer or Client Data", r'(?i)\b(?:customer|customers|client|clients)(?:\'s|s\')?\s+(?:data|records?|personal information|email list|contact details|private information)\b'),
    ("Credential or Secret Access", r'(?i)\b(?:give|show|provide|share|tell|list|fetch|retrieve|access|find|display|reveal|export|download|what(?:\s+is|\'s))\b.{0,80}\b(?:api\s*key|secret\s*key|access\s*token|private\s*key|password|credential(?:s)?)\b'),
    ("Confidential Access Request", r'(?i)\b(?:give|show|provide|share|tell|list|fetch|retrieve|access|find|display|reveal|export|download)\b.{0,80}\b(?:employee|staff|worker|salary|salaries|payroll|compensation|wages|bonus(?:es)?|hr records?|performance records?|personal data|bank(?:ing)? details?|confidential|internal(?:\s+(?:data|information|details|records?))?|customer(?:\s+(?:data|records?|list))?|client(?:\s+(?:data|records?))?)\b')
]

def detect_confidential_docs(text: str) -> List[Dict[str, str]]:
    """
    Detect internal corporate confidential documents and legal markings.
    """
    entities: List[Dict[str, str]] = []
    seen = set()

    for label, pattern in CONFIDENTIAL_PATTERNS:
        for m in re.finditer(pattern, text):
            match_str = m.group(0)
            if match_str.lower() not in seen:
                seen.add(match_str.lower())
                entities.append({
                    "type": "Confidential",
                    "match": f"{label}: {match_str}"
                })

    return entities
