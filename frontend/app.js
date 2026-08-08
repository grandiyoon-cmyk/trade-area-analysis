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
    lastResult: null,
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
  function escapeText(s) {
    return String(s ?? "");
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
      badge.className = "live-badge " + (h.hasKey ? "is-ok" : "is-error");
      badge.innerHTML = h.hasKey
        ? `<b>백엔드 연결됨</b><span>서비스키 설정됨</span>`
        : `<b>서비스키 없음</b><span>backend/.env에 SEMAS_SERVICE_KEY 필요</span>`;
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
    const r = await api("/api/regions/sigungu?sidoCd=" + encodeURIComponent(cd));
    state.sigungu = r.items;
    fillSelect(selSigungu, state.sigungu, { valueKey: "signguCd", labelKey: "signguNm", placeholder: "시·군·구 선택" });
    selSigungu.disabled = false;
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
    const r = await api("/api/landmarks");
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
    const r = await api("/api/categories/middle?lclsCd=" + encodeURIComponent(cd));
    state.mcls = r.items;
    fillSelect(selMcls, state.mcls, { valueKey: "indsMclsCd", labelKey: "indsMclsNm", placeholder: "중분류 전체" });
    selMcls.disabled = false;
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
    const r = await api(`/api/categories/small?lclsCd=${encodeURIComponent(state.selLcls)}&mclsCd=${encodeURIComponent(cd)}`);
    state.scls = r.items;
    fillSelect(selScls, state.scls, { valueKey: "indsSclsCd", labelKey: "indsSclsNm", placeholder: "소분류 전체" });
    selScls.disabled = false;
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
      state.lastResult = data;
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
      `<div class="kpi-label">${escapeText(label)}</div><div class="kpi-value">${value}</div>` +
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
  function topCategoryColorer(byLarge) {
    const top3 = byLarge.slice(0, 3);
    const colorVars = ["--series-1", "--series-2", "--series-3"];
    const codeToVar = new Map(top3.map((r, i) => [r.code, colorVars[i]]));
    return { colorVarFor: (code) => codeToVar.get(code) || "--series-other", top3 };
  }

  function categoryLegend(container, byLarge) {
    const legend = document.createElement("div");
    legend.className = "scatter-legend";
    const colorVars = ["--series-1", "--series-2", "--series-3"];
    byLarge.slice(0, 3).forEach((r, i) => {
      const item = document.createElement("span");
      item.innerHTML = `<span class="legend-swatch" style="background:${cssVar(colorVars[i])}"></span>${escapeText(r.name)} (${num(r.count)})`;
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

    const lons = points.map((p) => p.lon), lats = points.map((p) => p.lat);
    let minLon = Math.min(...lons), maxLon = Math.max(...lons);
    let minLat = Math.min(...lats), maxLat = Math.max(...lats);
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

  const MAX_MAP_MARKERS = 1000;
  let naverInfoWindow = null;

  /** 실제 네이버 지도 위에 마커. NAVER_MAPS_CLIENT_ID가 없으면 안내만 띄우고 조용히 넘어간다
   *  (좌표 산점도는 항상 뜨니 지도가 없어도 기능이 막히지는 않는다). */
  async function renderNaverMap(container, points, byLarge) {
    container.innerHTML = "";
    if (!state.naverMapsClientId) {
      container.innerHTML = `<div class="empty-state">네이버 지도 API 키가 없어 실제 지도는 생략합니다 — backend/.env에 NAVER_MAPS_CLIENT_ID를 넣으면 여기에 지도가 뜹니다. 아래 좌표 상대 위치는 키 없이도 항상 볼 수 있어요.</div>`;
      return;
    }
    if (!points.length) {
      container.innerHTML = `<div class="empty-state">좌표 정보가 있는 점포가 없습니다.</div>`;
      return;
    }
    container.innerHTML = `<div class="loading-inline"><span class="spinner"></span> 지도 불러오는 중…</div>`;

    try {
      await loadNaverMapsScript(state.naverMapsClientId);
    } catch (err) {
      container.innerHTML = `<div class="empty-state">${escapeText(err.message)}</div>`;
      return;
    }
    if (!window.naver?.maps) {
      container.innerHTML = `<div class="empty-state">네이버 지도를 불러오지 못했습니다. Client ID와 콘솔에 등록된 서비스 URL을 확인하세요.</div>`;
      return;
    }

    container.innerHTML = "";
    const mapEl = document.createElement("div");
    mapEl.className = "naver-map-el";
    container.appendChild(mapEl);

    const { colorVarFor } = topCategoryColorer(byLarge);
    const step = Math.max(1, Math.ceil(points.length / MAX_MAP_MARKERS));
    const sample = points.filter((_, i) => i % step === 0);

    const lats = points.map((p) => p.lat), lons = points.map((p) => p.lon);
    const bounds = new naver.maps.LatLngBounds(
      new naver.maps.LatLng(Math.min(...lats), Math.min(...lons)),
      new naver.maps.LatLng(Math.max(...lats), Math.max(...lons))
    );

    const map = new naver.maps.Map(mapEl, { center: bounds.getCenter(), zoom: 15 });
    if (!naverInfoWindow) naverInfoWindow = new naver.maps.InfoWindow({ content: " " });

    sample.forEach((p) => {
      const colorHex = cssVar(colorVarFor(p.largeCd));
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(p.lat, p.lon),
        map,
        icon: {
          content: `<span style="display:block;width:10px;height:10px;border-radius:50%;background:${colorHex};border:1.5px solid ${cssVar("--surface-1")};box-shadow:0 0 0 1px rgba(0,0,0,.18)"></span>`,
          anchor: new naver.maps.Point(5, 5),
        },
      });
      naver.maps.Event.addListener(marker, "click", () => {
        naverInfoWindow.setContent(
          `<div style="padding:8px 10px;font-size:12.5px;line-height:1.5;max-width:220px">` +
          `<b>${escapeText(p.name)}</b><br/>${escapeText(p.large ?? "")}${p.middle ? " · " + escapeText(p.middle) : ""}<br/>` +
          `<span style="color:#777">${escapeText(p.addr ?? "—")}</span></div>`
        );
        naverInfoWindow.open(map, marker);
      });
    });

    map.fitBounds(bounds);
    categoryLegend(container, byLarge);

    if (points.length > sample.length) {
      const note = document.createElement("p");
      note.className = "kpi-sub";
      note.style.marginTop = "8px";
      note.textContent = `지도 마커는 최대 ${num(MAX_MAP_MARKERS)}개까지만 표시합니다(전체 ${num(points.length)}개 중 샘플). 전체 표본은 아래 좌표 상대 위치와 점포 목록에서 볼 수 있어요.`;
      container.appendChild(note);
    }
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

  function renderResults(data) {
    resultsEl.innerHTML = "";

    const kpiRow = document.createElement("div");
    kpiRow.className = "kpi-row";
    kpiRow.appendChild(kpiTile("표본 점포 수", num(data.fetchedCount) + "개", data.capped ? `전체 ${num(data.totalCount)}개 중 표본` : "전체 조회 완료"));
    kpiRow.appendChild(kpiTile("업종 다양성", data.diversity != null ? pct(data.diversity) : "—", "소분류 종류 수 ÷ 점포 수"));
    kpiRow.appendChild(kpiTile("최다 업종(대분류)", data.byLarge[0]?.name ?? "—", data.byLarge[0] ? num(data.byLarge[0].count) + "개" : null));
    kpiRow.appendChild(kpiTile("데이터 기준", stdrYmLabel(data.stdrYm), "소진공 분기별 갱신"));
    resultsEl.appendChild(kpiRow);

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

    const middleCard = document.createElement("div");
    middleCard.className = "result-card";
    middleCard.innerHTML = `<div class="result-card-head"><h3>업종 중분류 Top 15</h3></div>`;
    const middleBody = document.createElement("div");
    middleCard.appendChild(middleBody);
    rankedBarList(middleBody, data.byMiddle);
    resultsEl.appendChild(middleCard);

    const mapCard = document.createElement("div");
    mapCard.className = "result-card";
    mapCard.innerHTML = `<div class="result-card-head"><h3>지도에서 보기</h3><span class="kpi-sub">네이버 지도 · 클릭하면 상호명/주소</span></div>`;
    const mapBody = document.createElement("div");
    mapBody.className = "scatter-wrap";
    mapCard.appendChild(mapBody);
    resultsEl.appendChild(mapCard);
    renderNaverMap(mapBody, data.points, data.byLarge); // 비동기 — 로드되는 대로 mapBody 안을 채움

    const scatterCard = document.createElement("div");
    scatterCard.className = "result-card";
    scatterCard.innerHTML = `<div class="result-card-head"><h3>위치 분포 (전체 표본)</h3><span class="kpi-sub">지도가 아닌 좌표 상대 위치 · 위=북쪽</span></div>`;
    const scatterBody = document.createElement("div");
    scatterBody.className = "scatter-wrap";
    scatterCard.appendChild(scatterBody);
    renderScatter(scatterBody, data.points, data.byLarge);
    resultsEl.appendChild(scatterCard);

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
