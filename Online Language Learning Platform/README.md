# CodeVerse — Online Programming Learning Platform

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%7C%20Postgres%20%7C%20Realtime-3ecf8e.svg)](https://supabase.com/)

CodeVerse is an enterprise-grade, data-driven online programming learning platform supporting 19+ programming languages, Monaco browser code execution, automated quizzes, interactive modules, and persistent gamification.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM
- **Java Web Backend**: Core Java (OOP, Generics, Multithreading), Java Servlets (`HttpServlet`), JDBC Database Connectivity, Session Management, CORS Filter
- **Database**: PostgreSQL 15+ (25 Relational Tables with Foreign Keys, Triggers, and RLS)
- **Code Execution**: Judge0 Sandboxed Execution (C++, Python, Java, and 16 other languages)

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
npm install
```

### 2. Configure Environment
Your `.env` is already configured with your Supabase project:
```env
VITE_SUPABASE_URL=https://bxzdpsmqunpetlvjuptw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_6C73H9jH8tFDjjUrz3pIsA_nuLLyGc1
VITE_APP_NAME=CodeVerse
VITE_APP_URL=http://localhost:5173
```

### 3. Initialize Supabase Database
1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/bxzdpsmqunpetlvjuptw/sql).
2. Copy the contents of `supabase/migrations/full_setup.sql`.
3. Paste into the SQL editor and click **Run**.

### 4. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` to explore the platform.

### 5. Start Java Web Backend (Servlets + JDBC)
```bash
cd backend-java
./compile.sh
./run.sh 8080
```
Open `http://localhost:8080/api/health` to inspect JDBC database diagnostics.

---

## 📚 Documentation

- [System Architecture](docs/architecture.md)
- [PostgreSQL Database Schema (25 Tables)](docs/database-schema.md)
- [Supabase Setup Guide](docs/supabase-setup.md)
- [Code Execution Runner Setup](docs/code-execution-setup.md)
- [Deployment Guide](docs/deployment.md)
- [Testing & Quality Assurance](docs/testing.md)

---

## 🔒 Security Principles

- **Row Level Security (RLS)** is enabled on all 25 tables.
- **Client Privilege Escalation Protection**: Users cannot modify their own roles.
- **Private Test Cases**: Hidden assessment test cases are inaccessible to students via RLS.
- **Server Keys**: `service_role` and execution runner keys are kept strictly on the backend.
