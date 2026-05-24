# DevPulse – Internal Tech Issue & Feature Tracker

## Live API

https://devpulse-api-two.vercel.app

---

# Project Overview

DevPulse is a collaborative backend API for software teams to report bugs, suggest features, and manage issue workflows.

The system includes:

- JWT Authentication
- Role-based Authorization
- Issue Tracking
- PostgreSQL Database
- Raw SQL Queries
- Express Modular Architecture

---

# Features

## Authentication System

- User Registration
- User Login
- JWT Token Generation
- Protected Routes

## Role-Based Access

### Contributor

- Create issues
- View issues

### Maintainer

- Update issues
- Delete issues
- Manage issue status

---

# Technology Stack

| Technology | Usage |
|---|---|
| Node.js | Runtime Environment |
| TypeScript | Type Safety |
| Express.js | Backend Framework |
| PostgreSQL | Database |
| pg | PostgreSQL Driver |
| bcryptjs | Password Hashing |
| jsonwebtoken | JWT Authentication |
| Vercel | Deployment |

---

# Project Structure

```txt
src/
│
├── app.ts
├── server.ts
│
├── config/
├── db/
├── middleware/
├── modules/
├── utility/
└── types/
```

---

# Environment Variables

Create a `.env` file:

```env
PORT=5000

DATABASE_URL=your_postgresql_database_url

JWT_SECRET=your_secret_key
```

---

# Installation & Setup

## Clone Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_LINK
```

---

## Install Dependencies

```bash
npm install
```

---

## Run Development Server

```bash
npm run dev
```

---

## Build Project

```bash
npm run build
```

---

# Database Schema

## Users Table

| Field | Type |
|---|---|
| id | SERIAL |
| name | VARCHAR |
| email | VARCHAR |
| password | TEXT |
| role | VARCHAR |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

## Issues Table

| Field | Type |
|---|---|
| id | SERIAL |
| title | VARCHAR |
| description | TEXT |
| type | VARCHAR |
| status | VARCHAR |
| reporter_id | INTEGER |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

# API Endpoints

# Authentication

## Register User

```http
POST /api/auth/signup
```

---

## Login User

```http
POST /api/auth/login
```

---

# Issues

## Create Issue

```http
POST /api/issues
```

Authorization Required

---

## Get All Issues

```http
GET /api/issues
```

---

## Get Single Issue

```http
GET /api/issues/:id
```

---

## Update Issue

```http
PATCH /api/issues/:id
```

Authorization Required

---

## Delete Issue

```http
DELETE /api/issues/:id
```

Maintainer Only

---

# Query Parameters

## Get All Issues

```http
GET /api/issues?sort=newest
```

Available Queries:

| Query | Values |
|---|---|
| sort | newest, oldest |
| type | bug, feature_request |
| status | open, in_progress, resolved |

---

# Authentication Flow

1. User logs in
2. Server validates credentials
3. JWT token generated
4. Client sends token in Authorization header
5. Protected routes verify token

---

# Authorization Header Example

```http
Authorization: Bearer YOUR_TOKEN
```

---

# Deployment

## Backend

Vercel

## Database

Neon PostgreSQL

---

# Author

SalmanAlMahmud
