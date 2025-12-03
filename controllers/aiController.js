const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const asyncHandler = require('express-async-handler');

// API 키 로드
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro", //3.0 pro - preview가 최신이지만 2.5 pro면 충분함
    generationConfig: { responseMimeType: "application/json" }
});

const getRecommendation = asyncHandler(async (req, res) => {
    const { city, theme, requirements } = req.body;

    // 1. 유효성 검사
    if (!city) {
        return res.status(400).json({ error: '여행할 도시(city) 정보가 필요합니다.' });
    }

    console.log(`[AI Request] City: ${city}, Theme: ${theme}`);

    // 2. Gemini 프롬프트 (기존 techdemo.js 내용 유지)
    const prompt = `
        너는 전문 여행 가이드야. 다음 정보를 바탕으로 '단 하나의' 최고의 여행 장소를 추천해줘.
        - 여행 도시: ${city}
        - 여행 테마: ${theme || "자유 여행"}
        - 사용자 요구사항: ${requirements || "특별한 요구사항 없음"}

        [지시사항]
        1. 위 조건에 가장 잘 맞는 구체적인 장소(식당, 관광지, 카페 등) 1곳을 선정해.
        2. Google Maps API에서 검색이 잘 되도록 '공식 명칭'과 '지역명'을 포함한 검색어(searchQuery)를 만들어줘.
        3. 응답은 반드시 아래 JSON 스키마를 따라야 해.

        [JSON 출력 형식]
        {
            "placeName": "장소의 정확한 이름",
            "searchQuery": "Google Maps 검색어 (예: 도쿄 스카이트리, 도쿄 시부야구, 양화대교, 서울 강남구)",
            "reason": "추천 이유",
            "activity": "추천 활동",
            "estimatedTime": "예상 소요 시간 (숫자만, 예: 2, 3, 2.5, 4.8)"
        }
    `;

    try {
        // 3. AI 응답 생성
        const result = await model.generateContent(prompt);
        const aiResponse = result.response;
        let aiData = JSON.parse(aiResponse.text());

        // 4. Google Places API로 상세 정보 조회
        const mapsUrl = 'https://places.googleapis.com/v1/places:searchText';
        const mapsResponse = await axios.post(
            mapsUrl,
            { textQuery: aiData.searchQuery, languageCode: "ko" },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
                    'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.photos'
                }
            }
        );

        const placeDetail = mapsResponse.data.places ? mapsResponse.data.places[0] : null;

        // 5. 응답 데이터 병합
        const responseData = {
            success: true,
            data: {
                name: placeDetail?.displayName?.text || aiData.placeName,
                address: placeDetail?.formattedAddress || "주소 정보 없음",
                reason: aiData.reason,
                location: placeDetail?.location || null, // { lat, lng }
                rating: placeDetail?.rating || 0,
                category: "AI Recommended" // 프론트 식별용
            }
        };

        res.json(responseData);

    } catch (error) {
        console.error("AI Recommendation Error:", error);
        res.status(500).json({ success: false, error: "AI 추천 중 오류 발생" });
    }
});

module.exports = { getRecommendation };