(function () {
  "use strict";

  const API = ""; // same-origin (backend가 이 프런트도 함께 서빙)

  const state = {
    mode: "region", // "region" | "radius"
    sido: [], sigungu: [], dong: [],
    selSido: "", selSigungu: "", selDong: "",
    lcls: [], mcls: [], scls: [],
    selLcls: "", selMcls: "", selScls: "",
    landmarks: [],
    naverMapsClientId: null,
    favorites: [],
    favoritesAvailable: false,
  };

  function num(n) {
    return n == null ? "—" : Math.round(n).toLocaleString("ko-KR");
  }
  function pct(n, digits = 0) {
    return n == null ? "—" : (n * 100).toFixed(digits) + "%";
  }
  // innerHTML 템플릿에 값을 끼워 넣기 전에 반드시 통과시킨다.
  // 상호명은 사업자가 등록한 자유 문자열이라 실제로 특수문자가 들어온다(예: "민기획&네온",
  // "돈까스&우.찌" — 종로 표본 2000건 중 9건). 에러 배너에는 외부 API 응답 본문이
  // 그대로 실려 오기도 한다. 이스케이프 없이 넣으면 마크업이 깨지고, 그 틈이 곧 XSS다.
  const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function escapeText(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  async function api(path) {
    const res = await fetch(API + path);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `요청 실패 (HTTP ${res.status})`);
    return body;
  }

  /** POST/DELETE 등 바디가 있을 수 있는 요청용. 즐겨찾기 저장/삭제에서 쓴다. */
  async function apiSend(path, method, jsonBody) {
    const res = await fetch(API + path, {
      method,
      headers: jsonBody ? { "Content-Type": "application/json" } : undefined,
      body: jsonBody ? JSON.stringify(jsonBody) : undefined,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `요청 실패 (HTTP ${res.status})`);
    return body;
  }

  /* ============================= HEALTH ============================= */

  async function checkHealth() {
    const badge = document.getElementById("liveBadge");
    try {
      const h = await api("/health");
      // hasKey는 이제 "설정돼 있고 실제 API 호출에 성공했다"는 뜻이다. 설정은 됐는데
      // 통하지 않는 경우(예전에 초록불로 잘못 표시되던 상황)를 따로 구분해 보여준다.
      if (h.hasKey) {
        badge.className = "live-badge is-ok";
        badge.innerHTML = `<b>백엔드 연결됨</b><span>서비스키 확인됨</span>`;
      } else if (h.keyConfigured) {
        badge.className = "live-badge is-error";
        badge.title = h.keyError || "";
        badge.innerHTML = `<b>서비스키 오류</b><span>키가 설정돼 있지만 API가 거부했습니다</span>`;
      } else {
        badge.className = "live-badge is-error";
        badge.innerHTML = `<b>서비스키 없음</b><span>backend/.env에 SEMAS_SERVICE_KEY 필요</span>`;
      }
    } catch {
      badge.className = "live-badge is-error";
      badge.innerHTML = `<b>백엔드 연결 안 됨</b><span>backend에서 npm start 필요</span>`;
    }
  }

  /* ============================= MODE TABS ============================= */

  const tabRegion = document.getElementById("tabRegion");
  const tabRadius = document.getElementById("tabRadius");
  const panelRegion = document.getElementById("panelRegion");
  const panelRadius = document.getElementById("panelRadius");

  function setMode(mode) {
    state.mode = mode;
    tabRegion.classList.toggle("is-active", mode === "region");
    tabRadius.classList.toggle("is-active", mode === "radius");
    tabRegion.setAttribute("aria-selected", String(mode === "region"));
    tabRadius.setAttribute("aria-selected", String(mode === "radius"));
    panelRegion.classList.toggle("is-hidden", mode !== "region");
    panelRadius.classList.toggle("is-hidden", mode !== "radius");
  }
  tabRegion.addEventListener("click", () => setMode("region"));
  tabRadius.addEventListener("click", () => setMode("radius"));

  /* ============================= REGION CASCADE ============================= */

  const selSido = document.getElementById("selSido");
  const selSigungu = document.getElementById("selSigungu");
  const selDong = document.getElementById("selDong");

  function fillSelect(el, items, { valueKey, labelKey, placeholder }) {
    el.innerHTML = "";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = placeholder;
    el.appendChild(ph);
    items.forEach((it) => {
      const opt = document.createElement("option");
      opt.value = it[valueKey];
      opt.textContent = it[labelKey];
      el.appendChild(opt);
    });
  }

  async function loadSido() {
    try {
      const r = await api("/api/regions/sido");
      state.sido = r.items;
      fillSelect(selSido, state.sido, { valueKey: "cd", labelKey: "nm", placeholder: "시·도 선택" });
      selSido.disabled = false;
    } catch {
      fillSelect(selSido, [], { valueKey: "cd", labelKey: "nm", placeholder: "지역 목록 불러오기 실패" });
    }
  }

  // 계단식 선택 로직을 named 함수로 빼서 change 이벤트뿐 아니라 즐겨찾기 불러오기(applyFavorite)에서도
  // await로 순서대로 호출할 수 있게 한다 — synthetic dispatchEvent로는 비동기 완료를 기다릴 수 없어서.
  async function selectSido(cd, { selectEl = true } = {}) {
    state.selSido = cd;
    state.selSigungu = "";
    state.selDong = "";
    if (selectEl) selSido.value = cd;
    selDong.disabled = true;
    fillSelect(selDong, [], { valueKey: "cd", labelKey: "nm", placeholder: "시·군·구 먼저 선택" });
    if (!cd) {
      selSigungu.disabled = true;
      fillSelect(selSigungu, [], { valueKey: "cd", labelKey: "nm", placeholder: "시·도 먼저 선택" });
      return;
    }
    try {
      const r = await api("/api/regions/sigungu?sidoCd=" + encodeURIComponent(cd));
      state.sigungu = r.items;
      fillSelect(selSigungu, state.sigungu, { valueKey: "signguCd", labelKey: "signguNm", placeholder: "시·군·구 선택" });
      selSigungu.disabled = false;
    } catch {
      // 실패를 삼키지 않고 드롭다운 placeholder로 알린다 — 예전엔 여기서 프로미스가 그냥
      // 거부돼 사용자에겐 "아무 반응 없이 멈춘 드롭다운"으로만 보였다.
      selSigungu.disabled = true;
      fillSelect(selSigungu, [], { valueKey: "cd", labelKey: "nm", placeholder: "시·군·구 불러오기 실패" });
    }
  }

  async function selectSigungu(cd, { selectEl = true } = {}) {
    state.selSigungu = cd;
    state.selDong = "";
    if (selectEl) selSigungu.value = cd;
    if (!cd) {
      selDong.disabled = true;
      fillSelect(selDong, [], { valueKey: "cd", labelKey: "nm", placeholder: "시·군·구 먼저 선택" });
      return;
    }
    selDong.disabled = true;
    fillSelect(selDong, [], { valueKey: "cd", labelKey: "nm", placeholder: "불러오는 중…" });
    try {
      const r = await api("/api/regions/dong?sigunguCd=" + encodeURIComponent(cd));
      state.dong = r.items;
      fillSelect(selDong, state.dong, { valueKey: "adongCd", labelKey: "adongNm", placeholder: "행정동 선택(선택 안 해도 됨)" });
      selDong.disabled = false;
    } catch {
      fillSelect(selDong, [], { valueKey: "cd", labelKey: "nm", placeholder: "행정동 불러오기 실패" });
    }
  }

  function selectDong(cd, { selectEl = true } = {}) {
    state.selDong = cd;
    if (selectEl) selDong.value = cd;
  }

  selSido.addEventListener("change", () => selectSido(selSido.value, { selectEl: false }));
  selSigungu.addEventListener("change", () => selectSigungu(selSigungu.value, { selectEl: false }));
  selDong.addEventListener("change", () => selectDong(selDong.value, { selectEl: false }));

  /* ============================= RADIUS MODE ============================= */

  const landmarkRow = document.getElementById("landmarkRow");
  const inLon = document.getElementById("inLon");
  const inLat = document.getElementById("inLat");
  const inRadius = document.getElementById("inRadius");
  const radiusVal = document.getElementById("radiusVal");

  async function loadLandmarks() {
    let r;
    try {
      r = await api("/api/landmarks");
    } catch {
      landmarkRow.innerHTML = `<span class="fav-hint">즐겨찾는 위치를 불러오지 못했습니다 — 경도·위도를 직접 입력하세요.</span>`;
      return;
    }
    state.landmarks = r.items;
    landmarkRow.innerHTML = "";
    state.landmarks.forEach((lm) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "landmark-chip";
      chip.textContent = lm.name;
      chip.addEventListener("click", () => {
        inLon.value = lm.lon;
        inLat.value = lm.lat;
        [...landmarkRow.children].forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
      });
      landmarkRow.appendChild(chip);
    });
  }

  inRadius.addEventListener("input", () => {
    radiusVal.textContent = inRadius.value;
  });

  /* ============================= UPJONG CASCADE ============================= */

  const selLcls = document.getElementById("selLcls");
  const selMcls = document.getElementById("selMcls");
  const selScls = document.getElementById("selScls");

  async function loadLcls() {
    try {
      const r = await api("/api/categories/large");
      state.lcls = r.items;
      fillSelect(selLcls, state.lcls, { valueKey: "indsLclsCd", labelKey: "indsLclsNm", placeholder: "전체 업종" });
    } catch {
      fillSelect(selLcls, [], { valueKey: "cd", labelKey: "nm", placeholder: "업종 목록 불러오기 실패" });
    }
  }

  async function selectLcls(cd, { selectEl = true } = {}) {
    state.selLcls = cd;
    state.selMcls = "";
    state.selScls = "";
    if (selectEl) selLcls.value = cd;
    fillSelect(selScls, [], { valueKey: "cd", labelKey: "nm", placeholder: "중분류 먼저 선택" });
    selScls.disabled = true;
    if (!cd) {
      fillSelect(selMcls, [], { valueKey: "cd", labelKey: "nm", placeholder: "대분류 먼저 선택" });
      selMcls.disabled = true;
      return;
    }
    try {
      const r = await api("/api/categories/middle?lclsCd=" + encodeURIComponent(cd));
      state.mcls = r.items;
      fillSelect(selMcls, state.mcls, { valueKey: "indsMclsCd", labelKey: "indsMclsNm", placeholder: "중분류 전체" });
      selMcls.disabled = false;
    } catch {
      selMcls.disabled = true;
      fillSelect(selMcls, [], { valueKey: "cd", labelKey: "nm", placeholder: "중분류 불러오기 실패" });
    }
  }

  async function selectMcls(cd, { selectEl = true } = {}) {
    state.selMcls = cd;
    state.selScls = "";
    if (selectEl) selMcls.value = cd;
    if (!cd) {
      fillSelect(selScls, [], { valueKey: "cd", labelKey: "nm", placeholder: "중분류 먼저 선택" });
      selScls.disabled = true;
      return;
    }
    try {
      const r = await api(`/api/categories/small?lclsCd=${encodeURIComponent(state.selLcls)}&mclsCd=${encodeURIComponent(cd)}`);
      state.scls = r.items;
      fillSelect(selScls, state.scls, { valueKey: "indsSclsCd", labelKey: "indsSclsNm", placeholder: "소분류 전체" });
      selScls.disabled = false;
    } catch {
      selScls.disabled = true;
      fillSelect(selScls, [], { valueKey: "cd", labelKey: "nm", placeholder: "소분류 불러오기 실패" });
    }
  }

  function selectScls(cd, { selectEl = true } = {}) {
    state.selScls = cd;
    if (selectEl) selScls.value = cd;
  }

  selLcls.addEventListener("change", () => selectLcls(selLcls.value, { selectEl: false }));
  selMcls.addEventListener("change", () => selectMcls(selMcls.value, { selectEl: false }));
  selScls.addEventListener("change", () => selectScls(selScls.value, { selectEl: false }));

  /* ============================= RUN ============================= */

  const runBtn = document.getElementById("runBtn");
  const resultsEl = document.getElementById("results");

  function selectedUpjongLabel() {
    if (state.selScls) return state.scls.find((s) => s.indsSclsCd === state.selScls)?.indsSclsNm || "";
    if (state.selMcls) return state.mcls.find((s) => s.indsMclsCd === state.selMcls)?.indsMclsNm || "";
    if (state.selLcls) return state.lcls.find((s) => s.indsLclsCd === state.selLcls)?.indsLclsNm || "";
    return "";
  }
  function selectedRegionLabel() {
    const parts = [];
    const s = state.sido.find((x) => x.cd === state.selSido);
    if (s) parts.push(s.nm);
    const g = state.sigungu.find((x) => x.signguCd === state.selSigungu);
    if (g) parts.push(g.signguNm);
    const d = state.dong.find((x) => x.adongCd === state.selDong);
    if (d) parts.push(d.adongNm);
    return parts.join(" ");
  }
  function selectedRadiusLabel() {
    const cx = inLon.value, cy = inLat.value;
    const lm = state.landmarks.find((l) => String(l.lon) === String(cx) && String(l.lat) === String(cy));
    return `${lm ? lm.name : `${cx}, ${cy}`} 반경 ${inRadius.value}m`;
  }

  /** 지금 화면 상태를 분석 API 호출/즐겨찾기 저장 양쪽에서 쓸 수 있는 params 객체로.
   *  location이 안 골라졌으면 null. */
  function currentParams() {
    const lclsCd = state.selLcls || undefined;
    const mclsCd = state.selMcls || undefined;
    const sclsCd = state.selScls || undefined;
    const upjongLabel = selectedUpjongLabel();
    if (state.mode === "region") {
      let divId, code;
      if (state.selDong) { divId = "adongCd"; code = state.selDong; }
      else if (state.selSigungu) { divId = "signguCd"; code = state.selSigungu; }
      else if (state.selSido) { divId = "ctprvnCd"; code = state.selSido; }
      else return null;
      return { divId, code, lclsCd, mclsCd, sclsCd, regionLabel: selectedRegionLabel(), upjongLabel };
    }
    const cx = parseFloat(inLon.value), cy = parseFloat(inLat.value);
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
    return { cx, cy, radius: Number(inRadius.value) || 500, lclsCd, mclsCd, sclsCd, radiusLabel: selectedRadiusLabel(), upjongLabel };
  }

  function pathFromParams(mode, p) {
    const parts = [];
    if (p.lclsCd) parts.push("lclsCd=" + encodeURIComponent(p.lclsCd));
    if (p.mclsCd) parts.push("mclsCd=" + encodeURIComponent(p.mclsCd));
    if (p.sclsCd) parts.push("sclsCd=" + encodeURIComponent(p.sclsCd));
    if (mode === "region") return `/api/trade-area/region?divId=${p.divId}&code=${encodeURIComponent(p.code)}&${parts.join("&")}`;
    return `/api/trade-area/radius?cx=${p.cx}&cy=${p.cy}&radius=${p.radius}&${parts.join("&")}`;
  }

  async function runAnalysis() {
    const params = currentParams();
    if (!params) {
      resultsEl.innerHTML = state.mode === "region"
        ? `<div class="error-banner"><b>지역을 선택하세요</b>최소한 시·도는 선택해야 분석할 수 있습니다.</div>`
        : `<div class="error-banner"><b>중심점을 입력하세요</b>즐겨찾는 위치를 고르거나 경도·위도를 직접 입력하세요.</div>`;
      return;
    }
    resultsEl.innerHTML = `<div class="loading-inline"><span class="spinner"></span> 상권 데이터를 모아 집계하는 중… (지역이 넓으면 몇 초 걸릴 수 있어요)</div>`;
    runBtn.disabled = true;
    try {
      const data = await api(pathFromParams(state.mode, params));
      renderResults(data);
    } catch (err) {
      resultsEl.innerHTML = `<div class="error-banner"><b>분석 실패</b>${escapeText(err.message)}</div>`;
    } finally {
      runBtn.disabled = false;
    }
  }

  runBtn.addEventListener("click", runAnalysis);

  /* ============================= 즐겨찾기 ============================= */

  const favoritesBar = document.getElementById("favoritesBar");
  const saveFavBtn = document.getElementById("saveFavBtn");
  let favHintTimer = null;

  function flashFavHint(msg) {
    const hint = document.createElement("span");
    hint.className = "fav-hint";
    hint.style.color = cssVar("--status-critical");
    hint.textContent = msg;
    favoritesBar.prepend(hint);
    clearTimeout(favHintTimer);
    favHintTimer = setTimeout(() => hint.remove(), 2800);
  }

  async function loadFavorites() {
    try {
      const r = await api("/api/favorites");
      state.favorites = r.items;
      state.favoritesAvailable = true;
    } catch {
      state.favorites = [];
      state.favoritesAvailable = false;
    }
    renderFavoritesBar();
  }

  function renderFavoritesBar() {
    favoritesBar.innerHTML = "";
    if (!state.favoritesAvailable) {
      favoritesBar.innerHTML = `<span class="fav-hint">즐겨찾기는 DB 연결 후 쓸 수 있어요 (backend/.env의 DATABASE_URL 필요).</span>`;
      return;
    }
    if (!state.favorites.length) {
      favoritesBar.innerHTML = `<span class="fav-hint">즐겨찾기가 없어요 — 조건을 고르고 "☆ 저장"을 눌러보세요.</span>`;
      return;
    }
    state.favorites.forEach((fav) => {
      const chip = document.createElement("span");
      chip.className = "fav-chip";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = fav.label;
      btn.title = "불러와서 바로 분석";
      btn.addEventListener("click", () => applyFavorite(fav));
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "fav-chip-remove";
      rm.textContent = "×";
      rm.setAttribute("aria-label", "즐겨찾기 삭제: " + fav.label);
      rm.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        try {
          await apiSend(`/api/favorites/${fav.id}`, "DELETE");
          await loadFavorites();
        } catch (err) {
          flashFavHint(err.message);
        }
      });
      chip.append(btn, rm);
      favoritesBar.appendChild(chip);
    });
  }

  /** 시도/시군구/행정동코드 사이엔 접두사 관계가 있다(행정동 8자리의 앞 5자리=시군구,
   *  시군구 5자리의 앞 2자리=시도) — 저장된 divId+code만으로 계단식 선택을 복원할 수 있다. */
  function deriveRegionChain(divId, code) {
    if (divId === "ctprvnCd") return { sidoCd: code, signguCd: "", adongCd: "" };
    if (divId === "signguCd") return { sidoCd: code.slice(0, 2), signguCd: code, adongCd: "" };
    if (divId === "adongCd") return { sidoCd: code.slice(0, 2), signguCd: code.slice(0, 5), adongCd: code };
    return { sidoCd: "", signguCd: "", adongCd: "" };
  }

  async function applyFavorite(fav) {
    setMode(fav.mode);
    const p = fav.params;
    if (fav.mode === "region") {
      const chain = deriveRegionChain(p.divId, p.code);
      await selectSido(chain.sidoCd);
      if (chain.signguCd) await selectSigungu(chain.signguCd);
      if (chain.adongCd) selectDong(chain.adongCd);
    } else {
      inLon.value = p.cx;
      inLat.value = p.cy;
      inRadius.value = p.radius;
      radiusVal.textContent = p.radius;
      [...landmarkRow.children].forEach((c) => c.classList.remove("is-active"));
    }
    if (p.lclsCd) {
      await selectLcls(p.lclsCd);
      if (p.mclsCd) {
        await selectMcls(p.mclsCd);
        if (p.sclsCd) selectScls(p.sclsCd);
      }
    } else {
      await selectLcls("");
    }
    await runAnalysis();
  }

  saveFavBtn.addEventListener("click", async () => {
    const params = currentParams();
    if (!params) {
      flashFavHint(state.mode === "region" ? "지역을 먼저 선택하세요." : "중심점을 먼저 입력하세요.");
      return;
    }
    const suggested = [state.mode === "region" ? params.regionLabel : params.radiusLabel, params.upjongLabel]
      .filter(Boolean)
      .join(" · ");
    const label = (window.prompt("즐겨찾기 이름", suggested || "내 상권") || "").trim();
    if (!label) return;
    try {
      await apiSend("/api/favorites", "POST", { label, mode: state.mode, params });
      await loadFavorites();
    } catch (err) {
      flashFavHint(err.message);
    }
  });

  /* ============================= RENDER: RESULTS ============================= */

  function stdrYmLabel(ym) {
    if (!ym || ym.length !== 6) return "—";
    return `${ym.slice(0, 4)}년 ${ym.slice(4, 6)}월`;
  }

  function kpiTile(label, value, sub) {
    const tile = document.createElement("div");
    tile.className = "kpi-tile";
    tile.innerHTML =
      // value에도 API에서 온 문자열이 들어온다("최다 업종(대분류)" 타일의 업종명) — 함께 이스케이프.
      `<div class="kpi-label">${escapeText(label)}</div><div class="kpi-value">${escapeText(value)}</div>` +
      (sub ? `<div class="kpi-sub">${escapeText(sub)}</div>` : "");
    return tile;
  }

  function rankedBarList(container, rows, { max = 15, colorVar = "--series-1" } = {}) {
    container.innerHTML = "";
    if (!rows.length) {
      container.innerHTML = `<div class="empty-state">표시할 데이터가 없습니다.</div>`;
      return;
    }
    const top = rows.slice(0, max);
    const maxCount = top[0].count;
    const list = document.createElement("div");
    list.className = "bar-list";
    top.forEach((r) => {
      const row = document.createElement("div");
      row.className = "bar-row";
      const label = document.createElement("div");
      label.className = "bar-label";
      label.textContent = r.name;
      label.title = r.name;
      const track = document.createElement("div");
      track.className = "bar-track";
      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = ((r.count / maxCount) * 100).toFixed(1) + "%";
      fill.style.background = cssVar(colorVar);
      track.appendChild(fill);
      const val = document.createElement("div");
      val.className = "bar-val";
      val.textContent = num(r.count) + "개";
      row.append(label, track, val);
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  /** 상위 3개 대분류까지만 카테고리컬 색을 쓰고 나머지는 회색 "기타"로 묶는 컬러러.
   *  all-pairs 산점도/지도 마커는 카테고리컬 색상을 3개까지만 써야 CVD 안전성이 보장된다
   *  (dataviz 스킬 규칙) — 좌표 산점도와 지도 마커 양쪽에서 재사용해 색 배정을 일치시킨다. */
  // 카테고리컬 색 슬롯은 한 곳에서만 정의한다 — 예전엔 이 배열이 topCategoryColorer와
  // categoryLegend 양쪽에 각각 있어서, 한쪽만 고치면 지도 점 색과 범례 색이 조용히 어긋났다.
  const CATEGORY_COLOR_VARS = ["--series-1", "--series-2", "--series-3"];

  function topCategoryColorer(byLarge) {
    const top3 = byLarge.slice(0, 3);
    const codeToVar = new Map(top3.map((r, i) => [r.code, CATEGORY_COLOR_VARS[i]]));
    return { colorVarFor: (code) => codeToVar.get(code) || "--series-other", top3 };
  }

  function categoryLegend(container, byLarge) {
    const legend = document.createElement("div");
    legend.className = "scatter-legend";
    byLarge.slice(0, 3).forEach((r, i) => {
      const item = document.createElement("span");
      item.innerHTML = `<span class="legend-swatch" style="background:${cssVar(CATEGORY_COLOR_VARS[i])}"></span>${escapeText(r.name)} (${num(r.count)})`;
      legend.appendChild(item);
    });
    if (byLarge.length > 3) {
      const rest = byLarge.slice(3).reduce((s, r) => s + r.count, 0);
      const item = document.createElement("span");
      item.innerHTML = `<span class="legend-swatch" style="background:${cssVar("--series-other")}"></span>기타 업종 (${num(rest)})`;
      legend.appendChild(item);
    }
    container.appendChild(legend);
  }

  /** 좌표 산점도 — 실제 지도가 아니라 이 표본 내 상대 위치. */
  function renderScatter(container, points, byLarge) {
    container.innerHTML = "";
    if (!points.length) {
      container.innerHTML = `<div class="empty-state">좌표 정보가 있는 점포가 없습니다.</div>`;
      return;
    }
    const { colorVarFor } = topCategoryColorer(byLarge);

    // reduce로 구한다 — Math.min(...arr)은 표본이 1만 건이면 인자 개수 한계에 닿는다.
    const ex = points.reduce(
      (a, p) => ({
        minLon: Math.min(a.minLon, p.lon), maxLon: Math.max(a.maxLon, p.lon),
        minLat: Math.min(a.minLat, p.lat), maxLat: Math.max(a.maxLat, p.lat),
      }),
      { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity }
    );
    let { minLon, maxLon, minLat, maxLat } = ex;
    const padLon = (maxLon - minLon) * 0.08 || 0.001;
    const padLat = (maxLat - minLat) * 0.08 || 0.001;
    minLon -= padLon; maxLon += padLon; minLat -= padLat; maxLat += padLat;

    const W = 640, H = 360;
    const x = (lon) => ((lon - minLon) / (maxLon - minLon)) * W;
    const y = (lat) => H - ((lat - minLat) / (maxLat - minLat)) * H; // 위도 클수록 북쪽=위쪽

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", "100%");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "표본 점포들의 상대 위치 산점도");

    const frame = document.createElementNS(svgNS, "rect");
    frame.setAttribute("x", 0.5); frame.setAttribute("y", 0.5);
    frame.setAttribute("width", W - 1); frame.setAttribute("height", H - 1);
    frame.setAttribute("fill", "none");
    frame.setAttribute("stroke", cssVar("--gridline"));
    svg.appendChild(frame);

    points.forEach((p) => {
      const c = document.createElementNS(svgNS, "circle");
      c.setAttribute("cx", x(p.lon).toFixed(1));
      c.setAttribute("cy", y(p.lat).toFixed(1));
      c.setAttribute("r", 4);
      c.setAttribute("fill", cssVar(colorVarFor(p.largeCd)));
      c.setAttribute("stroke", cssVar("--surface-1"));
      c.setAttribute("stroke-width", 1.5);
      const title = document.createElementNS(svgNS, "title");
      title.textContent = `${p.name} · ${p.large ?? ""}${p.addr ? " · " + p.addr : ""}`;
      c.appendChild(title);
      svg.appendChild(c);
    });

    container.appendChild(svg);
    categoryLegend(container, byLarge);
  }

  /* ============================= NAVER MAP ============================= */

  // 네이버 지도는 **키가 틀려도 스크립트 자체는 HTTP 200으로 정상 로드된다**(333KB짜리 실제
  // 라이브러리가 그대로 내려온다). 그래서 script.onerror는 절대 안 터지고, 인증 실패는 지도를
  // 만든 뒤에야 "네이버 지도 Open API 인증이 실패했습니다" 타일로 드러난다. 그 상태를 감지하는
  // 공식 수단이 이 전역 콜백이다. 이걸 안 달아두면 키가 틀렸을 때 위치 분포가 통째로 사라진다.
  let naverAuthFailed = false;
  let onNaverAuthFailure = null;
  window.navermap_authFailure = function () {
    naverAuthFailed = true;
    if (onNaverAuthFailure) onNaverAuthFailure();
  };

  let naverMapsScriptPromise = null;
  function loadNaverMapsScript(clientId) {
    if (window.naver?.maps) return Promise.resolve();
    if (!naverMapsScriptPromise) {
      naverMapsScriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("네이버 지도 스크립트를 불러오지 못했습니다 (Client ID 또는 등록된 서비스 URL을 확인하세요)."));
        document.head.appendChild(script);
      });
    }
    return naverMapsScriptPromise;
  }

  let naverInfoWindow = null;

  const MARKER_R = 4;        // 점 반지름(px)
  const CLICK_SLOP = 8;      // 클릭 지점에서 이 픽셀 안에 있는 점을 집는다

  /**
   * 표본 전체를 지도 위에 그리는 캔버스 오버레이.
   *
   * naver.maps.Marker를 점포마다 만들면 마커 하나가 DOM 엘리먼트 하나라서, 수천 개를
   * 넘어가면 패닝·줌이 눈에 띄게 버벅인다(그래서 예전엔 1,000개만 샘플링해 보여줬다).
   * 캔버스에 직접 찍으면 엘리먼트는 <canvas> 하나뿐이라 1만 개도 부드럽게 그려져서,
   * "표본 전체의 분포"를 있는 그대로 지도 위에 얹을 수 있다.
   *
   * 클릭은 캔버스가 pointer-events:none 이라 지도로 그대로 통과하고, 지도의 click
   * 이벤트에서 좌표를 픽셀로 바꿔 가장 가까운 점을 찾는 방식으로 처리한다.
   */
  // 지도 위 점의 테두리 색. **테마 토큰을 쓰면 안 된다.**
  // 이 테두리는 앱 배경이 아니라 네이버 지도 타일 위에 그려지는데, 지도 타일은 사용자가
  // 다크모드를 켜도 항상 밝다. 예전엔 --surface-1(다크에서 #1a1a19, 거의 검정)을 써서
  // 다크모드일 때 밝은 지도 위에 검은 테두리가 깔려 점이 뭉개져 보였다.
  const MAP_DOT_RING = "#ffffff";

  function createPointsOverlay(points, colorHexFor) {
    // 좌표 객체는 한 번만 만들어 재사용한다. draw()는 지도를 끌거나 확대할 때마다 불리는데,
    // 매번 새로 만들면 표본 2,445개 기준 4.5ms(재사용 시 2.7ms)가 들고, 표본 상한인
    // 1만 개에서는 60fps 예산(16.7ms)을 넘긴다.
    const coords = points.map((p) => new naver.maps.LatLng(p.lat, p.lon));

    function PointsOverlay() {
      const cv = document.createElement("canvas");
      cv.style.position = "absolute";
      cv.style.pointerEvents = "none"; // 클릭은 지도가 받게 둔다
      this._canvas = cv;
    }
    PointsOverlay.prototype = new naver.maps.OverlayView();
    PointsOverlay.prototype.constructor = PointsOverlay;

    PointsOverlay.prototype.onAdd = function () {
      this.getPanes().overlayLayer.appendChild(this._canvas);
    };
    PointsOverlay.prototype.onRemove = function () {
      this._canvas.remove();
    };
    PointsOverlay.prototype.draw = function () {
      const map = this.getMap();
      if (!map) return;
      const proj = this.getProjection();
      const size = map.getSize();
      const bounds = map.getBounds();

      // 오버레이 레이어는 지도와 함께 움직이는 자체 좌표계를 쓴다. 화면 좌상단(북서)의
      // 오버레이 좌표를 원점으로 잡고, 캔버스를 딱 그 자리에 올려 화면 크기만큼만 그린다.
      const nw = new naver.maps.LatLng(bounds.getMax().y, bounds.getMin().x);
      const origin = proj.fromCoordToOffset(nw);

      const dpr = window.devicePixelRatio || 1;
      const cv = this._canvas;
      cv.width = Math.round(size.width * dpr);
      cv.height = Math.round(size.height * dpr);
      cv.style.width = size.width + "px";
      cv.style.height = size.height + "px";
      cv.style.left = origin.x + "px";
      cv.style.top = origin.y + "px";

      const ctx = cv.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.width, size.height);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = MAP_DOT_RING;

      const pad = MARKER_R + 2;
      for (let i = 0; i < points.length; i++) {
        const pt = proj.fromCoordToOffset(coords[i]);
        const x = pt.x - origin.x, y = pt.y - origin.y;
        if (x < -pad || y < -pad || x > size.width + pad || y > size.height + pad) continue; // 화면 밖은 건너뛴다
        ctx.beginPath();
        ctx.arc(x, y, MARKER_R, 0, Math.PI * 2);
        ctx.fillStyle = colorHexFor(points[i].largeCd);
        ctx.fill();
        ctx.stroke();
      }
    };
    PointsOverlay.prototype.coords = coords; // 클릭 판정에서 같은 배열을 재사용한다
    return new PointsOverlay();
  }

  /** 클릭 지점에서 CLICK_SLOP 픽셀 안에 있는 점포 중 가장 가까운 것 */
  function findPointNear(proj, points, coords, coord) {
    const target = proj.fromCoordToOffset(coord);
    let best = null, bestD2 = (CLICK_SLOP + MARKER_R) ** 2;
    for (let i = 0; i < points.length; i++) {
      const pt = proj.fromCoordToOffset(coords[i]);
      const d2 = (pt.x - target.x) ** 2 + (pt.y - target.y) ** 2;
      if (d2 <= bestD2) { bestD2 = d2; best = points[i]; }
    }
    return best;
  }

  /**
   * 위치 분포를 실제 네이버 지도 위에 그린다.
   * 키(NAVER_MAPS_CLIENT_ID)가 없거나 지도 로드에 실패하면 좌표 산점도로 폴백한다 —
   * 지도가 없다고 위치 분포 자체를 못 보는 일은 없어야 한다.
   */
  async function renderDistribution(container, points, byLarge) {
    container.innerHTML = "";
    if (!points.length) {
      container.innerHTML = `<div class="empty-state">좌표 정보가 있는 점포가 없습니다.</div>`;
      return;
    }

    const fallback = (msg) => {
      container.innerHTML = "";
      if (msg) {
        const note = document.createElement("p");
        note.className = "kpi-sub";
        note.style.marginBottom = "10px";
        note.textContent = msg;
        container.appendChild(note);
      }
      const box = document.createElement("div");
      container.appendChild(box);
      renderScatter(box, points, byLarge);
    };

    const AUTH_FAIL_MSG =
      "네이버 지도 인증에 실패해 좌표 상대 위치로 표시합니다 — NCP 콘솔에서 Client ID와 '웹 서비스 URL' 등록을 확인하세요.";

    if (!state.naverMapsClientId) {
      fallback("네이버 지도 키(NAVER_MAPS_CLIENT_ID)가 없어 좌표 상대 위치로 표시합니다 — 키를 넣으면 이 자리에 실제 지도가 뜹니다.");
      return;
    }
    // 한 번 인증에 실패했으면 같은 키로 다시 시도해봐야 결과가 같다. 바로 폴백한다.
    if (naverAuthFailed) {
      fallback(AUTH_FAIL_MSG);
      return;
    }

    container.innerHTML = `<div class="loading-inline"><span class="spinner"></span> 지도 불러오는 중…</div>`;
    try {
      await loadNaverMapsScript(state.naverMapsClientId);
    } catch (err) {
      fallback(err.message);
      return;
    }
    if (!window.naver?.maps) {
      fallback("네이버 지도를 불러오지 못했습니다. Client ID와 NCP 콘솔에 등록한 서비스 URL을 확인하세요.");
      return;
    }

    // 인증 실패는 지도를 만든 **뒤에** 비동기로 통보된다. 그때 이 카드를 산점도로 갈아끼운다.
    // (이미 다른 분석 결과로 화면이 바뀐 뒤라면 건드리지 않는다)
    onNaverAuthFailure = () => {
      if (container.isConnected) fallback(AUTH_FAIL_MSG);
    };

    container.innerHTML = "";
    const mapEl = document.createElement("div");
    mapEl.className = "naver-map-el";
    container.appendChild(mapEl);

    const { colorVarFor } = topCategoryColorer(byLarge);
    const colorHexFor = (code) => cssVar(colorVarFor(code));

    // reduce로 최소/최대를 구한다 — Math.min(...arr)은 표본이 1만 건이면 인자 개수 한계에 닿는다.
    const b = points.reduce(
      (a, p) => ({
        minLat: Math.min(a.minLat, p.lat), maxLat: Math.max(a.maxLat, p.lat),
        minLon: Math.min(a.minLon, p.lon), maxLon: Math.max(a.maxLon, p.lon),
      }),
      { minLat: Infinity, maxLat: -Infinity, minLon: Infinity, maxLon: -Infinity }
    );
    const bounds = new naver.maps.LatLngBounds(
      new naver.maps.LatLng(b.minLat, b.minLon),
      new naver.maps.LatLng(b.maxLat, b.maxLon)
    );

    const map = new naver.maps.Map(mapEl, { center: bounds.getCenter(), zoom: 15 });
    map.fitBounds(bounds);

    const overlay = createPointsOverlay(points, colorHexFor);
    overlay.setMap(map);

    if (!naverInfoWindow) naverInfoWindow = new naver.maps.InfoWindow({ content: " " });
    naver.maps.Event.addListener(map, "click", (e) => {
      const proj = overlay.getProjection();
      if (!proj) return;
      const hit = findPointNear(proj, points, overlay.coords, e.coord);
      if (!hit) return naverInfoWindow.close();
      naverInfoWindow.setContent(
        `<div style="padding:8px 10px;font-size:12.5px;line-height:1.5;max-width:220px">` +
        `<b>${escapeText(hit.name)}</b><br/>${escapeText(hit.large ?? "")}${hit.middle ? " · " + escapeText(hit.middle) : ""}<br/>` +
        `<span style="color:#777">${escapeText(hit.addr ?? "—")}</span></div>`
      );
      naverInfoWindow.open(map, new naver.maps.LatLng(hit.lat, hit.lon));
    });

    categoryLegend(container, byLarge);
    const hint = document.createElement("p");
    hint.className = "kpi-sub";
    hint.style.marginTop = "8px";
    hint.textContent = `표본 ${num(points.length)}개를 모두 표시합니다. 점을 클릭하면 상호명·주소가 나옵니다.`;
    container.appendChild(hint);
  }

  function renderStoreTable(container, points) {
    container.innerHTML = "";
    const toolbar = document.createElement("div");
    toolbar.className = "table-toolbar";
    toolbar.innerHTML = `<span class="eyebrow-mark" style="margin:0">점포 목록 (${num(points.length)}건 표본)</span>`;
    const filterInput = document.createElement("input");
    filterInput.className = "table-filter-input";
    filterInput.type = "text";
    filterInput.placeholder = "상호명·업종·주소로 필터…";
    toolbar.appendChild(filterInput);
    container.appendChild(toolbar);

    const scroll = document.createElement("div");
    scroll.className = "table-scroll";
    container.appendChild(scroll);

    function draw(rows) {
      scroll.innerHTML = "";
      if (!rows.length) {
        scroll.innerHTML = `<div class="empty-state">일치하는 점포가 없습니다.</div>`;
        return;
      }
      const table = document.createElement("table");
      table.className = "data-table";
      table.innerHTML =
        `<thead><tr><th>상호명</th><th>대분류</th><th>중분류</th><th>주소</th></tr></thead>`;
      const tbody = document.createElement("tbody");
      rows.slice(0, 500).forEach((p) => {
        const tr = document.createElement("tr");
        tr.innerHTML =
          `<td>${escapeText(p.name)}</td><td>${escapeText(p.large)}</td><td>${escapeText(p.middle)}</td><td class="addr">${escapeText(p.addr ?? "—")}</td>`;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      scroll.appendChild(table);
      if (rows.length > 500) {
        const note = document.createElement("p");
        note.className = "kpi-sub";
        note.style.marginTop = "8px";
        note.textContent = `표는 최대 500건까지만 표시합니다 (필터로 좁혀보세요). 전체 ${num(rows.length)}건.`;
        scroll.appendChild(note);
      }
    }

    draw(points);
    let debounce = null;
    filterInput.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const q = filterInput.value.trim().toLowerCase();
        if (!q) return draw(points);
        draw(points.filter((p) => [p.name, p.large, p.middle, p.addr].join(" ").toLowerCase().includes(q)));
      }, 150);
    });
  }

  /**
   * 구성 막대 — 이 화면의 시그니처.
   * "여기 뭐가 몰려 있나"가 이 도구가 답하는 질문이라, 결과를 열자마자 상권의 업종 구성이
   * 한 줄로 들어오게 한다. 상위 3개 대분류 + 기타로 묶는 건 지도 마커·산점도와 같은 규칙이고
   * (카테고리컬 색은 3개까지만), 색만으로 구분되지 않도록 이름과 비율을 직접 라벨로 단다.
   */
  function renderComposition(container, byLarge, total) {
    if (!byLarge.length || !total) return;
    const top3 = byLarge.slice(0, 3);
    const restCount = byLarge.slice(3).reduce((s, r) => s + r.count, 0);
    const segments = top3.map((r, i) => ({ name: r.name, count: r.count, colorVar: CATEGORY_COLOR_VARS[i] }));
    if (restCount > 0) segments.push({ name: "기타 업종", count: restCount, colorVar: "--series-other" });

    const wrap = document.createElement("section");
    wrap.className = "composition";
    wrap.innerHTML = `<p class="eyebrow-mark">업종 구성 · 대분류 기준</p>`;

    const bar = document.createElement("div");
    bar.className = "composition-bar";
    bar.setAttribute("role", "img");
    bar.setAttribute("aria-label", segments.map((s) => `${s.name} ${Math.round((s.count / total) * 100)}%`).join(", "));
    segments.forEach((s, i) => {
      const seg = document.createElement("div");
      seg.className = "composition-seg";
      seg.style.flex = `${s.count} 0 0`;
      seg.style.background = cssVar(s.colorVar);
      seg.style.animationDelay = `${i * 70}ms`;
      seg.title = `${s.name} · ${num(s.count)}개`;
      bar.appendChild(seg);
    });
    wrap.appendChild(bar);

    const keys = document.createElement("div");
    keys.className = "composition-keys";
    segments.forEach((s) => {
      const k = document.createElement("span");
      k.className = "composition-key";
      k.innerHTML =
        `<span class="swatch" style="background:${cssVar(s.colorVar)}"></span>` +
        `<span class="nm">${escapeText(s.name)}</span>` +
        `<span class="pc">${pct(s.count / total)} · ${num(s.count)}개</span>`;
      keys.appendChild(k);
    });
    wrap.appendChild(keys);
    container.appendChild(wrap);
  }

  function renderResults(data) {
    resultsEl.innerHTML = "";

    const kpiRow = document.createElement("div");
    kpiRow.className = "kpi-row";
    kpiRow.appendChild(kpiTile("표본 점포 수", num(data.fetchedCount) + "개", data.capped ? `전체 ${num(data.totalCount)}개 중 표본` : "전체 조회 완료"));
    // "소분류 종류 수 ÷ 점포 수"(다양성)를 쓰다가 상위 3개 업종 점유율로 바꿨다. 다양성은
    // 표본이 커질수록 자동으로 작아져서, 넓은 지역과 좁은 동네를 나란히 비교할 수 없었다.
    // 점유율은 비율이라 표본 크기에 흔들리지 않고 그대로 읽힌다(높을수록 쏠린 상권).
    kpiRow.appendChild(kpiTile(
      "업종 쏠림",
      data.top3SmallShare != null ? pct(data.top3SmallShare) : "—",
      data.top3SmallNames?.length ? `상위 3개: ${data.top3SmallNames.join(" · ")}` : "상위 3개 소분류 점유율"
    ));
    kpiRow.appendChild(kpiTile("최다 업종(대분류)", data.byLarge[0]?.name ?? "—", data.byLarge[0] ? num(data.byLarge[0].count) + "개" : null));
    kpiRow.appendChild(kpiTile("데이터 기준", stdrYmLabel(data.stdrYm), "분기마다 갱신"));
    resultsEl.appendChild(kpiRow);

    renderComposition(resultsEl, data.byLarge, data.fetchedCount);

    if (data.capped) {
      const warn = document.createElement("div");
      warn.className = "result-card";
      warn.innerHTML =
        `<div class="warning-list" style="margin-top:0;padding-top:0;border-top:none">` +
        `<p class="eyebrow" style="color:var(--status-warning);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0 0 6px">데이터 참고사항</p>` +
        `<div class="warning-item">선택한 범위의 점포가 많아(전체 ${num(data.totalCount)}개) 앞쪽 ${num(data.fetchedCount)}개만 가져와 집계했습니다. 정확한 전체 집계가 필요하면 업종이나 지역을 더 좁혀보세요.</div></div>`;
      resultsEl.appendChild(warn);
    }

    const largeCard = document.createElement("div");
    largeCard.className = "result-card";
    largeCard.innerHTML = `<div class="result-card-head"><h3>업종 대분류 분포</h3><span class="kpi-sub">점포 수 기준</span></div>`;
    const largeBody = document.createElement("div");
    largeCard.appendChild(largeBody);
    rankedBarList(largeBody, data.byLarge);
    resultsEl.appendChild(largeCard);

    // 중분류/소분류로 필터를 걸면 결과에 남는 중분류가 한두 개뿐인데, 그때도 제목이
    // "Top 15"면 나머지 14개가 잘린 것처럼 읽힌다. 실제 개수에 맞춰 제목을 바꾼다.
    const middleCard = document.createElement("div");
    middleCard.className = "result-card";
    // byMiddleTotal은 서버가 자르기 전 종류 수. byMiddle.length만 보면 15개가 전부인지
    // 더 있는데 잘린 건지 구분할 수 없다. (구버전 응답 호환: 값이 없으면 length로 대체)
    const middleTotal = data.byMiddleTotal ?? data.byMiddle.length;
    const middleTitle = middleTotal > 15 ? "업종 중분류 Top 15" : "업종 중분류 분포";
    const middleSub = middleTotal > 15 ? `전체 ${num(middleTotal)}종 중 상위 15종` : `${num(middleTotal)}종`;
    middleCard.innerHTML = `<div class="result-card-head"><h3>${middleTitle}</h3><span class="kpi-sub">${middleSub}</span></div>`;
    const middleBody = document.createElement("div");
    middleCard.appendChild(middleBody);
    rankedBarList(middleBody, data.byMiddle);
    resultsEl.appendChild(middleCard);

    // 지도와 좌표 산점도를 따로 두지 않고 한 카드로 합쳤다 — 둘 다 "표본이 어디에 몰려
    // 있는가"라는 같은 질문에 답하는데, 지도가 뜨는 환경에서는 산점도가 열등한 중복이고,
    // 키가 없는 환경에서는 산점도가 그 자리를 대신하면 된다.
    const distCard = document.createElement("div");
    distCard.className = "result-card";
    distCard.innerHTML = `<div class="result-card-head"><h3>위치 분포 (전체 표본)</h3><span class="kpi-sub">네이버 지도 · 점을 클릭하면 상호명/주소</span></div>`;
    const distBody = document.createElement("div");
    distBody.className = "scatter-wrap";
    distCard.appendChild(distBody);
    resultsEl.appendChild(distCard);
    renderDistribution(distBody, data.points, data.byLarge); // 비동기 — 지도가 로드되는 대로 채움

    const tableCard = document.createElement("div");
    tableCard.className = "result-card";
    renderStoreTable(tableCard, data.points);
    resultsEl.appendChild(tableCard);
  }

  /* ============================= INIT ============================= */

  async function loadConfig() {
    try {
      const r = await api("/api/config");
      state.naverMapsClientId = r.naverMapsClientId;
      if (state.naverMapsClientId) loadNaverMapsScript(state.naverMapsClientId).catch(() => {}); // 미리 로드, 실패해도 조용히(지도 카드에서 다시 안내)
    } catch {
      /* 설정 못 받아와도 좌표 산점도는 그대로 동작하므로 조용히 넘어간다 */
    }
  }

  checkHealth();
  loadConfig();
  loadSido();
  loadLcls();
  loadLandmarks();
  loadFavorites();
})();
