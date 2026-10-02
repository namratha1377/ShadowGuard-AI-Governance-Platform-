# ShadowGuard: Adaptive AI Governance Platform

ShadowGuard is an enterprise AI governance platform designed to provide a controlled interface between employees and external AI services. The platform evaluates prompts before they are sent to an AI provider, applies security and policy controls, and records governance activity for authorized administrators.

The current implementation focuses on adaptive prompt evaluation, confidential-data protection, role-based access control, and controlled Gemini-based response generation.

## Overview

ShadowGuard separates employee-facing AI interaction from administrator-facing governance information.

For an employee request:

1. The request is authenticated and associated with the employee.
2. The ShadowGuard harness evaluates the prompt for sensitivity, confidential information, personally identifiable information, financial information, and secrets.
3. Requests that satisfy the configured security policies can be sent to the configured AI provider.
4. Confidential or restricted requests are prevented from being sent to the model and are presented to the employee with a limited status such as `In Review` or `Blocked`.
5. Governance metadata such as risk scores, policy matches, detected entities, workflow details, and internal security reasoning is reserved for authorized administrator views.
6. Generated responses are checked before being returned to the employee.

This separation is intended to reduce accidental disclosure of organizational governance information while maintaining a usable AI interface for legitimate requests.

## Architecture

The repository is organized as a monorepo containing three primary services.

| Component | Technology | Default Port | Responsibility |
| --- | --- | --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS | 5173 | Employee prompt interface and administrator console |
| Backend | Node.js, Express, TypeScript, Socket.IO, SQLite | 4000 | Authentication, RBAC, API gateway, persistence, and real-time updates |
| Harness | Python, FastAPI, Uvicorn, LangGraph, Presidio, Gemini | 8000 | Prompt evaluation, risk assessment, security orchestration, and AI generation |

### Request Flow

```text
Employee
   |
   v
React Frontend
   |
   | HTTP / Socket.IO
   v
Express Gateway
   |
   | Authenticated Request
   v
Adaptive Security Harness
   |
   +--> Prompt Evaluation
   |       |
   |       +--> Allowed --------> Gemini Generation
   |       |
   |       +--> Restricted/Blocked
   |
   +--> Output Security Checks
   |
   v
Employee-Safe Response

Administrator
   |
   v
Administrator Console
   |
   v
Governance Metadata, Reviews, Audit Information,
Risk Assessment, Policies, and Harness Traces
```

## Technology Stack

### Frontend

| Technology | Purpose |
| --- | --- |
| React 18 | User interface and application components |
| TypeScript | Type-safe frontend development |
| Vite | Development server and frontend build tooling |
| Tailwind CSS | Interface styling and responsive layouts |
| Socket.IO Client | Real-time interaction and status updates |

### Backend

| Technology | Purpose |
| --- | --- |
| Node.js | Backend runtime |
| Express.js | REST API and application gateway |
| TypeScript | Type-safe backend development |
| Socket.IO | Real-time communication between server and clients |
| SQLite | Application data persistence |
| better-sqlite3 | SQLite database integration |
| JWT | Authentication and authorization |

### Adaptive Security Harness

| Technology | Purpose |
| --- | --- |
| Python 3.10+ | Security harness runtime |
| FastAPI | Harness API layer |
| Uvicorn | ASGI application server |
| LangGraph | Adaptive orchestration and workflow execution |
| Presidio | PII detection and analysis |
| Gemini | AI response generation |
| Pydantic | Request and response validation |

### Security and Governance Components

| Component | Purpose |
| --- | --- |
| Role-Based Access Control | Separates employee and administrator capabilities |
| Risk Assessment | Evaluates prompt sensitivity and security risk |
| PII Detection | Identifies personally identifiable information |
| Financial Information Detection | Identifies sensitive financial information |
| Confidential Information Detection | Identifies organizationally sensitive requests |
| Secret Detection | Identifies credentials, API keys, and other secrets |
| Policy Enforcement | Determines whether requests can proceed |
| Human-in-the-Loop Review | Handles requests requiring administrator review |
| Audit Logging | Records security and governance activity |
| Output Validation | Checks generated responses before delivery |

## Core Capabilities

### Adaptive Prompt Evaluation

The harness evaluates incoming prompts using security detectors and risk-scoring logic.

Evaluation can incorporate:

- Confidential document and organizational information detection
- Personally identifiable information detection
- Financial information detection
- Secret and credential detection
- Risk scoring and risk tiers
- Policy matching
- Human review requirements
- Security verification and orchestration

### Employee and Administrator Separation

Employees receive only the information required to use the AI interface. Governance information is not exposed through the employee-facing interaction flow.

Administrators have access to the governance information required for security review, including:

- Risk assessment
- Policy information
- Audit records
- Security events
- Human review workflows
- Harness and orchestration traces

### Confidential-Data Protection

Requests for sensitive organizational information, such as employee salary or personal employee details, can be restricted before they reach the AI provider.

Normal prompts are allowed to proceed when they satisfy the configured policies.

The system does not block a prompt solely because it contains generic words such as `password` or `email`. The security decision is based on the context detected by the evaluation layer.

### Gemini Integration

The current implementation uses Gemini as the available AI provider.

Provider credentials are kept server-side and are not exposed to the frontend.

The Gemini model can be configured through the harness environment.

### Role-Based Access Control

The application separates administrator and employee capabilities through authenticated role-based access control.

Administrator capabilities include:

- Risk assessment
- Policy management
- Audit information
- Harness and orchestration traces
- Human review workflows
- Data security information

Employee capabilities focus on:

- Submitting prompts
- Receiving permitted AI responses
- Viewing their own interaction history
- Viewing request status

## Repository Structure

```text
ShadowGuard-AI-Governance-Platform/
|
+-- frontend/       React employee and administrator interfaces
+-- backend/        Express API, authentication, RBAC, database, and Socket.IO
+-- harness/        Python security evaluation and AI orchestration service
+-- docker-compose.yml
+-- package.json
+-- README.md
+-- RUN_GEMINI.md
+-- DEMO_SCRIPT.md
+-- PROGRESS.md
```

## Prerequisites

Install the following before running the project:

- Node.js 18 or later
- npm
- Python 3.10 or later
- pip

A Gemini API key is required for Gemini response generation.

## Configuration

Create the required environment files locally. Environment files are excluded from version control by the repository's `.gitignore`.

### Harness Configuration

Create `harness/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=your_configured_gemini_model
PORT=8000
```

### Backend Configuration

Create `backend/.env` with the values required by the local backend configuration:

```env
PORT=4000
JWT_SECRET=your_local_jwt_secret
HARNESS_URL=http://localhost:8000
```

Do not commit API keys, JWT secrets, or other credentials to the repository.

## Installation

From the repository root:

```powershell
npm install

cd frontend
npm install
cd ..

cd backend
npm install
cd ..

cd harness
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..
```

On Linux or macOS:

```bash
source harness/venv/bin/activate
```

## Database Setup

Initialize the backend database using the project's seed script:

```powershell
cd backend
npm run db:seed
cd ..
```

The seed script initializes the database schema and project seed data defined by the backend.

## Running the Application

Start the three services separately.

### 1. Start the Harness

Open a terminal:

```powershell
cd harness
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --port 8000
```

The harness will run on:

```text
http://localhost:8000
```

### 2. Start the Backend

Open another terminal:

```powershell
cd backend
npm run dev
```

The backend will run on:

```text
http://localhost:4000
```

### 3. Start the Frontend

Open a third terminal:

```powershell
cd frontend
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

### Service Endpoints

| Service | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| Security Harness | http://localhost:8000 |
| Harness Health Check | http://localhost:8000/health |
| Harness API Documentation | http://localhost:8000/docs |

## Verification

A basic harness health check can be performed at:

```text
http://localhost:8000/health
```

The FastAPI service also exposes OpenAPI documentation while running.

The application should be tested using both permitted and restricted request paths.

| Test Case | Expected Behavior |
| --- | --- |
| Basic HTML/CSS/JavaScript coding request | Gemini response is returned |
| General informational request | Gemini response is returned when supported |
| Employee salary information request | Request is restricted or placed in review |
| Employee personal-details request | Request is restricted or placed in review |
| Credential or secret disclosure request | Request is restricted or blocked |
| Normal login-page request containing `username` and `password` | Request can proceed when no sensitive information is being requested |

## Security Workflow

ShadowGuard follows a controlled request-processing workflow.

```text
User Prompt
    |
    v
Authentication
    |
    v
Prompt Evaluation
    |
    +----------------------------+
    |                            |
    v                            v
Security Check              Risk Assessment
    |                            |
    +-------------+--------------+
                  |
                  v
          Policy Decision
                  |
        +---------+---------+
        |                   |
        v                   v
     Allowed          Restricted/Blocked
        |                   |
        v                   v
 Gemini Generation      Employee-Safe
        |                 Response
        v
 Output Security Check
        |
        v
 Employee-Safe Response
```

Governance information generated during this workflow is intended for authorized administrator access and is not exposed to ordinary employees.

## Production Builds

### Frontend

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
npm run build
```

## Security Considerations

The repository intentionally excludes local environment files and generated database artifacts from version control.

For any deployment beyond local development:

- Use a strong, unique JWT secret.
- Store Gemini credentials in a secure secret-management system.
- Do not expose provider API keys to the frontend.
- Restrict administrator accounts and governance endpoints.
- Review audit logs and security policies before deployment.
- Configure production CORS, authentication, and network access appropriately.
- Keep development credentials separate from production credentials.
- Apply appropriate access controls to governance and audit information.

## Current Provider Configuration

ShadowGuard currently uses Gemini for AI response generation.

The provider configuration is intentionally kept server-side. The frontend should not directly communicate with Gemini or expose the Gemini API key.

Additional AI providers may be integrated in future versions through the provider abstraction layer.

## Project Scope

The current implementation focuses on the adaptive security and governance layer that evaluates employee-to-AI requests.

The Adaptive Secure AI Harness is the primary research contribution. It provides the orchestration layer responsible for selecting and applying appropriate evaluation, security, verification, and governance workflows based on request context.

The project is designed to demonstrate how enterprise organizations can introduce governance controls around employee use of generative AI while maintaining a usable AI interaction experience.

## Future Development

Planned development areas include:

- Enhanced administrator governance dashboards
- Additional AI provider integrations
- Advanced security analytics
- Expanded policy configuration
- Improved risk visualization for administrators
- Additional security verification mechanisms
- Expanded audit and compliance capabilities
- More adaptive orchestration strategies

## Academic and Research Context

ShadowGuard is developed as an academic and research project focused on enterprise AI governance, secure generative AI adoption, and responsible AI usage.

The Adaptive Secure AI Harness forms the core research contribution by introducing an adaptive orchestration layer capable of selecting security and verification mechanisms based on the context and risk characteristics of an AI request.

## License

This project is developed for academic and research purposes focused on enterprise AI governance, security, and responsible use of generative AI.
