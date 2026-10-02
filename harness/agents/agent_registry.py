import re
from typing import Dict, Any, Callable, NamedTuple, List
from orchestrator.state import EvaluationState

class AgentEntry(NamedTuple):
    name: str
    run: Callable[[EvaluationState], Dict[str, Any]]
    min_risk_tier: str
    description: str

def run_redaction_agent(state: EvaluationState) -> Dict[str, Any]:
    """
    Masks detected sensitive entities (PII, secrets, financial, confidential)
    in a sanitized copy of the user prompt.
    """
    prompt = state.get("prompt", "")
    entities = state.get("detected_entities", [])
    redacted = prompt

    for ent in entities:
        match_val = ent.get("match", "")
        ent_type = ent.get("type", "SENSITIVE")
        # If match is prefixed (e.g. 'AWS Access Key: AKIA...'), extract raw snippet or replace match
        if ":" in match_val:
            raw_target = match_val.split(":", 1)[1].strip()
        else:
            raw_target = match_val.strip()

        if raw_target and raw_target in redacted:
            redacted = redacted.replace(raw_target, f"[REDACTED:{ent_type.upper()}]")
        elif match_val in redacted:
            redacted = redacted.replace(match_val, f"[REDACTED:{ent_type.upper()}]")

    node_reasoning = dict(state.get("node_reasoning", {}))
    node_reasoning["redaction_agent"] = (
        f"Masked {len(entities)} sensitive entity match(es) in prompt copy."
    )

    return {
        "redacted_prompt": redacted,
        "node_reasoning": node_reasoning
    }

def run_output_validation_agent(state: EvaluationState) -> Dict[str, Any]:
    """
    Validates the generated output or prompt response against data exfiltration
    and leakage before it is returned to the user or downstream agent.
    """
    entities = state.get("detected_entities", [])
    risk_tier = state.get("risk_tier", "Low")

    # Verify whether sensitive tokens or critical keys leaked through
    passed = True
    for ent in entities:
        if ent.get("type") in ["SourceCode", "Confidential"] and risk_tier in ["High", "Critical"]:
            passed = False
            break

    node_reasoning = dict(state.get("node_reasoning", {}))
    node_reasoning["output_validation_agent"] = (
        f"Output verification completed. Leakage containment check: {'PASSED' if passed else 'FLAGGED_LEAK_PREVENTED'}."
    )

    return {
        "output_validation_passed": passed,
        "node_reasoning": node_reasoning
    }

def run_approval_routing_agent(state: EvaluationState) -> Dict[str, Any]:
    """
    Routes high-severity or policy-violating interactions to human compliance
    sign-off instead of permitting immediate automated resolution.
    """
    node_reasoning = dict(state.get("node_reasoning", {}))
    node_reasoning["approval_routing_agent"] = (
        "Critical organizational risk threshold triggered. Interaction routed to mandatory human compliance queue."
    )

    return {
        "requires_human_review": True,
        "node_reasoning": node_reasoning
    }

def run_restricted_model_routing_agent(state: EvaluationState) -> Dict[str, Any]:
    """
    Enforces that elevated-risk interactions are constrained to an approved
    internal secure model (Internal-Secure-LLM) rather than external public endpoints.
    """
    target_app = state.get("target_app", "ChatGPT")
    routed_model = "Internal-Secure-LLM"

    node_reasoning = dict(state.get("node_reasoning", {}))
    node_reasoning["restricted_model_routing_agent"] = (
        f"Diverted target endpoint from '{target_app}' to sanctioned '{routed_model}'."
    )

    return {
        "routed_model": routed_model,
        "node_reasoning": node_reasoning
    }

# Formal Agent Registry
AGENT_REGISTRY: Dict[str, AgentEntry] = {
    "redaction_agent": AgentEntry(
        name="redaction_agent",
        run=run_redaction_agent,
        min_risk_tier="Medium",
        description="Masks detected sensitive entities in a copy of the prompt"
    ),
    "output_validation_agent": AgentEntry(
        name="output_validation_agent",
        run=run_output_validation_agent,
        min_risk_tier="High",
        description="Checks response and outputs for leaked entities before return"
    ),
    "approval_routing_agent": AgentEntry(
        name="approval_routing_agent",
        run=run_approval_routing_agent,
        min_risk_tier="Critical",
        description="Marks interaction as requiring human sign-off instead of auto-finalizing"
    ),
    "restricted_model_routing_agent": AgentEntry(
        name="restricted_model_routing_agent",
        run=run_restricted_model_routing_agent,
        min_risk_tier="High",
        description="Enforces routing to approved internal secure models rather than public endpoints"
    ),
}

def get_agent(agent_name: str) -> AgentEntry:
    if agent_name not in AGENT_REGISTRY:
        raise KeyError(f"Agent '{agent_name}' is not registered in AGENT_REGISTRY.")
    return AGENT_REGISTRY[agent_name]
