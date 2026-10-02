# ShadowGuard: Adaptive AI Security & Governance Platform

ShadowGuard is an enterprise-grade AI security, monitoring, and governance platform designed to protect organizations against Data Loss Prevention (DLP) risks, credential leaks, and ungoverned LLM usage. It features a modern React frontend with a public landing page and consumer prompt interface, a Node.js/Express backend with Socket.IO real-time sync and SQLite storage, and an adaptive Python/FastAPI evaluation harness powered by LangGraph, Presidio, and Gemini Pro.

---

## 🏗️ Architecture Overview

The monorepo consists of three core subprojects:

- **`frontend/`**: Vite + React 18 + TypeScript + Tailwind CSS (Port **5173**)
- **`backend/`**: Node.js + Express + TypeScript + Socket.IO + SQLite via `better-sqlite3` (Port **4000**)
- **`harness/`**: Python 3.10+ + FastAPI + Uvicorn + LangGraph + Presidio + Gemini Pro (Port **8000**)

```text
                               +----------------------------------+
                               |    React 18 Frontend (5173)      |
                               | (Landing, Prompt, Admin Dash)    |
                               +-----------------+----------------+
                                                 |
                                       HTTP / Socket.IO
                                                 v
                               +-----------------+----------------+
                               |   Express API Backend (4000)     |
                               | (JWT Auth, RBAC, Socket Server)  |
                               +-----------------+----------------+
                                                 |
                                            HTTP / JSON
                                                 v
                               +-----------------+----------------+
                               |  FastAPI Evaluation Harness (8000)|
                               | (LangGraph + Presidio + Gemini)  |
                               +----------------------------------+
```

---

## 🔑 Key Features & User Roles

ShadowGuard enforces a two-tier Role-Based Access Control (RBAC) architecture:

1. **`admin` (Security & Risk Officer)**:
   - Pre-seeded administrative account (never public).
   - Access to `/dashboard`, Human-in-the-Loop Live Review Queue, Harness Pipeline Viewer, Policy Management, Data Security, Audit Ledger, and persistent "Ask ShadowGuard" AI Chatbot widget.
2. **`user` (Employee)**:
   - Self-serve registration via public signup page (`/signup`).
   - Consumer-style ChatGPT/Claude prompt interface (`/prompt`) supporting multi-format file uploads (`.txt, .pdf, .png, .jpg, .docx`), real-time DLP verification feedback, and personal history isolation.

---

## 🔑 Environment Variables

Create `.env` files in `backend/` and `harness/` (or monorepo root) as needed:

### 1. Harness Environment (`harness/.env`)
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
```

### 2. Backend Environment (`backend/.env`)
```env
PORT=4000
JWT_SECRET=shadowguard_super_secret_jwt_key_2026
HARNESS_URL=http://localhost:8000
```

> **Note**: If `GEMINI_API_KEY` is not provided, the harness automatically uses fallback evaluation logic for high-risk prompts, ensuring seamless execution offline.

---

## ⚡ Quick Start & Setup

### Prerequisites

- **Node.js** (v18+ recommended) & `npm`
- **Python** (v3.10+ recommended) & `pip`

### Step 1: Install Dependencies

Run the setup commands across subprojects:

```bash
# 1. Monorepo root dependencies
npm install

# 2. Frontend dependencies
cd frontend
npm install
cd ..

# 3. Backend dependencies
cd backend
npm install
cd ..

# 4. Harness Python Virtual Environment
cd harness
python -m venv venv

# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
cd ..
```

### Step 2: Seed the Database

Populate SQLite with initial schema, default policies, metrics, and seed accounts:

```bash
cd backend
npm run db:seed
cd ..
```

*Default Seed Credentials:*
- **Admin**: `sarah.connor@shadowguard.io` (or `admin@shadowguard.local`) / `Password123!`
- **Employee Accounts**: `alex.mercer@shadowguard.local` / `Password123!`

### Step 3: Run All Services Concurrently

From the root directory, launch all three services simultaneously:

```bash
npm run dev
```

The services will be available at:
- **Public Product Landing**: `http://localhost:5173`
- **Employee Prompt Console**: `http://localhost:5173/prompt` (User login)
- **Admin Security Console**: `http://localhost:5173/dashboard` (Admin login)
- **Backend Express API**: `http://localhost:4000/api`
- **FastAPI Harness Service**: `http://localhost:8000`

---

## 🧪 Verification & Production Build

To run linters and compile production bundles:

```bash
# Frontend Production Build
cd frontend
npm run build

# Backend Compilation
cd backend
npm run build
```

---

## 📄 License & Attribution

ShadowGuard Monorepo - Developed for AI Safety, Data Loss Prevention, and Adaptive Governance.
