# Batchly: mini ERP for a food-ingredient company

Internal tool for company staff (customers never log in). One database, connected modules:
**leads -> orders -> stock -> dashboard.**

**Stack:** React (Vite) + Node/Express + PostgreSQL, JWT auth with roles, Recharts, Groq (LLaMA) for the AI summary.

## Features
- Login with roles: `admin` and `sales` (role checked on the backend)
- Customers, Leads (New -> Contacted -> Quoted -> Won / Lost, notes, follow-up date, filter)
- Inventory with low-stock warning and stock movement log (admin adds/restocks products)
- Orders: total calculated, stock reduced in one **database transaction**; rejected if stock is short
- Dashboard: revenue, orders, new leads, low-stock cards + 3 charts
- AI summary: aggregated numbers are sent to an LLM, which returns a plain-English summary

Demo logins (password `demo1234`): `admin@demo.com`, `sales@demo.com`

---

## Run locally

### 1. Database (Neon, free)
1. Create a project at https://neon.tech and copy the connection string (`postgresql://...`).

### 2. Backend
```
cd server
npm install
cp .env.example .env        (Windows: copy .env.example .env)
```
Edit `.env`:
- `DATABASE_URL` = your Neon string
- `DATABASE_SSL=true` (for Neon)
- `JWT_SECRET` = any long random text
- `GROQ_API_KEY` = your Groq key (optional; only the AI summary needs it)

Then:
```
npm run db:setup     # creates tables + demo data (this WIPES existing tables)
npm run dev          # http://localhost:5000/api/health
```

### 3. Frontend
```
cd client
npm install
cp .env.example .env        (Windows: copy .env.example .env)
npm run dev                 # http://localhost:5173
```

---

## Deploy

**Backend on Render** (New -> Web Service, connect your GitHub repo)
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `DATABASE_URL`, `DATABASE_SSL=true`, `JWT_SECRET`, `GROQ_API_KEY`, `CLIENT_URL` (your Vercel URL, add after step below)
- Run `npm run db:setup` once locally with the Neon URL in `.env` to create the tables.

**Frontend on Vercel** (Add New -> Project, same repo)
- Root directory: `client`, framework: Vite
- Environment variable: `VITE_API_URL` = `https://YOUR-RENDER-APP.onrender.com/api`

Then go back to Render, set `CLIENT_URL` to your Vercel URL (no trailing slash) and redeploy.

Note: Render's free tier sleeps after inactivity; the first request can take about 50 seconds. Open the site once before sharing the link.

---

## Project structure
```
server/
  index.js            app setup, routes, error handler
  db.js               PostgreSQL connection pool
  schema.sql          all tables
  seed.js             creates tables + demo data
  middleware/auth.js  JWT check + role check
  routes/             auth, customers, leads, items, orders, dashboard, ai
client/src/
  api.js              fetch helper (adds JWT)
  auth.jsx            login state
  pages/              Login, Dashboard, Leads, Customers, Inventory, Orders
```

## Ideas for next steps
Email/WhatsApp notifications, invoice PDF, Tally voucher export, HubSpot sync.
