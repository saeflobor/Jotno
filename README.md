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
- [Frontend Routes](#frontend-routes)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

Jotno is designed to bridge the gap between healthcare and everyday personal management. Users can log their chronic conditions, track ongoing medications with automated reminders (via email and WhatsApp), upload and access medical reports, and share health visibility with trusted family members. AI-powered features let users generate health summaries and extract medication data from PDF prescriptions. A built-in medicine database with 65,000+ Bangladesh-specific drugs allows users to look up drugs, dosage forms, and manufacturer information. The app supports both English and Bengali (বাংলা).

---

## Features

### Authentication & Profile
- Secure registration with **email + phone number** (Bangladesh format)
- **JWT-based authentication**
- **Email verification** on sign-up and email change
- Forgot / **Reset password** via secure email link
- Profile update (username, gender, phone, timezone, privacy, WhatsApp number)
- Avatar with initials

### Health Dashboard
- Personal **health summary** at a glance (conditions, medications, reports, family count)
- Time-based **greeting message**
- **Recent activity feed** with timestamps
- Quick-access navigation cards to key features

### AI-Powered Features
- **AI Health Summary** — generates an intelligent health overview using Ollama (local LLM), analyzing conditions, medications, and reports to identify insights and potential drug interactions
- **Prescription Extractor** — upload a PDF prescription and let AI extract structured medication data (name, dosage, frequency, duration); edit and save extracted medications directly

### Chronic Conditions & Medications
- Add, view, and delete **chronic conditions** with severity levels (mild, moderate, severe)
- Track **medications** with name, dosage, frequency, and duration
- **Custom reminder times** per medication
- Automated **medication reminder emails** and **WhatsApp messages** via a background scheduler (runs every 60 seconds)
- Timezone-aware reminder delivery
- Add or remove conditions and medications **on behalf of a family member**

### Family Integration
- Send and receive **family linking requests** by email or phone
- Relation types: father, mother, spouse, child (bidirectional linking)
- Accept / decline / cancel pending requests
- View a linked family member's **medications, conditions, and reports**
- Upload reports and manage health data **for a family member**
- **SOS Emergency Alert** — sends email and WhatsApp messages with GPS location to all linked family members

### Medical Reports
- Upload one or multiple report files (PDF, PNG, JPG — max 10 per upload)
- **Categorization**: Lab Results, Prescription, X-Ray, CT Scan, MRI, Ultrasound, Blood Test, Doctor's Note, Insurance, Other
- Optional report date, notes, and tags
- **Privacy toggle** (private or shared with family)
- Reports stored securely on **Cloudinary**
- Download or delete your own (or family member's) reports

### Medicine Lookup
- Search over **65,000+ Bangladeshi medicines** (Medex database)
- **Score-based relevance ranking** (exact match > starts with > contains)
- Searches across brand name and generic names
- Filter by **dosage form** and **manufacturer**
- Paginated results (30 per page)

### Activity Log
- Automatic tracking of 20+ action types (health changes, family events, report management, SOS alerts, etc.)
- View full **profile activity history** with pagination

### Internationalization (i18n)
- Full UI translation support
- **English** and **Bengali** (বাংলা) locales
- Language detection via browser with localStorage persistence

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, React Router DOM 7, Framer Motion, Axios, react-i18next |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB via Mongoose 9 |
| **Auth** | JSON Web Tokens (jsonwebtoken), bcryptjs |
| **File Storage** | Cloudinary (via Multer + streamifier) |
| **Email** | Nodemailer (SMTP) |
| **WhatsApp** | Meta WhatsApp Business API (text & template modes) |
| **AI / LLM** | Ollama (local — e.g., Llama 3.2) |
| **PDF Parsing** | pdf-parse |
| **Scheduling** | Custom Node.js scheduler (medication reminders) |
| **Icons** | Lucide React, React Icons |
| **i18n** | i18next, i18next-browser-languagedetector |

---

## Project Structure

```
Jotno/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── User.js            # Auth, profile, password reset
│   │   ├── healthController.js        # Conditions, medications, reminders
│   │   ├── familyController.js        # Family linking, SOS alerts
│   │   ├── medicalReportController.js # Report upload, download, privacy
│   │   ├── aiSummaryController.js     # AI health summary (Ollama)
│   │   ├── prescriptionExtractorController.js  # AI prescription parsing
│   │   └── Medicines.js       # Medicine search & filters
│   ├── middleware/
│   │   ├── auth.js            # JWT auth guard
│   │   └── errorhandler.js    # Global error handler
│   ├── models/                # Mongoose schemas (User, Medication, ChronicCondition,
│   │                          #   MedicalReport, FamilyRequest, ActivityLog,
│   │                          #   WhatsAppRecipient, Medicines)
│   ├── routes/                # Express routers
│   ├── utils/
│   │   ├── scheduler.js       # Background medication reminder loop
│   │   ├── sendEmail.js       # Nodemailer email sending
│   │   ├── sendWhatsApp.js    # WhatsApp Business API integration
│   │   ├── activityLogger.js  # Non-blocking activity logging
│   │   ├── emailverification.js  # Email templates
│   │   ├── generatetokens.js  # JWT token helpers
│   │   └── AppError.js        # Custom error class
│   └── Data/                  # Bangladesh medicine dataset (65,000+ medicines)
│       ├── bangladesh-medicines.json
│       ├── medicines.json
│       └── *.csv              # Source CSV files
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── vercel.json            # Vercel SPA rewrite config
    └── src/
        ├── App.jsx            # Route definitions & auth state
        ├── main.jsx           # React entry point
        ├── index.css          # Global styles
        ├── pages/
        │   ├── Home.jsx               # Landing page
        │   ├── Login.jsx              # Authentication
        │   ├── Register.jsx           # Sign up
        │   ├── Dashboard.jsx          # Health overview & SOS
        │   ├── ProfileActivity.jsx    # Health data & reports management
        │   ├── ProfileUpdatePage.jsx  # Account settings
        │   ├── FamilyIntegration.jsx  # Family linking & management
        │   ├── LookupMeds.jsx         # Medicine search
        │   ├── ExtractPrescription.jsx # AI prescription extraction
        │   ├── EmailVerification.jsx  # Email verification callback
        │   ├── VerifyEmailChange.jsx  # Email change confirmation
        │   └── ResetPassword.jsx      # Password reset
        ├── components/
        │   ├── Navbar.jsx             # Navigation bar & language switcher
        │   ├── Footer.jsx             # Page footer
        │   ├── AddConditionModal.jsx  # Add chronic condition form
        │   ├── AddMedicationModal.jsx # Add medication form
        │   ├── ConfirmationModal.jsx  # Reusable confirm dialog
        │   ├── FamilyMemberSection.jsx # Family member display
        │   ├── FamilyRequestNotifications.jsx # Pending request alerts
        │   ├── UserCard.jsx           # User profile card
        │   └── NotFound.jsx           # 404 page
        ├── hooks/
        │   └── useFamilyRequests.js   # Family request polling hook
        ├── i18n/
        │   ├── index.js               # i18next config
        │   └── locales/
        │       ├── en.json            # English translations
        │       └── bn.json            # Bengali translations
        └── lib/
            └── axios.js               # Configured Axios instance
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB** database (local or Atlas)
- A **Cloudinary** account (for file uploads)
- An SMTP-capable email account (e.g., Gmail with App Password)
- *(Optional)* **Ollama** installed locally for AI features
- *(Optional)* A **Meta WhatsApp Business** account for WhatsApp notifications

### Environment Variables

#### Backend

Create a `.env` file inside the `backend/` directory (see `.env.example`):

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

# Email (SMTP / Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
SMTP_FROM=your_email@gmail.com

# Client URL (for CORS & email links)
CLIENT_URL=http://localhost:5173

# AI / LLM (optional — required for AI features)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# WhatsApp (optional — required for WhatsApp reminders & SOS)
WHATSAPP_API_URL=https://graph.facebook.com/v22.0
WHATSAPP_PHONE_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_MESSAGE_MODE=text
WHATSAPP_TEMPLATE_NAME=hello_world
WHATSAPP_TEMPLATE_LANG=en_US
```

#### Frontend

Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5001
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

## Frontend Routes

| Path | Component | Auth | Description |
|------|-----------|:----:|-------------|
| `/` | Home | — | Landing page |
| `/login` | Login | — | Sign in |
| `/register` | Register | — | Create account |
| `/verifyemail/:token` | EmailVerification | — | Confirm email |
| `/verify-email-change/:token` | VerifyEmailChange | — | Confirm email change |
| `/reset-password/:token` | ResetPassword | — | Set new password |
| `/dashboard` | Dashboard | ✅ | Health overview & SOS |
| `/profile-activity` | ProfileActivity | ✅ | Health data management |
| `/profile-update` | ProfileUpdatePage | ✅ | Account settings |
| `/family-integration` | FamilyIntegration | ✅ | Family linking |
| `/lookup-meds` | LookupMeds | ✅ | Medicine search |
| `/extract-prescription` | ExtractPrescription | ✅ | AI prescription parsing |
| `*` | NotFound | — | 404 page |

---

## API Reference

All API routes are prefixed with `/api`.

### Authentication (`/api/users`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/users/register` | — | Register a new user |
| `POST` | `/users/login` | — | Login |
| `GET` | `/users/me` | ✅ | Get current user |
| `PUT` | `/users/update` | ✅ | Update profile |
| `POST` | `/users/forgot-password` | — | Send reset email |
| `POST` | `/users/reset-password` | — | Reset password |
| `POST` | `/users/verifyemail` | — | Verify email with token |
| `POST` | `/users/verify-email-change` | — | Confirm email change |

### Health (`/api/health`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/health/summary` | ✅ | Health overview stats |
| `GET` | `/health/chronic-conditions` | ✅ | List conditions |
| `POST` | `/health/chronic-conditions` | ✅ | Add condition |
| `DELETE`| `/health/chronic-conditions/:id` | ✅ | Delete condition |
| `POST` | `/health/chronic-conditions-for-user` | ✅ | Add condition for family member |
| `DELETE`| `/health/chronic-conditions-for-user/:targetUserId/:conditionId` | ✅ | Delete family member's condition |
| `GET` | `/health/medications` | ✅ | List medications |
| `POST` | `/health/medications` | ✅ | Add medication |
| `PUT` | `/health/medications/:id` | ✅ | Update medication |
| `DELETE`| `/health/medications/:id` | ✅ | Delete medication |
| `POST` | `/health/medications-for-user` | ✅ | Add medication for family member |
| `DELETE`| `/health/medications-for-user/:targetUserId/:medicationId` | ✅ | Delete family member's medication |

### Family (`/api/family`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/family/add` | ✅ | Add family member |
| `POST` | `/family/remove` | ✅ | Remove family member |
| `POST` | `/family/sos` | ✅ | Send SOS with location |
| `POST` | `/family/request/send` | ✅ | Send family request |
| `GET` | `/family/request/pending` | ✅ | Pending incoming requests |
| `GET` | `/family/request/sent` | ✅ | Sent outgoing requests |
| `POST` | `/family/request/:id/accept` | ✅ | Accept request |
| `POST` | `/family/request/:id/decline` | ✅ | Decline request |
| `DELETE`| `/family/request/:id/cancel` | ✅ | Cancel sent request |
| `GET` | `/family/member/:id/medications` | ✅ | Family member's medications |
| `GET` | `/family/member/:id/conditions` | ✅ | Family member's conditions |
| `GET` | `/family/member/:id/reports` | ✅ | Family member's reports |

### Medical Reports (`/api/medical-report`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/medical-report` | ✅ | Upload report(s) (max 10) |
| `POST` | `/medical-report/for-user` | ✅ | Upload for family member |
| `GET` | `/medical-report` | ✅ | List reports |
| `GET` | `/medical-report/:id/download` | ✅ | Download report |
| `DELETE`| `/medical-report/:id` | ✅ | Delete report |
| `DELETE`| `/medical-report/for-user/:targetUserId/:reportId` | ✅ | Delete family member's report |
| `PATCH` | `/medical-report/:id/privacy` | ✅ | Toggle report privacy |

### AI (`/api/ai`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/ai/summary` | ✅ | Generate AI health summary |
| `POST` | `/ai/extract-prescription` | ✅ | Extract medications from PDF |

### Medicines (`/api/medicines`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/medicines/filters` | — | Available dosage forms & manufacturers |
| `GET` | `/medicines?q=...` | — | Search medicines |
| `GET` | `/medicines/:name` | — | Search by name (legacy) |

### Activities (`/api/activities`)

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/activities` | ✅ | User's activity history |

> ✅ = Requires `Authorization: Bearer <token>` header

---

## Deployment

### Frontend (Vercel)

The project includes a `vercel.json` that rewrites all non-API routes to `index.html` for SPA routing. Deploy the `frontend/` directory to Vercel and set the `VITE_API_BASE_URL` environment variable to your backend URL.

### Backend

Deploy the `backend/` directory to any Node.js hosting platform (Render, Railway, Heroku, etc.). Set all required environment variables in the platform dashboard.

**Requirements:**
- MongoDB Atlas connection string
- Cloudinary account credentials
- SMTP email credentials
- *(Optional)* Ollama endpoint for AI features
- *(Optional)* WhatsApp Business API credentials

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
