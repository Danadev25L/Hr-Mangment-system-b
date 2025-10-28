# Human Resource System (HRS)

Full-stack Human Resource Management System with separate frontend and backend.

## 📁 Project Structure

```
hrs/
├── c/                          # Frontend (Next.js)
│   ├── app/                    # Next.js App Router
│   ├── src/                    # Source code
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities and configurations
│   │   ├── services/           # API services
│   │   └── store/              # State management
│   └── package.json
│
└── thesis-fullstack/           # Backend (Node.js/Express)
    ├── modules/                # Feature modules
    │   ├── admin/              # Admin routes & controllers
    │   ├── manager/            # Manager routes & controllers
    │   ├── employee/           # Employee routes & controllers
    │   └── shared/             # Shared functionality
    ├── db/                     # Database setup & migrations
    ├── drizzle/                # Drizzle ORM schemas
    ├── middleware/             # Express middleware
    ├── utils/                  # Utility functions
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Frontend Setup (Next.js)

```bash
cd c
npm install
npm run dev
```

The frontend will run on `http://localhost:3000`

### Backend Setup (Express)

```bash
cd thesis-fullstack
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npm run migrate

# Seed the database (optional)
npm run seed

# Start the server
npm start
# or for development
npm run dev
```

The backend will run on `http://localhost:3001`

## 🔑 Test Credentials

See `TEST_CREDENTIALS.txt` for login information.

## 📝 Features

- **Admin Module**: User management, department management, payroll, expenses tracking
- **Manager Module**: Employee management, expenses approval, announcements
- **Employee Module**: View profile, submit applications, track personal info
- **Authentication**: JWT-based authentication with role-based access control
- **Database**: PostgreSQL with Drizzle ORM

## 🛠️ Tech Stack

### Frontend
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Ant Design
- Zustand (State Management)
- Axios

### Backend
- Node.js
- Express.js
- PostgreSQL
- Drizzle ORM
- JWT Authentication
- bcrypt

## 📄 License

This project is for educational purposes.
