# 🌍 RoamRest

RoamRest is a full-stack Airbnb-style stay-listing app built with Node.js, Express, EJS and **MySQL**.
Users can browse stays, post their own listings with photos, review other listings, and discover live hotels near any city.

## 🚀 Features

- 🏠 **Browse stays** with images, prices, descriptions and a paginated index
- ✨ **Authentication**: signup/login/logout with Passport (local strategy) and bcrypt-hashed passwords; sessions are stored in MySQL
- 🧾 **Listings CRUD**: logged-in users can create, edit and delete their own listings (owner-only checks)
- 🖼️ **Image uploads** to Cloudinary via Multer
- 🗺️ **Maps**: each listing is geocoded with Mapbox and shown on a map
- 💬 **Reviews & ratings** (1–5 stars); only the author can delete a review
- 🔎 **Live hotel search** (Geoapify + Google Places photos) with one-click import into your listings
- ✅ **Server-side validation** with Joi

## 🛠️ Tech Stack

| Layer | Tools |
| --- | --- |
| Runtime / server | Node.js 24, Express 5 |
| Views | EJS, ejs-mate, Bootstrap 5, Mapbox GL JS |
| Database | **MySQL** (`mysql2` connection pool, relational schema with foreign keys) |
| Auth & sessions | Passport (local), bcryptjs, express-session, express-mysql-session, connect-flash |
| Validation | Joi |
| Files | Multer, Cloudinary |
| External APIs | Mapbox Geocoding, Geoapify Places, Google Places |
| Deployment | Vercel (`vercel.json`) |

### Database design

Three tables (see [`init/schema.sql`](init/schema.sql)); a fourth `sessions` table is created automatically by the session store.

```
users (id, username UNIQUE, email, password_hash, created_at)
listings (id, title, description, image_url, image_filename, price, location, country,
          latitude, longitude, owner_id -> users.id ON DELETE CASCADE, created_at)
reviews (id, listing_id -> listings.id ON DELETE CASCADE,
         author_id -> users.id ON DELETE SET NULL, rating CHECK 1..5, comment, created_at)
```

Deleting a listing deletes its reviews through the foreign key, and listing pages load the owner and review authors with SQL `JOIN`s.

## ⚙️ Getting started

### 1. Prerequisites

- Node.js 24+
- A running MySQL 8 server (macOS: `brew install mysql && brew services start mysql`)

### 2. Install and configure

```bash
npm install
cp .env.example .env     # then fill in your own values
```

### 3. Create the tables and sample data

```bash
npm run db:init
```

This creates the database named in `DB_NAME` if needed, creates the tables, adds a demo user (`roamrest-demo`, random password printed once in the terminal, or set `SEED_PASSWORD`) and loads 29 sample listings. **It deletes existing listings first**, so only run it on a fresh or disposable database.

### 4. Run

```bash
npm start
```

Open http://localhost:8080.

## 🔑 Environment variables

See [`.env.example`](.env.example). Never commit your real `.env`.

| Variable | Purpose |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection (`DB_SSL=true` for hosted databases that require TLS) |
| `SECRET` | Session signing secret |
| `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET` | Cloudinary image uploads |
| `MAP_TOKEN` | Mapbox access token |
| `GEOAPIFY_API_KEY` | Live hotel search |
| `GOOGLE_PLACES_API_KEY` | Optional: hotel photos for live results |

## 🏨 Live Hotel Venues API

The backend exposes an endpoint that fetches live hotel venues from Geoapify.

Search by city name:

`GET /api/places/hotels?location=Delhi&limit=20&radius=5000`

Search by coordinates:

`GET /api/places/hotels?lat=28.6139&lng=77.2090&limit=20&radius=5000`

Query params:

- `location`: city or place name (optional if lat/lng provided)
- `lat`, `lng`: coordinates
- `limit`: number of results, max 50 (default 20)
- `radius`: search radius in meters, max 50000 (default 5000)

Returns JSON with `center`, `count`, and `hotels[]` including name, address and coordinates.
