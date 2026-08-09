// 프런트엔드가 소상공인시장진흥공단 서비스키를 직접 들고 있지 않도록 감싸는 프록시 서버.
// - 서비스키는 .env(SEMAS_SERVICE_KEY)에만 있고, 여기서만 원본 API를 호출한다.
// - 상가업소 목록은 페이지네이션을 서버가 대신 다 돌아 모으고, 업종별 집계까지 마쳐서
//   프런트가 바로 그릴 수 있는 JSON으로 돌려준다.
import "dotenv/config";
import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SIDO_LIST, sigunguBySido } from "./lib/regionStatic.js";
import { LANDMARKS } from "./lib/landmarks.js";
import { cached, cacheStats } from "./lib/cache.js";
import {
  fetchDongList,
  fetchLargeUpjong,
  fetchMiddleUpjong,
  fetchSmallUpjong,
  fetchStoresInRegion,
  fetchStoresInRadius,
  fetchStoreOne,
  fetchAllPages,
  serviceKeyFingerprint,
} from "./lib/semasClient.js";
import { analyzeStores } from "./lib/analysis.js";
import { listFavorites, createFavorite, deleteFavorite } from "./lib/favorites.js";
import { hasDb } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 8788;

// 요청 본문은 즐겨찾기 저장(label/mode/params)뿐이라 크게 받을 이유가 없다.
app.use(express.json({ limit: "32kb" }));

// CORS 헤더는 두지 않는다. 프런트와 API가 같은 출처(백엔드가 프런트를 함께 서빙)라
// 필요가 없고, 예전에 있던 `Access-Control-Allow-Origin: *`는 Allow-Methods/Headers가
// 없어서 조회만 열리고 쓰기는 어차피 preflight에서 막히는 어중간한 상태였다.
// 다른 출처에서 쓸 일이 생기면 그때 필요한 헤더를 온전히 갖춰서 넣는 게 맞다.

const FRONTEND_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "frontend");
app.use(express.static(FRONTEND_DIR));

// ── /health ──────────────────────────────────────────────────────────────────
// 예전에는 "환경변수가 비어 있지 않은가"만 보고 초록불을 켰다. 그래서 Vercel에 엉뚱한
// 문자열이 들어가 모든 조회가 403으로 죽는 동안에도 화면에는 "서비스키 설정됨"이 떴고,
// 원인을 찾는 데 한참 돌아갔다. 이제 가장 가벼운 실API(업종 대분류)를 실제로 한 번 불러
// 통하는 키인지 확인한다. 매 요청마다 부르면 낭비라 결과를 잠깐 들고 있는다.
const KEY_PROBE_TTL_MS = 5 * 60 * 1000;
let keyProbe = { at: 0, ok: null, error: null };

async function probeServiceKey() {
  if (Date.now() - keyProbe.at < KEY_PROBE_TTL_MS && keyProbe.ok !== null) return keyProbe;
  try {
    await fetchLargeUpjong();
    keyProbe = { at: Date.now(), ok: true, error: null };
  } catch (err) {
    keyProbe = { at: Date.now(), ok: false, error: err.message.slice(0, 200) };
  }
  return keyProbe;
}

app.get("/health", async (req, res) => {
  const configured = Boolean(
    process.env.SEMAS_SERVICE_KEY && !process.env.SEMAS_SERVICE_KEY.includes("여기에_발급받은")
  );
  const probe = configured ? await probeServiceKey() : { ok: false, error: "서비스키가 설정되지 않았습니다." };
  res.json({
    ok: true,
    // hasKey는 "설정돼 있고 실제로 통한다"는 뜻이다. 프런트 배지가 이 값만 보고 판단한다.
    hasKey: configured && probe.ok === true,
    keyConfigured: configured,
    keyError: probe.ok === false ? probe.error : null,
    hasDb: hasDb(),
    cache: await cacheStats(),
    // 키 자체가 아니라 길이+해시 앞 8자리만 — 로컬과 배포 환경에 같은 키가 들어갔는지
    // 대조하는 용도다. 이 값으로는 키를 역산할 수 없다.
    key: serviceKeyFingerprint(),
  });
});

// 프런트가 필요로 하는 "공개해도 되는" 설정값만 모아 전달.
//
// 네이버 지도 Client ID는 시크릿이 아니다 — 어차피 브라우저의 <script src="...?ncpKeyId=">에
// 그대로 박혀서 개발자도구로 다 보인다. 도용 방지는 값을 숨기는 게 아니라 NCP 콘솔의
// "Web 서비스 URL" 등록으로 한다. 그래서 JSON으로 내려줘도 된다.
//
// ⚠️ 반대로 NAVER_MAPS_CLIENT_SECRET은 **절대 여기 넣지 말 것.** 그건 Geocoding 같은
// 서버 호출용 API의 자격증명이라, 이 응답에 실리는 순간 브라우저를 통해 전 세계에 공개된다.
// 이 엔드포인트에 값을 추가할 때는 "개발자도구로 보여도 괜찮은가"를 먼저 자문할 것.
app.get("/api/config", (req, res) => {
  res.json({ naverMapsClientId: process.env.NAVER_MAPS_CLIENT_ID || null });
});

// ── 지역 선택 ─────────────────────────────────────────────────────────────
// 시도/시군구는 정적 데이터라 API 호출 없이 즉답. 행정동만 실API(캐시 경유).

app.get("/api/regions/sido", (req, res) => {
  res.json({ items: SIDO_LIST });
});

app.get("/api/regions/sigungu", (req, res) => {
  const { sidoCd } = req.query;
  if (!sidoCd) return res.status(400).json({ error: "sidoCd 쿼리 파라미터가 필요합니다." });
  res.json({ items: sigunguBySido(sidoCd) });
});

app.get("/api/regions/dong", async (req, res) => {
  const { sigunguCd } = req.query;
  if (!sigunguCd) return res.status(400).json({ error: "sigunguCd 쿼리 파라미터가 필요합니다." });
  try {
    const result = await cached("dong-list", sigunguCd, () => fetchDongList(sigunguCd));
    res.json({ items: result.items });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get("/api/landmarks", (req, res) => {
  res.json({ items: LANDMARKS });
});

// ── 업종 분류 ─────────────────────────────────────────────────────────────

app.get("/api/categories/large", async (req, res) => {
  try {
    const result = await cached("upjong-large", "all", () => fetchLargeUpjong());
    res.json({ items: result.items });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get("/api/categories/middle", async (req, res) => {
  const { lclsCd } = req.query;
  if (!lclsCd) return res.status(400).json({ error: "lclsCd 쿼리 파라미터가 필요합니다." });
  try {
    const result = await cached("upjong-middle", lclsCd, () => fetchMiddleUpjong(lclsCd));
    res.json({ items: result.items });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get("/api/categories/small", async (req, res) => {
  const { lclsCd, mclsCd } = req.query;
  if (!lclsCd || !mclsCd) return res.status(400).json({ error: "lclsCd, mclsCd 쿼리 파라미터가 필요합니다." });
  try {
    const result = await cached("upjong-small", `${lclsCd}_${mclsCd}`, () => fetchSmallUpjong(lclsCd, mclsCd));
    res.json({ items: result.items });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// ── 상권분석 ──────────────────────────────────────────────────────────────
// 공통 옵션: lclsCd/mclsCd/sclsCd(업종 필터, 전부 선택), maxPages(안전 상한, 기본 5 = 최대 5000건)

function upjongFilter(query) {
  const { lclsCd, mclsCd, sclsCd } = query;
  return { indsLclsCd: lclsCd || undefined, indsMclsCd: mclsCd || undefined, indsSclsCd: sclsCd || undefined };
}

// 분석 결과 캐시 유효기간. 상가업소 데이터는 소진공이 **분기별**로 갱신하므로(응답 헤더의
// stdrYm으로 확인 가능) 일주일 캐시는 신선도 면에서 넉넉히 안전하다.
//
// 이게 있어야 하는 진짜 이유는 속도가 아니라 **일일 호출한도**다. 분석 1회는 최대 maxPages(10)회
// 실API 호출이고 공공데이터포털 개발계정은 보통 일 1,000회다 — 캐시가 없으면 몇 사람이
// 백 번쯤 돌리는 것만으로 하루치가 소진돼 앱 전체가 멈춘다.
const TRADE_AREA_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// 한 번 분석할 때 실API를 몇 페이지까지 도는지. 1페이지 = 1,000건이므로 기본 5,000건이
// 표본 상한이다. /api/trade-area/count가 이 값을 화면에 알려줘서, 조건이 이보다 넓으면
// "일부만 집계된다"고 미리 경고할 수 있다.
const DEFAULT_MAX_PAGES = 5;
const MAX_MAX_PAGES = 10;

// analyzeStores()가 내보내는 필드 구성이 바뀌면 이 숫자를 올린다.
// 안 올리면 형식을 바꿔도 **최대 7일 동안 옛 형식이 그대로 나간다** — 실제로 top3SmallShare를
// 추가했을 때 캐시에 있던 구버전 응답이 나와서 프런트가 값을 못 찾는 일이 있었다.
// 키가 달라지면 옛 항목은 아무도 안 읽게 되고, 캐시 청소가 알아서 걷어간다.
const ANALYSIS_VERSION = 2;

/** 같은 조건이면 같은 문자열이 나오도록 — 캐시 키. maxPages가 다르면 결과 표본도 다르니 키에 포함한다. */
function tradeAreaCacheKey(parts) {
  return [`v${ANALYSIS_VERSION}`, ...parts].map((v) => (v == null || v === "" ? "-" : String(v))).join("_");
}

/** 조회가 이상할 때 캐시를 우회할 escape hatch (`?refresh=1`). 7일 캐시를 기다릴 필요 없이 다시 받는다. */
function wantsFresh(query) {
  return query.refresh === "1" || query.refresh === "true";
}

/**
 * 조건에 해당하는 점포가 몇 건인지만 미리 알려준다 (집계 없이).
 *
 * 상권분석은 조건이 넓으면 앞쪽 표본만 가져와 집계하는데, 사용자는 그걸 결과 화면에
 * 가서야 안다. 1건짜리 페이지를 한 번만 불러 totalCount를 읽어오면, 분석을 돌리기 전에
 * "이 조건은 22,739건이라 일부만 집계됩니다"라고 미리 알려줄 수 있다.
 * 실API 호출 1회 + 7일 캐시라 화면에서 조건을 바꿀 때마다 불러도 부담이 없다.
 */
app.get("/api/trade-area/count", async (req, res) => {
  const { divId, code } = req.query;
  const filter = upjongFilter(req.query);
  const isRegion = ["ctprvnCd", "signguCd", "adongCd"].includes(divId) && code;
  const cx = Number(req.query.cx), cy = Number(req.query.cy);
  const radius = Number(req.query.radius) || 500;
  const isRadius = Number.isFinite(cx) && Number.isFinite(cy);

  if (!isRegion && !isRadius) {
    return res.status(400).json({ error: "divId+code 또는 cx+cy가 필요합니다." });
  }
  try {
    const key = tradeAreaCacheKey(
      isRegion
        ? ["region", divId, code, filter.indsLclsCd, filter.indsMclsCd, filter.indsSclsCd]
        : ["radius", cx, cy, radius, filter.indsLclsCd, filter.indsMclsCd, filter.indsSclsCd]
    );
    const result = await cached(
      "trade-area-count",
      key,
      async () => {
        const page = isRegion
          ? await fetchStoresInRegion({ divId, key: code, ...filter, pageNo: 1, numOfRows: 1 })
          : await fetchStoresInRadius({ cx, cy, radius, ...filter, pageNo: 1, numOfRows: 1 });
        return { totalCount: page.totalCount };
      },
      { ttlMs: TRADE_AREA_TTL_MS }
    );
    res.json({ totalCount: result.totalCount, sampleCap: DEFAULT_MAX_PAGES * 1000 });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** 시도(ctprvnCd) / 시군구(signguCd) / 행정동(adongCd) 단위 상권분석 */
app.get("/api/trade-area/region", async (req, res) => {
  const { divId, code } = req.query;
  const maxPages = Math.min(parseInt(req.query.maxPages, 10) || DEFAULT_MAX_PAGES, MAX_MAX_PAGES);
  if (!["ctprvnCd", "signguCd", "adongCd"].includes(divId) || !code) {
    return res.status(400).json({ error: "divId(ctprvnCd|signguCd|adongCd)와 code가 필요합니다." });
  }
  try {
    const filter = upjongFilter(req.query);
    const key = tradeAreaCacheKey([divId, code, filter.indsLclsCd, filter.indsMclsCd, filter.indsSclsCd, `p${maxPages}`]);
    const compute = async () => {
      const { items, totalCount, fetchedCount, capped, stdrYm } = await fetchAllPages(
        (pageNo) => fetchStoresInRegion({ divId, key: code, ...filter, pageNo }),
        { maxPages }
      );
      return analyzeStores(items, { totalCount, fetchedCount, capped, stdrYm });
    };
    res.json(
      wantsFresh(req.query) ? await compute() : await cached("trade-area-region", key, compute, { ttlMs: TRADE_AREA_TTL_MS })
    );
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** 좌표 반경(최대 2000m) 상권분석 */
app.get("/api/trade-area/radius", async (req, res) => {
  const cx = Number(req.query.cx);
  const cy = Number(req.query.cy);
  const radius = Number(req.query.radius) || 500;
  const maxPages = Math.min(parseInt(req.query.maxPages, 10) || DEFAULT_MAX_PAGES, MAX_MAX_PAGES);
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
    return res.status(400).json({ error: "cx(경도), cy(위도) 쿼리 파라미터가 필요합니다." });
  }
  try {
    const filter = upjongFilter(req.query);
    const key = tradeAreaCacheKey([cx, cy, radius, filter.indsLclsCd, filter.indsMclsCd, filter.indsSclsCd, `p${maxPages}`]);
    const compute = async () => {
      const { items, totalCount, fetchedCount, capped, stdrYm } = await fetchAllPages(
        (pageNo) => fetchStoresInRadius({ cx, cy, radius, ...filter, pageNo }),
        { maxPages }
      );
      return analyzeStores(items, { totalCount, fetchedCount, capped, stdrYm });
    };
    res.json(
      wantsFresh(req.query) ? await compute() : await cached("trade-area-radius", key, compute, { ttlMs: TRADE_AREA_TTL_MS })
    );
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

const STORE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 상가업소 상세도 분기 갱신이라 캐시가 안전하다

app.get("/api/stores/:bizesId", async (req, res) => {
  const { bizesId } = req.params;
  // 상가업소 ID는 영숫자다. 형식이 아니면 실API를 부르기 전에 돌려보낸다.
  if (!/^[A-Za-z0-9]{1,40}$/.test(bizesId)) {
    return res.status(400).json({ error: "bizesId 형식이 올바르지 않습니다." });
  }
  try {
    const result = await cached("store-one", bizesId, () => fetchStoreOne(bizesId), { ttlMs: STORE_TTL_MS });
    res.json({ item: result.items[0] ?? null });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// ── 즐겨찾기 (저장된 분석 조건) ────────────────────────────────────────────
// DB(DATABASE_URL)가 연결돼 있어야 동작한다 — 로컬에서 DB 없이 개발할 땐 503으로
// "DB 연결 필요"를 명확히 알려준다. 아직 로그인이 없어서 전부 공용 목록이다
// (나중에 로그인 붙이면 favorites 테이블에 user_id 컬럼만 추가하면 됨 — lib/favorites.js 주석 참고).

app.get("/api/favorites", async (req, res) => {
  try {
    res.json({ items: await listFavorites() });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

app.post("/api/favorites", async (req, res) => {
  const { label, mode, params } = req.body || {};
  if (typeof label !== "string" || !label.trim() || !["region", "radius"].includes(mode) || typeof params !== "object" || params === null) {
    return res.status(400).json({ error: "label(문자열), mode(region|radius), params(객체)가 필요합니다." });
  }
  try {
    res.json({ item: await createFavorite({ label: label.trim(), mode, params }) });
  } catch (err) {
    // 개수 상한 초과처럼 "요청이 잘못된" 경우와 DB가 없는 경우를 구분해서 돌려준다.
    res.status(err.status ?? 503).json({ error: err.message });
  }
});

app.delete("/api/favorites/:id", async (req, res) => {
  // id는 SERIAL(정수)이다. 숫자가 아니면 Postgres가 던지는 에러를 503(서버 장애)으로
  // 내보내는 대신, 요청이 잘못됐다고 400으로 알려준다.
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "id는 양의 정수여야 합니다." });
  }
  try {
    await deleteFavorite(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// 로컬(npm start)에서는 평범한 상시 구동 서버로 뜨고, Vercel에 배포되면 이 파일은
// api/index.js가 서버리스 함수로 감싸 쓰므로 여기서 또 listen하면 안 된다
// (Vercel이 VERCEL 환경변수를 자동으로 심어준다).
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`trade-area-analysis backend listening on http://localhost:${PORT}`);
  });
}

export default app;
