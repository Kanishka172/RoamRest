mapboxgl.accessToken = mapToken;

const hasCoordinates =
    listing &&
    listing.geometry &&
    Array.isArray(listing.geometry.coordinates) &&
    listing.geometry.coordinates.length === 2;

const fallbackCoordinates = [77.209, 28.6139];
const centerCoordinates = hasCoordinates
    ? listing.geometry.coordinates
    : fallbackCoordinates;

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: centerCoordinates,
    zoom: hasCoordinates ? 9 : 4,
});

new mapboxgl.Marker({ color: "red" })
    .setLngLat(centerCoordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<h4>${listing.title}</h4><p>Exact location will be provided after booking</p>`
        )
    )
    .addTo(map);
