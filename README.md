#  DevPulse - Internal Issue Tracker API

A collaborative backend system for managing bugs and feature requests in software teams.

---

##  Live URL
https://devpulse-zeta.vercel.app

---

##  Features

- User authentication (Signup/Login)
- JWT-based authorization
- Role-based access control (Contributor / Maintainer)
- Create / Read / Update / Delete issues
- Filtering & sorting issues
- Reporter information included
- Secure password hashing
- PostgreSQL raw SQL implementation

---

##  Tech Stack

- Node.js (LTS)
- Express.js
- TypeScript
- PostgreSQL (pg driver only)
- bcrypt
- jsonwebtoken

---

##  Roles

### Contributor
- Signup/Login
- Create issues
- View issues
- Update own open issues only

### Maintainer
- All contributor permissions
- Update any issue
- Delete issues
- Manage system data

---

##  Database Schema

### Users
- id (SERIAL)
- name (VARCHAR)
- email (UNIQUE)
- password (TEXT)
- role (contributor/maintainer)
- created_at
- updated_at

### Issues
- id (SERIAL)
- title (VARCHAR 150)
- description (TEXT)
- type (bug | feature_request)
- status (open | in_progress | resolved)
- reporter_id (INT)
- created_at
- updated_at

---

##  API Endpoints

### Auth

- POST /api/auth/signup
- POST /api/auth/login

### Issues

- POST /api/issues
- GET /api/issues (public)
- GET /api/issues/:id (public)
- PATCH /api/issues/:id
- DELETE /api/issues/:id (maintainer only)

---

##  Setup Instructions

```bash
npm install