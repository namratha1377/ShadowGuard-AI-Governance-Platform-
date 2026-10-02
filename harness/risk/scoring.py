import os
import json
from typing import List, Dict, Tuple

# Path to configurable weights.json
WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "weights.json")

def load_weights_config() -> Dict:
    if os.path.exists(WEIGHTS_PATH):
        try:
            with open(WEIGHTS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    # Fallback default configuration
    return {
        "wu": 0.25, "wd": 0.35, "we": 0.20, "wp": 0.20,
        "department_baseline": {"Engineering": 60, "Finance": 65, "Legal": 70, "HR": 50, "Marketing": 30, "Sales": 35, "Executive": 75, "Default": 45},
        "endpoint_trust": {"ChatGPT": 70, "Claude": 65, "Perplexity": 80, "Gemini": 65, "Internal Copilot": 15, "ShadowGuard Sandbox": 10, "Default": 80},
        "entity_severity": {"AWS Access Key": 95, "Private Key Header": 95, "Generic API Key/Token": 85, "US_SSN": 90, "CREDIT_CARD": 85, "Internal Repo Path": 75, "Attorney-Client Privilege": 80, "Board Meeting Minutes": 75, "EBITDA Mention": 70, "Balance Sheet Mention": 70, "Quarterly Revenue": 65, "Acquisition Target": 75, "EMAIL_ADDRESS": 30, "PHONE_NUMBER": 40, "Default": 50}
    }

def calculate_risk_score(
    user: str,
    department: str,
    target_app: str,
    prompt: str,
    detected_entities: List[Dict[str, str]],
    has_policy_match: bool
) -> Tuple[int, str, Dict[str, float]]:
    """
    Computes multi-factor risk score using formula:
      R_total = wu*S_user + wd*S_data + we*S_endpoint + wp*S_policy
    Maps final score to risk tier: 0-39 Low, 40-69 Medium, 70-89 High, 90-100 Critical.
    """
    config = load_weights_config()
    wu = config.get("wu", 0.25)
    wd = config.get("wd", 0.35)
    we = config.get("we", 0.20)
    wp = config.get("wp", 0.20)

    dept_map = config.get("department_baseline", {})
    endpoint_map = config.get("endpoint_trust", {})
    entity_severity_map = config.get("entity_severity", {})

    # 1. User/Department Risk Factor (S_user)
    S_user = float(dept_map.get(department, dept_map.get("Default", 45)))

    # 2. Data Sensitivity Risk Factor (S_data)
    if not detected_entities:
        S_data = 0.0
    else:
        severities = []
        for entity in detected_entities:
            match_text = entity.get("match", "")
            matched_label = match_text.split(":")[0].strip() if ":" in match_text else match_text
            sev = entity_severity_map.get(matched_label, entity_severity_map.get("Default", 50))
            severities.append(sev)
        S_data = float(max(severities)) if severities else 0.0

    # 3. Endpoint Trust Risk Factor (S_endpoint)
    S_endpoint = float(endpoint_map.get(target_app, endpoint_map.get("Default", 80)))

    # 4. Policy Violation Risk Factor (S_policy)
    S_policy = 85.0 if has_policy_match else 0.0

    # Weighted Total Score
    R_total = (wu * S_user) + (wd * S_data) + (we * S_endpoint) + (wp * S_policy)
    final_score = int(round(min(max(R_total, 0.0), 100.0)))

    # Risk Tier Mapping
    if final_score >= 78:
        risk_tier = "Critical"
    elif final_score >= 65:
        risk_tier = "High"
    elif final_score >= 35:
        risk_tier = "Medium"
    else:
        risk_tier = "Low"

    top_factors = {
        "user_role_contribution": round(wu * S_user, 2),
        "data_sensitivity_contribution": round(wd * S_data, 2),
        "endpoint_trust_contribution": round(we * S_endpoint, 2),
        "policy_match_contribution": round(wp * S_policy, 2)
    }

    return final_score, risk_tier, top_factors
