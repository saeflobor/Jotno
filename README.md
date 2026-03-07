<div align="center">

# Jotno — Personal Health Management Platform

**Jotno** (যত্ন) means *care* in Bengali. It is a full-stack health management web application that helps individuals and families track medications, chronic conditions, medical reports, and overall health — all in one place.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue)](LICENSE)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [Contributing](#contributing)

---

## Overview

Jotno is designed to bridge the gap between healthcare and everyday personal management. Users can log their chronic conditions, track ongoing medications with reminders, upload and access medical reports, and share health visibility with trusted family members. A built-in medicine database (Bangladesh-specific) allows users to look up drugs, dosage forms, and manufacturer information.

---

## Features

### Authentication & Profile
- Secure registration with **email + phone number**
- **JWT-based authentication** with HTTP-only tokens
- **Email verification** on sign-up and email change
- Forgot / **Reset password** via secure email link
- Profile update with **avatar upload** (Cloudinary)

### Health Dashboard
- Personal **health summary** at a glance
- Add, view, and delete **chronic conditions**
- Track **medications** with name, dosage, and schedule
- Automated **medication reminder emails** via a background scheduler

### Family Integration
- Send and receive **family linking requests** (by email or phone)
- Accept / decline / cancel pending requests
- View a linked family member's **medications, conditions, and reports**
- Add or remove conditions and medications **on behalf of a family member**
- Send an **SOS alert** email to all linked family members instantly

### Medical Reports
- Upload one or multiple medical report files (PDF, images, etc.)
- Reports stored securely on **Cloudinary**
- Download or delete your own reports
- Upload reports **for a family member** (if permitted)

### Medicine Lookup
- Search over a comprehensive **Bangladeshi medicines database**
- Filter by **dosage form** and **manufacturer**
- Paginated results with backwards-compatible name search

### Activity Log
- Automatic tracking of key account and health actions
- View full **profile activity history**

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, React Router DOM 7, Framer Motion, Axios |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB via Mongoose 9 |
| **Auth** | JSON Web Tokens (jsonwebtoken), bcryptjs |
| **File Storage** | Cloudinary (via Multer + streamifier) |
| **Email** | Nodemailer |
| **Scheduling** | Custom Node.js scheduler (medication reminders) |
| **Icons** | Lucide React, React Icons |

---

## Project Structure

```
Jotno/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/           # Route logic (User, Health, Family, Reports, Medicines)
│   ├── middleware/            # Auth guard, error handler
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── utils/                 # Email, tokens, scheduler, activity logger
│   └── Data/                  # Bangladesh medicine dataset (JSON/CSV)
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Route definitions
        ├── pages/              # Full-page views (Dashboard, Login, Register, …)
        ├── components/         # Reusable UI components
        ├── hooks/              # Custom React hooks
        └── lib/
            └── axios.js        # Configured Axios instance
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB** database (local or Atlas)
- A **Cloudinary** account (for file uploads)
- An SMTP-capable email account (e.g., Gmail with App Password)

### Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password

# Client URL (for CORS & email links)
CLIENT_URL=http://localhost:5173
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/jotno.git
cd jotno

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

### Running the App

**Development mode** (run each in a separate terminal):

```bash
# Backend — from /backend
npm run dev

# Frontend — from /frontend
npm run dev
```

The backend starts on `http://localhost:5001` and the frontend on `http://localhost:5173`.

**Production build:**

```bash
# Build frontend
cd frontend && npm run build

# Start backend in production
cd ../backend && npm run start:prod
```

---

## API Reference

All API routes are prefixed with `/api`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/users/register` | — | Register a new user |
| `POST` | `/users/login` | — | Login |
| `GET` | `/users/me` | ✅ | Get current user |
| `PUT` | `/users/update` | ✅ | Update profile |
| `POST` | `/users/forgot-password` | — | Send reset email |
| `POST` | `/users/reset-password` | — | Reset password |
| `GET` | `/health/summary` | ✅ | Health overview |
| `GET` | `/health/chronic-conditions` | ✅ | List conditions |
| `POST` | `/health/chronic-conditions` | ✅ | Add condition |
| `DELETE`| `/health/chronic-conditions/:id` | ✅ | Delete condition |
| `GET` | `/health/medications` | ✅ | List medications |
| `POST` | `/health/medications` | ✅ | Add medication |
| `DELETE`| `/health/medications/:id` | ✅ | Delete medication |
| `GET` | `/medical-report` | ✅ | List reports |
| `POST` | `/medical-report` | ✅ | Upload report(s) |
| `GET` | `/medical-report/:id/download` | ✅ | Download report |
| `DELETE`| `/medical-report/:id` | ✅ | Delete report |
| `POST` | `/family/request/send` | ✅ | Send family request |
| `GET` | `/family/request/pending` | ✅ | Pending requests |
| `POST` | `/family/request/:id/accept` | ✅ | Accept request |
| `POST` | `/family/sos` | ✅ | Send SOS alert |
| `GET` | `/medicines` | — | Search medicines |
| `GET` | `/medicines/filters` | — | Get filter options |
| `GET` | `/activities` | ✅ | Activity history |

> ✅ = Requires `Authorization` Bearer token

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

<div align="center">
Made with care · <strong>Jotno</strong> (যত্ন)
</div>
