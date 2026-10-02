from typing import List, Dict, Any

def build_execution_trace(
    workflow_path: List[str],
    node_reasoning: Dict[str, str],
    risk_score: int,
    risk_tier: str,
    decision: str,
    matched_policy: str,
    verification_used: bool,
    verification_reasoning: str
) -> str:
    """
    Assembles complete workflow path and per-node reasoning into a human-readable explanation trace.
    """
    parts = []
    
    # 1. Primary Verdict Summary
    parts.append(f"Decision: {decision.upper()} (Risk Score: {risk_score}/100, Tier: {risk_tier}).")

    # 2. Matched Policy Statement
    if matched_policy:
        parts.append(f"Triggered Policy: {matched_policy}.")
    else:
        parts.append("Policy Evaluation: Clean (No policy rules violated).")

    # 3. Node Reasoning Summary
    if node_reasoning:
        node_summaries = []
        for node in workflow_path:
            if node in node_reasoning:
                node_summaries.append(f"{node}: {node_reasoning[node]}")
        if node_summaries:
            parts.append("Pipeline Reasoning Trace: " + " -> ".join(node_summaries) + ".")

    # 4. Verification Agent Summary
    if verification_used and verification_reasoning:
        parts.append(f"Agent Verification: {verification_reasoning}")

    return " ".join(parts)
