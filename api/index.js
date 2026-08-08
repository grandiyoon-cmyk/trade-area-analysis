// Vercel은 이 파일(api/index.js)을 서버리스 함수 하나로 감싸 /api 경로에 건다.
// vercel.json의 rewrites가 모든 요청("/(.*)")을 /api로 보내주기 때문에,
// backend/server.js의 Express 앱이 지금까지처럼(로컬 npm start와 동일하게) 내부에서
// 알아서 라우팅한다 — 정적 프런트 서빙(express.static)까지 이 함수 하나가 다 처리한다.
export { default } from "../backend/server.js";
