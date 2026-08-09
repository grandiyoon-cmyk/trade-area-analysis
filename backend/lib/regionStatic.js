// 시도/시군구는 자주 안 바뀌어서 정적으로 들고 있는다 — 매번 API를 부를 이유가 없다.
//
// ⚠️ 2026-08-09 갱신: 광주광역시(29)와 전라남도(46)가 **전남광주통합특별시(12)**로 통합됐다.
// 옛 코드 29·46으로 조회하면 API가 NODATA_ERROR를 돌려주므로(행정동 목록조차 안 나옴),
// 화면에서 고를 수는 있는데 결과가 0건인 상태였다. 시군구 27개(광주 5개 구 + 전남 22개 시·군)는
// 실제 데이터에서 뽑아 각 시군구 건수 합이 시도 총계(175,276건)와 정확히 일치하는 것으로 검증했다.
//
// 이 목록이 또 틀어지면 같은 증상이 난다 — 특정 지역만 "점포가 없어요"로 나온다면 여기를 의심할 것.

export const SIDO_LIST = [
  {
    "cd": "11",
    "nm": "서울특별시"
  },
  {
    "cd": "12",
    "nm": "전남광주통합특별시"
  },
  {
    "cd": "26",
    "nm": "부산광역시"
  },
  {
    "cd": "27",
    "nm": "대구광역시"
  },
  {
    "cd": "28",
    "nm": "인천광역시"
  },
  {
    "cd": "30",
    "nm": "대전광역시"
  },
  {
    "cd": "31",
    "nm": "울산광역시"
  },
  {
    "cd": "36",
    "nm": "세종특별자치시"
  },
  {
    "cd": "41",
    "nm": "경기도"
  },
  {
    "cd": "43",
    "nm": "충청북도"
  },
  {
    "cd": "44",
    "nm": "충청남도"
  },
  {
    "cd": "47",
    "nm": "경상북도"
  },
  {
    "cd": "48",
    "nm": "경상남도"
  },
  {
    "cd": "50",
    "nm": "제주특별자치도"
  },
  {
    "cd": "51",
    "nm": "강원특별자치도"
  },
  {
    "cd": "52",
    "nm": "전북특별자치도"
  }
];

export const SIGUNGU_LIST = [
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11110",
    "signguNm": "종로구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11140",
    "signguNm": "중구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11170",
    "signguNm": "용산구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11200",
    "signguNm": "성동구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11215",
    "signguNm": "광진구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11230",
    "signguNm": "동대문구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11260",
    "signguNm": "중랑구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11290",
    "signguNm": "성북구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11305",
    "signguNm": "강북구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11320",
    "signguNm": "도봉구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11350",
    "signguNm": "노원구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11380",
    "signguNm": "은평구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11410",
    "signguNm": "서대문구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11440",
    "signguNm": "마포구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11470",
    "signguNm": "양천구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11500",
    "signguNm": "강서구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11530",
    "signguNm": "구로구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11545",
    "signguNm": "금천구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11560",
    "signguNm": "영등포구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11590",
    "signguNm": "동작구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11620",
    "signguNm": "관악구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11650",
    "signguNm": "서초구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11680",
    "signguNm": "강남구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11710",
    "signguNm": "송파구"
  },
  {
    "ctprvnCd": "11",
    "ctprvnNm": "서울특별시",
    "signguCd": "11740",
    "signguNm": "강동구"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12110",
    "signguNm": "목포시"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12130",
    "signguNm": "여수시"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12150",
    "signguNm": "순천시"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12170",
    "signguNm": "나주시"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12190",
    "signguNm": "광양시"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12210",
    "signguNm": "동구"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12240",
    "signguNm": "서구"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12270",
    "signguNm": "남구"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12300",
    "signguNm": "북구"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12330",
    "signguNm": "광산구"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12710",
    "signguNm": "담양군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12720",
    "signguNm": "곡성군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12730",
    "signguNm": "구례군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12740",
    "signguNm": "고흥군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12750",
    "signguNm": "보성군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12760",
    "signguNm": "화순군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12770",
    "signguNm": "장흥군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12780",
    "signguNm": "강진군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12790",
    "signguNm": "해남군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12800",
    "signguNm": "영암군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12810",
    "signguNm": "무안군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12820",
    "signguNm": "함평군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12830",
    "signguNm": "영광군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12840",
    "signguNm": "장성군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12850",
    "signguNm": "완도군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12860",
    "signguNm": "진도군"
  },
  {
    "ctprvnCd": "12",
    "ctprvnNm": "전남광주통합특별시",
    "signguCd": "12870",
    "signguNm": "신안군"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26110",
    "signguNm": "중구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26140",
    "signguNm": "서구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26170",
    "signguNm": "동구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26200",
    "signguNm": "영도구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26230",
    "signguNm": "부산진구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26260",
    "signguNm": "동래구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26290",
    "signguNm": "남구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26320",
    "signguNm": "북구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26350",
    "signguNm": "해운대구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26380",
    "signguNm": "사하구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26410",
    "signguNm": "금정구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26440",
    "signguNm": "강서구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26470",
    "signguNm": "연제구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26500",
    "signguNm": "수영구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26530",
    "signguNm": "사상구"
  },
  {
    "ctprvnCd": "26",
    "ctprvnNm": "부산광역시",
    "signguCd": "26710",
    "signguNm": "기장군"
  },
  {
    "ctprvnCd": "27",
    "ctprvnNm": "대구광역시",
    "signguCd": "27110",
    "signguNm": "중구"
  },
  {
    "ctprvnCd": "27",
    "ctprvnNm": "대구광역시",
    "signguCd": "27140",
    "signguNm": "동구"
  },
  {
    "ctprvnCd": "27",
    "ctprvnNm": "대구광역시",
    "signguCd": "27170",
    "signguNm": "서구"
  },
  {
    "ctprvnCd": "27",
    "ctprvnNm": "대구광역시",
    "signguCd": "27200",
    "signguNm": "남구"
  },
  {
    "ctprvnCd": "27",
    "ctprvnNm": "대구광역시",
    "signguCd": "27230",
    "signguNm": "북구"
  },
  {
    "ctprvnCd": "27",
    "ctprvnNm": "대구광역시",
    "signguCd": "27260",
    "signguNm": "수성구"
  },
  {
    "ctprvnCd": "27",
    "ctprvnNm": "대구광역시",
    "signguCd": "27290",
    "signguNm": "달서구"
  },
  {
    "ctprvnCd": "27",
    "ctprvnNm": "대구광역시",
    "signguCd": "27710",
    "signguNm": "달성군"
  },
  {
    "ctprvnCd": "27",
    "ctprvnNm": "대구광역시",
    "signguCd": "27720",
    "signguNm": "군위군"
  },
  {
    "ctprvnCd": "28",
    "ctprvnNm": "인천광역시",
    "signguCd": "28110",
    "signguNm": "중구"
  },
  {
    "ctprvnCd": "28",
    "ctprvnNm": "인천광역시",
    "signguCd": "28140",
    "signguNm": "동구"
  },
  {
    "ctprvnCd": "28",
    "ctprvnNm": "인천광역시",
    "signguCd": "28177",
    "signguNm": "미추홀구"
  },
  {
    "ctprvnCd": "28",
    "ctprvnNm": "인천광역시",
    "signguCd": "28185",
    "signguNm": "연수구"
  },
  {
    "ctprvnCd": "28",
    "ctprvnNm": "인천광역시",
    "signguCd": "28200",
    "signguNm": "남동구"
  },
  {
    "ctprvnCd": "28",
    "ctprvnNm": "인천광역시",
    "signguCd": "28237",
    "signguNm": "부평구"
  },
  {
    "ctprvnCd": "28",
    "ctprvnNm": "인천광역시",
    "signguCd": "28245",
    "signguNm": "계양구"
  },
  {
    "ctprvnCd": "28",
    "ctprvnNm": "인천광역시",
    "signguCd": "28260",
    "signguNm": "서구"
  },
  {
    "ctprvnCd": "28",
    "ctprvnNm": "인천광역시",
    "signguCd": "28710",
    "signguNm": "강화군"
  },
  {
    "ctprvnCd": "28",
    "ctprvnNm": "인천광역시",
    "signguCd": "28720",
    "signguNm": "옹진군"
  },
  {
    "ctprvnCd": "30",
    "ctprvnNm": "대전광역시",
    "signguCd": "30110",
    "signguNm": "동구"
  },
  {
    "ctprvnCd": "30",
    "ctprvnNm": "대전광역시",
    "signguCd": "30140",
    "signguNm": "중구"
  },
  {
    "ctprvnCd": "30",
    "ctprvnNm": "대전광역시",
    "signguCd": "30170",
    "signguNm": "서구"
  },
  {
    "ctprvnCd": "30",
    "ctprvnNm": "대전광역시",
    "signguCd": "30200",
    "signguNm": "유성구"
  },
  {
    "ctprvnCd": "30",
    "ctprvnNm": "대전광역시",
    "signguCd": "30230",
    "signguNm": "대덕구"
  },
  {
    "ctprvnCd": "31",
    "ctprvnNm": "울산광역시",
    "signguCd": "31110",
    "signguNm": "중구"
  },
  {
    "ctprvnCd": "31",
    "ctprvnNm": "울산광역시",
    "signguCd": "31140",
    "signguNm": "남구"
  },
  {
    "ctprvnCd": "31",
    "ctprvnNm": "울산광역시",
    "signguCd": "31170",
    "signguNm": "동구"
  },
  {
    "ctprvnCd": "31",
    "ctprvnNm": "울산광역시",
    "signguCd": "31200",
    "signguNm": "북구"
  },
  {
    "ctprvnCd": "31",
    "ctprvnNm": "울산광역시",
    "signguCd": "31710",
    "signguNm": "울주군"
  },
  {
    "ctprvnCd": "36",
    "ctprvnNm": "세종특별자치시",
    "signguCd": "36110",
    "signguNm": "세종특별자치시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41111",
    "signguNm": "수원시 장안구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41113",
    "signguNm": "수원시 권선구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41115",
    "signguNm": "수원시 팔달구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41117",
    "signguNm": "수원시 영통구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41131",
    "signguNm": "성남시 수정구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41133",
    "signguNm": "성남시 중원구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41135",
    "signguNm": "성남시 분당구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41150",
    "signguNm": "의정부시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41171",
    "signguNm": "안양시 만안구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41173",
    "signguNm": "안양시 동안구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41192",
    "signguNm": "부천시 원미구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41194",
    "signguNm": "부천시 소사구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41196",
    "signguNm": "부천시 오정구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41210",
    "signguNm": "광명시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41220",
    "signguNm": "평택시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41250",
    "signguNm": "동두천시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41271",
    "signguNm": "안산시 상록구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41273",
    "signguNm": "안산시 단원구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41281",
    "signguNm": "고양시 덕양구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41285",
    "signguNm": "고양시 일산동구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41287",
    "signguNm": "고양시 일산서구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41290",
    "signguNm": "과천시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41310",
    "signguNm": "구리시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41360",
    "signguNm": "남양주시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41370",
    "signguNm": "오산시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41390",
    "signguNm": "시흥시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41410",
    "signguNm": "군포시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41430",
    "signguNm": "의왕시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41450",
    "signguNm": "하남시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41461",
    "signguNm": "용인시 처인구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41463",
    "signguNm": "용인시 기흥구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41465",
    "signguNm": "용인시 수지구"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41480",
    "signguNm": "파주시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41500",
    "signguNm": "이천시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41550",
    "signguNm": "안성시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41570",
    "signguNm": "김포시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41590",
    "signguNm": "화성시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41610",
    "signguNm": "광주시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41630",
    "signguNm": "양주시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41650",
    "signguNm": "포천시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41670",
    "signguNm": "여주시"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41800",
    "signguNm": "연천군"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41820",
    "signguNm": "가평군"
  },
  {
    "ctprvnCd": "41",
    "ctprvnNm": "경기도",
    "signguCd": "41830",
    "signguNm": "양평군"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43111",
    "signguNm": "청주시 상당구"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43112",
    "signguNm": "청주시 서원구"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43113",
    "signguNm": "청주시 흥덕구"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43114",
    "signguNm": "청주시 청원구"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43130",
    "signguNm": "충주시"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43150",
    "signguNm": "제천시"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43720",
    "signguNm": "보은군"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43730",
    "signguNm": "옥천군"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43740",
    "signguNm": "영동군"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43750",
    "signguNm": "진천군"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43760",
    "signguNm": "괴산군"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43770",
    "signguNm": "음성군"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43785",
    "signguNm": "증평군"
  },
  {
    "ctprvnCd": "43",
    "ctprvnNm": "충청북도",
    "signguCd": "43800",
    "signguNm": "단양군"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44131",
    "signguNm": "천안시 동남구"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44133",
    "signguNm": "천안시 서북구"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44150",
    "signguNm": "공주시"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44180",
    "signguNm": "보령시"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44200",
    "signguNm": "아산시"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44210",
    "signguNm": "서산시"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44230",
    "signguNm": "논산시"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44250",
    "signguNm": "계룡시"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44270",
    "signguNm": "당진시"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44710",
    "signguNm": "금산군"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44760",
    "signguNm": "부여군"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44770",
    "signguNm": "서천군"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44790",
    "signguNm": "청양군"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44800",
    "signguNm": "홍성군"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44810",
    "signguNm": "예산군"
  },
  {
    "ctprvnCd": "44",
    "ctprvnNm": "충청남도",
    "signguCd": "44825",
    "signguNm": "태안군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47111",
    "signguNm": "포항시 남구"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47113",
    "signguNm": "포항시 북구"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47130",
    "signguNm": "경주시"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47150",
    "signguNm": "김천시"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47170",
    "signguNm": "안동시"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47190",
    "signguNm": "구미시"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47210",
    "signguNm": "영주시"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47230",
    "signguNm": "영천시"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47250",
    "signguNm": "상주시"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47280",
    "signguNm": "문경시"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47290",
    "signguNm": "경산시"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47730",
    "signguNm": "의성군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47750",
    "signguNm": "청송군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47760",
    "signguNm": "영양군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47770",
    "signguNm": "영덕군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47820",
    "signguNm": "청도군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47830",
    "signguNm": "고령군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47840",
    "signguNm": "성주군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47850",
    "signguNm": "칠곡군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47900",
    "signguNm": "예천군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47920",
    "signguNm": "봉화군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47930",
    "signguNm": "울진군"
  },
  {
    "ctprvnCd": "47",
    "ctprvnNm": "경상북도",
    "signguCd": "47940",
    "signguNm": "울릉군"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48121",
    "signguNm": "창원시 의창구"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48123",
    "signguNm": "창원시 성산구"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48125",
    "signguNm": "창원시 마산합포구"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48127",
    "signguNm": "창원시 마산회원구"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48129",
    "signguNm": "창원시 진해구"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48170",
    "signguNm": "진주시"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48220",
    "signguNm": "통영시"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48240",
    "signguNm": "사천시"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48250",
    "signguNm": "김해시"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48270",
    "signguNm": "밀양시"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48310",
    "signguNm": "거제시"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48330",
    "signguNm": "양산시"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48720",
    "signguNm": "의령군"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48730",
    "signguNm": "함안군"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48740",
    "signguNm": "창녕군"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48820",
    "signguNm": "고성군"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48840",
    "signguNm": "남해군"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48850",
    "signguNm": "하동군"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48860",
    "signguNm": "산청군"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48870",
    "signguNm": "함양군"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48880",
    "signguNm": "거창군"
  },
  {
    "ctprvnCd": "48",
    "ctprvnNm": "경상남도",
    "signguCd": "48890",
    "signguNm": "합천군"
  },
  {
    "ctprvnCd": "50",
    "ctprvnNm": "제주특별자치도",
    "signguCd": "50110",
    "signguNm": "제주시"
  },
  {
    "ctprvnCd": "50",
    "ctprvnNm": "제주특별자치도",
    "signguCd": "50130",
    "signguNm": "서귀포시"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51110",
    "signguNm": "춘천시"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51130",
    "signguNm": "원주시"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51150",
    "signguNm": "강릉시"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51170",
    "signguNm": "동해시"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51190",
    "signguNm": "태백시"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51210",
    "signguNm": "속초시"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51230",
    "signguNm": "삼척시"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51720",
    "signguNm": "홍천군"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51730",
    "signguNm": "횡성군"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51750",
    "signguNm": "영월군"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51760",
    "signguNm": "평창군"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51770",
    "signguNm": "정선군"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51780",
    "signguNm": "철원군"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51790",
    "signguNm": "화천군"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51800",
    "signguNm": "양구군"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51810",
    "signguNm": "인제군"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51820",
    "signguNm": "고성군"
  },
  {
    "ctprvnCd": "51",
    "ctprvnNm": "강원특별자치도",
    "signguCd": "51830",
    "signguNm": "양양군"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52111",
    "signguNm": "전주시 완산구"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52113",
    "signguNm": "전주시 덕진구"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52130",
    "signguNm": "군산시"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52140",
    "signguNm": "익산시"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52180",
    "signguNm": "정읍시"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52190",
    "signguNm": "남원시"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52210",
    "signguNm": "김제시"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52710",
    "signguNm": "완주군"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52720",
    "signguNm": "진안군"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52730",
    "signguNm": "무주군"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52740",
    "signguNm": "장수군"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52750",
    "signguNm": "임실군"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52770",
    "signguNm": "순창군"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52790",
    "signguNm": "고창군"
  },
  {
    "ctprvnCd": "52",
    "ctprvnNm": "전북특별자치도",
    "signguCd": "52800",
    "signguNm": "부안군"
  }
];

export function sigunguBySido(ctprvnCd) {
  return SIGUNGU_LIST.filter((s) => s.ctprvnCd === String(ctprvnCd));
}
