# SmartQueue AI Ration Distribution System 🧠

## Overview
Full-stack AI-powered ration distribution system for efficient queue management and need-based allocation.

**Tech Stack:**
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express.js + Prisma
- **Database**: PostgreSQL

## 🚀 Quick Start

### Prerequisites
- Node.js (18+)
- PostgreSQL (local or Docker)
- npm/yarn

### 1. Clone & Setup
```bash
cd 'c:/Users/ELCOT/OneDrive/projects/ration system'
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env  # Update DB_URL, JWT_SECRET
npm install
npx prisma generate
npx prisma db push  # Creates tables
npm run dev
```
Backend runs on http://localhost:5000

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

### 4. Docker (Optional - Postgres)
```bash
docker-compose up -d
```

### Environment Variables (backend/.env)
```
DATABASE_URL="postgresql://user:pass@localhost:5432/smartqueue"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
PORT=5000
```

## Features
- **Auth**: Admin/Family/Business login/register
- **Smart Queues**: AI priority scoring (family size, needs, history)
- **Ration Allocation**: Inventory-based distribution
- **Admin Dashboard**: Manage queues, inventory, distributions

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/queues (auth)
- POST /api/queues
- POST /api/rations/allocate (admin)

## Project Structure
```
smartqueue-system/
├── backend/     # Express + Prisma
├── frontend/    # React + Vite + Tailwind
└── README.md
```

## Scripts
**Backend:**
- `npm run dev` - Nodemon
- `npm run start` - Production
- `npm run migrate` - Prisma push

**Frontend:**
- `npm run dev` - Vite dev server
- `npm run build` - Production build

Happy rationing! 🚀

