# Factorial24 Hackathon Solution 🚀

> **Target:** Campus Recruitment Process | 2026 Batch  
> **Role:** QA Intern / Developer  
> **Team:** 2 Students  
> **Status:** 🚧 Preparing for Launch (Jan 12)

Welcome to our project repository for the **Factorial24 Hackathon**. This repository is designed to be a rapid-development monorepo template, ready to solve the problem statement released on the day of the event.

---

## 📅 Event Schedule

**Round:** Hackathon (24 Hours)  
**Mode:** Hybrid (Online Kickoff -> Offline Evaluation)

| Time | Session | Details | Venue |
| :--- | :--- | :--- | :--- |
| **Jan 12, 10:00 AM - 11:00 AM** | **Kickoff** | Welcome, Agenda, **Problem Statement Release**, Q&A | Online |
| **Jan 12, 11:00 AM** | **Start** | Hackathon Begins (Coding Phase) | Online / Campus |
| **Jan 13, 10:00 AM** | **End** | Code Freeze & Submission | At Campus |
| **Jan 13, Onwards** | **Evaluation** | Solution Walkthrough, Design Explanation, Demo | At Campus |

---

## 🎯 Outcomes & Evaluation
We are building a solution to demonstrate:
*   **Clarity:** Clean code, clear documentation, and intuitive UI.
*   **Innovation:** Creative approach to the problem statement.
*   **Technical Depth:** Robust backend, efficient data handling, and type safety.
*   **Feasibility:** A working, deployable prototype.
*   **Collaboration:** Effective teamwork using Git & Monorepo practices.

---

## 🧩 Problem Statement
*(To be updated on Jan 12 @ 10:00 AM)*

> **Awaiting Release...**  
> We anticipate a challenge related to **Web Applications, Data Analysis, or Process Automation**, given Factorial24's expertise in these areas.

**Our Approach:**
1.  **Analyze**: Break down the problem into user stories (10:00 - 11:00 AM).
2.  **Design**: Database schema and API contract (11:00 - 12:00 PM).
3.  **Build**: execute using this boilerplate (12:00 PM onwards).
4.  **Test**: Functional & UI testing (Jan 13 Morning).

---

## 🛠️ Repository Structure (Monorepo)

```bash
my-app-monorepo/
├── apps/
│   ├── client/          # Frontend (React + Vite + TypeScript)
│   └── server/          # Backend (FastAPI / Python)
├── infra/               # Docker & Deployment Configs
├── common/              # Shared Types/Schemas
└── README.md            # You are here
```

### Tech Stack
*   **Frontend:** React, TailwindCSS, Lucide Icons.
*   **Backend:** Python (FastAPI) or Node.js.
*   **Database:** PostgreSQL / MongoDB.
*   **Tools:** Docker, Git, Postman.

---

## ⚡ Quick Start for Contributors

### 1. Prerequisities
*   Docker & Docker Compose
*   Node.js v18+
*   Python 3.10+

### 2. Run the Stack
We use **Docker Compose** to spin up the entire environment (DB + Apps).

```bash
# Start Infrastructure (Database)
docker-compose -f infra/docker-compose.yml up -d

# Run Client (Terminal 1)
cd apps/client
npm install
npm run dev

# Run Server (Terminal 2)
cd apps/server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 📝 Rules
*   **No Live Backlogs:** Ensure eligibility criteria is met.
*   **Attendance:** Mandatory for Online Kickoff and Offline Evaluation.
*   **Submission:** Code must be pushed to this repository before the deadline.

---
*Built with ❤️ for Factorial24 Recruitment Drive*
