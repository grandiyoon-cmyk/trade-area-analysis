// 저장된 분석 조건("즐겨찾기") CRUD. DB(DATABASE_URL)가 있어야만 동작 — 로컬에서 DB 없이
// 개발할 땐 명확한 에러를 던져서 라우트가 503으로 안내하게 한다(캐시처럼 파일로 조용히
// 폴백하지 않는다: 즐겨찾기는 "저장됐다"는 사용자 기대가 있는 기능이라, 재시작하면 사라지는
// 파일 폴백은 오히려 혼란스럽다).
//
// 아직 로그인이 없어서 전부 공용 목록이다. 나중에 로그인을 붙이면:
//   1) db.js의 favorites 테이블에 user_id INTEGER 컬럼 추가
//   2) 아래 세 함수에 userId 인자를 받아 WHERE/INSERT에 끼워 넣기
//   3) 라우트(server.js)에서 로그인 세션의 userId를 넘겨주기
// 만 하면 되도록 쿼리를 한곳에 모아뒀다.
import { getSql, ensureSchema } from "./db.js";

export async function listFavorites() {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`SELECT id, label, mode, params, created_at FROM favorites ORDER BY created_at DESC`;
  return rows;
}

export async function createFavorite({ label, mode, params }) {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    INSERT INTO favorites (label, mode, params)
    VALUES (${label}, ${mode}, ${JSON.stringify(params)}::jsonb)
    RETURNING id, label, mode, params, created_at
  `;
  return rows[0];
}

export async function deleteFavorite(id) {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM favorites WHERE id = ${id}`;
}
