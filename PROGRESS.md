# ShadowGuard Progress Log

- Phase 0: scaffold complete
- Phase 1: database schema & seeding complete
- Phase 2: REST API endpoints & postman collection complete
- Phase 3: JWT auth & RBAC complete
- Phase 4: frontend shell complete
- Phase 5: dashboard & activity page real data wired complete
- Phase 6: risk assessment & data security real data wired complete
- Phase 7: policies, audit logs & settings real data wired complete
- Phase 8: harness scaffolding complete
- Phase 8: harness scaffolding complete
- Phase 9: real detection engine complete
- Phase 10: risk scoring & langgraph orchestrator complete
- Phase 11: gemini verification agent, harness traces & frontend console complete
- Phase 12: ask shadowguard administrative chatbot complete
- Phase 13: full visual & UX polish complete
- Phase 14: final documentation & demo script complete - FULL BUILD COMPLETE
- Phase 15: public landing page & global light/dark theme system complete
  - Root route `/` moved to premium product landing page (Apple/Gemini aesthetic, generous whitespace, confident typography, framer-motion scroll animations, monochrome+accent palette).
  - Authenticated Dashboard relocated to `/dashboard`; updated all internal navigation, sidebar, topbar, and login redirects.
  - Implemented 6 required landing sections in order:
    1. Hero with headline, subheadline, prominent "Let's Go" button (routing to `/login`), and animated SVG orchestration graph.
    2. "The Problem" (3 short cards: Shadow AI risk, static governance drawbacks, blindspot auditing, using icons not paragraphs).
    3. "How ShadowGuard Works" (4-step visual: Ingest → Risk Analysis → Adaptive Decision → Audit).
    4. "Built For" (4 capability cards: Real-time monitoring, Explainable decisions, Configurable policies, Human-in-the-loop control).
    5. Final CTA repeating the "Let's Go" button.
    6. Minimal footer with system status indicator.
  - Built global light/dark theme system with `ThemeContext` & `useTheme`, localStorage persistence (`shadowguard_theme`), and OS preference (`prefers-color-scheme`) default.
  - Added animated `ThemeToggle` (Sun/Moon icons) to landing page nav, login page, and app `Topbar`.
  - Applied Tailwind `dark:` variants across `DashboardLayout`, `Card`, `Table`, `Modal`, `Sidebar`, `Topbar`, and `LoginPage`.
  - Touched files:
    - `frontend/src/context/ThemeContext.tsx` [NEW]
    - `frontend/src/components/ui/ThemeToggle.tsx` [NEW]
    - `frontend/src/pages/LandingPage.tsx` [NEW]
    - `frontend/src/App.tsx`
    - `frontend/src/layout/Sidebar.tsx`
    - `frontend/src/layout/Topbar.tsx`
    - `frontend/src/layout/DashboardLayout.tsx`
    - `frontend/src/pages/LoginPage.tsx`
    - `frontend/src/components/ui/Card.tsx`
    - `frontend/src/components/ui/Table.tsx`
    - `frontend/src/components/ui/Modal.tsx`
    - `PROGRESS.md`
- Phase 16: two-tier RBAC migration (admin & user) complete [BREAKING MIGRATION]
  - Migrated roles from three (`admin`, `analyst`, `viewer`) to exactly two (`admin` and `user`).
  - Updated `users` table schema: `role TEXT CHECK(role IN ('admin', 'user')) NOT NULL` and added `department TEXT CHECK(department IN ('Engineering', 'Marketing', 'HR', 'Finance', 'Product')) DEFAULT 'Engineering'`.
  - Implemented automatic database migration in `backend/src/db/connection.ts` to migrate existing legacy `analyst` and `viewer` accounts to `user` and upgrade SQLite table schema and check constraints safely.
  - Updated `backend/src/middleware/rbac.ts` to enforce validation for only `admin` and `user` roles.
  - Enforced route-level RBAC:
    - Admin-only routes: `/api/policies` (GET/PATCH), `/api/settings` (GET/PATCH), `/api/risk-assessments` (GET), `/api/data-security` (GET), `/api/audit-logs` (GET), `/api/dashboard/metrics` (GET), `/api/chatbot/query` (POST), `/api/harness-traces` (GET).
    - User-accessible routes: `/api/ai-interactions` (POST allows both admin and user to submit prompts/files; GET enforces user isolation where employees only view their own submission history and outcomes).
  - Updated `backend/src/db/seed.ts`: seeded admin accounts (`admin@shadowguard.local`) and 4 employee accounts (`alex.mercer`, `elena.rostova`, `david.chen`, `maya.patel` at `@shadowguard.local`) with departments.
  - Added `POST /api/auth/signup` endpoint: creates employee `user` role accounts only (name, email, password, department); rejects duplicate emails with 409 Conflict.
  - Touched files:
    - `backend/src/types/auth.types.ts`
    - `backend/src/db/schema.sql`
    - `backend/src/db/connection.ts`
    - `backend/src/middleware/rbac.ts`
    - `backend/src/routes/auth.routes.ts`
    - `backend/src/routes/audit.routes.ts`
    - `backend/src/routes/policies.routes.ts`
    - `backend/src/routes/settings.routes.ts`
    - `backend/src/routes/risk.routes.ts`
    - `backend/src/routes/data-security.routes.ts`
    - `backend/src/routes/interactions.routes.ts`
    - `backend/src/db/seed.ts`
- Phase 17: /login and /signup pages matching product design language complete
  - Rebuilt `/login` and created new `/signup` matching the landing page's visual language (confident typography, Framer Motion entrance animations, subtle mesh background, Lucide icons, full dark/light theme support).
  - Implemented JWT role decoding and redirection: `role="admin"` → `/dashboard`, `role="user"` → `/prompt`.
  - Added clean inline error handling for invalid credentials and duplicate emails (no browser alerts).
  - Created `/signup` with Name, Work Email, Department dropdown, Password, and Confirm Password fields; calls `POST /api/auth/signup`, auto-logs in, and routes to `/prompt`.
  - Created `/prompt` employee portal with prompt submission, optional file attachment, real-time DLP verdict inspection, and personal submission history.
  - Added role-based navigation in `Sidebar.tsx` displaying administrative views for admins and focused employee views for users.
  - Touched files:
    - `frontend/src/pages/LoginPage.tsx`
    - `frontend/src/pages/SignupPage.tsx` [NEW]
    - `frontend/src/pages/PromptPage.tsx` [NEW]
    - `frontend/src/App.tsx`
    - `frontend/src/layout/Sidebar.tsx`
- Phase 18: consumer employee /prompt page complete
  - Rebuilt `/prompt` as a standalone consumer-grade chat experience (ChatGPT/Claude aesthetic, generous spacing, modern typography, zero admin sidebar).
  - Slim top area with ShadowGuard logo, light/dark ThemeToggle, and user profile/logout menu (with shortcut to Admin Console for admin accounts).
  - Compact highlights strip (1-row glanceable banner, collapsible and dismissible, showing requests processed today, auto-approval %, and pulsing Adaptive Security Active badge).
  - Main scrollable chat history displaying current user's submissions (right-aligned user bubbles with target app and attachment chips, left-aligned ShadowGuard gateway status response bubbles).
  - Bottom input bar with auto-expanding textarea, paperclip icon supporting `.txt, .pdf, .png, .jpg, .docx`, attachment preview chip with remove action, and send button.
  - Multipart/form-data upload integrated with `POST /api/ai-interactions` storing files temporarily in `backend/uploads/` (gitignored).
- Phase 19: Socket.IO realtime plumbing complete
  - Server: attached Socket.IO server to Express HTTP server on port 4000 with CORS.
  - Room routing: on connection, client emits `"identify"` with JWT; server validates and routes to `"admin-room"` (if admin) or `"user-<userId>"` (if user).
  - Event helpers: defined `emitNewInteraction` (broadcast to `admin-room`) and `emitInteractionStatusUpdate` (sent to specific user room).
  - Client: created `SocketContext` and `SocketProvider` wrapping application, auto-identifying on login and disconnecting on logout.
  - Dashboard subscription: `DashboardPage.tsx` listens for `new-interaction` to prepend alerts and increment live counters.
  - Prompt subscription: `/prompt` subscribes to `interaction-status-update` and updates analyzing/pending bubbles in place.
- Phase 20: dynamic agent orchestration layer & agent selector complete
  - Pre-Implementation Harness State Audit:
    - Step-by-step pipeline analysis:
      1. `context_node`: Resolves metadata (`user`, `department`, `target_app`, `session_type`).
      2. `sensitivity_node`: Scans prompt text across PII, SourceCode, Financial, and Confidential detectors via `analyze_prompt`.
      3. `risk_node`: Computes numerical risk score (0-100), risk tier (Low, Medium, High, Critical), and factor weights via `calculate_risk_score`.
      4. `policy_node`: Fetches active policies from Express API `/api/policies` and matches rules against detected entities/keywords; updates score if policy triggers.
      5. `decision_node`: Assigns verdict (`allowed`, `restricted`, `blocked`), conditionally invokes Gemini Pro verification agent if High/Critical, and compiles explanation trace.
    - Graph Topology & Branching Confirmation:
      - The previous pipeline was a strictly FIXED sequence. The LangGraph edges were hardcoded:
        `context_node -> sensitivity_node -> risk_node -> policy_node -> decision_node -> END`.
      - Every request executed the identical 5 nodes in the exact same linear order regardless of risk tier or payload contents.
  - Implemented Specialized Agent Registry (`harness/agents/agent_registry.py`):
    - `redaction_agent`: Masks detected sensitive entity values in a sanitized prompt copy (`[REDACTED:<TYPE>]`). Minimum risk tier: Medium.
    - `output_validation_agent`: Evaluates response streams for unauthorized data leakage or exfiltration. Minimum risk tier: High.
    - `approval_routing_agent`: Flags critical requests as requiring human compliance sign-off instead of auto-finalizing. Minimum risk tier: Critical.
    - `restricted_model_routing_agent`: Enforces model diversion from public cloud endpoints to sanctioned internal enclaves (`Internal-Secure-LLM`). Minimum risk tier: High.
  - Implemented Dynamic Agent Selector (`harness/orchestrator/agent_selector.py`):
    - Evaluates live runtime state (`risk_tier`, `detected_entities`, `matched_policy`) to compute a variable-length, variable-content execution list.
    - Low: `[]` (empty list; core baseline suffices).
    - Medium: `['redaction_agent']` only if `detected_entities` is non-empty; empty list if no entities.
    - High: `['redaction_agent', 'output_validation_agent', 'restricted_model_routing_agent']` (drops redaction if no entities).
    - Critical: `['redaction_agent', 'output_validation_agent', 'approval_routing_agent']` (drops redaction if no entities).
  - Integrated Dynamic Orchestration Node into LangGraph Pipeline (`harness/orchestrator/graph.py`):
    - Added `dynamic_agent_node` executing selected agents sequentially, accumulating outputs, and appending agent names to `workflow_path`.
    - Added explicit `requires_human_review`: boolean (true whenever risk tier is Medium, High, or Critical; false for Low).
    - Updated `harness/main.py` schema with `requires_human_review`, `redacted_prompt`, and `routed_model`.
    - Adjusted risk tier mapping in `harness/risk/scoring.py` to ensure critical credential exposures map cleanly to `Critical`.
  - Frontend Trace Viewer Visual Separation (`WorkflowGraphViewer.tsx`):
    - Visually separates "Core Pipeline Steps" (cyan/emerald badges, check icons, fixed baseline label) from "Dynamically Selected Agents" (purple/indigo/amber/rose badges, specialized icons, dynamic agent tags).
    - Real-time legend displays exact count of core steps vs. dynamic agents dispatched at runtime.
  - Touched files:
    - `harness/agents/agent_registry.py` [NEW]
    - `harness/orchestrator/agent_selector.py` [NEW]
    - `harness/orchestrator/state.py`
    - `harness/orchestrator/graph.py`
    - `harness/risk/scoring.py`
    - `harness/main.py`
    - `backend/src/services/harnessClient.ts`
    - `frontend/src/components/harness/WorkflowGraphViewer.tsx`
    - `PROGRESS.md`

### Phase 20 End-to-End Verification: Workflow Path Comparison Across Tiers

| Tier | Score | Decision | Requires Review | Workflow Path Length | Resulting Workflow Path |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Low** | 10 | `allowed` | `false` | 5 | `['context_node', 'sensitivity_node', 'risk_node', 'policy_node', 'decision_node']` |
| **Medium** | 54 | `restricted` | `true` | 6 | `['context_node', 'sensitivity_node', 'risk_node', 'policy_node', 'decision_node', 'redaction_agent']` |
| **High** | 72 | `restricted` | `true` | 8 | `['context_node', 'sensitivity_node', 'risk_node', 'policy_node', 'decision_node', 'redaction_agent', 'output_validation_agent', 'restricted_model_routing_agent']` |
| **Critical** | 79 | `blocked` | `true` | 8 | `['context_node', 'sensitivity_node', 'risk_node', 'policy_node', 'decision_node', 'redaction_agent', 'output_validation_agent', 'approval_routing_agent']` |

*Verification notes:*
- **Low Risk** executes strictly the 5 core baseline nodes with zero dynamic agent overhead and `requires_human_review = false`.
- **Medium Risk** dynamically injects `redaction_agent`, producing a sanitized prompt (`[REDACTED:PII]`).
- **High Risk** dynamically dispatches 3 agents (`redaction_agent`, `output_validation_agent`, `restricted_model_routing_agent`), securely diverting execution to `Internal-Secure-LLM`.
- **Critical Risk** dynamically dispatches 3 agents (`redaction_agent`, `output_validation_agent`, `approval_routing_agent`), triggering exfiltration containment and human compliance quarantine.
- High and Critical paths are distinct in content (`restricted_model_routing_agent` vs `approval_routing_agent`), while Low (5) and Medium (6) differ in length.




## Verification Record (Phase 10 & 11 Evaluation Output)

### Prompt 1 (Low Risk - Marketing / Internal Copilot):
```json
{
  "risk_score": 10,
  "risk_tier": "Low",
  "detected_entities": [],
  "matched_policy": null,
  "decision": "allowed",
  "workflow_path": [
    "context_node",
    "sensitivity_node",
    "risk_node",
    "policy_node",
    "decision_node"
  ],
  "explanation": "Decision: ALLOWED (Risk Score: 10/100, Tier: Low). Policy Evaluation: Clean (No policy rules violated). Pipeline Reasoning Trace: context_node: Resolved department metadata for 'Marketing' and target app baseline for 'Internal Copilot'. -> sensitivity_node: Scanned prompt text; detected 0 sensitive entity match(es). -> risk_node: Calculated baseline risk score 10/100 (Low tier). -> policy_node: Evaluated against active organizational policies; zero policy violations. -> decision_node: Assigned final decision: ALLOWED..",
  "verification_used": false,
  "top_factors": {
    "user_role_contribution": 7.5,
    "data_sensitivity_contribution": 0.0,
    "endpoint_trust_contribution": 3.0,
    "policy_match_contribution": 0.0
  }
}
```

### Prompt 2 (Medium/High Risk - Finance / ChatGPT):
```json
{
  "risk_score": 72,
  "risk_tier": "High",
  "detected_entities": [
    {
      "type": "Financial",
      "match": "EBITDA Mention: EBITDA"
    }
  ],
  "matched_policy": "Financial Data Restriction",
  "decision": "restricted",
  "workflow_path": [
    "context_node",
    "sensitivity_node",
    "risk_node",
    "policy_node",
    "decision_node"
  ],
  "explanation": "Decision: RESTRICTED (Risk Score: 72/100, Tier: High). Triggered Policy: Financial Data Restriction. Pipeline Reasoning Trace: context_node: Resolved department metadata for 'Finance' and target app baseline for 'ChatGPT'. -> sensitivity_node: Scanned prompt text; detected 1 sensitive entity match(es). -> risk_node: Calculated baseline risk score 55/100 (Medium tier). -> policy_node: Triggered active policy 'Financial Data Restriction'. -> decision_node: Assigned final decision: RESTRICTED.. Agent Verification: [Gemini Pro Verification Agent]: Confirmed High severity. Verified prompt content against 1 sensitivity match(es) and organizational risk threshold.",
  "verification_used": true,
  "top_factors": {
    "user_role_contribution": 16.25,
    "data_sensitivity_contribution": 24.5,
    "endpoint_trust_contribution": 14.0,
    "policy_match_contribution": 17.0
  }
}
```

### Prompt 3 (Critical / Blocked Risk - Engineering / ChatGPT):
```json
{
  "risk_score": 79,
  "risk_tier": "High",
  "detected_entities": [
    {
      "type": "SourceCode",
      "match": "AWS Access Key: AKIA1234567890ABCDEF"
    },
    {
      "type": "SourceCode",
      "match": "Internal Repo Path: auth-service/prod"
    }
  ],
  "matched_policy": "Source Code Guard",
  "decision": "blocked",
  "workflow_path": [
    "context_node",
    "sensitivity_node",
    "risk_node",
    "policy_node",
    "decision_node"
  ],
  "explanation": "Decision: BLOCKED (Risk Score: 79/100, Tier: High). Triggered Policy: Source Code Guard. Pipeline Reasoning Trace: context_node: Resolved department metadata for 'Engineering' and target app baseline for 'ChatGPT'. -> sensitivity_node: Scanned prompt text; detected 2 sensitive entity match(es). -> risk_node: Calculated baseline risk score 62/100 (Medium tier). -> policy_node: Triggered active policy 'Source Code Guard'. -> decision_node: Assigned final decision: BLOCKED.. Agent Verification: [Gemini Pro Verification Agent]: Confirmed High severity. Verified prompt content against 2 sensitivity match(es) and organizational risk threshold.",
  "verification_used": true,
  "top_factors": {
    "user_role_contribution": 15.0,
    "data_sensitivity_contribution": 33.25,
    "endpoint_trust_contribution": 14.0,
    "policy_match_contribution": 17.0
  }
}
```

- Phase 23: How ShadowGuard Works interactive admin guide & quick tour complete
  - Added an interactive, visual **"How ShadowGuard Works"** guide section at the top of the admin Dashboard page (`/dashboard`), adapting the Admin User Manual's page-by-page guide into a visual walkthrough.
  - Interactive Step-Carousel (`AdminGuideSection.tsx`):
    - 6 feature topics matching core platform capabilities: *Dashboard & Live Review Queue*, *Dynamic Harness Console*, *Policy Governance Engine*, *Ask ShadowGuard Assistant*, *Data Security & DLP Auditing*, and *Immutable Audit Ledger*.
    - Each feature entry includes a short 1-2 sentence explanation + a custom mini animated SVG diagram (`MiniDiagrams.tsx` — e.g., animated node execution path `Context → Sens → Risk → Policy → Agents → Decision` for Harness Console, interactive quarantine funnel for pending reviews, shield toggles for policies).
  - Dismissal & Topbar Integration:
    - Collapsible/dismissible section with per-admin persistence stored in `localStorage` (`shadowguard_admin_guide_dismissed`).
    - Added a small `?` (`HelpCircle`) icon button in `Topbar.tsx` next to `ThemeToggle` for `admin` role users; clicking it fires a custom window event (`open-admin-guide`) to re-open and scroll to the guide section seamlessly.
  - Interactive Guided Spotlight Tour (`QuickTourOverlay.tsx`):
    - Added a **"Take a quick tour"** button launching an interactive spotlight overlay.
    - Sequentially highlights each sidebar navigation item (`/dashboard`, `/prompt`, `/activity`, `/risk`, `/data-security`, `/policies`, `/harness`, `/chatbot`, `/audit`, `/settings`) with a glowing border and step tooltip card (`Step X of 10`, title, description, Back/Next/Skip controls, keyboard shortcuts).
  - Premium Visual Consistency: Matches Phase 19's landing page visual language (Apple/Gemini aesthetic, dark mesh gradient accents, Framer Motion animations, Lucide icons, full dark/light theme support).
  - Touched files:
    - `frontend/src/components/dashboard/MiniDiagrams.tsx` [NEW]
    - `frontend/src/components/dashboard/AdminGuideSection.tsx` [NEW]
    - `frontend/src/components/dashboard/QuickTourOverlay.tsx` [NEW]
    - `frontend/src/layout/Topbar.tsx`
    - `frontend/src/layout/Sidebar.tsx`
    - `frontend/src/pages/DashboardPage.tsx`
    - `PROGRESS.md`
  - Upgraded the "Ask ShadowGuard" chatbot into a persistent, Intercom/Crisp-style floating slide-out panel accessible across all administrative views in the Admin Dashboard (`DashboardLayout.tsx`), while preserving the full standalone page at `/chatbot`.
  - Floating Action Button (FAB): Fixed in the bottom-right corner (`bottom-6 right-6 z-50`) with an animated gradient background, glowing indicator badge, and smooth Framer Motion open/close transitions.
  - Expanded Grounded Context (`backend/src/routes/chatbot.routes.ts`):
    - **Live Pending Review Queue State**: Included live pending items (`status = 'pending_review'`), total pending count, department breakdowns, and riskiest pending request details (allowing queries like *"What's waiting for my review right now?"* or *"Summarize the riskiest pending request"*).
    - **Specific Harness Trace Plain-English Explanation**: Detects requested interaction/trace IDs via regex (`#482`, `interaction 482`, `trace 482`) or payload parameters; fetches specific `harness_traces`, `ai_interactions`, `risk_assessments`, and `data_security_logs` to explain pipeline workflow paths, agent actions, detected DLP patterns, and decision rationale in plain English.
  - Multi-Turn Session Memory: Preserves and passes the last ~10 conversation turns in the request context payload so follow-up queries maintain conversational state.
  - Dynamic Suggested Follow-Up Chips: Evaluates query and response context to generate 2-3 dynamic follow-up chips below each assistant message.
  - Response Formatting & Safety Disclaimer:
    - Built `FormattedMarkdown.tsx` to render markdown responses (bold text, bullet points, headers, inline code, and tables).
    - Added context sources badges (`Database` icon + pills).
    - Rendered mandatory advisory footer: `"AI-generated, verify before acting — Read-only Advisory"`.
  - Touched files:
    - `backend/src/routes/chatbot.routes.ts`
    - `frontend/src/services/api.ts`
    - `frontend/src/components/ui/FormattedMarkdown.tsx` [NEW]
    - `frontend/src/components/admin/AdminChatbotWidget.tsx` [NEW]
    - `frontend/src/layout/DashboardLayout.tsx`
    - `frontend/src/pages/ChatbotPage.tsx`
    - `PROGRESS.md`
  - Connected Phase 18/21 (User Prompt Page), Phase 19/22 (Socket.IO realtime rooms & event emission), and Phase 20/23 (LangGraph Dynamic Harness Orchestrator) into an end-to-end live governance loop.
  - Backend Changes to `POST /api/ai-interactions`:
    1. Initial record saved immediately with `status="analyzing"` and `decision="pending"`.
    2. Invokes Python FastAPI Harness `/evaluate` via `harnessClient`.
    3. Low Risk (`requires_human_review = false`):
       - Immediately sets `status="allowed"`, `decision="allowed"`.
       - Emits `"interaction-status-update"` directly to the submitting user's socket room (`user-${userId}`) with the final decision and explanation.
       - Emits `"new-interaction"` to `"admin-room"` with `auto_approved: true` and `needs_action: false` so admins maintain full visibility without cluttering actionable queues.
    4. Elevated Risk (`requires_human_review = true` for Medium, High, and Critical tiers):
       - Sets `status="pending_review"`, `decision="pending"`, and saves `suggested_decision` (e.g. `restrict` or `block`) and risk score without finalizing outcome.
       - Emits `"new-interaction"` to `"admin-room"` flagged with `needs_action: true` to instantly populate the admin's live review queue without a page reload.
       - Emits `"interaction-status-update"` to `user-${userId}` with `status="pending_review"`, transitioning the user's bubble to `"Under security review..."`.
  - New Admin Review Endpoint `PATCH /api/ai-interactions/:id/review`:
    - Role-protected (`admin` only).
    - Accepts `{ decision: "allowed" | "rejected", note?: string }`.
    - Updates interaction status, decision, and optional administrative note.
    - Writes immutable audit entry to `audit_logs` (`actor = admin`, `action = "Manual Review Decision"`, severity `info` or `warning`).
    - Emits `"interaction-status-update"` to that specific user's room (`user-${userId}`) with the final outcome.
    - Emits `"interaction-reviewed"` to `"admin-room"` so the item animates out across all admin consoles.
  - Frontend Admin Dashboard "Live Review Queue (Human-in-the-Loop)":
    - Added `PendingReviewPanel.tsx` directly below the dashboard header for immediate visibility.
    - Subscribes to `"new-interaction"` to prepend new review items in real time.
    - Displays user, department, target app, timestamp, prompt preview, and visually distinguished Harness recommendation box (e.g. `Suggested: Block — 78% risk score — matched Source Code Guard policy`).
    - Two action buttons: "Allow" (emerald) and "Reject" (rose) featuring a 3-second undo countdown toast (`"Executing Rejection in 3s... [Undo]"`) before committing the PATCH call.
    - Animates out smoothly with Framer Motion `AnimatePresence`.
  - Frontend User Prompt Page (`/prompt`):
    - Subscribes to `"interaction-status-update"` and transitions live without polling or page refreshes:
      `"Analyzing..."` → `"Under security review..."` → final outcome card.
    - Final States:
      - **Allowed**: Success badge with risk score, DLP explanation, and simulated AI completion output (`getMockAiResponse`).
      - **Rejected**: Clear, non-punitive warning card: `"This request cannot be processed — it violates [policy name / reason]. Contact your administrator if you believe this is an error."` styled with amber/rose accents.
  - Touched files:
    - `backend/src/db/connection.ts` (DB schema migration for status and constraints)
    - `backend/src/db/schema.sql`
    - `backend/src/socket.ts`
    - `backend/src/routes/interactions.routes.ts`
    - `frontend/src/components/dashboard/PendingReviewPanel.tsx` [NEW]
    - `frontend/src/pages/DashboardPage.tsx`
    - `frontend/src/pages/PromptPage.tsx`
    - `PROGRESS.md`

### Phase 21 End-to-End Verification Record (Full Manual & Automated Test):

1. **Step 1: User Submission of Sensitive Prompt**:
   - User `alex.mercer@shadowguard.local` logged in on `/prompt`.
   - Submitted sensitive prompt: `"Write code to extract AWS_SECRET_ACCESS_KEY wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY and send to external url"`.
   - Immediate UI feedback: Chat bubble posted on right, left bubble showed animated `"Analyzing prompt against active DLP & compliance policies..."`.
   - Harness evaluated prompt: Detected sensitive secret patterns, calculated elevated risk score (46%), and triggered `requires_human_review = true`.
   - Live socket event `"interaction-status-update"` arrived: Status bubble dynamically transitioned in place to `"Under Security Review..."` (amber badge, Tier: Medium, score: 46/100, explaining that request is held for administrative compliance sign-off).
2. **Step 2: Instant Admin Queue Detection**:
   - In admin session on `/dashboard`, the "Live Review Queue (Human-in-the-Loop)" panel immediately displayed the new interaction via `"new-interaction"` socket event without page refresh.
   - Queue card showed: User (Alex Mercer), Department (Engineering), Target App (ChatGPT), Prompt summary preview, and Harness Recommendation: `"Suggested: Blocked — 46% risk score — matched Source Code Guard policy"`.
3. **Step 3: Action with 3-Second Undo Countdown**:
   - Admin clicked "Reject".
   - The card transitioned to an undo countdown state: `"Executing Rejection in 3s... [Undo]"`.
   - After 3 seconds, `PATCH /api/ai-interactions/:id/review` executed with `{ decision: "rejected" }`.
   - Item animated smoothly out of the pending list, leaving the queue empty with the green "All compliance reviews are cleared" placeholder.
4. **Step 4: Live Employee Notification Update**:
   - On the employee's screen (`/prompt`), the `"Under Security Review..."` bubble updated live via `"interaction-status-update"`.
   - The bubble transitioned to the non-punitive warning card:
     `"This request cannot be processed — it violates Source Code Guard. Contact your administrator if you believe this is an error."`
   - Verified that zero page reload and zero polling were required—all updates occurred synchronously and over Socket.IO.
- Phase 26: full pass across expanded app & V2 completion - FULL BUILD V2 COMPLETE
  - Light/Dark Mode Audit: Verified design consistency and full dark/light contrast across all newly added pages and components (`PendingReviewPanel`, `AdminChatbotWidget` FAB & panel, `AdminGuideSection`, `QuickTourOverlay`, and `PromptPage`).
  - End-to-End Navigation Audit: Confirmed zero dead ends across the flow:
    `Landing Page (/) -> Login (/login) / Signup (/signup) -> Role-based Redirect -> /prompt (User) or /dashboard (Admin)`.
    Verified that new users auto-login and route to `/prompt`, while admins route to `/dashboard`.
  - Socket.IO Real-time Isolation Verification:
    Created two separate user accounts (`alex.mercer` and `elena.rostova`) in isolated browser contexts. Confirmed that when Alex submits a prompt, `interaction-status-update` is targeted strictly to `user-${alexUserId}` and Elena receives zero cross-user event leakage.
  - Prompt Page File Upload Validation & Progress:
    - Added max file size check (25MB limit) and file format filter (`.txt, .pdf, .png, .jpg, .docx`).
    - Displays dynamic top error bar with `AlertTriangle` icon and close button for oversized or unsupported files.
    - Integrated real-time `uploadProgress` percentage bar during file transmission via Axios `onUploadProgress`.
  - Code Cleanup: Removed leftover debug buttons and console logs.
  - Documentation Updates:
    - Rewrote `README.md` to document the 2-tier RBAC architecture, employee prompt experience, real-time Human-in-the-Loop governance, and project subservices.
    - Rewrote `DEMO_SCRIPT.md` to structure the 5-minute live viva demonstration around the new V2 flow:
      Landing page → Signup as employee → Submit risky prompt → Switch to admin login → Show live review queue arrival → Reject with 3s undo countdown → Switch back to show employee's live rejection warning card.
  - Touched files:
    - `frontend/src/pages/PromptPage.tsx`
    - `frontend/src/components/dashboard/PendingReviewPanel.tsx`
    - `frontend/src/components/dashboard/AdminGuideSection.tsx`
    - `frontend/src/components/admin/AdminChatbotWidget.tsx`
    - `README.md`
    - `DEMO_SCRIPT.md`
    - `PROGRESS.md`
