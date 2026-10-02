"""
Dynamic Agent Selector Module
Evaluates live runtime state (risk_tier, detected_entities, matched_policy)
to dynamically construct a variable-length, variable-content execution plan
of specialized agents from the AGENT_REGISTRY.
"""

from typing import List
from orchestrator.state import EvaluationState
from agents.agent_registry import AGENT_REGISTRY

def select_agents_for_request(state: EvaluationState) -> List[str]:
    """
    Determines at runtime which specialized agents to execute based on live request state.

    Dynamic Selection Rules & Rationale:
    1. Low Risk:
       - Rationale: Benign queries pose negligible threat to the organization.
         Zero agent intervention needed beyond the baseline core pipeline.
       - Selected: []

    2. Medium Risk:
       - Rationale: Potential data exposure or moderate compliance ambiguity.
         If entities are detected, 'redaction_agent' runs to sanitize sensitive terms.
         If no entities are detected (e.g. risk driven solely by context or app baseline),
         redaction is omitted since there are no target tokens to mask.
       - Selected: ['redaction_agent'] if detected_entities else []

    3. High Risk:
       - Rationale: High compliance danger (e.g. financial metrics, confidential documents).
         - If entities present, 'redaction_agent' runs to sanitize tokens.
         - 'output_validation_agent' runs to scan downstream responses for data exfiltration.
         - 'restricted_model_routing_agent' runs to divert execution from public cloud LLMs
           to an internal secured model ('Internal-Secure-LLM').
       - Selected: (['redaction_agent'] if detected_entities else []) +
                   ['output_validation_agent', 'restricted_model_routing_agent']

    4. Critical Risk:
       - Rationale: Severe corporate vulnerability (e.g. live AWS secrets, source code leaks).
         - If entities present, 'redaction_agent' sanitizes tokens.
         - 'output_validation_agent' acts as a strict firewall preventing output transmission.
         - 'approval_routing_agent' quarantines the interaction, requiring mandatory human sign-off.
       - Selected: (['redaction_agent'] if detected_entities else []) +
                   ['output_validation_agent', 'approval_routing_agent']
    """
    risk_tier = state.get("risk_tier", "Low")
    detected_entities = state.get("detected_entities", [])
    has_entities = len(detected_entities) > 0

    selected_agents: List[str] = []

    if risk_tier == "Low":
        # Low risk: no specialized dynamic agents required
        return []

    elif risk_tier == "Medium":
        # Medium risk: sanitize prompt only if sensitive entities exist
        if has_entities and "redaction_agent" in AGENT_REGISTRY:
            selected_agents.append("redaction_agent")

    elif risk_tier == "High":
        # High risk: sanitize entities, validate output stream, and reroute model to secure enclave
        if has_entities and "redaction_agent" in AGENT_REGISTRY:
            selected_agents.append("redaction_agent")
        if "output_validation_agent" in AGENT_REGISTRY:
            selected_agents.append("output_validation_agent")
        if "restricted_model_routing_agent" in AGENT_REGISTRY:
            selected_agents.append("restricted_model_routing_agent")

    elif risk_tier == "Critical":
        # Critical risk: sanitize entities, prevent exfiltration, and require human compliance approval
        if has_entities and "redaction_agent" in AGENT_REGISTRY:
            selected_agents.append("redaction_agent")
        if "output_validation_agent" in AGENT_REGISTRY:
            selected_agents.append("output_validation_agent")
        if "approval_routing_agent" in AGENT_REGISTRY:
            selected_agents.append("approval_routing_agent")

    return selected_agents
