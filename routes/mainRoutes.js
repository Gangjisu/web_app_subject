const express = require("express");
const router = express.Router();
const {
    getHome,
    getPlan,
    getRegion,
    getBooking,
    getDashboard,
    getMapsKey,
    postRecommend
} = require("../controllers/mainController");

router
    .route(['/','/home'])
    .get(getHome)
    ;
router
    .route(['/region'])
    .get(getRegion)
    ;
router
    .route(['/plan'])
    .get(getPlan)
    ;
router
    .route(['/booking'])
    .get(getBooking)
    ;
router
    .route(['/dashboard'])
    .get(getDashboard)
    ;

module.exports = router;