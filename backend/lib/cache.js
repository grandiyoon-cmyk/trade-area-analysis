// 이중 모드 캐시: DATABASE_URL이 있으면 Postgres(cache_entries 테이블)에, 없으면 로컬
// 디스크(data/cache/)에 저장한다. 로컬 개발(npm start, DB 없음)과 Vercel 배포(서버리스라 디스크가
// 재배포마다 날아감, DB 필요) 양쪽을 하나의 코드로 지원하려는 목적 — 호출하는 쪽(server.js)은
// 어느 모드인지 신경 쓸 필요 없이 그냥 cached()만 쓰면 된다.
//
// 상가업소 데이터는 소상공인시장진흥공단이 "분기별"로 갱신하므로, 같은 조회(지역×업종
// 조합)는 하루 안에 여러 번 반복해도 매번 실API를 다시 부를 필요가 없다. 지역/업종 코드표처럼
// 더 안 바뀌는 것들은 ttlMs 없이 계속 쓴다.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { hasDb, getSql, ensureSchema } from "./db.js";

// Vercel 서버리스는 배포 번들(/var/task)이 읽기 전용이라 그 아래에 파일을 쓰면 EROFS/ENOENT가 난다.
// 쓸 수 있는 곳은 /tmp뿐이고 그마저 인스턴스가 살아있는 동안만 유지되지만, 웜 인스턴스가
// 연속 요청을 처리하는 동안은 캐시 역할을 해준다. 로컬에서는 지금까지처럼 data/cache/를 쓴다.
const ROOT = process.env.VERCEL
  ? join(tmpdir(), "trade-area-cache")
  : join(dirname(fileURLToPath(import.meta.url)), "..", "data", "cache");

function pathFor(namespace, key) {
  const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 150);
  return join(ROOT, namespace, `${safeKey}.json`);
}

function fileCacheGet(namespace, key, { ttlMs } = {}) {
  try {
    const p = pathFor(namespace, key);
    if (!existsSync(p)) return null;
    const parsed = JSON.parse(readFileSync(p, "utf8"));
    if (ttlMs != null && Date.now() - (parsed.__savedAt ?? 0) > ttlMs) return null;
    return parsed.__value;
  } catch {
    return null; // 못 읽으면 캐시 미스로 취급하고 원본을 다시 부르면 된다
  }
}

function fileCacheSet(namespace, key, value) {
  try {
    mkdirSync(join(ROOT, namespace), { recursive: true });
    writeFileSync(pathFor(namespace, key), JSON.stringify({ __savedAt: Date.now(), __value: value }), "utf8");
  } catch {
    // 쓰기 실패(읽기 전용 FS 등)는 무시한다 — 캐시는 최적화일 뿐이라
    // 저장에 실패했다고 이미 성공한 API 응답을 못 내보내면 안 된다.
  }
}

async function dbCacheGet(namespace, key, { ttlMs } = {}) {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT value, updated_at FROM cache_entries WHERE namespace = ${namespace} AND key = ${key}`;
  if (!rows.length) return null;
  const row = rows[0];
  if (ttlMs != null && Date.now() - new Date(row.updated_at).getTime() > ttlMs) return null;
  return row.value;
}

async function dbCacheSet(namespace, key, value) {
  await ensureSchema();
  const sql = getSql();
  // JSON.stringify + ::jsonb 캐스트를 명시적으로 해서, 드라이버가 객체를 자동으로
  // jsonb 파라미터로 바꿔주는지에 기대지 않는다(문자열 파라미터는 항상 안전하게 들어간다).
  await sql`
    INSERT INTO cache_entries (namespace, key, value, updated_at)
    VALUES (${namespace}, ${key}, ${JSON.stringify(value)}::jsonb, now())
    ON CONFLICT (namespace, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
}

// 캐시 계층 전체의 원칙: **캐시 실패는 절대 요청을 깨뜨리지 않는다.**
// DB가 잠깐 죽거나 파일시스템이 읽기 전용이어도, 원본 API만 살아있으면 응답은 나가야 한다.
// (실제로 Vercel 첫 배포에서 읽기 전용 FS 때문에 mkdir이 터져 정상 API 응답까지 502가 났었다)

export async function cacheGet(namespace, key, opts = {}) {
  try {
    return hasDb() ? await dbCacheGet(namespace, key, opts) : fileCacheGet(namespace, key, opts);
  } catch (err) {
    console.warn(`[cache] 조회 실패 (${namespace}/${key}) — 캐시 미스로 처리: ${err.message}`);
    return null;
  }
}

export async function cacheSet(namespace, key, value) {
  try {
    return hasDb() ? await dbCacheSet(namespace, key, value) : fileCacheSet(namespace, key, value);
  } catch (err) {
    console.warn(`[cache] 저장 실패 (${namespace}/${key}) — 무시하고 진행: ${err.message}`);
  }
}

/** 캐시에 있으면 그대로, 없거나 만료됐으면 fn()을 호출해 저장 후 반환 */
export async function cached(namespace, key, fn, opts = {}) {
  const hit = await cacheGet(namespace, key, opts);
  if (hit != null) return hit;
  const value = await fn();
  await cacheSet(namespace, key, value);
  return value;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
