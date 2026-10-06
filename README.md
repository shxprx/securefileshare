# SecureShare — Secure File-Sharing SaaS Platform

SecureShare is a modern, secure, self-hosted file-sharing application that allows users to upload files, configure multiple temporary share links with granular access controls (passwords, download limits, and expirations), and track visitor analytics.

---

## Getting Started (Local Setup)

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
