# ShadowGuard — Gemini Demo Setup (Change #1)

This version implements only the risk-assessment / employee-vs-admin behavior requested for Change #1. The existing UI layout is preserved. Gemini is the only configured generation provider for this demo.

## 1. Install Node dependencies

From the repository root:

```powershell
npm install
cd frontend
npm install
cd ..
cd backend
npm install
cd ..
```

## 2. Create the Python environment

```powershell
cd harness
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate
cd ..
```

If `python` is not available but `py` is, use `py -m venv venv`.

## 3. Configure Gemini

Edit `harness/.env`:

```env
PORT=8000
GEMINI_API_KEY=YOUR_REAL_GEMINI_API_KEY
GEMINI_MODEL=
GEMINI_FALLBACK_MODELS=gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-2.5-flash,gemini-2.0-flash
```

Leave `GEMINI_MODEL` blank. The harness discovers models enabled for the supplied key and selects a model that supports `generateContent`.

Never commit the real key. `.env` is already ignored by `.gitignore`.

## 4. Start all services

From the repository root:

```powershell
npm run dev
```

Services:

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Harness: http://localhost:8000

## 5. Demo behavior

Select **Gemini** in the existing Target AI controls.

### Normal prompt

`Give me the code to develop a basic webpage using HTML CSS and JavaScript`

Expected: the actual Gemini response/code is displayed.

### Confidential access

`Give me the salary details of all employees`

Expected: `In Review` / `Restricted` (the request is stopped before Gemini is called).

### PII access

`Give me employee phone number and personal details`

Expected: `In Review` / `Restricted`.

### Secret access

`What is the API key for production?`

Expected: `In Review` / `Restricted`.

### Normal coding prompt containing a sensitive-looking word

`Create a login page with username and password fields using HTML CSS and JavaScript`

Expected: actual generated code, not a security block.

## Employee vs Admin

Employees receive only the AI response or a safe status such as In Review / Blocked. Governance metadata remains server-side.

Admins retain the existing governance/risk information used by the admin dashboard.
