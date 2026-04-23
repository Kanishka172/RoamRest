const Listing=require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const CURATED_HOTEL_IMAGES = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=60",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=60",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=60",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=60",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=60",
    "https://images.unsplash.com/photo-1444201983204-c43cbd584d93?auto=format&fit=crop&w=1200&q=60",
];

const DEFAULT_HOTEL_IMAGE = CURATED_HOTEL_IMAGES[0];
const PAGE_SIZE = 9;
const RANDOM_DISCOVERY_CITIES = [
    "Delhi",
    "Mumbai",
    "Goa",
    "Jaipur",
    "Bengaluru",
    "London",
    "Paris",
    "Dubai",
    "Singapore",
    "Tokyo",
    "Sydney",
    "New York",
];

function pickRandomCity() {
    const idx = Math.floor(Math.random() * RANDOM_DISCOVERY_CITIES.length);
    return RANDOM_DISCOVERY_CITIES[idx];
}

function pickCuratedHotelImage(seed = "hotel") {
    let hash = 0;
    for (const ch of seed) {
        hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    }
    const idx = hash % CURATED_HOTEL_IMAGES.length;
    return CURATED_HOTEL_IMAGES[idx];
}

async function getGooglePlacesHotelImage(name, address) {
    const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!googlePlacesApiKey) {
        return null;
    }

    const searchQuery = encodeURIComponent(`${name} ${address}`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&type=lodging&key=${googlePlacesApiKey}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
        return null;
    }

    const searchData = await searchRes.json();
    const place = searchData.results && searchData.results[0];
    const photoRef = place && place.photos && place.photos[0] && place.photos[0].photo_reference;
    if (!photoRef) {
        return null;
    }

    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoRef}&key=${googlePlacesApiKey}`;
}

async function fetchLiveHotelsByLocation(location, limit = 12, radius = 10000) {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
        return [];
    }

    const geocodeRes = await geocodingClient.forwardGeocode({
        query: location,
        limit: 1,
    }).send();

    const feature = geocodeRes.body.features && geocodeRes.body.features[0];
    if (!feature || !feature.center || feature.center.length < 2) {
        return [];
    }

    const lng = feature.center[0];
    const lat = feature.center[1];

    const url = new URL("https://api.geoapify.com/v2/places");
    url.searchParams.set("categories", "accommodation.hotel");
    url.searchParams.set("filter", `circle:${lng},${lat},${radius}`);
    url.searchParams.set("bias", `proximity:${lng},${lat}`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url);
    if (!response.ok) {
        return [];
    }

    const data = await response.json();
    return await Promise.all((data.features || []).map(async (featureItem) => {
        const props = featureItem.properties || {};
        const hotelLng = props.lon;
        const hotelLat = props.lat;
        const hotelName = props.name || "Unnamed Hotel";
        const hotelAddress = props.formatted || "Address unavailable";
        let imageUrl = await getGooglePlacesHotelImage(hotelName, hotelAddress);
        if (!imageUrl) {
            imageUrl = pickCuratedHotelImage(`${hotelName}-${hotelAddress}`);
        }

        return {
            id: props.place_id || featureItem.id,
            name: hotelName,
            address: hotelAddress,
            lat: hotelLat,
            lng: hotelLng,
            distanceMeters: props.distance,
            imageUrl: imageUrl || DEFAULT_HOTEL_IMAGE,
        };
    }));
}


module.exports.index=async (req,res)=>{
    const parsedPage = Number(req.query.page);
    const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
    const skip = (currentPage - 1) * PAGE_SIZE;

    const [allListings, totalListings] = await Promise.all([
        Listing.find({}).skip(skip).limit(PAGE_SIZE),
        Listing.countDocuments({}),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalListings / PAGE_SIZE));
    const searchLocation = (req.query.location || "").trim();
    const trendingEnabled = req.query.trending === "1";
    const requestedTrendingCity = (req.query.trendingCity || "").trim();
    let liveHotels = [];
    let liveOriginLocation = searchLocation;
    let liveSectionTitle = "Live Hotel Results";

    if (searchLocation) {
        try {
            liveHotels = await fetchLiveHotelsByLocation(searchLocation);
            liveSectionTitle = `Live Hotel Results for \"${searchLocation}\"`;
        } catch (err) {
            liveHotels = [];
        }
    } else if (trendingEnabled) {
        liveOriginLocation = requestedTrendingCity || pickRandomCity();
        try {
            liveHotels = await fetchLiveHotelsByLocation(liveOriginLocation, 9, 12000);
            liveSectionTitle = `Trending Live Stays in ${liveOriginLocation}`;
        } catch (err) {
            liveHotels = [];
        }
    }

    res.render("listings/index.ejs",{
        allListings,
        liveHotels,
        searchLocation,
        liveOriginLocation,
        liveSectionTitle,
        trendingEnabled,
        currentPage,
        totalPages,
    });
}

module.exports.renderNewForm=(req,res)=>{
    res.render("listings/new.ejs")
}

module.exports.showListing=async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id).populate({path:"reviews",populate:{path:"author"}}).populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for does not exist!")
        res.redirect("/listings");
    }
    console.log(listing)
    res.render("listings/show",{listing});
}

module.exports.createListing=async(req,res,next)=>{
    let response=await geocodingClient.forwardGeocode({
        query:req.body.listing.location,
        limit:1,
    })
    .send();
    
    

    let url=req.file.path;
    let filename=req.file.username
    const newListing=new Listing(req.body.listing);
    if(req.file){
        newListing.image={
            url: req.file.path,
            filename: req.file.filename
        };
    }
    newListing.owner=req.user._id;
    newListing.image={url,filename}

    newListing.geometry=response.body.features[0].geometry;

    let savedListing=await newListing.save();
    console.log(savedListing)
    req.flash("success","New Listing Created!");
    res.redirect("/listings")
}

module.exports.importLiveHotel=async(req,res)=>{
    const hotel = req.body.hotel || {};
    const title = (hotel.name || "Live Hotel").trim();
    const address = (hotel.address || "").trim();
    const lat = Number(hotel.lat);
    const lng = Number(hotel.lng);
    const searchLocation = (hotel.searchLocation || "").trim();

    if (!title || !address || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        req.flash("error", "Invalid hotel data. Please search again and try importing.");
        return res.redirect("/listings");
    }

    const addressParts = address.split(",").map((p) => p.trim()).filter(Boolean);
    const country = addressParts.length > 0 ? addressParts[addressParts.length - 1] : "Unknown";
    const location = searchLocation || (addressParts.length > 1 ? addressParts[addressParts.length - 2] : address);

    const importedListing = new Listing({
        title,
        description: `Imported from live venues: ${address}`,
        price: 2500,
        location,
        country,
        geometry: {
            type: "Point",
            coordinates: [lng, lat],
        },
        image: {
            url: hotel.imageUrl || pickCuratedHotelImage(`${title}-${location}`),
            filename: "live-hotel-image",
        },
        owner: req.user._id,
    });

    await importedListing.save();
    req.flash("success", "Live hotel imported to your listings.");
    return res.redirect(`/listings/${importedListing._id}`);
}

module.exports.renderEditForm=async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!")
        res.redirect("/listings");
    }
    res.render("listings/edit",{listing});
}

module.exports.updateListing=async(req,res)=>{
    
    let {id}=req.params;
    let listing = await Listing.findByIdAndUpdate(id,{...req.body.listing});
    
    if(typeof req.file !=="undefined"){
        let url=req.file.path;
        let filename=req.file.filename;
        listing.image={url,filename};
        await listing.save();
    }
    
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`)
}

module.exports.destroyListing=async(req,res)=>{
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing deleted!");
    res.redirect("/listings");
}