import requests
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END

from detectors.sensitivity_node import analyze_prompt
from risk.scoring import calculate_risk_score
from agents.verification_agent import verify_high_risk_event
from explainability.trace_builder import build_execution_trace
from orchestrator.state import EvaluationState
from orchestrator.agent_selector import select_agents_for_request
from agents.agent_registry import get_agent

# Fallback policies if Express backend (port 4000) is unreachable
DEFAULT_POLICIES = [
    {"id": 1, "name": "Source Code Guard", "scope": "Engineering", "status": "enabled", "keywords": ["api_key", "secret", "password", "aws_access_key", "private_key", "akia"]},
    {"id": 2, "name": "PII Data Protection", "scope": "Organization-Wide", "status": "enabled", "keywords": ["ssn", "social security", "credit card", "passport", "email"]},
    {"id": 3, "name": "Financial Data Restriction", "scope": "Finance, Executive", "status": "enabled", "keywords": ["ebitda", "revenue", "balance sheet", "quarterly revenue", "acquisition target"]},
    {"id": 4, "name": "Confidential Document Control", "scope": "Legal, HR", "status": "enabled", "keywords": ["attorney-client privileged", "board meeting minutes", "product roadmap", "strictly confidential"]}
]

def context_node(state: EvaluationState) -> Dict[str, Any]:
    department = state.get("department", "Default")
    target_app = state.get("target_app", "ChatGPT")
    
    context = {
        "user": state.get("user", "Anonymous"),
        "department": department,
        "target_app": target_app,
        "session_type": "standard_eval"
    }
    
    workflow_path = list(state.get("workflow_path", [])) + ["context_node"]
    node_reasoning = dict(state.get("node_reasoning", {}))
    node_reasoning["context_node"] = f"Resolved department metadata for '{department}' and target app baseline for '{target_app}'."

    return {
        "context": context,
        "workflow_path": workflow_path,
        "node_reasoning": node_reasoning
    }

def sensitivity_node(state: EvaluationState) -> Dict[str, Any]:
    prompt = state.get("prompt", "")
    entities = analyze_prompt(prompt)

    workflow_path = list(state.get("workflow_path", [])) + ["sensitivity_node"]
    node_reasoning = dict(state.get("node_reasoning", {}))
    node_reasoning["sensitivity_node"] = f"Scanned prompt text; detected {len(entities)} sensitive entity match(es)."

    return {
        "detected_entities": entities,
        "workflow_path": workflow_path,
        "node_reasoning": node_reasoning
    }

def risk_node(state: EvaluationState) -> Dict[str, Any]:
    user = state.get("user", "")
    department = state.get("department", "")
    target_app = state.get("target_app", "")
    prompt = state.get("prompt", "")
    entities = state.get("detected_entities", [])

    score, tier, top_factors = calculate_risk_score(
        user=user,
        department=department,
        target_app=target_app,
        prompt=prompt,
        detected_entities=entities,
        has_policy_match=False
    )

    workflow_path = list(state.get("workflow_path", [])) + ["risk_node"]
    node_reasoning = dict(state.get("node_reasoning", {}))
    node_reasoning["risk_node"] = f"Calculated baseline risk score {score}/100 ({tier} tier)."

    return {
        "risk_score": score,
        "risk_tier": tier,
        "top_factors": top_factors,
        "workflow_path": workflow_path,
        "node_reasoning": node_reasoning
    }

def policy_node(state: EvaluationState) -> Dict[str, Any]:
    prompt_lower = state.get("prompt", "").lower()
    entities = state.get("detected_entities", [])
    entity_types = {e.get("type") for e in entities}

    # Fetch active policies from Express backend API
    policies = []
    try:
        resp = requests.get("http://localhost:4000/api/policies", timeout=1.5)
        if resp.status_code == 200:
            data = resp.json()
            policies = [p for p in data.get("data", []) if p.get("status") == "enabled"]
    except Exception:
        pass

    if not policies:
        policies = DEFAULT_POLICIES

    matched_policy_name = None
    for p in policies:
        name = p.get("name", "")
        # Check rule match against entity types or keywords
        if name == "Source Code Guard" and ("SourceCode" in entity_types or any(k in prompt_lower for k in ["api_key", "secret", "private_key", "akia"])):
            matched_policy_name = name
            break
        elif name == "PII Data Protection" and ("PII" in entity_types or any(k in prompt_lower for k in ["ssn", "social security", "credit card"])):
            matched_policy_name = name
            break
        elif name == "Financial Data Restriction" and ("Financial" in entity_types or any(k in prompt_lower for k in ["ebitda", "revenue", "balance sheet"])):
            matched_policy_name = name
            break
        elif name == "Confidential Document Control" and ("Confidential" in entity_types or any(k in prompt_lower for k in ["attorney-client", "board meeting", "product roadmap"])):
            matched_policy_name = name
            break

    # Recalculate risk score if policy matched
    score = state.get("risk_score", 0)
    tier = state.get("risk_tier", "Low")
    top_factors = state.get("top_factors", {})

    if matched_policy_name:
        score, tier, top_factors = calculate_risk_score(
            user=state.get("user", ""),
            department=state.get("department", ""),
            target_app=state.get("target_app", ""),
            prompt=state.get("prompt", ""),
            detected_entities=entities,
            has_policy_match=True
        )

    workflow_path = list(state.get("workflow_path", [])) + ["policy_node"]
    node_reasoning = dict(state.get("node_reasoning", {}))
    if matched_policy_name:
        node_reasoning["policy_node"] = f"Triggered active policy '{matched_policy_name}'."
    else:
        node_reasoning["policy_node"] = "Evaluated against active organizational policies; zero policy violations."

    return {
        "active_policies": policies,
        "matched_policy": matched_policy_name,
        "risk_score": score,
        "risk_tier": tier,
        "top_factors": top_factors,
        "workflow_path": workflow_path,
        "node_reasoning": node_reasoning
    }

def decision_node(state: EvaluationState) -> Dict[str, Any]:
    tier = state.get("risk_tier", "Low")
    matched_policy = state.get("matched_policy")
    entities = state.get("detected_entities", [])
    prompt = state.get("prompt", "")
    risk_score = state.get("risk_score", 0)

    # Determine final decision verdict
    if tier == "Critical" or matched_policy == "Source Code Guard":
        decision = "blocked"
    elif tier in ["High", "Medium"] or matched_policy is not None or len(entities) > 0:
        decision = "restricted"
    else:
        decision = "allowed"

    # Call Gemini Pro Verification Agent for High / Critical items
    verification_used, verification_reasoning = verify_high_risk_event(
        prompt=prompt,
        detected_entities=entities,
        initial_tier=tier,
        risk_score=risk_score
    )

    workflow_path = list(state.get("workflow_path", [])) + ["decision_node"]
    node_reasoning = dict(state.get("node_reasoning", {}))
    node_reasoning["decision_node"] = f"Assigned final decision: {decision.upper()}."

    explanation = build_execution_trace(
        workflow_path=workflow_path,
        node_reasoning=node_reasoning,
        risk_score=risk_score,
        risk_tier=tier,
        decision=decision,
        matched_policy=matched_policy,
        verification_used=verification_used,
        verification_reasoning=verification_reasoning
    )

    return {
        "decision": decision,
        "verification_used": verification_used,
        "verification_reasoning": verification_reasoning,
        "explanation": explanation,
        "workflow_path": workflow_path,
        "node_reasoning": node_reasoning
    }

def dynamic_agent_node(state: EvaluationState) -> Dict[str, Any]:
    """
    Executes variable runtime specialized agents dynamically selected by agent_selector.py
    based on the computed risk tier, detected sensitive entities, and policy rules.
    """
    selected_agent_names = select_agents_for_request(state)

    workflow_path = list(state.get("workflow_path", []))
    node_reasoning = dict(state.get("node_reasoning", {}))

    current_state = dict(state)
    current_state["workflow_path"] = workflow_path
    current_state["node_reasoning"] = node_reasoning

    executed_agents = []

    for agent_name in selected_agent_names:
        agent_entry = get_agent(agent_name)
        updates = agent_entry.run(current_state)
        current_state.update(updates)
        if "node_reasoning" in updates:
            node_reasoning.update(updates["node_reasoning"])
        workflow_path.append(agent_name)
        executed_agents.append(agent_name)
        current_state["workflow_path"] = workflow_path
        current_state["node_reasoning"] = node_reasoning

    risk_tier = state.get("risk_tier", "Low")
    # Any policy match or restricted decision requires human review. This is
    # intentionally independent of the numeric risk score so a simple request
    # for confidential employee information cannot be auto-approved merely
    # because it scores below the normal risk threshold.
    requires_human_review = (
        risk_tier in ["Medium", "High", "Critical"]
        or state.get("matched_policy") is not None
        or state.get("decision") == "restricted"
    )

    # Rebuild final execution trace to include dynamic agent reasoning
    explanation = build_execution_trace(
        workflow_path=workflow_path,
        node_reasoning=node_reasoning,
        risk_score=state.get("risk_score", 0),
        risk_tier=risk_tier,
        decision=state.get("decision", "allowed"),
        matched_policy=state.get("matched_policy"),
        verification_used=state.get("verification_used", False),
        verification_reasoning=state.get("verification_reasoning", "")
    )

    return {
        "workflow_path": workflow_path,
        "node_reasoning": node_reasoning,
        "dynamic_agents_executed": executed_agents,
        "requires_human_review": requires_human_review,
        "explanation": explanation,
        "redacted_prompt": current_state.get("redacted_prompt"),
        "routed_model": current_state.get("routed_model"),
        "output_validation_passed": current_state.get("output_validation_passed")
    }

def build_evaluation_graph():
    """
    Constructs and compiles the LangGraph StateGraph pipeline with dynamic agent dispatching.
    """
    builder = StateGraph(EvaluationState)

    builder.add_node("context_node", context_node)
    builder.add_node("sensitivity_node", sensitivity_node)
    builder.add_node("risk_node", risk_node)
    builder.add_node("policy_node", policy_node)
    builder.add_node("decision_node", decision_node)
    builder.add_node("dynamic_agent_node", dynamic_agent_node)

    builder.set_entry_point("context_node")
    builder.add_edge("context_node", "sensitivity_node")
    builder.add_edge("sensitivity_node", "risk_node")
    builder.add_edge("risk_node", "policy_node")
    builder.add_edge("policy_node", "decision_node")
    builder.add_edge("decision_node", "dynamic_agent_node")
    builder.add_edge("dynamic_agent_node", END)

    return builder.compile()

# Singleton compiled graph instance
evaluation_graph = build_evaluation_graph()

