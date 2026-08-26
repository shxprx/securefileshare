# SecureShare — Secure File-Sharing SaaS Platform

SecureShare is a modern, secure, self-hosted file-sharing application that allows users to upload files, configure multiple temporary share links with granular access controls (passwords, download limits, and expirations), and track visitor analytics.

---

## 📖 Deep-Dive Engineering Documentation

### 📋 Complete Interview Prep Suite (NEW)

| # | Document | What It Covers |
|---|----------|----------------|
| 00 | **[Project Overview](docs/00_PROJECT_OVERVIEW.md)** | Architecture, data model, user flows, tech stack, file counts, key numbers |
| 01 | **[Concurrency Deep Dive](docs/01_CONCURRENCY_DEEP_DIVE.md)** | Every race condition, TOCTOU vulnerabilities, atomic operations, MongoDB internals |
| 02 | **[Security Deep Dive](docs/02_SECURITY_DEEP_DIVE.md)** | XSS, CSRF, brute-force, JWT, bcrypt, signed URLs — every attack vector & defense |
| 03 | **[Database Deep Dive](docs/03_DATABASE_DEEP_DIVE.md)** | Schema design, indexes, transactions, aggregation, scaling considerations |
| 04 | **[Edge Cases & Error Handling](docs/04_EDGE_CASES_AND_ERROR_HANDLING.md)** | Every failure scenario, compensating rollbacks, error response map |
| 05 | **[Backend Code Walkthrough](docs/05_BACKEND_CODE_WALKTHROUGH.md)** | Line-by-line WHY for every backend decision |
| 06 | **[Frontend Architecture](docs/06_FRONTEND_ARCHITECTURE.md)** | React patterns, state management, component design, CSS system |
| 07 | **[Why/What/When Decisions](docs/07_WHY_WHAT_WHEN_DECISIONS.md)** | Every tech choice justified with alternatives and tradeoffs |
| 08 | **[Advanced Interview Grill](docs/08_ADVANCED_INTERVIEW_GRILL.md)** | Mock interview: distributed systems, Node.js event loop, Docker networking |
| 09 | **[API Reference](docs/09_API_REFERENCE.md)** | All 13 endpoints with request/response formats and error codes |
| 10 | **[System Design Interview Guide](docs/10_SYSTEM_DESIGN_INTERVIEW_GUIDE.md)** | How to present this project: whiteboard flow, STAR method, hooks |
| 11 | **[DevOps & Deployment](docs/11_DEVOPS_AND_DEPLOYMENT.md)** | Docker, environment variables, production checklist, CI/CD |
| 12 | **[Scaling & Future Roadmap](docs/12_SCALING_AND_FUTURE_ROADMAP.md)** | Bottlenecks, solutions, V2/V3 features, testing strategy |
| 13 | **[100 Interview Questions](docs/13_100_INTERVIEW_QUESTIONS.md)** | Rapid-fire Q&A covering every topic |
| 14 | **[Auth Deep Dive](docs/14_AUTH_DEEP_DIVE.md)** | JWT internals, cookie config, bcrypt, session management |
| 15 | **[File Upload Deep Dive](docs/15_FILE_UPLOAD_DEEP_DIVE.md)** | Multer, SHA-256, duplicate detection, Supabase, quota management |

### 📚 Original Documentation

1. 🏗️ **[System Architecture & Data Flows](docs/architecture.md)** — Database schemas, API contracts, and sequence flows with Mermaid diagrams
2. ⚖️ **[Engineering Decisions & Trade-offs](docs/decisions.md)** — Rationale behind key architecture choices
3. 🎓 **[Technical Interview Bible (Q&A)](docs/interview_bible.md)** — Mock interview questions on concurrency, security, and edge cases
4. 💬 **[Technical Interview Transcript](docs/interview_transcript.md)** — Full mock interview script
5. ⚙️ **[Scripts & Deployment Bible](docs/scripts_and_deployment.md)** — NPM scripts, Docker, and cloud deployment
6. 📂 **[Codebase Guide & Walkthrough](docs/codebase_guide.md)** — File-by-file walkthrough

---

## 🛠️ Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) + React Router + Axios | Single-Page Application with simple state management. |
| **Styling** | Vanilla CSS | Custom, responsive stylesheet without build-step overhead. |
| **Backend** | Node.js + Express | Lightweight, asynchronous, feature-based modular structure. |
| **Database** | MongoDB (Mongoose) | Document database with transaction support for storage quota management. |
| **Storage** | Supabase Storage | Cloud object storage configured with a Private Bucket for secure URLs. |
| **Cache & Limit** | Redis (Upstash) | Fast in-memory key-value store for sliding window rate limiting. |
| **Auth** | JWT in HttpOnly Cookies | Secure token transport that mitigates XSS attacks. |

---

## 📂 Directory Layout

```
project/
├── client/                     # React Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable layouts, modals, and routes
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── CreateLinkModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── UploadModal.jsx
│   │   ├── pages/              # Primary application views
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── FileDetailsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── SharePage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── services/           # API interaction layer (Axios clients)
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── fileService.js
│   │   │   └── shareService.js
│   │   ├── App.jsx             # Main router configuration
│   │   ├── index.css           # Global stylesheet & CSS variables
│   │   └── main.jsx            # React root mount script
│   └── package.json
├── server/                     # Express Backend Monolith
│   ├── src/
│   │   ├── config/             # Environment configurations
│   │   │   └── index.js
│   │   ├── middleware/         # Custom Express middlewares
│   │   │   ├── auth.middleware.js
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.middleware.js
│   │   │   └── upload.middleware.js
│   │   ├── modules/            # Feature-based backend modules
│   │   │   ├── auth/           # User sign-up, sign-in, and profiling
│   │   │   ├── file/           # Upload processing and storage management
│   │   │   ├── share/          # Link generation, public landing page, and unlocking
│   │   │   └── activity/       # Visit and download logging
│   │   ├── utils/              # Helper utilities (Supabase, Redis clients)
│   │   │   ├── appError.js
│   │   │   ├── redis.js
│   │   │   ├── shortCode.js
│   │   │   └── supabase.js
│   │   └── app.js              # Express app setup and middleware configuration
│   ├── package.json
│   └── Dockerfile
├── docs/                       # Comprehensive documentation
│   ├── architecture.md
│   ├── codebase_guide.md
│   ├── decisions.md
│   ├── interview_bible.md
│   ├── interview_transcript.md
│   └── scripts_and_deployment.md
├── docker-compose.yml          # Local container configuration
└── implementation_plan.md      # Project blueprint
```

---

## ⚡ Getting Started (Local Setup)

### Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or Atlas connection string)
- Redis (Local instance or Upstash connection details)
- Supabase Account (with a private storage bucket created)

### 1. Configure the Backend
Navigate to the [server](file:///c:/Users/shour/Downloads/project/server) folder and clone the example environment file:
```bash
cd server
cp .env.example .env
```
Fill out the variables in `.env`:
- `PORT` (e.g. `5000`)
- `MONGODB_URI` (Your MongoDB Atlas or local connection string)
- `JWT_SECRET` (A secure random signing key)
- `SUPABASE_URL` & `SUPABASE_SERVICE_KEY` (From your Supabase API settings)
- `SUPABASE_BUCKET` (The name of your private storage bucket)
- `REDIS_URL` (Your Redis connection string)
- `CLIENT_URL` (The address of the frontend, e.g. `http://localhost:5173`)

Install dependencies and start the development server:
```bash
npm install
npm run dev
```

### 2. Configure the Frontend
Navigate to the [client](file:///c:/Users/shour/Downloads/project/client) folder:
```bash
cd ../client
```
Install dependencies and run the Vite server:
```bash
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🐳 Docker Deployment (Optional)

To run the entire system locally inside Docker containers (including database and caching instances), run the following command from the root directory:

```bash
docker-compose up --build
```
This builds the backend using the [Dockerfile](file:///c:/Users/shour/Downloads/project/server/Dockerfile) and runs MongoDB and Redis services.
