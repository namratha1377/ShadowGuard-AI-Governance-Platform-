import logging
from typing import Tuple

logger = logging.getLogger("verification_agent")


def verify_high_risk_event(
    prompt: str,
    detected_entities: list,
    initial_tier: str,
    risk_score: int,
) -> Tuple[bool, str]:
    """Perform a local second-pass verification for high-risk requests.

    Sensitive prompts are deliberately never forwarded to an external model for
    verification. The gateway must decide whether data may leave the organization
    before any external AI provider sees the request.
    """
    if initial_tier not in ["High", "Critical"]:
        return False, "Skipped verification for Low/Medium risk tier."

    if detected_entities:
        return True, (
            f"Local verification confirmed {initial_tier} severity because "
            f"{len(detected_entities)} sensitive finding(s) were detected. "
            "The request must not be forwarded to an external AI provider."
        )

    return True, (
        f"Local verification retained {initial_tier} severity at {risk_score}/100 "
        "based on the configured organizational risk thresholds."
    )
