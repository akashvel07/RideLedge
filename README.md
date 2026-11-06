# RideLedger – Personal Bike & Rapido Tracker

> **Tagline:** Your bike. Your fuel. Your actual earnings.

**RideLedger** is a mobile-first Progressive Web App (PWA) designed around a **TVS Jupiter 110** scooter used for both personal transportation and Rapido bike taxi work. It tracks real-world fuel mileage using an exact **full-tank-to-full-tank** measurement engine, calculates true Rapido profitability (fares + tips − real fuel expenses − maintenance allocation), tracks service intervals, and operates seamlessly offline with background synchronization.

---

## Features

1. **Dashboard (Screen 01 - `/dashboard`)**:
   - Time-based greeting, TVS Jupiter 110 status, current odometer.
   - Prominent **Full-to-Full Measured Mileage Card** (km/l, cost/km, measurement cycle status).
   - **Today's Activity Split**: Separate cards for Rapido (distance, earnings, hours, rate/km) and Personal (distance, trip count).
   - **Financial Breakdown**: Clear distinction between recorded amounts (fares + tips) and estimated fuel and maintenance allocations.
   - **Service Health Reminder**: Live countdown to next service target.
   - **Recent Activity Feed**: Latest 5 sessions, refills, and repairs.

2. **Trip Management (Screen 02 - `/trips`)**:
   - **Rapido Shifts**: Start session with odometer auto-suggestion, live active shift banner, and end shift modal.
   - **Rapido Tips Integration**: Explicitly records base fares and customer tips to calculate total earnings.
   - **Personal Scooting**: Record personal trips (Home, Shopping, Family, Work, Other) without mixing them into business earnings.
   - Validations: Prevents negative distances, duplicate active sessions, and negative earnings.

3. **Fuel & Mileage Engine (Screen 03 - `/fuel`)**:
   - **Full-Tank-to-Full-Tank Logic**: Initial full-tank sets reference; intermediate partial fills accumulate consumed litres; closing full tank computes exact km/l.
   - **Weighted Mileage**: Overall average is computed as `(Total Measured Distance) / (Total Measured Fuel)` across all cycles.
   - Discrepancy detector for petrol pump rounding differences.
   - Trend chart of measured mileage over time.

4. **Service & Maintenance (Screen 04 - `/service`)**:
   - Countdown to next target (Engine oil, general service, brake pads).
   - Alerts: *On Track*, *Upcoming* (≤ 200 km), *Due Soon* (≤ 100 km), and *Overdue*.
   - Document reminders: Two-wheeler insurance, PUC, and registration renewals.

5. **Insights & Analytics (Screen 05 - `/insights`)**:
   - Time filters: *This Week*, *This Month*, *Last Month*, *All Time*.
   - Donut chart showing usage percentage between Rapido business vs Personal scooting.
   - **Profitability Engine**: Total earnings (fares + tips), fuel cost allocation, maintenance allocation (@ ₹0.50/km default), and net profit margin %.
   - **One-Click Export**: Download structured CSV data or generate a monthly PDF report via jsPDF.

6. **Vehicle Profile & Settings (Screen 06 - `/settings`)**:
   - TVS Jupiter 110 profile details.
   - Theme toggle: Light, Dark, and System mode.
   - Maintenance rate customization.
   - Complete JSON database backup export.

7. **PWA & Offline Capability**:
   - Installable on Android (Chrome) and iOS as a standalone app.
   - **Local-First IndexedDB**: Trips, fuels, and services work offline immediately.
   - **Background Sync Queue**: Auto-syncs pending mutations to Supabase when connectivity returns.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons.
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Auth, Storage).
- **Data Visualization**: Recharts (Mileage trends and Donut usage distribution).
- **PWA & Storage**: `vite-plugin-pwa`, Web App Manifest, Service Worker, `idb` (IndexedDB).
- **Date & Currency**: `date-fns`, Indian Rupee (INR / ₹) formatted for `Asia/Kolkata`.
- **Reporting**: `jspdf` for PDF report generation.
- **Testing**: `vitest` unit test suite for all calculation engines.

---

## Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### 2. Installation
```bash
git clone <repo-url> RideLedger
cd RideLedger
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Provide your Supabase URL and Anon Key (from Supabase Dashboard > Settings > API):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
> *Note:* If Supabase credentials are not provided, RideLedger automatically runs in **high-performance local-first mode** using IndexedDB, so you can test all features offline immediately!

### 4. Database Migrations (Supabase)
Run the SQL migration located at `supabase/migrations/20250101000000_create_rideledger_schema.sql` in your Supabase SQL Editor:
1. Open [Supabase Dashboard](https://app.supabase.com).
2. Go to **SQL Editor** -> **New query**.
3. Paste the contents of `supabase/migrations/20250101000000_create_rideledger_schema.sql`.
4. Click **Run**.
This creates all tables, indexes, and enables Row Level Security (RLS) policies.

### 5. Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Running Unit Tests
```bash
npm test
```
Runs 17 unit tests covering the Full-Tank Mileage Engine, Trip aggregation, Rapido Profitability, Service countdowns, and Fuel validations.

### 7. Production Build
```bash
npm run build
```
Builds the static application and service worker into `dist/`.

---

## PWA Installation on Android (Chrome)

1. Deploy the `dist/` build to any HTTPS host (Vercel, Netlify, Cloudflare Pages, Supabase Hosting).
2. Open the URL in Google Chrome on your Android smartphone.
3. Tap the Chrome menu (three dots) -> tap **"Add to Home screen"** or **"Install app"**.
4. RideLedger launches full screen with an app icon and offline caching enabled.

