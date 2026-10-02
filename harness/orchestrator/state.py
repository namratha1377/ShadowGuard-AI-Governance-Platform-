from typing import List, Dict, Optional, Any, TypedDict

class EvaluationState(TypedDict):
    # Input Request
    user: str
    department: str
    target_app: str
    prompt: str

    # Node Output Accumulators
    context: Dict[str, Any]
    detected_entities: List[Dict[str, str]]
    risk_score: int
    risk_tier: str
    top_factors: Dict[str, float]
    active_policies: List[Dict[str, Any]]
    matched_policy: Optional[str]
    decision: str
    verification_used: bool
    verification_reasoning: str
    explanation: str
    workflow_path: List[str]
    node_reasoning: Dict[str, str]

    # Dynamic Agent Orchestration Fields (Phase 20)
    requires_human_review: bool
    redacted_prompt: Optional[str]
    routed_model: Optional[str]
    output_validation_passed: Optional[bool]
    dynamic_agents_executed: List[str]
