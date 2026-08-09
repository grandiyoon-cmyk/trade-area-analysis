// 상가업소 목록(원본 API 아이템 배열)을 받아 화면에 바로 쓸 수 있는 집계로 정리.
// storeOne/storeListInDong/storeListInRadius 응답 필드명(bizesNm, indsLclsNm, lon, lat 등)을
// 그대로 기준으로 삼는다 — 공식 활용가이드에 실린 필드명 그대로.

function groupCount(items, codeField, nameField) {
  const map = new Map();
  for (const it of items) {
    const code = it[codeField];
    if (!code) continue;
    const name = it[nameField] || code;
    const key = code;
    if (!map.has(key)) map.set(key, { code, name, count: 0 });
    map.get(key).count += 1;
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/**
 * @param {any[]} items storeListInDong / storeListInRadius 응답의 items
 * @param {{fetchedCount:number, totalCount:number, capped:boolean}} meta fetchAllPages()가 준 페이지 메타
 */
export function analyzeStores(items, meta = {}) {
  const byLarge = groupCount(items, "indsLclsCd", "indsLclsNm");
  const byMiddle = groupCount(items, "indsMclsCd", "indsMclsNm");
  const bySmall = groupCount(items, "indsSclsCd", "indsSclsNm");

  const points = [];
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const it of items) {
    const lon = Number(it.lon);
    const lat = Number(it.lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    points.push({
      lon,
      lat,
      bizesId: it.bizesId,
      name: it.bizesNm,
      large: it.indsLclsNm,
      largeCd: it.indsLclsCd,
      middle: it.indsMclsNm,
      addr: it.rdnmAdr || it.lnoAdr || null,
    });
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  const bbox = points.length ? { minLon, maxLon, minLat, maxLat } : null;

  // 업종 다양성(= 소분류 종류 수 ÷ 점포 수)은 **표본이 커질수록 자동으로 작아진다.**
  // 종류 수는 업종 가짓수(247개)에 막혀 포화되는데 분모는 계속 늘기 때문이다. 그래서
  // 5,000건까지 긁어온 넓은 지역과 300건짜리 동네를 나란히 놓으면, 낮은 쪽이 "업종이
  // 쏠렸다"가 아니라 그냥 "표본이 컸다"는 뜻이 돼버린다. 지역 간 비교에 쓸 수 없다.
  //
  // 대신 화면에는 **상위 3개 소분류의 점유율**을 쓴다. 비율이라 표본 크기에 흔들리지 않고,
  // "상위 3개 업종이 전체의 45%" 처럼 그대로 읽히기도 한다. 값이 높을수록 쏠린 상권이다.
  // (diversity는 기존 응답 호환을 위해 남겨두되 화면의 대표 지표에서는 뺐다)
  const diversity = items.length ? bySmall.length / items.length : null;
  const top3SmallShare = items.length
    ? bySmall.slice(0, 3).reduce((sum, r) => sum + r.count, 0) / items.length
    : null;

  return {
    stdrYm: meta.stdrYm ?? null, // semasClient 응답 header의 데이터 기준년월(YYYYMM)
    totalCount: meta.totalCount ?? items.length,
    fetchedCount: meta.fetchedCount ?? items.length,
    capped: Boolean(meta.capped),
    byLarge,
    byMiddle: byMiddle.slice(0, 15),
    bySmall: bySmall.slice(0, 15),
    // 자르기 전 종류 수. 프런트가 "Top 15"라고 쓸지 "분포"라고 쓸지 판단하는 데 쓴다 —
    // 잘린 목록의 length만 보면 15개가 전부인지 더 있는지 구분할 수 없다.
    byMiddleTotal: byMiddle.length,
    bySmallTotal: bySmall.length,
    diversity,
    top3SmallShare,
    top3SmallNames: bySmall.slice(0, 3).map((r) => r.name),
    bbox,
    points,
  };
}
