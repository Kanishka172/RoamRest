const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const parseNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

module.exports.getHotels = async (req, res) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Missing GEOAPIFY_API_KEY in environment variables.",
    });
  }

  const limit = Math.min(parseNumber(req.query.limit, 20), 50);
  const radius = Math.min(parseNumber(req.query.radius, 5000), 50000);
  const queryLocation = (req.query.location || "").trim();

  let lat = parseNumber(req.query.lat, null);
  let lng = parseNumber(req.query.lng, null);

  if ((!lat || !lng) && queryLocation) {
    const response = await geocodingClient
      .forwardGeocode({
        query: queryLocation,
        limit: 1,
      })
      .send();

    const feature = response.body.features && response.body.features[0];
    if (!feature || !feature.center || feature.center.length < 2) {
      return res.status(404).json({
        error: "Location not found.",
      });
    }

    lng = feature.center[0];
    lat = feature.center[1];
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({
      error: "Provide either location=CityName or both lat and lng query params.",
    });
  }

  const url = new URL("https://api.geoapify.com/v2/places");
  url.searchParams.set("categories", "accommodation.hotel");
  url.searchParams.set("filter", `circle:${lng},${lat},${radius}`);
  url.searchParams.set("bias", `proximity:${lng},${lat}`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("apiKey", apiKey);

  const geoapifyResponse = await fetch(url);
  if (!geoapifyResponse.ok) {
    const errorText = await geoapifyResponse.text();
    return res.status(geoapifyResponse.status).json({
      error: "Failed to fetch places from Geoapify.",
      details: errorText,
    });
  }

  const data = await geoapifyResponse.json();
  const hotels = (data.features || []).map((feature) => {
    const props = feature.properties || {};
    return {
      id: props.place_id || feature.id,
      name: props.name || "Unnamed Hotel",
      address: props.formatted || "Address unavailable",
      lat: props.lat,
      lng: props.lon,
      categories: props.categories || [],
      distanceMeters: props.distance,
    };
  });

  return res.json({
    source: "geoapify",
    center: { lat, lng },
    count: hotels.length,
    hotels,
  });
};