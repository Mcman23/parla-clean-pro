# Parla Təmizlik — Parla Clean Pro

Peşəkar təmizlik xidmətləri üçün veb sayt + admin panel.

## Struktur

```
parla-clean-pro/
├─ backend/                # Express + Sequelize + MySQL (Render)
│  ├─ config.js            # DB & mail config
│  ├─ server.js            # Express app + REST API
│  ├─ data.sql             # MySQL seed data
│  ├─ routes/
│  │  ├─ auth.js           # POST /api/auth/login, /me, /register
│  │  ├─ orders.js         # CRUD /api/orders
│  │  ├─ customers.js      # CRUD /api/customers
│  │  ├─ employees.js      # CRUD /api/employees
│  │  ├─ services.js       # CRUD /api/services
│  │  └─ payments.js       # CRUD /api/payments + /stats
│  ├─ middleware/
│  │  ├─ auth.js           # JWT verification
│  │  └─ error.js          # Global error handler
│  ├─ models/
│  │  └─ index.js          # Sequelize models (User, Customer, Service, Employee, Order, Payment)
│  ├─ utils/
│  │  └─ email.js          # Nodemailer utility
│  ├─ .env.example
│  └─ package.json
├─ frontend/
│  ├─ src/
│  │  ├─ index.html        # Əsas sayt
│  │  ├─ admin.html        # Admin panel
│  │  ├─ css/
│  │  │  ├─ style.css      # Sayt stilləri
│  │  │  └─ admin.css      # Admin stilləri
│  │  ├─ js/
│  │  │  ├─ main.js        # Sayt logikası (contact form, API)
│  │  │  └─ admin.js       # Admin panel (charts, API, CRUD)
│  └─ public/              # Static assets
└─ README.md
```

## Deploy

### Frontend — GitHub Pages
- `gh-pages` branch: `frontend/src/` içindəki fayllar root səviyyəsində
- URL: https://mcman23.github.io/parla-clean-pro/
- Admin: https://mcman23.github.io/parla-clean-pro/admin.html

### Backend — Render
- render.com → New → Web Service → GitHub `Mcman23/parla-clean-pro`
- Root Directory: `backend`
- Build: `npm install` / Start: `npm start`
- Environment Variables:
  - `DB_HOST` — MySQL host
  - `DB_USER` — MySQL istifadəçi
  - `DB_PASS` — MySQL şifrə
  - `DB_NAME` — `parla_clean`
  - `JWT_SECRET` — təsadüfi string
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (optional)

### Database
`backend/data.sql` faylını MySQL-də işə sal. Sequelize sync cədvəlləri yaradır, bu fayl seed məlumatlarını əlavə edir.
- Admin: `admin` / `admin123`

## API Endpoints

| Method | Path | Auth | Açıqlama |
|--------|------|------|----------|
| POST | `/api/auth/login` | — | Admin login |
| GET | `/api/auth/me` | ✅ | Cari istifadəçi |
| GET | `/api/orders` | ✅ | Sifarişlər siyahısı |
| POST | `/api/orders` | — | Yeni sifariş (formadan) |
| PUT | `/api/orders/:id` | ✅ | Sifariş yenilə |
| DELETE | `/api/orders/:id` | ✅ | Sifariş sil |
| GET | `/api/customers` | ✅ | Müştərilər |
| POST | `/api/customers` | ✅ | Müştəri əlavə |
| GET | `/api/employees` | ✅ | İşçilər |
| GET | `/api/services` | — | Xidmətlər (public) |
| POST | `/api/services` | ✅ | Xidmət əlavə |
| GET | `/api/payments` | ✅ | Ödənişlər |
| GET | `/api/payments/stats` | ✅ | Maliyyə statistika |
