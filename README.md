# Task Management Platform API

A RESTful API built with **Laravel 11** that powers the Task Management Platform. It provides secure authentication, role-based authorization, task management, team management, notifications, and analytics integration while serving as the primary backend for the React frontend and Node.js services.

## Features

- JWT Authentication
- Role-Based Access Control (RBAC)
- User & Team Management
- Task Assignment & Workflow
- Dashboard Analytics Integration
- Notification Integration
- RESTful API
- PostgreSQL Database
- Docker Support
- Production Deployment on Render

---

## Tech Stack

- Laravel 11
- PHP 8.4
- PostgreSQL (Supabase)
- JWT Authentication
- Docker
- Render

---

## Repository Structure

```text
task-management-laravel-api/
├── app/
├── bootstrap/
├── config/
├── database/
├── frontend/
├── public/
├── resources/
├── routes/
├── storage/
├── tests/
├── Dockerfile
├── composer.json
└── README.md
```

---

## Installation

Clone the repository.

```bash
git clone https://github.com/mich022001/task-management-laravel-api.git
cd task-management-laravel-api
```

Install PHP dependencies.

```bash
composer install
```

Create the environment file.

```bash
cp .env.example .env
```

Generate the application key.

```bash
php artisan key:generate
```

Generate the JWT secret.

```bash
php artisan jwt:secret
```

Run database migrations.

```bash
php artisan migrate
```

Start the Laravel server.

```bash
php artisan serve
```

---

## Frontend

The React frontend is located inside the `frontend/` directory.

Run locally using:

```bash
cd frontend

npm install

npm run dev
```

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | 02michael2001@gmail.com | password123 |
| Admin | valenzuelamichaelb6282@gmail.com | Password@123 |
| Manager | 1002michael.v@gmail.com | password123 |
| Team Lead | 0102michael.v@gmail.com | password123 |
| Member | valenzueladyesibel@gmail.com | password123 |

---

## Related Services

Node.js Services

https://github.com/mich022001/task-management-node-services

---

## Deployment

| Service | Platform |
|----------|----------|
| Laravel API | Render |
| Database | Supabase PostgreSQL |
| Frontend | Render Static Site |
| Node Services | Render Web Service |

---

## Author

**Michael Valenzuela**
