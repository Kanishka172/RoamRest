const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const placesController = require("../controllers/places.js");

router.get("/hotels", wrapAsync(placesController.getHotels));

module.exports = router;