const express = require("express");
const router = express.Router();
const {
    getHome,
    getPlan,
    getRegion,
    getBooking,
    getDashboard
} = require("../controllers/mainController");

// AI 컨트롤러 가져오기
const { getRecommendation } = require("../controllers/aiController");

/////////////////////////header end/////////////////////////////////////

// 기존 라우트
router.route(['/','/home']).get(getHome);
router.route(['/region']).get(getRegion);
router.route(['/plan']).get(getPlan);
router.route(['/booking']).get(getBooking);
router.route(['/dashboard']).get(getDashboard);

// AI 추천 API 라우트 정의
router.post('/api/recommend', getRecommendation);

module.exports = router;