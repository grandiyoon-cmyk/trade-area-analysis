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

  // 업종 다양성: 등장한 소분류 수 / 전체 점포 수. 값이 낮을수록 특정 업종에 쏠린 상권.
  const diversity = items.length ? bySmall.length / items.length : null;

  return {
    stdrYm: meta.stdrYm ?? null, // semasClient 응답 header의 데이터 기준년월(YYYYMM)
    totalCount: meta.totalCount ?? items.length,
    fetchedCount: meta.fetchedCount ?? items.length,
    capped: Boolean(meta.capped),
    byLarge,
    byMiddle: byMiddle.slice(0, 15),
    bySmall: bySmall.slice(0, 15),
    diversity,
    bbox,
    points,
  };
}
