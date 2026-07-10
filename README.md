# Parla Təmizlik — Parla Clean Pro

Peşəkar təmizlik xidmətləri üçün veb sayt + admin panel.

## Struktur

```
parla-clean-pro/
├── frontend/           # Statik HTML/CSS/JS (GitHub Pages)
│   ├── index.html
│   └── style.css
├── backend/            # Express.js API (Render)
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   ├── routes/
│   │   ├── contacts.js  # POST /api/contact
│   │   ├── auth.js      # POST /api/auth/login
│   │   └── admin.js     # GET/PUT/DELETE /api/admin/*
│   └── middleware/
│       └── auth.js
├── database.sql        # MySQL schema + default admin
├── .github/workflows/
│   └── deploy.yml      # Render deploy workflow
└── README.md
```

## Deploy addımları

### 1. GitHub Repo
Bu repo artıq GitHub-da: `Mcman23/parla-clean-pro`

### 2. Frontend — GitHub Pages
- `gh-pages` branch-ində `frontend/` qovluğunun içindəki fayllar var
- GitHub → Settings → Pages → Source: `gh-pages` branch → `/ (root)`
- URL: `https://mcman23.github.io/parla-clean-pro/`

### 3. Backend — Render
- Render.com → New → Web Service → GitHub repo seç → `backend` qovluğu
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables:
  - `DB_HOST` — MySQL host
  - `DB_USER` — MySQL istifadəçi
  - `DB_PASS` — MySQL şifrə
  - `DB_NAME` — `parla_clean`
  - `JWT_SECRET` — təsadüfi string
  - `RENDER_DEPLOY_HOOK` — (optional) Render deploy hook URL

### 4. Database
`database.sql` faylını MySQL-də bir dəfə işə salın. Admin user avtomatik yaradılır:
- Username: `admin`
- Password: `admin123`

## API Endpoints

| Method | Path | Açıqlama |
|--------|------|----------|
| POST | `/api/contact` | Əlaqə forması (public) |
| POST | `/api/auth/login` | Admin login |
| GET | `/api/admin/contacts` | Bütün müraciətlər (auth) |
| PUT | `/api/admin/contacts/:id` | Status yenilə (auth) |
| DELETE | `/api/admin/contacts/:id` | Müraciəti sil (auth) |
| GET | `/api/admin/stats` | Dashboard statistika (auth) |
