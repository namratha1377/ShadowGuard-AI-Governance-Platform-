# ShadowGuard: Adaptive AI Governance Platform

ShadowGuard is an AI governance platform designed to provide a controlled interface between employees and external AI services. It evaluates prompts before they reach an AI provider, applies security and policy controls, and provides authorized administrators with governance information for reviewing potentially risky interactions.

The project focuses on adaptive prompt evaluation, confidential-data protection, role-based access control, and controlled AI response generation through Google's Gemini API.

The primary research contribution is the **Adaptive Secure AI Harness (ASAH)**, an orchestration layer designed to select and apply appropriate security evaluation and verification workflows based on request context and risk.

## Overview

ShadowGuard separates the employee-facing AI experience from administrator-facing security and governance information.

The request-processing workflow is designed to:

1. Authenticate incoming requests and associate them with the relevant user.
2. Evaluate prompts for potentially sensitive information, including personally identifiable information (PII), financial information, confidential organizational data, and secrets.
3. Apply configured security policies to determine whether a request can proceed.
4. Restrict or flag requests that require blocking or further review.
5. Keep detailed risk assessments, policy evaluations, and internal security metadata available only to authorized administrators.
6. Check generated responses before returning them to employees.

This approach aims to reduce accidental disclosure of sensitive information while maintaining a usable AI interaction experience.

## Key Features

- **Adaptive prompt evaluation:** Evaluates incoming prompts using security detection, risk assessment, and policy logic.
- **Confidential-data protection:** Identifies potentially sensitive requests before they are sent to the configured AI provider.
- **Role-based access control (RBAC):** Separates employee capabilities from administrator privileges.
- **Administrator governance console:** Provides authorized administrators with access to risk assessments, policy information, audit records, and review workflows.
- **Human-in-the-loop review:** Supports handling requests that require additional review.
- **Gemini integration:** Uses Google's Gemini API for AI response generation.
- **Output security checks:** Applies response validation before returning generated content.
- **Real-time communication:** Uses Socket.IO for communication and status updates between the backend and clients.

## System Architecture

ShadowGuard is organized as a monorepo containing three primary services.

| Component | Technologies | Default Port | Responsibility |
|---|---|---:|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS | 5173 | Employee interface and administrator console |
| Backend | Node.js, Express.js, TypeScript, Socket.IO, SQLite | 4000 | API gateway, authentication, access control, persistence, and real-time communication |
| Adaptive Security Harness | Python, FastAPI, Uvicorn, LangGraph, Presidio, Gemini | 8000 | Prompt evaluation, risk assessment, security orchestration, and AI generation |

### Request Flow

The following flow illustrates how ShadowGuard processes employee requests and separates security evaluation from administrator governance.

```text
                    EMPLOYEE
                        |
                        v
                 REACT FRONTEND
                        |
                        v
                 EXPRESS BACKEND
                        |
                        v
             AUTHENTICATION AND RBAC
                        |
                        v
            ADAPTIVE SECURE AI HARNESS
                        |
                        v
               PROMPT EVALUATION
                        |
                        v
                 POLICY DECISION
                  /           \
                 /             \
                v               v
             ALLOWED       RESTRICTED /
                |            BLOCKED
                v               |
          GEMINI API             v
                |          EMPLOYEE-SAFE
                v             STATUS
        OUTPUT SECURITY
             CHECKS
                |
                v
       EMPLOYEE-SAFE RESPONSE


       ADMINISTRATOR WORKFLOW

          ADMINISTRATOR
                |
                v
       ADMINISTRATOR CONSOLE
                |
                v
       GOVERNANCE INFORMATION
                |
                +-- Risk Assessments
                +-- Policy Evaluation
                +-- Audit Records
                +-- Security Events
                +-- Review Workflows
                +-- Harness Traces
```

**How it works:** Employee prompts pass through authentication and security evaluation before a policy decision determines whether they can proceed. Permitted requests are sent to Gemini and checked before the response is returned. Restricted requests receive an appropriate status or response. Detailed governance information is intended for authorized administrators only.


## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | Building the user interface |
| TypeScript | Type-safe frontend development |
| Vite | Development server and build tooling |
| Tailwind CSS | Styling and responsive layouts |
| Socket.IO Client | Real-time communication with the backend |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API and application gateway |
| TypeScript | Type-safe backend development |
| Socket.IO | Real-time communication |
| SQLite | Application data persistence |
| better-sqlite3 | SQLite database integration |
| JSON Web Tokens (JWT) | Token-based authentication and authorization |

### Adaptive Secure AI Harness

| Technology | Purpose |
|---|---|
| Python 3.10+ | Harness runtime |
| FastAPI | API layer for the security harness |
| Uvicorn | ASGI server |
| LangGraph | Workflow orchestration |
| Microsoft Presidio | PII detection and analysis |
| Google Gemini API | AI response generation |
| Pydantic | Request and response validation |

## Security and Governance

### Adaptive Prompt Evaluation

The harness evaluates incoming prompts using the security checks and risk-assessment logic configured in the application.

The evaluation workflow is designed to consider:

- Personally identifiable information
- Financial information
- Confidential organizational information
- Credentials, API keys, and other secrets
- Risk scores and risk levels
- Policy evaluation results
- Requests that require additional review

The final decision depends on the evaluation results and the policies configured in the system.

### Role-Based Access Control

ShadowGuard separates employee-facing functionality from administrator-facing governance capabilities.

**Employee functionality**
- Submit prompts for AI-assisted tasks.
- Receive permitted AI responses.
- View request status and permitted interaction history.

**Administrator functionality**
- Review risk assessments and policy evaluation details.
- Access available audit records and security events.
- Review requests requiring human intervention.
- Inspect available harness and orchestration information.

Detailed governance information is intended for authorized administrators rather than ordinary employee accounts.

### Confidential-Data Protection

The system is designed to restrict requests that attempt to obtain sensitive organizational information, such as employee salary details or personal employee records.

It distinguishes between the presence of a potentially sensitive word and the context in which that word is used. For example, mentioning `password` in a legitimate programming request should not automatically result in a block.

### Gemini Integration

The current implementation uses Google's Gemini API for AI response generation.

- Provider credentials are configured on the server side.
- The frontend should not contain or expose the Gemini API key.
- The model can be configured through the harness environment.
- Additional AI providers are potential future extensions.

## Repository Structure

```text
ShadowGuard-AI-Governance-Platform/
├── frontend/
│   └── React employee and administrator interfaces
├── backend/
│   └── Express API, authentication, RBAC, database, and Socket.IO
├── harness/
│   └── Python security evaluation and AI orchestration service
├── docker-compose.yml
├── package.json
├── RUN_GEMINI.md
├── DEMO_SCRIPT.md
├── PROGRESS.md
└── README.md
```

## Getting Started

The following instructions describe a local development setup using separate terminals for the frontend, backend, and harness.

### Prerequisites

Install:

- Node.js 18 or later
- npm
- Python 3.10 or later
- pip
- A Google Gemini API key

### 1. Configure the Environment

Create the required local environment files. Do not commit credentials or secrets to version control.

**Harness configuration — `harness/.env`**

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_configured_gemini_model
PORT=8000
```

**Backend configuration — `backend/.env`**

```env
PORT=4000
JWT_SECRET=your_local_jwt_secret
HARNESS_URL=http://localhost:8000
```

Use the environment variable names and values expected by the current application configuration. Replace the example values with your local configuration.

### 2. Install Dependencies

Run the following commands from the repository root in PowerShell.

Install the root dependencies:

```powershell
npm install
```

Install the frontend dependencies:

```powershell
cd frontend
npm install
cd ..
```

Install the backend dependencies:

```powershell
cd backend
npm install
cd ..
```

Create and activate the Python virtual environment:

```powershell
cd harness
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate
cd ..
```

If PowerShell prevents virtual-environment activation, review your local PowerShell execution policy rather than changing system-wide security settings unnecessarily.

### 3. Initialize the Database

From the repository root:

```powershell
cd backend
npm run db:seed
cd ..
```

This runs the backend's database seed script to initialize the schema and seed data defined by the project.

### 4. Start the Application

Open three separate terminals.

**Terminal 1 — Adaptive Security Harness**

```powershell
cd harness
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --port 8000
```

**Terminal 2 — Backend**

```powershell
cd backend
npm run dev
```

**Terminal 3 — Frontend**

```powershell
cd frontend
npm run dev
```

Keep all three services running while using the application.

### 5. Access the Local Services

| Service | Local URL |
|---|---|
| Frontend | [http://localhost:5173](http://localhost:5173) |
| Backend | [http://localhost:4000](http://localhost:4000) |
| Harness | [http://localhost:8000](http://localhost:8000) |
| Harness health check | [http://localhost:8000/health](http://localhost:8000/health) |
| Harness API documentation | [http://localhost:8000/docs](http://localhost:8000/docs) |

These addresses are for local development and are not publicly accessible deployment URLs.

## Verification and Testing

The harness health endpoint can be used to verify that the Python service is running:

```text
http://localhost:8000/health
```

The FastAPI documentation is available at `/docs` while the harness is running.

Test the application with both permitted and restricted requests.

| Test Scenario | Expected Behavior |
|---|---|
| General programming request | A response is returned when the request passes the configured checks |
| General informational request | A response is returned when permitted by the configured policies |
| Request for sensitive employee salary information | The request is restricted or sent for review, depending on the configured policy |
| Request for private employee details | The request is restricted or sent for review, depending on the configured policy |
| Request to disclose credentials or secrets | The request is restricted or blocked |
| Legitimate programming request containing words such as `username` or `password` | The request can proceed when the evaluation determines that it does not violate the configured policies |

Actual results depend on the implementation, configuration, and policies in use. These scenarios describe intended verification behavior rather than a claim that every possible case has been tested.

## Security Considerations

ShadowGuard demonstrates security controls for an AI governance workflow. It should not be considered production-ready solely because the local services run successfully.

Before deploying the system in a real organization:

- Store API keys and other credentials in a suitable secrets-management system.
- Use strong, unique secrets and rotate them when necessary.
- Enforce authorization on the backend for every protected endpoint; do not rely on frontend visibility controls alone.
- Protect administrator accounts and governance endpoints.
- Validate and sanitize inputs and outputs where appropriate.
- Configure production CORS, network access, and transport security.
- Protect audit records and sensitive governance metadata.
- Test authentication, authorization, policy enforcement, and failure handling.
- Review data retention and privacy requirements before storing prompts or generated responses.

## Research Contribution: Adaptive Secure AI Harness

The **Adaptive Secure AI Harness (ASAH)** is the primary research contribution of ShadowGuard.

It provides an orchestration layer intended to select and apply appropriate security evaluation, verification, and governance workflows based on the context and risk characteristics of an AI request.

Rather than treating AI governance as a simple prompt filter, the research explores how multiple security checks and workflow decisions can be coordinated within a controlled AI interaction pipeline.

The project investigates the integration of adaptive orchestration, sensitive-data detection, risk assessment, policy enforcement, and administrator oversight into an enterprise-oriented AI governance platform.

## Future Development

Potential areas for further development include:

- Expanded administrator dashboards and risk visualizations
- Integration with additional AI providers
- More configurable governance policies
- Enhanced security verification workflows
- Expanded audit and compliance capabilities
- Additional adaptive orchestration strategies
- More comprehensive automated testing
- Deployment hardening and operational monitoring

These are future development areas and should not be interpreted as completed features unless implemented.

## Academic Context

ShadowGuard is an academic and research project focused on enterprise AI governance, secure generative AI adoption, and responsible use of AI services.

The Adaptive Secure AI Harness forms the central research contribution by exploring how security and verification workflows can be selected and orchestrated according to request context and risk.

The project demonstrates an approach to placing governance controls between employees and generative AI services while keeping detailed security information available to authorized administrators.

## License and Usage

This repository is intended for academic, research, and demonstration purposes.

No specific open-source license is declared in this README. Unless a license file is added to the repository, others should not assume that the source code is released under an open-source license.
