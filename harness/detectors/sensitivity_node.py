from typing import List, Dict
from .pii_detector import detect_pii
from .secrets_detector import detect_secrets
from .financial_detector import detect_financial
from .confidential_doc_detector import detect_confidential_docs

def analyze_prompt(prompt_text: str) -> List[Dict[str, str]]:
    """
    Sensitivity Node: Aggregates findings from PII, Secrets, Financial, and Confidential Document detectors.
    Returns a combined list of detected_entities in the shape:
    [{"type": str, "match": str}, ...]
    """
    if not prompt_text:
        return []

    results: List[Dict[str, str]] = []

    # 1. Detect Source Code Secrets & Repo Paths
    secrets_found = detect_secrets(prompt_text)
    results.extend(secrets_found)

    # 2. Detect PII (Presidio + Regex Fallback)
    pii_found = detect_pii(prompt_text)
    results.extend(pii_found)

    # 3. Detect Financial Data & Currency Amounts
    financial_found = detect_financial(prompt_text)
    results.extend(financial_found)

    # 4. Detect Confidential Corporate Documents
    confidential_found = detect_confidential_docs(prompt_text)
    results.extend(confidential_found)

    return results
