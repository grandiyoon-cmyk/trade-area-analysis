#!/usr/bin/env bash
# backend/.env 의 SEMAS_SERVICE_KEY 를 Vercel 프로덕션 환경변수로 그대로 올린다.
#
# 왜 이게 필요한가: 웹 콘솔에 손으로 붙여넣는 방식은 클립보드를 거치기 때문에
# 값이 잘리거나 엉뚱한 게 들어가는 사고가 반복된다(실제로 두 번 났다).
# 이 스크립트는 파일에서 직접 읽어 파이프로 넘기므로 복사·붙여넣기가 없다.
#
# 쓰기 전에 한 번만: npx vercel login  →  npx vercel link
set -euo pipefail

# 기본 npm 캐시(~/.npm)에 root 소유 파일이 섞여 있으면 npx가 EACCES로 죽는다.
# 예전에 sudo로 npm을 한 번 돌린 흔적인데, 고치려면 sudo가 필요하다.
# 여기서는 사용자 소유가 확실한 별도 캐시를 써서 비밀번호 없이 우회한다.
# (~/.npm을 직접 고치고 싶다면: sudo chown -R "$(id -u):$(id -g)" ~/.npm)
export npm_config_cache="${npm_config_cache:-$HOME/.npm-cache}"
mkdir -p "$npm_config_cache"

cd "$(dirname "$0")/.."
ENV_FILE="backend/.env"

[ -f "$ENV_FILE" ] || { echo "❌ $ENV_FILE 이 없습니다."; exit 1; }

# .env에서 변수 하나를 읽는다. = 뒤 전체를 값으로 취급하고 따옴표만 벗긴다.
# 값 자체는 절대 출력하지 않는다 — 길이와 해시 앞 8자리만 보여준다.
read_env() {
  grep -m1 "^$1=" "$ENV_FILE" | cut -d= -f2- | sed 's/^["'"'"']//; s/["'"'"']$//'
}

# 여기에 나열된 것만 올린다. .env에 비어 있는 항목은 알아서 건너뛴다.
VARS="SEMAS_SERVICE_KEY NAVER_MAPS_CLIENT_ID NAVER_MAPS_CLIENT_SECRET"

SEMAS_FP=""
UPLOADED=0

for NAME in $VARS; do
  VALUE="$(read_env "$NAME")"
  if [ -z "$VALUE" ]; then
    echo "⏭  $NAME — .env에 비어 있어 건너뜁니다."
    continue
  fi
  FP="$(printf '%s' "$VALUE" | shasum -a 256 | cut -c1-8)"
  [ "$NAME" = "SEMAS_SERVICE_KEY" ] && SEMAS_FP="$FP"
  echo "📤 $NAME — ${#VALUE}자 · sha8 $FP"
  for TARGET in production preview development; do
    # 이미 있으면 지운다(없으면 조용히 넘어감). Vercel은 같은 이름을 덮어쓰지 않고 중복 등록한다.
    npx --yes vercel env rm "$NAME" "$TARGET" --yes >/dev/null 2>&1 || true
    printf '%s' "$VALUE" | npx --yes vercel env add "$NAME" "$TARGET" >/dev/null
  done
  echo "   → production / preview / development 등록 완료"
  UPLOADED=$((UPLOADED + 1))
done

[ "$UPLOADED" -gt 0 ] || { echo "❌ 올릴 값이 하나도 없습니다. $ENV_FILE 을 확인하세요."; exit 1; }

echo
echo "환경변수 업로드 완료. 이제 재배포합니다 (환경변수는 새 배포에만 적용됨)."
npx --yes vercel --prod --yes

echo
echo "✅ 끝났습니다. 아래 명령으로 확인하세요${SEMAS_FP:+ — 서비스키 sha8 이 $SEMAS_FP 이면 성공입니다}:"
echo "   curl -s https://trade-area-analysis-theta.vercel.app/health"
