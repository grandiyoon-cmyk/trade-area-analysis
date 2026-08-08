// 소상공인시장진흥공단_상가(상권)정보_API 원본 호출을 감싸는 얇은 클라이언트.
//
// 엔드포인트/파라미터/응답 필드는 전부 공식
// "소상공인시장진흥공단_상가(상권)정보_OpenApi 활용가이드"(2025.6, data.go.kr 15012005)
// 원문에서 그대로 옮겼다 — 추측이 아니다. 다만 이 문서가 훗날 개정되거나 서비스가
// 미세하게 바뀔 수 있으니, 실제 키를 발급받으면 `npm run probe`로 실호출 응답을
// 한 번 찍어보고 이 파일의 필드 매핑이 맞는지 확인하는 걸 권장한다.
//
// - 서비스 URL: https://apis.data.go.kr/B553077/api/open/sdsc2/{오퍼레이션명}
// - 응답 포맷은 <response><header>...</header><body><items>...</items></body></response>
//   구조를 그대로 JSON으로 바꾼 형태(type=json). items는 서비스에 따라
//   배열이거나(REST 스타일), { item: [...] } 또는 { item: {...} }(결과 1건일 때, XML→JSON
//   변환 특유의 함정)로 오기도 해서 normalizeItems()에서 세 가지를 모두 받아준다.

import { createHash } from "node:crypto";

const BASE = "https://apis.data.go.kr/B553077/api/open/sdsc2";

// 공공데이터포털 공통 에러코드 중 실제로 마주치기 쉬운 것들만 사람이 읽을 메시지로 매핑.
// (전체 목록은 포털의 "오픈API 활용가이드 > 공통 에러코드" 참고)
const RESULT_CODE_MESSAGES = {
  "01": "APPLICATION_ERROR — API 서버 내부 오류입니다. 잠시 후 다시 시도하세요.",
  "12": "NO_OPENAPI_SERVICE_ERROR — 요청한 오퍼레이션이 없습니다. 요청 경로를 확인하세요.",
  "20": "SERVICE_ACCESS_DENIED_ERROR — 활용신청이 아직 승인되지 않았거나 접근이 막혀 있습니다.",
  "22": "LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR — 일일 트래픽 한도를 넘었습니다.",
  "30": "SERVICE_KEY_IS_NOT_REGISTERED_ERROR — 서비스키가 잘못됐거나 등록되지 않았습니다. .env의 SEMAS_SERVICE_KEY를 확인하세요.",
  "31": "DEADLINE_HAS_EXPIRED_ERROR — 활용신청 기간이 만료됐습니다.",
  "32": "UNREGISTERED_IP_ERROR — 등록되지 않은 IP에서의 요청입니다.",
};

function requireServiceKey() {
  // 웹 콘솔(Vercel 등)에 붙여넣을 때 앞뒤 공백이나 줄바꿈이 딸려 들어가는 일이 잦은데,
  // 그대로 두면 키가 통째로 "등록되지 않은 서비스키"로 거부된다. 먼저 다듬는다.
  const key = process.env.SEMAS_SERVICE_KEY?.trim();
  if (!key || key.includes("여기에_발급받은")) {
    throw new Error("SEMAS_SERVICE_KEY가 설정되지 않았습니다. backend/.env 파일을 확인하세요.");
  }
  // 공공데이터포털은 "인코딩" 키와 "디코딩" 키를 함께 발급하는데, 여기서는 디코딩 키를
  // 기대한다(URLSearchParams가 알아서 한 번 인코딩하므로). 혹시 이미 퍼센트 인코딩된
  // "인코딩" 키를 그대로 붙여넣었다면 한 번 풀어서 이중 인코딩(%2B → %252B 등)을 막는다.
  return /%[0-9A-Fa-f]{2}/.test(key) ? decodeURIComponent(key) : key;
}

/**
 * 키를 노출하지 않고 "로컬과 배포 환경의 키가 같은 값인지"만 대조하기 위한 지문.
 * 길이 + SHA-256 앞 8자리만 내보내므로 이 값으로 키를 역산할 수 없다.
 */
export function serviceKeyFingerprint() {
  const raw = process.env.SEMAS_SERVICE_KEY;
  if (!raw) return { present: false };
  const trimmed = raw.trim();
  return {
    present: true,
    rawLength: raw.length,
    trimmedLength: trimmed.length,
    hadWhitespace: raw !== trimmed,
    sha8: createHash("sha256").update(trimmed).digest("hex").slice(0, 8),
  };
}

function buildUrl(operation, params) {
  const url = new URL(`${BASE}/${operation}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  url.searchParams.set("type", "json");
  url.searchParams.set("serviceKey", requireServiceKey());
  return url;
}

/** items가 배열/{item:[...]}/{item:{...}}/undefined 어느 모양으로 와도 배열로 통일 */
function normalizeItems(items) {
  if (items == null) return [];
  if (Array.isArray(items)) return items;
  if (Array.isArray(items.item)) return items.item;
  if (items.item != null) return [items.item];
  return [];
}

// 데이터센터(클라우드) IP에서 오는 요청에 대해 apis.data.go.kr 앞단 WAF가 더 깐깐하게 군다.
// 한국 가정용 회선에서는 Node 기본 UA로도 통과하지만, Vercel(서울 리전이어도)에서는 403이 났다.
// franchise.ftc.go.kr도 UA 없는 요청을 막았던 전례가 있어 브라우저 UA를 고정으로 붙인다.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function call(operation, params) {
  const url = buildUrl(operation, params);
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json, text/plain, */*" },
  });
  if (!res.ok) {
    // 상태코드만으로는 원인을 못 좁힌다(403이 키 문제인지 IP 차단인지 WAF인지 구분이 안 됨).
    // data.go.kr은 실패해도 본문에 사유를 담아주는 편이라, 앞부분을 잘라 에러에 함께 실어
    // 배포 환경에서도 로그만 보고 진단할 수 있게 한다. 서비스키는 URL에만 있고 본문엔
    // 들어가지 않으므로 이대로 노출해도 안전하다.
    const detail = await res.text().catch(() => "");
    const snippet = detail.replace(/\s+/g, " ").trim().slice(0, 300);
    throw new Error(
      `상권정보 API 요청 실패: HTTP ${res.status} (${operation})` + (snippet ? ` — 응답: ${snippet}` : "")
    );
  }
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`상권정보 API 응답을 JSON으로 읽지 못했습니다 (${operation}). 서비스키/오퍼레이션명을 확인하세요.`);
  }
  // 문서상 예시는 <response><header/><body/></response> 이지만, 실제 서비스에 따라
  // 바깥의 "response" 래퍼 없이 header/body를 바로 주는 경우도 있어 둘 다 받아준다.
  const root = json.response ?? json;
  const header = root?.header ?? {};
  const body = root?.body ?? {};
  const resultCode = header.resultCode;
  if (resultCode != null && resultCode !== "00") {
    const friendly = RESULT_CODE_MESSAGES[resultCode];
    throw new Error(
      `상권정보 API 오류 [${resultCode}] ${header.resultMsg ?? ""} (${operation})` + (friendly ? ` — ${friendly}` : "")
    );
  }
  return {
    items: normalizeItems(body.items),
    totalCount: body.totalCount != null ? Number(body.totalCount) : null,
    pageNo: body.pageNo != null ? Number(body.pageNo) : null,
    numOfRows: body.numOfRows != null ? Number(body.numOfRows) : null,
    stdrYm: header.stdrYm ?? null, // 상가업소 목록류 응답에만 있는 데이터 기준년월
  };
}

// ── 행정구역 조회 (baroApi, "19) 행정구역 조회" 오퍼레이션) ────────────────────────
// 시도/시군구는 backend/lib/regionStatic.js에 정적으로 있어 API를 안 타도 되지만,
// 행정동/법정동은 정적으로 두기엔 개수가 너무 많아 여기서 실시간 조회한다.

/** 시군구코드로 그 아래 행정동 목록 조회 */
export function fetchDongList(signguCd) {
  return call("baroApi", { resId: "dong", catId: "admi", signguCd });
}

/** 시군구코드로 그 아래 법정동 목록 조회 (참고용, 상가업소 응답의 ldongNm과 대조할 때 유용) */
export function fetchLdongList(signguCd) {
  return call("baroApi", { resId: "dong", catId: "zone", signguCd });
}

// ── 업종 분류 조회 ────────────────────────────────────────────────────────────
// 2023-02-20부로 대분류(2자리)/중분류(4자리)/소분류(6자리) 체계. 코드표를 정적으로
// 박아두지 않고 매번(캐시 경유) 실API로 받는다 — 소진공이 분류를 개정해도 자동 반영되게.

export function fetchLargeUpjong() {
  return call("largeUpjongList", {});
}
export function fetchMiddleUpjong(indsLclsCd) {
  return call("middleUpjongList", { indsLclsCd });
}
export function fetchSmallUpjong(indsLclsCd, indsMclsCd) {
  return call("smallUpjongList", { indsLclsCd, indsMclsCd });
}

// ── 상가업소 목록 조회 ────────────────────────────────────────────────────────

/**
 * 행정구역 단위 상가업소 조회 (storeListInDong 오퍼레이션).
 * 이름과 달리 divId를 바꾸면 시도/시군구/행정동 세 단계 전부에 쓸 수 있다.
 * @param {{divId:"ctprvnCd"|"signguCd"|"adongCd", key:string, indsLclsCd?:string, indsMclsCd?:string, indsSclsCd?:string, pageNo?:number, numOfRows?:number}} p
 */
export function fetchStoresInRegion({ divId, key, indsLclsCd, indsMclsCd, indsSclsCd, pageNo = 1, numOfRows = 1000 }) {
  return call("storeListInDong", { divId, key, indsLclsCd, indsMclsCd, indsSclsCd, pageNo, numOfRows });
}

/**
 * 반경내 상가업소 조회 (storeListInRadius). 반경은 미터 단위, API 제한상 최대 2000m.
 * @param {{cx:number, cy:number, radius:number, indsLclsCd?:string, indsMclsCd?:string, indsSclsCd?:string, pageNo?:number, numOfRows?:number}} p
 */
export function fetchStoresInRadius({ cx, cy, radius, indsLclsCd, indsMclsCd, indsSclsCd, pageNo = 1, numOfRows = 1000 }) {
  const clampedRadius = Math.min(Math.max(1, Math.round(radius)), 2000);
  return call("storeListInRadius", { cx, cy, radius: clampedRadius, indsLclsCd, indsMclsCd, indsSclsCd, pageNo, numOfRows });
}

/** 단일 상가업소 상세 (상호명 클릭 등으로 상세를 더 보고 싶을 때) */
export function fetchStoreOne(bizesId) {
  return call("storeOne", { key: bizesId });
}

/**
 * 페이지 요청 함수를 받아 totalCount에 도달할 때까지(또는 안전 상한까지) 이어붙여 모은다.
 * 정부 API를 배려해 페이지 사이에 짧은 간격을 둔다.
 * @param {(pageNo:number)=>Promise<{items:any[], totalCount:number|null}>} fetchPage
 * @param {{maxPages?:number}} opts
 */
export async function fetchAllPages(fetchPage, { maxPages = 10 } = {}) {
  let pageNo = 1;
  let all = [];
  let totalCount = null;
  let stdrYm = null;
  let capped = false;
  while (true) {
    const page = await fetchPage(pageNo);
    totalCount = page.totalCount;
    stdrYm = page.stdrYm ?? stdrYm;
    all = all.concat(page.items);
    if (page.items.length === 0) break;
    if (totalCount != null && all.length >= totalCount) break;
    if (pageNo >= maxPages) {
      capped = totalCount != null && all.length < totalCount;
      break;
    }
    pageNo += 1;
    await new Promise((r) => setTimeout(r, 150));
  }
  return { items: all, totalCount: totalCount ?? all.length, fetchedCount: all.length, capped, stdrYm };
}
