# 🏠 HomeCrew
Home Maintenance & Household Services Platform (MERN stack, built from the project report).

Customers request services, technicians/contractors register with documents, the admin verifies
them and assigns them to requests, and customers track the status.

| Folder      | What it is                         | Tech                          | Port |
|-------------|------------------------------------|-------------------------------|------|
| `backend/`  | REST API                           | Node + Express + MongoDB      | 5000 |
| `frontend/` | Customer + Technician website      | React (Vite) + Tailwind CSS   | 5173 |
| `admin/`    | Admin panel (separate app)         | React (Vite) + Tailwind CSS   | 5174 |

Theme: page background `bg-[#fbfdf5]` with a green accent (`brand` colour in `tailwind.config.js`).

---

## 1. Run on your computer

You need **Node.js 18+** and **MongoDB** running locally (MongoDB Compass connects to it).

### Step 1 - MongoDB Compass
Open Compass and connect to `mongodb://127.0.0.1:27017`. The database `homecrew` is created
automatically by the seed command below.

### Step 2 - Backend
```bash
cd backend
npm install
npm run seed      # creates the admin account + 7 default services
npm run dev       # http://localhost:5000
```
`.env` is already created (copy of `.env.example`). Change `JWT_SECRET` before deploying.

### Step 3 - Customer website
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

### Step 4 - Admin panel (new terminal)
```bash
cd admin
npm install
npm run dev       # http://localhost:5174
```

### Admin login
- Email: `admin@homecrew.com`
- Password: `admin123`

(change in `backend/.env` *before* running `npm run seed`)

### Try the full flow
1. Frontend -> **Join as Pro** -> register a technician with an ID file + certificate.
2. Admin panel -> **Professionals** -> review documents -> **Approve**.
3. Frontend -> **Sign up** as a customer -> **Request a service** (add photos).
4. Admin panel -> **Service Requests** -> **Assign professional**.
5. Login as the technician (Login page -> *Technician / Contractor* tab) -> Start work -> Mark completed.
6. Customer -> **My Requests** shows the live status.

---

## 2. Project structure (easy to follow)

```
HomeCrew/
├── backend/
│   ├── uploads/                 uploaded photos + documents
│   └── src/
│       ├── server.js            app entry (CORS, routes, errors)
│       ├── seed.js              first admin + default services
│       ├── config/db.js         MongoDB connection
│       ├── models/              User, Admin, Professional, Service, ServiceRequest, Verification
│       ├── middleware/          auth.js (JWT + roles), upload.js (multer), errorHandler.js
│       ├── controllers/         the logic for each module
│       ├── routes/              URL -> controller mapping
│       └── utils/               token, password hashing, asyncHandler
├── frontend/src/
│   ├── api/client.js            all fetch calls + API URL
│   ├── context/AuthContext.jsx  login state (customer / professional)
│   ├── hooks/useFetch.js        small data-loading hook
│   ├── components/              Navbar, Footer, ServiceCard, RequestCard, FormInput, Button ...
│   │   └── home/                Hero, HowItWorks, WhyUs
│   └── pages/                   Home, Services, Login, Register, Dashboard, RequestService ...
└── admin/src/
    ├── context/AdminAuthContext.jsx
    ├── components/              AdminLayout (sidebar), Modal, StatCard ...
    └── pages/                   Login, Dashboard, Services, Professionals, Requests, Users
```

Report modules -> code:
- Registration/Login, Profile -> `authController`, `Login.jsx`, `Register.jsx`, `Profile.jsx`
- Service Management -> `serviceController`, admin `Services.jsx`
- Service Request + Tracking -> `requestController`, `RequestService.jsx`, `MyRequests.jsx`
- Technician/Contractor + Verification -> `professionalController`, `adminController.verifyProfessional`
- Service Assignment -> `adminController.assignProfessional`, admin `Requests.jsx`
- Image management -> `middleware/upload.js` (multer)
- JWT + role based access -> `middleware/auth.js`

## 3. API overview

| Method | URL | Who |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | customer |
| GET/PUT | `/api/auth/me`, `/api/auth/profile` | customer |
| GET | `/api/services`, `/api/services/:id` | public |
| POST/PUT/DELETE | `/api/services`, `/api/services/:id` | admin |
| POST | `/api/requests` (multipart `images`) | customer |
| GET | `/api/requests/my`, `/api/requests/:id` | customer |
| PUT | `/api/requests/:id/cancel` | customer |
| POST | `/api/professionals/register` (multipart `idDocument`, `certificate`), `/login` | professional |
| GET | `/api/professionals/me`, `/api/professionals/requests` | professional |
| PUT | `/api/professionals/requests/:id/status` | professional |
| POST | `/api/admin/login` | admin |
| GET | `/api/admin/stats`, `/users`, `/professionals`, `/requests` | admin |
| PUT | `/api/admin/professionals/:id/verify`, `/requests/:id/assign`, `/requests/:id/status` | admin |

---

## 3. Key Advanced Features Implemented

1. **Dual Payment System (Online via Razorpay + Cash on Service Lock)**:
   - Customers choose payment method (COS or Online) upon booking.
   - Enforced lock: prevents switching payment methods at doorstep.
2. **Technician Financial Ledger & Commission Auto-Offset**:
   - 10% platform commission on cash orders is auto-offset against online earnings.
   - Debt protection limit blocks technicians from receiving leads if cash commission exceeds threshold.
   - Admin UPI settlement assistant with 1-click mobile copy and UPI deep linking (`upi://pay`).
3. **Live Real-Time Notification Bell System**:
   - Dynamic counter badge (`1, 2, 3...`) across Customer, Technician, and Admin portals.
   - Live polling for real-time alerts on booking, assignment, bill generation, and payments.
4. **Verified Contact Security**:
   - Dual OTP verification via Gmail SMTP and Twilio Verify.

---

## 4. Deploying to the Cloud

### Step 1: MongoDB Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and get your connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/homecrew?retryWrites=true&w=majority`.

### Step 2: Backend -> Render (Web Service)
1. Go to [Render.com](https://render.com), click **New +** -> **Web Service**, and connect your GitHub repo `sumansett/HomeCrew`.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. Environment Variables in Render:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = your secret key
   - `PORT` = `5001`
   - `CLIENT_URL` = your deployed frontend Vercel URL
   - `ADMIN_URL` = your deployed admin Vercel URL
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`
   - `PLATFORM_COMMISSION_PERCENT` = `10`
   - `SMTP_EMAIL` & `SMTP_APP_PASSWORD`
4. Once deployed, note your Render URL (e.g. `https://homecrew-api.onrender.com`).

### Step 3: Frontend (Customer & Technician) -> Vercel
1. Go to [Vercel.com](https://vercel.com), click **Add New Project**, and import `sumansett/HomeCrew`.
2. Settings:
   - **Root Directory:** Edit to `frontend`
   - **Framework Preset:** Vite
3. Environment Variables:
   - `VITE_API_URL` = `https://homecrew-api.onrender.com` (your backend URL without trailing slash)
4. Click **Deploy**.

### Step 4: Admin Panel -> Vercel
1. In Vercel, click **Add New Project**, and import `sumansett/HomeCrew` again.
2. Settings:
   - **Root Directory:** Edit to `admin`
   - **Framework Preset:** Vite
3. Environment Variables:
   - `VITE_API_URL` = `https://homecrew-api.onrender.com`
4. Click **Deploy**.

