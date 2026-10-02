import re
from typing import List, Dict

SECRET_PATTERNS = [
    ("AWS Access Key", r'AKIA[0-9A-Z]{16}'),
    ("Private Key Header", r'-----BEGIN (?:RSA|EC|OPENSSH|DSA|PGP)?\s?PRIVATE KEY-----'),
    ("Generic API Key/Token", r'(?i)(?:api[_-]?key|secret[_-]?key|access[_-]?token|bearer[\s_]+[a-z0-9\-._~+/]+=*)[\s=:\'"]+([a-zA-Z0-9_\-]{16,})'),
    ("Internal Repo Path", r'(?i)\b(?:auth-service|internal-api|admin-portal|payments-service|user-db|prod-cluster)/[a-zA-Z0-9_/.-]+'),
]

def detect_secrets(text: str) -> List[Dict[str, str]]:
    """
    Detect source code secrets, API keys, private keys, and internal repo paths.
    """
    entities: List[Dict[str, str]] = []
    seen = set()

    for label, pattern in SECRET_PATTERNS:
        for m in re.finditer(pattern, text):
            match_str = m.group(0)
            if match_str not in seen:
                seen.add(match_str)
                # Truncate long secrets for reporting
                display_str = match_str[:40] + ("..." if len(match_str) > 40 else "")
                entities.append({
                    "type": "SourceCode",
                    "match": f"{label}: {display_str}"
                })

    return entities
