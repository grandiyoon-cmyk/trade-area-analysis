// 반경분석 모드에서 매번 위경도를 직접 입력하지 않아도 되도록 자주 찾을 만한 지점의
// 대략적인 좌표를 미리 넣어둔 목록. 지오코딩 API(별도 키 필요) 없이 바로 쓸 수 있게 하려는
// 용도라 정밀 측량 좌표가 아니라 "대략 그 지점 부근"임 — 필요하면 화면에서 위경도를 직접
// 입력해 더 정확한 지점으로 바꿀 수 있다.

export const LANDMARKS = [
  { id: "gangnam", name: "강남역", lon: 127.0276, lat: 37.4979 },
  { id: "hongdae", name: "홍대입구역", lon: 126.9238, lat: 37.5563 },
  { id: "sinchon", name: "신촌역", lon: 126.9368, lat: 37.5596 },
  { id: "itaewon", name: "이태원역", lon: 126.9947, lat: 37.5347 },
  { id: "myeongdong", name: "명동", lon: 126.985, lat: 37.5636 },
  { id: "yeouido", name: "여의도역", lon: 126.9243, lat: 37.5219 },
  { id: "jamsil", name: "잠실역", lon: 127.1, lat: 37.5133 },
  { id: "konkuk", name: "건대입구역", lon: 127.07, lat: 37.5403 },
  { id: "seongsu", name: "성수역", lon: 127.0559, lat: 37.5447 },
  { id: "pangyo", name: "판교역", lon: 127.1119, lat: 37.3948 },
  { id: "seomyeon", name: "서면역(부산)", lon: 129.0603, lat: 35.158 },
  { id: "haeundae", name: "해운대해수욕장(부산)", lon: 129.1603, lat: 35.1587 },
  { id: "dongseongro", name: "동성로(대구)", lon: 128.5944, lat: 35.8697 },
  { id: "sangmu", name: "상무지구(광주)", lon: 126.8511, lat: 35.1522 },
  { id: "dunsan", name: "둔산동(대전)", lon: 127.3845, lat: 36.3512 },
];
