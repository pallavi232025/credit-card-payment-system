# Credit Card Payment System

A complete full-stack Credit Card Payment System built with Django (Core Backend), FastAPI (Payment Processor Simulation), React (Frontend), and MySQL (Database), containerized with Docker.

## Project Architecture

This project uses a modern microservices-inspired architecture within a monorepo setup:

1. **Django Backend (`/django-backend`)**:
   - Core API responsible for Authentication (JWT), User Management, Card Management (CRUD), and the Admin Panel.
   - Provides security features like Card Number Masking (no full numbers stored) and Luhn algorithm validation.
   - Serves as the primary data owner.

2. **FastAPI Backend (`/fastapi-backend`)**:
   - A high-performance microservice dedicated to Payment Processing.
   - Shares the MySQL database with Django using SQLAlchemy models that map to Django's tables.
   - Implements a Simulated Payment Gateway with a configurable success rate and idempotency for duplicate prevention.

3. **React Frontend (`/frontend`)**:
   - Built with React, TypeScript, Vite, and Tailwind CSS v4.
   - Provides an intuitive, responsive, dark-mode user interface for both regular users and administrators.
   - Communicates seamlessly with both the Django and FastAPI backends.

4. **MySQL Database (`/database`)**:
   - A centralized data store used by both backend services.

## Security Features

- **No Full Card Numbers Stored**: Card numbers are aggressively masked (e.g., `************1111`) before being saved to the database. Only the last 4 digits are kept for identification.
- **No CVV Stored**: The CVV is used during the transaction flow but is *never* persisted to the database.
- **Luhn Algorithm Validation**: Card numbers are mathematically validated before acceptance.
- **JWT Authentication**: Secure stateless authentication.
- **Idempotency**: Prevents duplicate charges by processing transactions with identical idempotency keys exactly once.
- **Role-Based Access Control**: Strict isolation between regular `USER` and `ADMIN` roles.

## Prerequisites

- **Docker Desktop** (or Docker Compose)
- **Node.js 20+** (if running frontend locally outside Docker)
- **Python 3.11+** (if running backends locally outside Docker)

## Quick Start (Docker Compose)

The easiest way to run the entire stack is using Docker Compose.

1. **Clone the repository** (if you haven't already).
2. **Copy the environment file**:
   ```bash
   cp .env.example .env
   ```
3. **Start the containers**:
   ```bash
   docker-compose up -d --build
   ```
4. **Run Database Migrations** (Inside the Django container):
   ```bash
   docker-compose exec django python manage.py migrate
   ```
5. **Seed the Database with Demo Data** (Creates admin/users/cards/transactions):
   ```bash
   docker-compose exec django python manage.py seed_data
   ```

### Accessing the Applications

- **React Frontend**: [http://localhost:5173](http://localhost:5173)
- **Django API Base URL**: `http://localhost:8000/api/`
- **FastAPI Base URL**: `http://localhost:8001/api/`
- **FastAPI Swagger Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)

### Demo Credentials (if seeded)

- **Admin User**: `admin@example.com` / `Admin@123`
- **Regular User**: `user@example.com` / `User@1234`

## API Collection

A comprehensive Postman collection is available in the `/postman` directory:
`Credit-Card-Payment-System.postman_collection.json`

Import this file into Postman. It includes all API endpoints and automatically handles JWT token capture and injection for authenticated requests.

## Running Tests

### Django Tests

Run tests inside the Django container:
```bash
docker-compose exec django pytest
```

### FastAPI Tests

Run tests inside the FastAPI container:
```bash
docker-compose exec fastapi pytest
```

## Manual Local Setup (Without Docker)

If you prefer to run the services directly on your machine:

1. **Database Setup**:
   Ensure MySQL is running locally. Create a database `credit_card_db` and user `ccpay_user` with password `ccpay_password` (or match your `.env`).

2. **Django Backend**:
   ```bash
   cd django-backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

3. **FastAPI Backend**:
   ```bash
   cd fastapi-backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8001
   ```

4. **React Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Development Features

- The FastAPI payment simulation success rate is configurable via the `PAYMENT_SUCCESS_RATE` environment variable (default: 80%).
- Admin logs automatically capture all critical actions (user status changes, CSV exports, data seeding).
