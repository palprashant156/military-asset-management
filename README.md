# Military Asset Management System

Enterprise-grade full-stack application for tracking military assets (vehicles, weapons, ammunition) across multiple bases with Role-Based Access Control (RBAC), audit trails, and real-time inventory calculations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React (Vite), Tailwind CSS, Recharts, Lucide React |
| **Backend** | Node.js, Express.js, JavaScript ES6+ |
| **Database** | PostgreSQL, Prisma ORM |
| **Auth** | JWT (JSON Web Tokens), Bcrypt |

## Features

- **Dashboard** — Real-time opening/closing balances, net movement with drill-down modal
- **Purchases** — Log incoming assets to any base
- **Transfers** — Atomic cross-base asset transfers with stock validation
- **Assignments** — Allocate equipment to personnel
- **Expenditures** — Record consumed assets (e.g., spent ammunition)
- **Audit Logs** — Complete mutation history (Admin only)
- **RBAC** — Admin (global), Base Commander (own base), Logistics Officer (purchases/transfers)

## Project Structure

```
military-asset-management/
├── backend/          # Express.js API server
│   ├── prisma/       # Schema & migrations
│   └── src/          # Controllers, routes, middlewares
├── frontend/         # React SPA
│   └── src/          # Pages, components, context
└── README.md
```

## Getting Started

### Prerequisites

- Node.js v18+ and npm
- PostgreSQL instance (local or cloud)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with VITE_API_BASE_URL

npm run dev
```

## Test Credentials

| Role | Username | Password | Base |
|------|----------|----------|------|
| Admin | `admin_user` | `AdminPass123!` | All Bases |
| Base Commander | `commander_alpha` | `CommandPass123!` | Fort Alpha |
| Logistics Officer | `logistics_officer` | `LogisticsPass123!` | Global |

## Inventory Model

```
Opening Balance = (Purchases + TransfersIn - TransfersOut - Assignments - Expenditures) before period
Net Movement    = Purchases + TransfersIn - TransfersOut during period
Closing Balance = Opening + NetMovement - Assignments - Expenditures during period
```

## License

MIT
