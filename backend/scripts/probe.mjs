// 실제 SEMAS_SERVICE_KEY로 몇 가지 오퍼레이션을 직접 호출해 원본 응답을 저장해보는 스크립트.
// franchise-registry의 test-list.sh / dev-test-parse.mjs와 같은 목적: semasClient.js의
// 필드 매핑이 공식 가이드 문서와 실제 응답이 정말 일치하는지, 키 발급 후 눈으로 확인하는 용도.
//
//   npm run probe
//
// 결과는 scripts/*.out.json에 저장된다 (.gitignore에 이미 등록돼 있어 커밋되지 않음).
import "dotenv/config";
import { writeFileSync } from "node:fs";
import {
  fetchDongList,
  fetchLargeUpjong,
  fetchStoresInRegion,
  fetchStoresInRadius,
} from "../lib/semasClient.js";

function save(name, data) {
  const path = new URL(`./${name}.out.json`, import.meta.url);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
  console.log(`✓ ${name}: ${data.items?.length ?? 0}건 저장 → scripts/${name}.out.json`);
}

async function main() {
  console.log("1) 업종 대분류 조회 (largeUpjongList)...");
  save("large-upjong", await fetchLargeUpjong());

  console.log("2) 강남구 행정동 목록 (baroApi, signguCd=11680)...");
  save("dong-list-11680", await fetchDongList("11680"));

  console.log("3) 강남역 반경 300m 상가업소 (storeListInRadius)...");
  save("radius-gangnam", await fetchStoresInRadius({ cx: 127.0276, cy: 37.4979, radius: 300, numOfRows: 20 }));

  console.log("4) 서울 종로구(시군구코드 11110) 상가업소 (storeListInDong, divId=signguCd)...");
  save("region-jongno", await fetchStoresInRegion({ divId: "signguCd", key: "11110", numOfRows: 20 }));

  console.log("\n완료. 각 out.json을 열어 items[0]의 필드명이 lib/analysis.js가 기대하는");
  console.log("bizesNm/indsLclsNm/indsMclsNm/lon/lat 등과 일치하는지 확인하세요.");
}

main().catch((err) => {
  console.error("probe 실패:", err.message);
  process.exit(1);
});
