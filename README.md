# Doctors Appointments Booking System (MERN)

Full‑stack **doctor appointment booking** platform with:

- **Patient Web App** (`Frontend/`) — browse doctors, book/cancel appointments, pay online
- **Admin / Doctor Dashboard** (`admin/`) — manage doctors, availability, appointments
- **Backend API** (`backend/`) — Express API + MongoDB + auth + integrations

---

## Project structure (important)

```text
Doctors-Appointments-Booking-System/
├─ Frontend/   # Patient-facing React (Vite) app  (port: 5173)
├─ admin/      # Admin/Doctor dashboard (Vite)    (port: 5174)
└─ backend/    # Node/Express API                 (port: 4000)
```

> Note: The folder name is **`Frontend`** (capital `F`). Use the same casing in commands.

---

## Tech stack

- **Frontend/Admin**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT
- **Uploads**: Cloudinary
- **Payments**: Razorpay (optional, for “Pay Online”)
- **Email**: Nodemailer (Gmail SMTP)

---

## Prerequisites

Install these first:

- **Node.js**: LTS recommended (18+). Verify:

```bash
node -v
npm -v
```

- **MongoDB**:
  - Option A (recommended): MongoDB Atlas (cloud)
  - Option B: Local MongoDB server

Optional (only if you use these features):
- **Cloudinary account** (doctor images / profile images)
- **Razorpay account** (online payments)
- **Gmail account + App Password** (welcome email + password reset emails)

---

## Quick start (copy/paste)

Open **3 terminals** (PowerShell) in the project root and run:

### 1) Backend (API)

```bash
cd backend
npm install
npm run server
```

Backend runs on: `http://localhost:4000`

### 2) Patient app

```bash
cd ..\Frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### 3) Admin/Doctor dashboard

```bash
cd ..\admin
npm install
npm run dev
```

Admin runs on: `http://localhost:5174`

If you see **CORS errors** or “Network Error”, finish the **Environment Variables** section below.

---

## Environment variables (required)

This project does **not** ship with `.env.example` files, so you must create them manually.

### Backend env: `backend/.env`

Create a file: `backend/.env`

```env
# Server
PORT=4000

# Database (the backend connects to: ${MONGODB_URI}/upchaar)
# Example (Atlas): MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net
# Example (local): MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_URI=

# JWT
JWT_SECRET=change_this_to_a_long_random_secret

# Admin login (used by /api/admin/login)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_password

# CORS + password reset links (must match your running URLs)
FRONTEND_URL=http://localhost:5173
ADMIN_DASHBOARD_URL=http://localhost:5174

# Cloudinary (required for image upload features)
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_SECRET_KEY=

# Email (required for welcome email + password reset)
# For Gmail: use an App Password (not your normal password)
EMAIL_USER=
EMAIL_PASS=

# Razorpay (required only for online payments)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CURRENCY=INR
```

Restart the backend after changing `.env`.

### Frontend env: `Frontend/.env`

Create a file: `Frontend/.env`

```env
VITE_BACKEND_URL=http://localhost:4000
VITE_ADMIN_URL=http://localhost:5174
VITE_RAZORPAY_KEY_ID=
```

Notes:
- `VITE_ADMIN_URL` is used by the patient app “Doctor Login” button.
- `VITE_RAZORPAY_KEY_ID` is required only if you want the “Pay Online” flow to work.

### Admin env: `admin/.env`

Create a file: `admin/.env`

```env
VITE_BACKEND_URL=http://localhost:4000
```

Restart Vite dev servers after changing `.env` files.

---

## Setup details (step-by-step)

### 1) MongoDB (Atlas or Local)

- **Atlas**:
  - Create a cluster
  - Add a database user
  - Add your IP to Network Access (or allow access for dev)
  - Copy the connection string (SRV)
  - Put it into `backend/.env` as `MONGODB_URI` (without the database name at the end)

- **Local MongoDB**:
  - Ensure MongoDB is running
  - Use: `MONGODB_URI=mongodb://127.0.0.1:27017`

The backend connects to the `upchaar` database automatically.

### 2) Cloudinary (for image uploads)

From Cloudinary dashboard, copy:
- `CLOUDINARY_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_SECRET_KEY`

Put them in `backend/.env`.

### 3) Gmail App Password (for emails)

This backend uses Nodemailer with `service: "gmail"`.

- Enable 2‑step verification on your Google account
- Create an **App Password**
- Put it into:
  - `EMAIL_USER=yourgmail@gmail.com`
  - `EMAIL_PASS=your_app_password`

### 4) Razorpay (optional)

If you want online payment:
- Put Razorpay keys in `backend/.env`:
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
- Put the **public key** in `Frontend/.env`:
  - `VITE_RAZORPAY_KEY_ID`

---

## Default ports

- **Backend**: `4000` (or `PORT` in `backend/.env`)
- **Frontend**: `5173`
- **Admin**: `5174`

---

## Common problems & fixes

### Backend starts but MongoDB fails

- **Check `MONGODB_URI`** in `backend/.env`
- For Atlas: ensure your **IP is allowed** in Network Access
- Ensure your connection string does **not** end with a database name, because the code appends `/upchaar`

### CORS / Network Error in frontend/admin

Backend CORS only allows:
- `FRONTEND_URL`
- `ADMIN_DASHBOARD_URL`

Make sure these are set correctly in `backend/.env` and match exactly:
- `http://localhost:5173`
- `http://localhost:5174`

### Node.js v24 on Windows + MongoDB Atlas SRV issues

This backend includes a workaround at the top of `backend/server.js` for Windows DNS SRV resolution issues by setting DNS servers explicitly.

---

## Features

### Patient

- Signup/Login (JWT)
- Browse doctors and view details
- Book appointment slots
- View appointments
- Cancel appointments
- Razorpay online payment (optional)
- Forgot/reset password (email)

### Doctor (via `admin/`)

- Login
- View appointments, mark completed, cancel
- Manage availability (add/update/delete)
- Dashboard summary
- Forgot/reset password (email)

### Admin (via `admin/`)

- Admin login using `ADMIN_EMAIL` + `ADMIN_PASSWORD`
- Add doctors (with Cloudinary image upload)
- View all doctors and appointments
- Change doctor availability / lock/unlock
- Dashboard metrics

---

## Useful scripts

### Backend

```bash
cd backend
npm run server   # dev (nodemon)
npm start        # prod
```

### Frontend

```bash
cd Frontend
npm run dev
npm run build
npm run preview
```

### Admin

```bash
cd admin
npm run dev
npm run build
npm run preview
```
