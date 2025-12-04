const asyncHandler = require("express-async-handler");

// const pageRequest = require("../models/p_requestModel");

const getHome = asyncHandler(async (req, res) => {
    // const index = await pageRequest.find();
    res.render("index.ejs");
}) 
const getPlan = asyncHandler(async (req, res) => {
    // const index = await pageRequest.find();
    res.render("plan/plan.ejs", { googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY, geminiApiKey: process.env.GEMINI_API_KEY });
}) 
const getRegion = asyncHandler(async (req, res) => {
    // const index = await pageRequest.find();
    res.render("region/region.ejs");
}) 
const getBooking = asyncHandler(async (req, res) => {
    // const index = await pageRequest.find();
    res.render("booking/booking.ejs");
}) 
const getDashboard = asyncHandler(async (req, res) => {
    // const index = await pageRequest.find();
    res.render("dashboard/dashboard.ejs");
}) 

module.exports = {
    getHome,
    getPlan,
    getRegion,
    getBooking,
    getDashboard
};