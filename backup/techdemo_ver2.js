require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());

// API 키 설정 (환경 변수에서 로드)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Gemini 모델 초기화 (Gemini 1.5 Pro 사용 - 2.5 버전은 정식 출시 전까지 1.5 Pro 최신 버전 권장)
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// 구조화된 JSON 출력을 위해 generationConfig 설정
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: { responseMimeType: "application/json" }
});

/**
 * @route POST /api/recommend
 * @desc 사용자 요구사항을 분석하여 단일 여행지를 추천하고 상세 정보를 반환
 */
app.post('/api/recommend', async (req, res) => {
    try {
        const { city, theme, destination, requirements } = req.body;

        // 1. 유효성 검사
        if (!city || !theme) {
            return res.status(400).json({ error: '도시(city)와 테마(theme)는 필수 입력값입니다.' });
        }

        console.log(`[Step 1] Gemini에게 추천 요청 중... (${city}, ${destination || '전역'}, ${theme})`);

        // 2. Gemini 프롬프트 작성
        // AI가 정확한 장소명과 검색 쿼리를 생성하도록 지시
        const prompt = `
            너는 전문 여행 가이드야. 다음 정보를 바탕으로 '단 하나의' 최고의 여행 장소를 추천해줘.
            
            [사용자 입력]
            - 여행 도시: ${city}
            - 여행 테마: ${theme}
            - 희망 지역/목적지: ${destination ? destination : "도시 내에서 가장 적합한 곳"}
            - 사용자 요구사항: ${requirements ? requirements : "특별한 요구사항 없음"}

            [지시사항]
            1. 위 조건에 가장 잘 맞는 구체적인 장소(식당, 관광지, 카페 등) 1곳을 선정해.
            2. Google Maps API에서 검색이 잘 되도록 '공식 명칭'과 '지역명'을 포함한 검색어(searchQuery)를 만들어줘.
            3. 응답은 반드시 아래 JSON 스키마를 따라야 해.

            [JSON 출력 형식]
            {
                "placeName": "장소의 정확한 이름",
                "searchQuery": "Google Maps에서 검색할 정확한 검색어 (예: 도쿄 시부야 스카이)",
                "reason": "이 장소를 추천하는 구체적인 이유 (사용자 요구사항 반영)",
                "activity": "여기서 할 수 있는 구체적인 추천 활동",
                "estimatedTime": "예상 총 활동 시간 (예: 1시간 30분)"
            }
        `;

        // 3. Gemini API 호출
        const result = await model.generateContent(prompt);
        const aiResponse = result.response;
        const aiText = aiResponse.text();
        
        // JSON 파싱
        let aiData;
        try {
            aiData = JSON.parse(aiText);
        } catch (e) {
            console.error("Gemini JSON 파싱 오류:", e);
            // 만약 순수 JSON이 아니라면 마크다운 제거 후 재시도
            const cleanText = aiText.replace(/```json|```/g, '').trim();
            aiData = JSON.parse(cleanText);
        }

        console.log(`[Step 2] AI 추천 완료: ${aiData.placeName} (Query: ${aiData.searchQuery})`);

        // 4. Google Maps Places API (New) 호출 - Text Search
        // 좌표, 평점, 사진, 공식 이름 등을 가져옴
        console.log(`[Step 3] Google Maps에서 상세 정보 조회 중...`);
        
        const mapsUrl = 'https://places.googleapis.com/v1/places:searchText';
        const mapsResponse = await axios.post(
            mapsUrl,
            {
                textQuery: aiData.searchQuery,
                languageCode: "ko" // 한국어 결과 요청
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                    // 필요한 필드만 지정하여 비용 및 응답 속도 최적화 (Field Masking)
                    'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos'
                }
            }
        );

        const places = mapsResponse.data.places;

        if (!places || places.length === 0) {
            // 지도에서 못 찾은 경우 AI 데이터만이라도 반환 (좌표 없음)
            return res.json({
                success: true,
                source: "AI_ONLY",
                data: {
                    ...aiData,
                    location: null,
                    rating: null,
                    photoUrl: null,
                    address: "지도 정보를 찾을 수 없습니다."
                }
            });
        }

        // 가장 정확도가 높은 첫 번째 결과 사용
        const placeDetail = places[0];

        // 5. 사진 URL 생성 (Google Maps API는 photoReference를 줌 -> URL로 변환 필요)
        let photoUrl = null;
        if (placeDetail.photos && placeDetail.photos.length > 0) {
            // Max width/height 400px로 설정
            const photoName = placeDetail.photos[0].name; // 'places/PLACE_ID/photos/PHOTO_ID' 형식
            photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=400&key=${GOOGLE_MAPS_API_KEY}`;
        }

        // 6. 데이터 병합 및 최종 응답 생성
        const finalResponse = {
            name: placeDetail.displayName ? placeDetail.displayName.text : aiData.placeName, // 지도상 공식 명칭 우선
            aiRecommendedName: aiData.placeName,
            address: placeDetail.formattedAddress,
            reason: aiData.reason,
            activity: aiData.activity,
            estimatedDuration: aiData.estimatedTime,
            rating: placeDetail.rating || 0,
            ratingCount: placeDetail.userRatingCount || 0,
            location: {
                lat: placeDetail.location.latitude,
                lng: placeDetail.location.longitude
            },
            photoUrl: photoUrl,
            googleMapsSearchQuery: aiData.searchQuery
        };

        console.log(`[Step 4] 최종 응답 생성 완료`);
        res.json({
            success: true,
            data: finalResponse
        });

    } catch (error) {
        console.error("서버 에러 발생:", error.response ? error.response.data : error.message);
        res.status(500).json({
            success: false,
            error: "여행지 추천 생성 중 오류가 발생했습니다.",
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// ### 2. 실행 방법 및 사용 가이드
// #### A. 환경 변수 설정 (.env)
// 프로젝트 루트 폴더에 `.env` 파일을 만들고 API 키를 입력하세요.
// ```.env
// GEMINI_API_KEY=당신의_GEMINI_API_키
// GOOGLE_MAPS_API_KEY=당신의_GOOGLE_MAPS_API_키
// PORT=3000
// ```
// > **참고:** `Maps_API_KEY`는 Google Cloud Console에서 **Places API (New)**가 활성화되어 있어야 합니다.

// #### B. 서버 실행
// ```bash
// node server.js
// ```

// #### C. API 요청 테스트 (Postman 또는 cURL)

// **Request (POST):** `http://localhost:3000/api/recommend`

// **Body (JSON):**
// ```json
// {
//   "city": "도쿄",
//   "theme": "휴식 및 힐링",
//   "destination": "시부야구",
//   "requirements": "사람이 너무 많지 않고 커피가 맛있는 조용한 카페나 공원이었으면 좋겠어. 사진 찍기 좋은 곳."
// }
// ```

// **Response (예시):**
// ```json
// {
//     "success": true,
//     "data": {
//         "name": "요요기 공원",
//         "aiRecommendedName": "요요기 공원 & 주변 카페 (Little Nap COFFEE STAND)",
//         "address": "2-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-0052 일본",
//         "reason": "시부야구의 번잡함에서 벗어나 힐링할 수 있는 최고의 장소입니다. 넓은 잔디밭과 숲이 있어 조용히 산책하기 좋으며, 공원 서쪽 입구 근처에 있는 'Little Nap COFFEE STAND'는 커피 맛이 훌륭하고 감성적인 사진을 찍기 좋습니다.",
//         "activity": "Little Nap에서 라떼를 테이크아웃하여 공원 벤치에 앉아 숲 풍경 감상하기, 계절 꽃 사진 촬영",
//         "estimatedDuration": "1시간 30분",
//         "rating": 4.5,
//         "ratingCount": 12500,
//         "location": {
//             "lat": 35.6716472,
//             "lng": 139.6948924
//         },
//         "photoUrl": "https://places.googleapis.com/v1/places/.../media?maxHeightPx=400&maxWidthPx=400&key=...",
//         "googleMapsSearchQuery": "도쿄 시부야 요요기 공원 Little Nap COFFEE STAND"
//     }
// }