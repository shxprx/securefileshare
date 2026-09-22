# SecureShare — Secure File-Sharing SaaS Platform

SecureShare is a modern, secure, self-hosted file-sharing application that allows users to upload files, configure multiple temporary share links with granular access controls (passwords, download limits, and expirations), and track visitor analytics.


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
