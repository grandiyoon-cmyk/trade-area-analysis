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
import { cached } from "./lib/cache.js";
import {
  fetchDongList,
  fetchLargeUpjong,
  fetchMiddleUpjong,
  fetchSmallUpjong,
  fetchStoresInRegion,
  fetchStoresInRadius,
  fetchStoreOne,
  fetchAllPages,
} from "./lib/semasClient.js";
import { analyzeStores } from "./lib/analysis.js";
import { listFavorites, createFavorite, deleteFavorite } from "./lib/favorites.js";

const app = express();
const PORT = process.env.PORT || 8788;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

const FRONTEND_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "frontend");
app.use(express.static(FRONTEND_DIR));

app.get("/health", (req, res) => {
  res.json({ ok: true, hasKey: Boolean(process.env.SEMAS_SERVICE_KEY && !process.env.SEMAS_SERVICE_KEY.includes("여기에_발급받은")) });
});

// 프런트가 필요로 하는 "공개해도 되는" 설정값만 모아 전달.
// 네이버 지도 Client ID는 시크릿이 아니라(브라우저 스크립트 태그에 그대로 노출되는 값이고,
// 보안은 NCP 콘솔의 웹 서비스 URL 등록/도메인 제한으로 한다) 그냥 JSON으로 내려줘도 된다.
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

/** 시도(ctprvnCd) / 시군구(signguCd) / 행정동(adongCd) 단위 상권분석 */
app.get("/api/trade-area/region", async (req, res) => {
  const { divId, code } = req.query;
  const maxPages = Math.min(parseInt(req.query.maxPages, 10) || 5, 10);
  if (!["ctprvnCd", "signguCd", "adongCd"].includes(divId) || !code) {
    return res.status(400).json({ error: "divId(ctprvnCd|signguCd|adongCd)와 code가 필요합니다." });
  }
  try {
    const filter = upjongFilter(req.query);
    const { items, totalCount, fetchedCount, capped, stdrYm } = await fetchAllPages(
      (pageNo) => fetchStoresInRegion({ divId, key: code, ...filter, pageNo }),
      { maxPages }
    );
    res.json(analyzeStores(items, { totalCount, fetchedCount, capped, stdrYm }));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** 좌표 반경(최대 2000m) 상권분석 */
app.get("/api/trade-area/radius", async (req, res) => {
  const cx = Number(req.query.cx);
  const cy = Number(req.query.cy);
  const radius = Number(req.query.radius) || 500;
  const maxPages = Math.min(parseInt(req.query.maxPages, 10) || 5, 10);
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
    return res.status(400).json({ error: "cx(경도), cy(위도) 쿼리 파라미터가 필요합니다." });
  }
  try {
    const filter = upjongFilter(req.query);
    const { items, totalCount, fetchedCount, capped, stdrYm } = await fetchAllPages(
      (pageNo) => fetchStoresInRadius({ cx, cy, radius, ...filter, pageNo }),
      { maxPages }
    );
    res.json(analyzeStores(items, { totalCount, fetchedCount, capped, stdrYm }));
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get("/api/stores/:bizesId", async (req, res) => {
  try {
    const result = await fetchStoreOne(req.params.bizesId);
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
  if (!label || !mode || !params) {
    return res.status(400).json({ error: "label, mode, params가 필요합니다." });
  }
  try {
    res.json({ item: await createFavorite({ label, mode, params }) });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

app.delete("/api/favorites/:id", async (req, res) => {
  try {
    await deleteFavorite(req.params.id);
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
