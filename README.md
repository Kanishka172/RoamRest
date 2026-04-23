🌍 WanderLust – Airbnb-like MERN App
WanderLust is a full-stack Airbnb clone built using the MERN stack (MongoDB, Express.js, React.js, Node.js).
It allows users to browse, book, and list vacation stays just like Airbnb, with authentication, property management, and a clean responsive UI.

🚀 Features
🏠 Browse Stays: View listings with images, prices, and descriptions.
✨ User Authentication: Secure signup/login using JWT and bcrypt.
🧾 Add & Manage Listings: Logged-in users can post, edit, and delete their own stays.
💬 Reviews & Ratings: Users can review and rate properties.
💡 Search & Filter: Find stays by location, price, and availability.
📱 Responsive UI: Works smoothly on both desktop and mobile.

## Live Hotel Venues API (Real Locations)

This project now includes a backend API that fetches live hotel venues from Geoapify.

### 1) Add API key in .env

Set this variable in your `.env` file:

`GEOAPIFY_API_KEY=your_geoapify_key`

You can get a free key from Geoapify.

### 2) Use endpoint

Search by city name:

`GET /api/places/hotels?location=Delhi&limit=20&radius=5000`

Search by coordinates:

`GET /api/places/hotels?lat=28.6139&lng=77.2090&limit=20&radius=5000`

### Query params

- `location`: city or place name (optional if lat/lng provided)
- `lat`: latitude
- `lng`: longitude
- `limit`: number of results, max 50 (default 20)
- `radius`: search radius in meters, max 50000 (default 5000)

### Response

Returns JSON with `center`, `count`, and `hotels[]` including name, address, and coordinates.
🛠️ Tech Stack
Frontend:

React.js
React Router
Axios
Bootstrap / Tailwind CSS
Backend:

Node.js
Express.js
MongoDB (Mongoose)
JWT Authentication
CORS
