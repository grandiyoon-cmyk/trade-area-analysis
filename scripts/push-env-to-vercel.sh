#!/usr/bin/env bash
# backend/.env 의 SEMAS_SERVICE_KEY 를 Vercel 프로덕션 환경변수로 그대로 올린다.
#
# 왜 이게 필요한가: 웹 콘솔에 손으로 붙여넣는 방식은 클립보드를 거치기 때문에
# 값이 잘리거나 엉뚱한 게 들어가는 사고가 반복된다(실제로 두 번 났다).
# 이 스크립트는 파일에서 직접 읽어 파이프로 넘기므로 복사·붙여넣기가 없다.
#
# 쓰기 전에 한 번만: npx vercel login  →  npx vercel link
set -euo pipefail

cd "$(dirname "$0")/.."
ENV_FILE="backend/.env"

[ -f "$ENV_FILE" ] || { echo "❌ $ENV_FILE 이 없습니다."; exit 1; }

# = 뒤 전체를 값으로 취급하고 따옴표만 벗긴다. 키 자체는 절대 출력하지 않는다.
KEY="$(grep -m1 '^SEMAS_SERVICE_KEY=' "$ENV_FILE" | cut -d= -f2- | sed 's/^["'"'"']//; s/["'"'"']$//')"

[ -n "$KEY" ] || { echo "❌ $ENV_FILE 에서 SEMAS_SERVICE_KEY 를 못 찾았습니다."; exit 1; }

# 이 지문이 배포 후 /health 의 sha8 과 같아야 성공이다.
FP="$(printf '%s' "$KEY" | shasum -a 256 | cut -c1-8)"
echo "올릴 키: ${#KEY}자 · sha8 $FP"
echo

for TARGET in production preview development; do
  echo "── $TARGET ──"
  # 이미 있으면 지운다(없으면 조용히 넘어감). Vercel은 같은 이름을 덮어쓰지 않고 중복 등록한다.
  npx --yes vercel env rm SEMAS_SERVICE_KEY "$TARGET" --yes 2>/dev/null || true
  printf '%s' "$KEY" | npx --yes vercel env add SEMAS_SERVICE_KEY "$TARGET"
done

echo
echo "환경변수 업로드 완료. 이제 재배포합니다 (환경변수는 새 배포에만 적용됨)."
npx --yes vercel --prod

echo
echo "✅ 끝났습니다. 아래 명령으로 확인하세요 — sha8 이 $FP 이면 성공입니다:"
echo "   curl -s https://trade-area-analysis-grandiyoon-cmyks-projects.vercel.app/health"
