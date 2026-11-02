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

## 4. Deploy later

### Backend -> Render (Web Service)
- Root directory: `backend`, Build: `npm install`, Start: `npm start`
- Use **MongoDB Atlas** for the database (Render cannot reach your local Compass DB).
- Environment variables:
  - `MONGO_URI` = your Atlas connection string
  - `JWT_SECRET` = long random text
  - `CLIENT_URL` = your deployed frontend URL
  - `ADMIN_URL` = your deployed admin URL
  - run `npm run seed` once (Render Shell, or locally with the Atlas `MONGO_URI`)

### Frontend and Admin -> Vercel (two separate projects)
- Root directory: `frontend` (and another project with root `admin`)
- Framework preset: Vite
- Environment variable: `VITE_API_URL` = your Render backend URL (no trailing slash)
- `vercel.json` is already included so page refresh works with React Router.

### Important note about uploads
Render's free disk is temporary, so uploaded images/documents are deleted on every redeploy.
For production, move uploads to Cloudinary / S3 (only `middleware/upload.js` and the
file-path fields need to change).
