require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Client } = require("@googlemaps/google-maps-services-js");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/config/maps-key', (req, res) => {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({ success: false, message: 'GOOGLE_MAPS_API_KEY is not configured.' });
  }

  res.json({ success: true, key: process.env.GOOGLE_MAPS_API_KEY });
});

// 1. API 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const mapsClient = new Client({});


app.post('/api/recommend', async (req, res) => {
  try {
    const { destination, preference } = req.body;

    console.log(`🔍 AI 검색 시작: ${destination}, 취향: ${preference}`);

    // ---------------------------------------------------------
    // 단계 1: Gemini에게 장소 추천받기 (이름만 정확히 받기)
    // ---------------------------------------------------------
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    const prompt = `
      도시: ${destination}
      여행 스타일: ${preference}
      
      위 조건에 딱 맞는 '여행지 1곳'을 추천해줘.
      응답은 오직 JSON 형식으로만 줘. 
      스키마: { "placeName": "정확한 장소명", "reason": "추천 이유 1문장", "activity": "할 수 있는 활동", "activityTime": "예상 총 활동 시간" }
    `;

    const aiResult = await model.generateContent(prompt);
    const aiResponseText = aiResult.response.text();
    
    // JSON 파싱 (Markdown 코드 블록 제거)
    const cleanedText = aiResponseText.replace(/```json|```/g, '').trim();
    const aiData = JSON.parse(cleanedText);
    
    console.log(`🤖 AI 추천 완료: ${aiData.placeName}`);

    // ---------------------------------------------------------
    // 단계 2: Google Maps API로 상세 정보(좌표, 사진, 평점) 조회
    // ---------------------------------------------------------
    const mapsResponse = await mapsClient.textSearch({
      params: {
        query: `${destination} ${aiData.placeName}`, // 예: "도쿄 시모키타자와"
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: 'ko', // 한국어 결과 요청
      },
      timeout: 1000, // 1초 타임아웃 설정
    });

    // 검색 결과가 있을 경우 첫 번째 장소 정보 가져오기
    const placeDetails = mapsResponse.data.results[0];

    if (!placeDetails) {
      throw new Error("구글 맵에서 장소를 찾을 수 없습니다.");
    }

    // ---------------------------------------------------------
    // 단계 3: 데이터 합치기 (AI의 추천 이유 + 지도의 정확한 위치)
    // ---------------------------------------------------------
    const finalResult = {
      ai_recommendation: {
        name: aiData.placeName,
        reason: aiData.reason,
        activity: aiData.activity,
        activityTime: aiData.activityTime
      },
      map_info: {
        address: placeDetails.formatted_address,
        location: placeDetails.geometry.location, // { lat: 35.xxx, lng: 139.xxx }
        rating: placeDetails.rating,
        user_ratings_total: placeDetails.user_ratings_total,
        // 사진이 있다면 첫 번째 사진의 참조값 가져오기
        photo_reference: placeDetails.photos ? placeDetails.photos[0].photo_reference : null
      }
    };

    res.json({ success: true, data: finalResult });

  } catch (error) {
    console.error("❌ 에러 발생:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 여행 추천 서버 가동 중: http://localhost:${port}`);
});
