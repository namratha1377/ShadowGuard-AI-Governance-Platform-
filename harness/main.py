from typing import List, Optional, Literal, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import dotenv
import os
import requests

from orchestrator.graph import evaluation_graph
from orchestrator.state import EvaluationState

dotenv.load_config() if hasattr(dotenv, 'load_config') else dotenv.load_dotenv()

app = FastAPI(
    title="ShadowGuard Execution Harness",
    description="Python/FastAPI evaluation harness microservice powered by LangGraph, Presidio & Gemini Pro.",
    version="0.3.0",
)

# Enable CORS for Express backend (port 4000) and React frontend (port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4000",
        "http://127.0.0.1:4000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EvaluateRequest(BaseModel):
    user: str = Field(..., description="Name of the user submitting the prompt")
    department: str = Field(..., description="Department of the user")
    target_app: str = Field(..., description="Target LLM provider application")
    prompt: str = Field(..., description="Raw prompt content to evaluate")

class DetectedEntity(BaseModel):
    type: str
    match: str

class EvaluateResponse(BaseModel):
    risk_score: int
    risk_tier: Literal["Low", "Medium", "High", "Critical"]
    detected_entities: List[DetectedEntity]
    matched_policy: Optional[str] = None
    decision: Literal["allowed", "restricted", "blocked"]
    workflow_path: List[str]
    explanation: str
    verification_used: bool = False
    top_factors: Optional[Dict[str, float]] = None
    requires_human_review: bool = False
    redacted_prompt: Optional[str] = None
    routed_model: Optional[str] = None

class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    target_app: str = Field("Gemini", description="Target AI selected by the employee")

class GenerateResponse(BaseModel):
    response: str
    provider: str

@app.get("/")
def read_root():
    return {
        "message": "Hello ShadowGuard",
        "service": "harness",
        "status": "online"
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "harness",
        "version": "0.3.0"
    }

@app.post("/generate", response_model=GenerateResponse)
def generate_response(payload: GenerateRequest):
    """Generate through the AI provider selected in the Prompt dashboard.

    This endpoint is only called by the Express gateway after ShadowGuard has
    allowed the request. Provider credentials remain server-side in harness/.env.
    """
    system_prompt = (
        "You are the AI assistant behind the ShadowGuard gateway. "
        "Answer the user's request directly and accurately. "
        "Return only the useful answer, with no ShadowGuard risk, policy, "
        "security, governance, approval, or compliance metadata. "
        "If code is requested, provide complete runnable code and a concise explanation. "
        "Do not invent confidential company or personal data."
    )
    user_prompt = payload.prompt

    try:
        answer, provider = _generate_with_selected_provider(
            target_app=payload.target_app,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )
        return GenerateResponse(response=answer, provider=provider)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(502, f"AI provider request failed: {exc}")


def _generate_with_selected_provider(target_app: str, system_prompt: str, user_prompt: str):
    """Route only to providers that are currently configured for this deployment."""
    provider = (target_app or "").strip().lower()

    # For this deployment, Gemini is the only provider configured with a real
    # API key. Do not silently route other UI selections to Gemini because that
    # would make the selected Target AI label inaccurate.
    if provider == "gemini":
        return _generate_gemini(system_prompt, user_prompt)

    raise HTTPException(503, f"{target_app or 'Selected AI provider'} is not configured yet. Please select Gemini.")


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise HTTPException(503, f"{name} is not configured in harness/.env.")
    return value


def _generate_openai(system_prompt: str, user_prompt: str):
    """ChatGPT/OpenAI via the Responses API."""
    api_key = _require_env("OPENAI_API_KEY")
    model = os.getenv("OPENAI_MODEL", "gpt-5").strip()

    response = requests.post(
        "https://api.openai.com/v1/responses",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "instructions": system_prompt,
            "input": user_prompt,
        },
        timeout=60,
    )
    if not response.ok:
        raise HTTPException(502, f"OpenAI returned HTTP {response.status_code}: {response.text[:500]}")

    data = response.json()
    answer = (data.get("output_text") or "").strip()
    if not answer:
        # Defensive extraction for Responses API payloads where output_text is absent.
        chunks = []
        for item in data.get("output", []):
            for content in item.get("content", []):
                if content.get("type") in ("output_text", "text") and content.get("text"):
                    chunks.append(content["text"])
        answer = "\n".join(chunks).strip()
    if not answer:
        raise HTTPException(502, "OpenAI returned an empty response.")
    return answer, f"ChatGPT ({model})"


def _generate_anthropic(system_prompt: str, user_prompt: str):
    """Claude via Anthropic's Messages API."""
    api_key = _require_env("ANTHROPIC_API_KEY")
    model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6").strip()

    response = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": 4096,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_prompt}],
        },
        timeout=60,
    )
    if not response.ok:
        raise HTTPException(502, f"Anthropic returned HTTP {response.status_code}: {response.text[:500]}")

    data = response.json()
    answer = "\n".join(
        block.get("text", "") for block in data.get("content", [])
        if block.get("type") == "text" and block.get("text")
    ).strip()
    if not answer:
        raise HTTPException(502, "Anthropic returned an empty response.")
    return answer, f"Claude ({model})"


def _generate_gemini(system_prompt: str, user_prompt: str):
    """Generate a response with the Gemini API using a model available to this key.

    The project only needs one real provider for the current demo. Instead of
    hard-coding a model that may not be enabled for a particular Google AI
    Studio key, discover models that advertise ``generateContent`` and select
    a Flash model. This avoids turning a valid employee request into a fake
    security block just because a model name changed or is unavailable.
    """
    api_key = _require_env("GEMINI_API_KEY")
    configured_model = os.getenv("GEMINI_MODEL", "").strip()
    fallback_models = [
        m.strip() for m in os.getenv(
            "GEMINI_FALLBACK_MODELS",
            "gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-2.5-flash,gemini-2.0-flash",
        ).split(",") if m.strip()
    ]

    models = []
    try:
        list_response = requests.get(
            "https://generativelanguage.googleapis.com/v1beta/models",
            headers={"x-goog-api-key": api_key},
            timeout=15,
        )
        if list_response.ok:
            for item in list_response.json().get("models", []):
                methods = item.get("supportedGenerationMethods", []) or []
                raw_name = str(item.get("name", ""))
                name = raw_name.split("/", 1)[1] if raw_name.startswith("models/") else raw_name
                if name and "generateContent" in methods:
                    models.append(name)
        else:
            try:
                detail = list_response.json().get("error", {}).get("message", list_response.text)
            except Exception:
                detail = list_response.text
            # Do not fail yet: the configured model may still be directly usable.
            models = []
            list_error = f"HTTP {list_response.status_code}: {detail}"
    except Exception as exc:
        models = []
        list_error = str(exc)

    # Prefer an explicitly configured model if the key advertises it. Otherwise
    # choose a known Flash model from the key's available model list.
    candidates = []
    if configured_model:
        candidates.append(configured_model)
    candidates.extend(fallback_models)

    selected = []
    if models:
        for candidate in candidates:
            if candidate in models and candidate not in selected:
                selected.append(candidate)
        # Last-resort: any available Flash model, then any text generation model.
        for name in models:
            if "flash" in name.lower() and name not in selected:
                selected.append(name)
        for name in models:
            if name not in selected:
                selected.append(name)
    else:
        # If model discovery is unavailable, try the configured/candidate names
        # directly and report the real provider error if all fail.
        selected = candidates or ["gemini-3.8-flash"]

    last_error = f"model discovery unavailable ({list_error})" if not models and 'list_error' in locals() else "no usable Gemini model was returned"

    for model in selected[:8]:
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            headers={
                "x-goog-api-key": api_key,
                "Content-Type": "application/json",
            },
            json={
                "system_instruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                "generationConfig": {"temperature": 0.2},
            },
            timeout=60,
        )
        if response.ok:
            data = response.json()
            candidates_data = data.get("candidates", []) or []
            if candidates_data:
                parts = candidates_data[0].get("content", {}).get("parts", []) or []
                answer = "\n".join(p.get("text", "") for p in parts if p.get("text")).strip()
                if answer:
                    return answer, f"Gemini ({model})"
            last_error = f"{model} returned an empty response"
            continue

        try:
            detail = response.json().get("error", {}).get("message", response.text)
        except Exception:
            detail = response.text
        last_error = f"{model}: HTTP {response.status_code} - {detail}"
        # Try the next candidate for model-not-found/unsupported requests.
        if response.status_code in (400, 404):
            continue
        # Authentication/quota/server failures should be surfaced immediately.
        break

    raise HTTPException(502, f"Gemini request failed: {last_error}")


def _generate_perplexity(system_prompt: str, user_prompt: str):
    """Perplexity via its OpenAI-compatible chat-completions endpoint."""
    api_key = _require_env("PERPLEXITY_API_KEY")
    model = os.getenv("PERPLEXITY_MODEL", "sonar").strip()

    response = requests.post(
        "https://api.perplexity.ai/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        },
        timeout=60,
    )
    if not response.ok:
        raise HTTPException(502, f"Perplexity returned HTTP {response.status_code}: {response.text[:500]}")

    data = response.json()
    answer = ((data.get("choices") or [{}])[0].get("message") or {}).get("content", "").strip()
    if not answer:
        raise HTTPException(502, "Perplexity returned an empty response.")
    return answer, f"Perplexity ({model})"


def _generate_copilot(system_prompt: str, user_prompt: str):
    """Use a configured OpenAI-compatible Copilot/Azure endpoint.

    Microsoft Copilot does not expose a single generic consumer API-key endpoint
    equivalent to the OpenAI/Anthropic APIs. If the project has a sanctioned
    Copilot/Azure-compatible endpoint, configure COPILOT_API_URL, COPILOT_API_KEY,
    and COPILOT_MODEL rather than pretending the ChatGPT key is a Copilot key.
    """
    api_key = _require_env("COPILOT_API_KEY")
    endpoint = _require_env("COPILOT_API_URL")
    model = os.getenv("COPILOT_MODEL", "").strip()

    body = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }
    if model:
        body["model"] = model

    response = requests.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=body,
        timeout=60,
    )
    if not response.ok:
        raise HTTPException(502, f"Configured Copilot endpoint returned HTTP {response.status_code}: {response.text[:500]}")

    data = response.json()
    answer = ((data.get("choices") or [{}])[0].get("message") or {}).get("content", "").strip()
    if not answer:
        raise HTTPException(502, "Configured Copilot endpoint returned an empty response.")
    return answer, f"Copilot ({model or 'configured endpoint'})"

@app.post("/evaluate", response_model=EvaluateResponse)
def evaluate_prompt(payload: EvaluateRequest):
    initial_state: EvaluationState = {
        "user": payload.user,
        "department": payload.department,
        "target_app": payload.target_app,
        "prompt": payload.prompt,
        "context": {},
        "detected_entities": [],
        "risk_score": 0,
        "risk_tier": "Low",
        "top_factors": {},
        "active_policies": [],
        "matched_policy": None,
        "decision": "allowed",
        "verification_used": False,
        "verification_reasoning": "",
        "explanation": "",
        "workflow_path": [],
        "node_reasoning": {},
        "requires_human_review": False,
        "redacted_prompt": None,
        "routed_model": None,
        "output_validation_passed": None,
        "dynamic_agents_executed": []
    }

    # Execute LangGraph orchestrator graph pipeline
    final_state = evaluation_graph.invoke(initial_state)

    raw_entities = final_state.get("detected_entities", [])
    detected_entities = [
        DetectedEntity(type=item["type"], match=item["match"])
        for item in raw_entities
    ]

    return EvaluateResponse(
        risk_score=final_state.get("risk_score", 0),
        risk_tier=final_state.get("risk_tier", "Low"),
        detected_entities=detected_entities,
        matched_policy=final_state.get("matched_policy"),
        decision=final_state.get("decision", "allowed"),
        workflow_path=final_state.get("workflow_path", []),
        explanation=final_state.get("explanation", ""),
        verification_used=final_state.get("verification_used", False),
        top_factors=final_state.get("top_factors"),
        requires_human_review=final_state.get("requires_human_review", False),
        redacted_prompt=final_state.get("redacted_prompt"),
        routed_model=final_state.get("routed_model")
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
