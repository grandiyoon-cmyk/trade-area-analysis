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
import { fileURLToPath } from "node:url";
import { hasDb, getSql, ensureSchema } from "./db.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "cache");

function pathFor(namespace, key) {
  const dir = join(ROOT, namespace);
  mkdirSync(dir, { recursive: true });
  const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 150);
  return join(dir, `${safeKey}.json`);
}

function fileCacheGet(namespace, key, { ttlMs } = {}) {
  const p = pathFor(namespace, key);
  if (!existsSync(p)) return null;
  try {
    const parsed = JSON.parse(readFileSync(p, "utf8"));
    if (ttlMs != null && Date.now() - (parsed.__savedAt ?? 0) > ttlMs) return null;
    return parsed.__value;
  } catch {
    return null;
  }
}

function fileCacheSet(namespace, key, value) {
  const p = pathFor(namespace, key);
  writeFileSync(p, JSON.stringify({ __savedAt: Date.now(), __value: value }), "utf8");
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

export async function cacheGet(namespace, key, opts = {}) {
  return hasDb() ? dbCacheGet(namespace, key, opts) : fileCacheGet(namespace, key, opts);
}

export async function cacheSet(namespace, key, value) {
  return hasDb() ? dbCacheSet(namespace, key, value) : fileCacheSet(namespace, key, value);
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
