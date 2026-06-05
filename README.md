# Cyberpunk HRMS - Employee & Leave Management System

A full-stack, enterprise-grade Employee Management System (EMS) and tiered Leave Approval Workflow system built using React, Redux, Node.js, Express, Prisma, and PostgreSQL. Designed with a premium **Cyberpunk Red & Black glassmorphic interface**, it includes robust transactional workflows, audit logging, and interactive API documentation.

---

## 🚀 Key Features

### 1. Tiered Leave Approval Workflow
* **Employee Screen**: Check remaining leave balances (Sick, Casual, Paid) with animated progress rings, submit leave requests with specific categories/dates, and track history.
* **Manager Screen**: Intermediate approval tier. Managers review requests from reporting employees, check history, and approve/reject with feedback.
* **HR Director Screen**: Final approval tier. HR reviews requests approved by managers, updates final status, and commits transactions.

### 2. Transactional Database Safety
* Multi-stage database updates are executed within a secure **PostgreSQL Transaction (`prisma.$transaction`)** to prevent concurrency anomalies.
* The transaction atomically:
  1. Validates that the employee has a sufficient leave balance.
  2. Decrements the leave balance by the exact requested duration.
  3. Transitions the leave request status to `APPROVED`.
  4. Generates an immutable tracking record in the `AuditLog` table.
* **Failure Safety**: If any check fails, the transaction immediately rolls back, ensuring that leave balances are never corrupted.

### 3. Cyberpunk Design System
* Curated dark-mode theme featuring neon-red indicators, dark glassmorphism effects, crisp layouts, smooth micro-interactions, and a custom font style.

### 4. Interactive Swagger Docs
* Live documentation of all REST APIs generated using OpenAPI specs and swagger-jsdoc. Browse schemas and try endpoints interactively.

---

## 🛠️ Technology Stack

* **Frontend**: React (SPA), Redux Toolkit (State Management), React Router v7, Lucide Icons, Vanilla CSS
* **Backend**: Node.js, Express.js
* **ORM & Database**: Prisma ORM, PostgreSQL
* **API Documentation**: Swagger (swagger-ui-express & swagger-jsdoc)
* **Authentication**: JSON Web Tokens (JWT) & bcrypt password hashing

---

## 📂 Project Architecture

```text
employee-management-system/
├── backend/
│   ├── config/              # Swagger & database config
│   ├── controllers/         # Express controllers (Leave, Auth, Employees)
│   ├── database/            # Seed scripts & custom DB utilities
│   ├── middleware/          # JWT Auth & role-based validation
│   ├── prisma/              # Prisma schema & migrations
│   ├── routes/              # Express routes (Swagger tags & endpoints)
│   └── server.js            # Express server configuration
├── frontend/
│   ├── public/              # Static assets
│   └── src/
│       ├── components/      # Common UI components (Navbar, ProtectedRoutes)
│       ├── pages/           # Pages (Dashboard, Leaves, LeaveApprovals, Login)
│       ├── redux/           # Store config & Slices (Auth, Leaves)
│       └── utils/           # Axios HTTP wrapper & API configurations
└── README.md                # General configuration & onboarding docs
```

---

## 💻 Running the Project Locally

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **PostgreSQL** database running locally

### 1. Database Setup
Create a PostgreSQL database (e.g. named `employee_db`), and grab your connection string:
```text
postgresql://USER:PASSWORD@localhost:PORT/DATABASE?schema=public
```

### 2. Backend Setup
1. Open the `/backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `backend` folder and configure variables:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/employee_db?schema=public"
   JWT_SECRET="cyberpunk_ultra_secret_key"
   ```
4. Run migrations to setup database tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed the database with the preloaded company accounts:
   ```bash
   node database/seed.js
   ```
6. Start the backend server:
   ```bash
   npm start
   ```
   * The API will run on **http://localhost:5000**
   * Swagger Documentation will be at **http://localhost:5000/api-docs**

### 3. Frontend Setup
1. Open the `/frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   * The web application will launch at **http://localhost:3000**

---

## 🔑 Seeding Credentials (Password: `password123`)

Use these pre-configured user credentials to log in and test the workflow tiers:

| Name | Email | System Role | Reporting Manager |
| :--- | :--- | :--- | :--- |
| **Alice Smith** | `employee@company.com` | `EMPLOYEE` (Software Engineer) | Bob Johnson |
| **Bob Johnson** | `manager@company.com` | `MANAGER` (Engineering Manager) | Jane Doe |
| **Jane Doe** | `hr@company.com` | `HR` (HR Director) | *None* |
| **Admin Principal** | `admin@company.com` | `ADMIN` (System Administrator) | *None* |

### Test Workflow Flow:
1. Log in as **Alice Smith** (`employee@company.com`) and apply for a 3-day Casual leave.
2. Log in as **Bob Johnson** (`manager@company.com`) to view the pending request under **Approvals** and approve it.
3. Log in as **Jane Doe** (`hr@company.com`) to final-approve it. Upon approval, Alice's Casual leave balance will automatically decrement from `15` to `12`, and an audit log timeline is committed.

---

## 🌐 Deploying to Public Links

### Step 1: Push to GitHub
Since Git is local, you can push the codebase to your GitHub repository:
1. Create a **new public repository** on GitHub (do not add a README, license, or `.gitignore` since they are already here).
2. Open your terminal at the project root (`employee-management-system/`) and run:
   ```bash
   # Initialize git repository
   git init

   # Stage and commit all code
   git add .
   git commit -m "feat: complete employee management system with leave workflow"

   # Rename branch to main
   git branch -M main

   # Link your local repo to GitHub (replace with your URL)
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git

   # Push the code
   git push -u origin main
   ```

### Step 2: Deploy Backend & Database on Render
1. Sign up on **[Render.com](https://render.com/)**.
2. Click **New +** and select **PostgreSQL**. Name it and choose the free tier. Once created, copy the **External Database URL**.
3. Click **New +** and select **Web Service**.
4. Connect your GitHub repository.
5. In settings:
   * **Root Directory**: `backend`
   * **Build Command**: `npm install && npx prisma generate`
   * **Start Command**: `npm start`
6. Add the following **Environment Variables**:
   * `DATABASE_URL`: *(Your Render PostgreSQL Connection URL)*
   * `JWT_SECRET`: *(A custom security string)*
   * `PORT`: `10000` (or leave default, Render matches automatically)
7. Once successfully deployed, Render will give you a public API URL (e.g. `https://your-backend.onrender.com`). Use this URL to update your frontend configuration.

### Step 3: Deploy Frontend on Vercel
1. Sign up on **[Vercel.com](https://vercel.com/)**.
2. Click **Add New** > **Project** and import your GitHub repository.
3. In settings:
   * **Framework Preset**: `Create React App`
   * **Root Directory**: `frontend`
4. If you deployed your backend to Render, make sure to set the API Base URL in your code/environment variables to point to the Render backend URL instead of `http://localhost:5000`.
5. Click **Deploy**. Vercel will generate a secure public link (`https://your-project.vercel.app`) you can share!
