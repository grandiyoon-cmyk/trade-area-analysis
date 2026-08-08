// Neon(Postgres) 연결. Vercel에 Neon 스토리지를 붙이면 DATABASE_URL이 자동으로 주입된다
// (레거시 호환용으로 POSTGRES_URL도 같이 세팅되는 경우가 있어 폴백으로 봐준다).
// 로컬 개발처럼 DB가 아예 없는 환경에서도 앱이 죽지 않게, "DB 있음"을 하나의 함수로 판단해서
// lib/cache.js(캐시)·lib/favorites.js(즐겨찾기)가 각자 알아서 폴백/에러 처리를 하게 한다.
//
// @neondatabase/serverless의 neon()은 HTTP 기반이라 서버리스 환경(콜드 스타트마다 새 커넥션을
// 안 만들어도 됨)에 잘 맞는다 — 로컬 상시구동 서버(npm start)에서도 그냥 똑같이 쓸 수 있다.
import { neon } from "@neondatabase/serverless";

function connectionString() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
}

export function hasDb() {
  return Boolean(connectionString());
}

let sqlClient = null;
export function getSql() {
  const conn = connectionString();
  if (!conn) {
    throw new Error("DATABASE_URL이 설정되지 않았습니다. Vercel Storage에서 Neon(Postgres)을 연결하거나, backend/.env에 로컬/개발용 Postgres 연결 문자열을 넣으세요.");
  }
  if (!sqlClient) sqlClient = neon(conn);
  return sqlClient;
}

// 서버리스 함수는 요청마다 콜드 스타트될 수 있어 매번 CREATE TABLE을 돌릴 순 없지만,
// 같은 웜 인스턴스 안에서는 한 번만 실행되도록 프로미스를 메모이즈해둔다.
let schemaReady = null;
export function ensureSchema() {
  if (!hasDb()) return Promise.resolve(false);
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS cache_entries (
          namespace   TEXT NOT NULL,
          key         TEXT NOT NULL,
          value       JSONB NOT NULL,
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (namespace, key)
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS favorites (
          id          SERIAL PRIMARY KEY,
          label       TEXT NOT NULL,
          mode        TEXT NOT NULL,
          params      JSONB NOT NULL,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
          -- 로그인 도입 시 여기에 user_id INTEGER NULL 컬럼만 추가하고,
          -- lib/favorites.js의 쿼리에 WHERE user_id = $1(또는 IS NULL)만 끼워 넣으면 된다.
        )
      `;
      return true;
    })();
  }
  return schemaReady;
}
