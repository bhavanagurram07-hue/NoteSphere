# NoteSphere – Smart Academic Resource Sharing Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%2B%20Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/QA%20Tests-61%20Passed%20(100%25)-brightgreen)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A modern, full-stack MERN platform engineered for university students and faculty to collaboratively discover, upload, review, and organize verified academic resources.

---

## 1. Project Title
**NoteSphere – Smart Academic Resource Sharing Platform**  
*Major College Training & Capstone Project in Computer Science & Engineering*

---

## 2. Project Introduction
**NoteSphere** is an enterprise-grade academic repository engineered to eliminate the chaos of lost course materials in higher education institutions. Built on the MERN stack (MongoDB, Express.js, React.js, Node.js), NoteSphere empowers university students to access verified lecture notes, previous years' exam question papers, lab manuals, and assignments across engineering disciplines, basic sciences, and management faculties.

---

## 3. Problem Statement
In contemporary universities and colleges, students face acute friction accessing reliable study materials:
1. **Scattered Distribution:** Notes are fragmented across ephemeral WhatsApp groups, private Google Drive links, and personal Telegram channels where links expire.
2. **Missing Verification:** Students frequently study outdated syllabus notes or incorrect question banks before midterm and end-term examinations.
3. **Absence of Searchability:** Generic file drives lack structured indexing by university department, semester, subject code, or document format.
4. **Knowledge Loss Across Batches:** High-quality handwritten notes prepared by top graduating seniors are permanently lost to incoming junior batches.
5. **Security and Inappropriate Content:** Unmoderated channels risk distributing malware, leaked papers, or inappropriate community uploads.

---

## 4. Objectives
- **Centralized Academic Hub:** Provide a single university portal for lecture notes, past exam question papers, assignments, and lab manuals.
- **Sub-3-Second Discovery:** Deliver instant multi-field keyword search and dynamic filters (department, semester, category, format, star rating).
- **Dual-Storage Resilience:** Stream document uploads to Cloudinary CDN with automatic fallback to local disk storage for seamless offline development.
- **Peer Accountability:** Incorporate 5-star student ratings, feedback reviews, cloud bookmarks, and a community reporting mechanism.
- **Administrative Control Panel:** Equip campus moderators with real-time MongoDB analytics, user suspension controls, and moderation workflows.
- **Enterprise-Grade Security:** Enforce HTTP-only JWT cookies, bcrypt password hashing, sliding-window rate limiters, and strict Role-Based Access Control (RBAC).

---

## 5. Technologies Used

### Frontend Client
- **React.js 18 (Vite):** Fast single-page application framework with Hot Module Replacement (HMR).
- **Tailwind CSS 3:** Utility-first CSS framework styled with custom academic SaaS palette (Navy `#0F172A`, Brand Blue `#2563EB`, Light Blue `#EFF6FF`).
- **React Router 6:** Declarative client-side routing with guarded protected routes.
- **Axios:** Promise-based HTTP client with request and response interceptors.
- **Lucide React:** Iconography system.

### Backend Server
- **Node.js (v20+ / v24):** Event-driven asynchronous JavaScript runtime.
- **Express.js 4:** Minimalist RESTful API web framework.
- **JSON Web Tokens (JWT):** Stateless authentication with HTTP-only cookies and Bearer tokens.
- **Bcrypt.js:** Password hashing with 10 salt rounds.
- **Multer:** Multipart/form-data middleware with memory buffer streaming (25MB limit).
- **In-Memory Sliding Window Rate Limiter:** Protects auth and report routes against brute-force attacks.

### Database & Cloud Storage
- **MongoDB & Mongoose 8:** Document database with compound text and unique indexes.
- **Cloudinary SDK:** Cloud document storage with on-the-fly streaming.

---

## 6. Features

### Student Capabilities
- **Authentication:** Registration, login, profile image customization, and automatic session restoration.
- **Student Dashboard:** Track personal upload count, total peer downloads, reputation score, and recent activity feed.
- **Resource Upload:** Drag-and-drop document upload with real-time percentage progress bar.
- **Document Discovery:** Instant search with autocomplete suggestions, department pills, semester filters, and format selectors.
- **Document Viewer & Secure Download:** Embedded preview viewport with zoom controls and atomic download tracking.
- **Cloud Bookmarks:** Pin key exam formulas and study guides to a personal cloud shelf.
- **5-Star Peer Reviews:** Submit reviews with interactive star selectors and inline edit/delete permissions.
- **Community Reporting:** Flag violating or incorrect syllabus documents for administrative review.

### Faculty Member Capabilities
- **Faculty Dashboard:** Real-time academic metrics, department and category resource distributions.
- **Official Resource Uploads:** Publish lecture notes, previous question papers, lab manuals, and syllabus guides.
- **Resource Moderation:** Review student submissions, inspect curriculum relevance, and approve or reject documents.
- **Student Mentorship Directory:** Search student profiles and inspect department contributions.
- **Academic Feedback Resolution:** Investigate flagged syllabus documents and maintain library integrity.

---

## 7. System Architecture

```text
[ Browser / Mobile Client ]
         │
         ▼
[ Vite + React.js SPA ] ─── Axios (withCredentials: true, Bearer Token)
         │
         ▼
[ Express.js REST API Gateway ]
   ├── CORS & Cookie Parser
   ├── Sliding-Window Rate Limiters (Auth & Reports)
   ├── JWT Auth & Role-Based Access Control (RBAC)
   └── Multer File Interceptor (MIME & Size Validator)
         │
         ├──────────────────────────┐
         ▼                          ▼
[ Mongoose ODM / Controllers ]   [ Storage Engine ]
   ├── User Controller             ├── Cloudinary CDN (Production)
   ├── Resource Controller         └── Local Disk Fallback (Dev/Offline)
   ├── Bookmark Controller
   ├── Review Controller
   ├── Report Controller
   └── Admin Controller
         │
         ▼
[ MongoDB Database (Local / Atlas) ]
   ├── Users Collection
   ├── Resources Collection (Text & Compound Indexes)
   ├── Bookmarks Collection (Compound Unique Index)
   ├── Reviews Collection (Automatic Rating Aggregation)
   └── Reports Collection (Unique Integrity Index)
```

---

## 8. Application Workflow

1. **Registration & Auth:** Student registers (`role: 'student'`) with bcrypt password hashing. Server responds with dual JWT (HTTP-only cookie + JSON token).
2. **Resource Upload:** Student submits metadata and a PDF/DOCX file. Server validates MIME type and file size (≤ 25MB), streams buffer to Cloudinary/disk fallback, and creates document with status `approved` (or `pending`).
3. **Discovery & Multi-Filtering:** Student queries library. Server runs efficient MongoDB queries across title, subject, description, department, semester, and minimum ratings with server-side pagination.
4. **Download & Interaction:** Student initiates download; server atomically increments `downloads` counter and streams file. Student can bookmark or rate the document (1–5 stars), triggering an aggregation pipeline that updates the resource's `averageRating`.
5. **Moderation & Administration:** Faculty moderator logs in (`role: 'admin'`). Control panel retrieves real-time aggregation analytics, reviews flagged reports, audits user contributions, and moderates content.

---

## 9. Database Collections

| Collection | Key Fields | Indexes & Constraints |
|---|---|---|
| **Users** | `name`, `email`, `password`, `department`, `semester`, `registrationNumber`, `role`, `isBlocked` | `email` (unique, lowercase) |
| **Resources** | `title`, `description`, `subject`, `department`, `semester`, `category`, `uploadedBy`, `fileUrl`, `publicId`, `fileType`, `fileSize`, `downloads`, `averageRating`, `totalRatings`, `status` | Compound text index (`title`, `subject`, `description`), `status` |
| **Bookmarks** | `user` (ref: User), `resource` (ref: Resource), `createdAt` | Compound unique: `{ user: 1, resource: 1 }` |
| **Reviews** | `user` (ref: User), `resource` (ref: Resource), `rating` (1–5), `comment`, timestamps | Compound unique: `{ user: 1, resource: 1 }` |
| **Reports** | `resource` (ref: Resource), `reportedBy` (ref: User), `reason`, `description`, `status`, `actionTaken`, `resolvedBy` | Compound unique: `{ resource: 1, reportedBy: 1 }` |

---

## 10. API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` — Register student account (rate limited)
- `POST /login` — Login and receive JWT (rate limited)
- `POST /logout` — Clear session cookie
- `GET /me` — Get authenticated user profile (protected)
- `PUT /profile` — Update student name, department, semester, image (protected)
- `GET /dashboard-stats` — Get student upload and download metrics (protected)

### Academic Resource Routes (`/api/resources`)
- `GET /` — Search and filter approved resources (public)
- `GET /suggestions` — Autocomplete search suggestions (public)
- `POST /` — Upload new resource with file attachment (protected)
- `GET /my-uploads` — Retrieve current student's uploads (protected)
- `GET /:id` — Get single resource details (public)
- `GET /:id/download` — Increment download count and return download URL (public)
- `PUT /:id` — Update resource metadata (owner / admin only)
- `DELETE /:id` — Delete resource and storage file (owner / admin only)

### Cloud Bookmarks Routes (`/api/bookmarks`)
- `POST /:resourceId/toggle` — Toggle bookmark for resource (protected)
- `GET /ids` — Get array of bookmarked IDs for state synchronization (protected)
- `GET /my-bookmarks` — Get populated list of saved resources (protected)

### Reviews & Ratings Routes (`/api/resources/:id/reviews` & `/api/reviews`)
- `GET /api/resources/:id/reviews` — Get all student reviews and rating stats (public)
- `POST /api/resources/:id/reviews` — Submit 1–5 star rating & comment (protected)
- `PUT /api/reviews/:id` — Edit own review (owner only)
- `DELETE /api/reviews/:id` — Delete own review (owner / admin only)

### Community Reports Routes (`/api/reports`)
- `POST /:resourceId` — Submit inappropriate content report (rate limited, protected)
- `GET /my-reports` — View reports filed by current student (protected)

### Administrative Routes (`/api/admin`) *(Strictly role=admin only)*
- `GET /analytics` — Real-time MongoDB metrics and chart aggregations
- `GET /users` — Search and filter student accounts with pagination
- `GET /users/:id` — View detailed student profile and contributions
- `PUT /users/:id/block` — Suspend or reinstate student account
- `GET /resources` — Moderation queue for all resources
- `PUT /resources/:id/moderate` — Approve or reject resource
- `DELETE /resources/:id` — Permanently delete document and purge files
- `GET /reports` — View community moderation reports
- `PUT /reports/:id` — Resolve or dismiss report with action taken

---

## 11. Installation Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x, v20.x, or v24.x)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (or MongoDB Atlas account)
- [Git](https://git-scm.com/)

### Clone Repository
```bash
git clone https://github.com/[your-username]/NoteSphere.git
cd NoteSphere
```

### Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 12. Environment Variable Setup

### Backend Environment (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Local MongoDB or MongoDB Atlas URI
MONGO_URI=mongodb://127.0.0.1:27017/notesphere

# JWT Secret
JWT_SECRET=notesphere_secure_jwt_secret_key_2026

# Cloudinary (Optional in development - local disk fallback active)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Authorized Faculty Initial Provisioning
FACULTY_NAME="Prof. Sarah Jenkins"
FACULTY_EMAIL=faculty@notesphere.com
FACULTY_PASSWORD=your_secure_faculty_password_here
FACULTY_DEPARTMENT="Computer Science"
```

### Frontend Environment (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 13. Frontend Execution
```bash
cd frontend
npm run dev
# Frontend runs at: http://localhost:5173
```

---

## 14. Backend Execution & Seeding

### Seed Authorized Faculty Account
```bash
cd backend
npm run seed:faculty
```
Creates or updates the authorized Faculty account in MongoDB using `FACULTY_EMAIL` and `FACULTY_PASSWORD` from `.env`. The password is encrypted with bcrypt before being stored.

### Seed Default Accounts
```bash
cd backend
npm run seed
```
Default accounts:
- **Authorized Faculty:** `faculty@notesphere.com`
- **Demo Student:** `alex.johnson@campus.edu` / `password123`

### Start Development Server
```bash
cd backend
npm run dev
# Backend runs at: http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### Run Automated QA Test Suite
```bash
cd backend
npm run test
# Executes all automated tests: auth, resources, interaction, admin integration, and master end-to-end suite

# Run specific suites:
npm run test:security   # Runs 6-scenario Admin RBAC security audit
npm run test:master     # Runs complete 24-step master end-to-end user journeys
```

### Provision Admin Account
```bash
cd backend
npm run admin:create
# Provisions or verifies the root administrator account: admin@notesphere.edu (role: admin)
```

---

## 15. Screenshots
*(Add high-resolution screenshots in `screenshots/` directory before college submission)*

1. `screenshots/01_landing_page.png` — Hero section, department navigation, and statistics.
2. `screenshots/02_explore_resources.png` — Multi-filter search interface with grid/list view.
3. `screenshots/03_resource_details.png` — Document viewer, 5-star rating breakdown, and reviews.
4. `screenshots/04_upload_modal.png` — Drag-and-drop upload modal with percentage progress bar.
5. `screenshots/05_student_dashboard.png` — Personal metrics, peer downloads, and saved bookmarks.
6. `screenshots/06_admin_dashboard.png` — Real-time analytics charts, moderation queue, and user management.

---

## 16. Deployment Links
- **Frontend (Vercel):** `https://notesphere-portal.vercel.app` *(Placeholder - configure in Phase 4)*
- **Backend (Render):** `https://notesphere-api.onrender.com` *(Placeholder - configure in Phase 4)*
- **Database (MongoDB Atlas):** Hosted on AWS Cluster (`notesphere-db`)

---

## 17. Future Scope
- **AI Lecture Summaries:** Integration with Google Gemini API to produce chapter summaries and flashcards.
- **Handwritten OCR Parsing:** Automatic formula extraction and full-text searching from handwritten notes.
- **Study Group Annotations:** Real-time synchronized PDF highlights and discussion threads.
- **Mobile Native Applications:** Cross-platform React Native apps for offline exam revision.

---

## 18. Project Team Details

**College/Institution:** [Your College / University Name Here]  
**Department:** Department of Computer Science & Engineering  
**Academic Year:** 2025–2026  
**Team Name:** Team Nexus

| S.No | Student Name | Registration / Roll No | Project Role | Email |
|---|---|---|---|---|
| 1 | **[Student 1 Full Name]** | [e.g. 22BCSE101] | Team Lead & Backend Developer | student1@campus.edu |
| 2 | **[Student 2 Full Name]** | [e.g. 22BCSE102] | Frontend & UI/UX Developer | student2@campus.edu |
| 3 | **[Student 3 Full Name]** | [e.g. 22BCSE103] | Database Architect & QA Tester | student3@campus.edu |

---

## License
This project is open-source and licensed under the [MIT License](LICENSE).
