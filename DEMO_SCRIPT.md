# 🎬 ShadowGuard V2: 5-Minute Live Viva Demo Walkthrough Script

This script provides a step-by-step guide for presenting **ShadowGuard V2** during a viva examination or technical demonstration. It showcases the public marketing landing page, employee self-serve signup, live prompt scanning, real-time Socket.IO status streaming, human-in-the-loop compliance review, and the persistent "Ask ShadowGuard" AI Chatbot widget.

---

## ⏱️ Demo Overview & Timeline

- **Total Duration**: 5 Minutes
- **Services Required**:
  - Frontend: `http://localhost:5173`
  - Backend API: `http://localhost:4000`
  - FastAPI Harness: `http://localhost:8000`

---

## 📍 Step 1: Public Landing Page & Employee Signup (0:00 - 1:00)

### What to Show:
1. Open browser (Window A) to `http://localhost:5173/` (**Landing Page**).
2. Showcase the **Hero Section**, animated orchestration node graph, **"The Problem"** cards, and **"How ShadowGuard Works"** 4-step workflow.
3. Toggle Light/Dark mode using the **ThemeToggle** in the navigation header.
4. Click **"Let's Go"** or **"Get Started"** $\rightarrow$ Routes to `/login`.
5. Click **"New here? Create an account"** $\rightarrow$ Routes to `/signup`.
6. Fill in signup details:
   - **Name**: `Jordan Taylor`
   - **Email**: `jordan.taylor@shadowguard.local`
   - **Department**: `Finance`
   - **Password**: `Password123!`
7. Submit signup $\rightarrow$ Auto-logs in as `role="user"` and redirects directly to `/prompt`.

### What to Say:
> "Welcome to **ShadowGuard V2**. We begin at the public product landing page, built with a modern, restrained aesthetic, scroll-triggered animations, and dark/light theme support.
>
> An employee signing up for the first time enters their name, department, and credentials. ShadowGuard automatically registers them as an employee `user` role and routes them directly to their dedicated consumer prompt portal."

---

## ⚡ Step 2: Employee Prompt Submission & Live Review Hold (1:00 - 2:15)

### What to Show:
1. Demonstrate the consumer ChatGPT/Claude-style interface at `/prompt`. Point out the top header, user menu, and glanceable platform highlights strip.
2. In the input box, paste a risky prompt containing financial sensitivity and credentials:
   > `"Please summarize our Q3 financial forecast for EBITDA and include AWS key AKIA1234567890ABCDEF"`
3. Click **Send**.
4. Observe the user's right-aligned chat bubble and the left-aligned status bubble:
   - Initially shows `"Analyzing prompt against active DLP & compliance policies..."`
   - The Python FastAPI Harness scans the text, calculates an elevated risk score, and flags `requires_human_review = true`.
   - Via Socket.IO event `interaction-status-update`, the bubble updates live to `"Under security review..."` with a yellow badge and risk score breakdown.

### What to Say:
> "On the employee prompt page, Jordan submits a request containing financial forecast metrics and an AWS access key.
>
> ShadowGuard's evaluation harness scans the prompt in real time using Microsoft Presidio and policy rules. Recognizing high data sensitivity, the system puts the request on hold for compliance sign-off and streams an 'Under security review...' status directly to the user's chat window via Socket.IO—without any page reloads."

---

## 🛡️ Step 3: Admin Real-Time Queue & Human-in-the-Loop Rejection (2:15 - 3:30)

### What to Show:
1. Open a second browser window (Window B) or incognito window to `http://localhost:5173/login`.
2. Log in as an Administrator:
   - **Email**: `sarah.connor@shadowguard.io` (or `admin@shadowguard.local`)
   - **Password**: `Password123!`
3. Redirects to `http://localhost:5173/dashboard`.
4. Point out the **"Live Review Queue (Human-in-the-Loop)"** panel right at the top of the dashboard.
5. Highlight the pending item that arrived live via Socket.IO:
   - User: `Jordan Taylor` | Department: `Finance`
   - Prompt preview & Harness recommendation: `"Suggested: Blocked — matched Source Code Guard policy"`
6. Click **Reject** (rose button).
7. Demonstrate the 3-second undo countdown toast (`"Executing Rejection in 3s... [Undo]"`).
8. Once committed, observe the item animate out smoothly from the admin review queue.

### What to Say:
> "Now, switching to the Admin Security Console in Window B, administrator Sarah Connor instantly sees Jordan's request sitting in the Live Review Queue. The item arrived in real time via Socket.IO as soon as it was flagged.
>
> The panel shows the submitting employee, department, and the Harness recommendation. Sarah clicks 'Reject'. ShadowGuard provides a 3-second undo safety buffer before executing the decision and recording an entry in the audit ledger."

---

## 🔄 Step 4: Real-Time Employee Rejection Notification (3:30 - 4:15)

### What to Show:
1. Switch back to Window A (the employee's `/prompt` screen).
2. Observe the chat bubble transition live without a refresh from `"Under security review..."` to a structured warning card:
   - Status: **Request Cannot Be Processed**
   - Message: `"This request cannot be processed — it violates Source Code Guard. Contact your administrator if you believe this is an error."`

### What to Say:
> "Switching back to the employee's screen in Window A, we see that the chat bubble updated instantly when Sarah clicked Reject.
>
> Jordan receives clear, non-punitive feedback explaining why the request was stopped and which policy was triggered. Room isolation guarantees that real-time notifications are sent strictly to the target employee."

---

## 🤖 Step 5: Persistent AI Chatbot & Harness Trace Inspection (4:15 - 5:00)

### What to Show:
1. Switch back to Window B (Admin Console).
2. Click the floating **Ask ShadowGuard** chatbot widget in the bottom-right corner (`FAB`).
3. Ask the chatbot: *"What's waiting for my review right now?"* or *"Explain why request #<id> was rejected"*.
4. Show the grounded, read-only markdown response with source citations.
5. Navigate to **Harness Console** (`/harness`) and inspect the trace execution graph for the interaction, showing core pipeline steps and dynamically selected agents (`redaction_agent`, `output_validation_agent`, `approval_routing_agent`).

### What to Say:
> "Finally, administrators can open the persistent 'Ask ShadowGuard' floating assistant from any page to ask natural language questions about security posture or specific harness traces.
>
> Coupled with the Harness Console trace viewer, ShadowGuard provides 100% explainability across every AI interaction in the enterprise."

---

## 🏁 Conclusion

> "ShadowGuard V2 delivers full-lifecycle AI governance—unifying a consumer-grade prompt portal, real-time Socket.IO event streaming, adaptive LangGraph orchestration, and human-in-the-loop compliance control."
