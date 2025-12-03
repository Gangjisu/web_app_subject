1. UI/UX 구성 (화면 설계)

   * 검색 및 자동완성 영역:
       * 기존과 동일하게 destination_input 아래에 자동완성 목록 표시.
   * View Detail 버튼 (신규):
       * 위치: 화면 상단 중앙 (position: absolute; top: ...; left: 50%; transform: translateX(-50%);).
       * 상태: 초기에는 숨김(Hidden) 상태.
       * 동작: 장소가 검색되어 마커가 찍히면 나타남(Visible). 클릭 시 해당 장소의 Google Maps(스트리트 뷰 모드  
         혹은 상세 페이지) 링크를 새 탭으로 엽니다.
   * 지도 영역:
       * 3D 지도 및 검색된 위치에 <gmp-marker-3d> 마커 표시.

  2. 기능 로직 설계 (map_script.js)

   1. 초기화 (`initMap`, `setupUI`):
       * View Detail 버튼을 DOM에 생성하거나 HTML에 추가하고, 클릭 이벤트를 리스닝합니다.
       * 전역 변수 currentPlaceUrl (또는 currentLat, currentLng)을 관리합니다.

   2. 검색 및 자동완성 (`setupSearch`):
       * 사용자 입력 -> AutocompleteService -> 목록 표시.
       * 항목 선택 -> `updateLocation(placeResult)` 실행.

   3. 위치 업데이트 (`updateLocation`):
       * 지도 이동: 3D 지도 중심 이동.
       * 마커 생성: <gmp-marker-3d>로 마커 표시.
       * URL 생성: Google Maps URL 생성.
           * 형식: https://www.google.com/maps/search/?api=1&query={lat},{lng} 또는
             https://www.google.com/maps/@?api=1&map_action=pano&viewpoint={lat},{lng} (스트리트 뷰 강제).      
           * 일반 상세 보기가 안전하므로 search 쿼리나 place_id를 사용 권장.
       * 버튼 활성화: View Detail 버튼을 보이게 하고, 클릭 시 생성된 URL로 이동하도록 설정.

  3. 구현 순서

   1. HTML/CSS:
       * autocomplete_results div 복구 및 CSS 적용.
       * View Detail 버튼 HTML 추가 및 CSS (상단 중앙 배치, 숨김 처리) 적용.
   2. JS:
       * 자동완성 로직 복구.
       * 마커 로직 (<gmp-marker-3d> 사용) 복구.
       * View Detail 버튼 로직 추가: 장소 선택 시 버튼 display: block 처리 및 onclick 이벤트에 window.open(url,
         '_blank') 연결.

/////


   1. 지도 요소(`gmp-map-3d`)와 2D 라이브러리 호환성
       * 문제점: google.maps.places.PlacesService나 AutocompleteService는 원래 2D 지도(google.maps.Map)와 함께
         쓰이도록 설계되었습니다. 특히 PlacesService의 textSearch나 getDetails 등 일부 메서드는 결과의
         귀속(Attribution)을 표시하기 위해 Map 객체나 div 컨테이너를 필수로 요구합니다.
       * 해결책: 지난번 구현 때처럼 document.createElement('div')로 보이지 않는 더미(dummy) 컨테이너를 만들어
         서비스 생성자에 넘겨주면 문제없이 작동합니다. 설계에 이 내용이 포함되어 있어 기술적 오류는 없을
         것입니다.

   2. 3D 마커(`gmp-marker-3d`) 좌표 포맷
       * 문제점: 3D 마커의 position 속성은 문자열("lat,lng,altitude")을 기대하는 반면, Places API의 결과는
         함수(location.lat()) 형태입니다.
       * 체크: 구현 시 템플릿 리터럴(${lat},${lng},0)로 변환하여 문자열로 주입해야 합니다. 만약 객체 그대로
         넣으면 마커가 뜨지 않는 오류가 발생합니다. (지난번 수정에서 확인된 사항입니다.)

   3. View Detail 링크의 정확도
       * 문제점: 단순히 위도/경도(lat,lng)만으로 Google Maps 링크를 열면, 해당 좌표의 도로가 아닌 건물 지붕이나
         엉뚱한 곳을 바라보는 스트리트 뷰가 열리거나, 스트리트 뷰 데이터가 없는 곳일 수 있습니다.
       * 보완:
           * 가장 확실한 방법: place_id를 사용하는 것입니다.
           * URL 형식: https://www.google.com/maps/place/?q=place_id:{PLACE_ID}
           * 이렇게 하면 사용자가 구글 지도 웹사이트에서 해당 장소의 "사진", "리뷰", "스트리트 뷰"를 선택해서 볼
             수 있는 가장 정확한 상세 페이지로 연결됩니다. 단순히 좌표로 연결하는 것보다 사용자 경험이 훨씬
             좋습니다.

   4. Z-Index 및 이벤트 충돌 (중요)
       * 문제점: View Detail 버튼을 화면 상단 중앙에 배치할 때, z-index가 낮으면 지도(gmp-map-3d)나 다른 UI
         요소에 가려 클릭이 안 될 수 있습니다.
       * 체크: CSS에서 z-index를 충분히 높게(예: 1000) 설정해야 합니다. 또한 지난번처럼 컨테이너의
         pointer-events 설정 때문에 버튼 클릭이 막히지 않도록 주의해야 합니다. (이미 해결된 사항이지만 재확인
         필요)

   5. 자동완성 목록 가림 현상
       * 문제점: 자동완성 목록(autocomplete_results)이 길어질 경우, 아래에 있는 다른 UI 요소나 지도 영역에      
         가려지거나 스크롤이 안 될 수 있습니다.
       * 체크: CSS에서 max-height와 overflow-y: auto, 그리고 z-index를 명확히 설정해야 합니다. (이전 CSS 복구 시
         포함되어 있습니다.)