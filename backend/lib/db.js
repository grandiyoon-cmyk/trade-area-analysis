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
//
// 단, **실패한 프로미스는 메모이즈하면 안 된다.** Neon은 유휴 상태에서 깨어나는 데 잠깐
// 걸려서 콜드 스타트 첫 쿼리가 실패할 수 있는데, 거부된 프로미스를 그대로 들고 있으면
// 그 웜 인스턴스가 재활용될 때까지 즐겨찾기와 DB 캐시가 통째로 죽는다. 실패하면 캐시를
// 비워 다음 요청이 다시 시도하게 한다.
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
          expires_at  TIMESTAMPTZ NULL,
          PRIMARY KEY (namespace, key)
        )
      `;
      // 이미 만들어진 테이블에는 expires_at이 없다. 만료 시각을 행에 직접 적어둬야
      // "지금 지워도 되는 행"을 SQL 한 줄로 골라낼 수 있다(네임스페이스마다 TTL이 달라서
      // 조회 시점의 ttlMs만으로는 청소를 할 수 없다). NULL이면 만료 없음(코드표 등).
      await sql`ALTER TABLE cache_entries ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NULL`;
      // 청소 쿼리가 매번 전체 스캔하지 않도록.
      await sql`CREATE INDEX IF NOT EXISTS cache_entries_expires_idx ON cache_entries (expires_at) WHERE expires_at IS NOT NULL`;
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
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}
