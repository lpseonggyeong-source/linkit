(function () {
  "use strict";

  var A = window.AdminShared;
  var STATUSES = ["정산 필요", "정산대기", "정산중", "정산 완료", "정산 보류"];
  var today = "2026-07-07";

  function whole(n) { return Math.round(Number(n) || 0); }
  function money(n) { return A.formatCurrency(whole(n)); }
  function num(n) { return whole(n).toLocaleString("ko-KR"); }
  function byId(id) { return document.getElementById(id); }
  function query(name) { return new URLSearchParams(location.search).get(name); }
  function toDateValue(s) { return String(s || "").replace(/\//g, "-").replace(/\./g, "-").slice(0, 10); }
  function parseDateTime(s, endOfDay) {
    if (!s) return null;
    var normalized = String(s).trim().replace(/\//g, "-").replace(/\./g, "-").replace(" ", "T");
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) normalized += endOfDay ? "T23:59:59" : "T00:00:00";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) normalized += ":00";
    var d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  }
  function dateTimeInputValue(s, endOfDay) {
    var d = s instanceof Date ? s : parseDateTime(s, endOfDay);
    if (!d) return "";
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  function formatSlash(s) { return String(s || "").replace(/-/g, "/"); }
  function normalizeStatus(s) { return s === "정산완료" ? "정산 완료" : s === "정산보류" ? "정산 보류" : s; }
  function statusBadge(s) {
    s = normalizeStatus(s);
    if (s === "정산 필요") return A.badge(s, "admin-badge--sett-needed");
    if (s === "정산 보류") return A.badge(s, "admin-badge--sett-hold");
    return A.settlementBadge(s);
  }
  function parseDay(s) {
    return parseDateTime(s, false);
  }
  function dday(s) {
    var d = parseDay(s);
    if (!d) return "—";
    var base = new Date(today + "T00:00:00");
    var diff = Math.round((d - base) / 86400000);
    return diff === 0 ? "D-day" : diff > 0 ? "D-" + diff : "D+" + Math.abs(diff);
  }
  function inRange(date, from, to) {
    var d = parseDateTime(date, false);
    if (!d) return true;
    var fromDate = parseDateTime(from, false);
    var toDate = parseDateTime(to, true);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  }
  /* 일정산·주정산(월~일)·월정산 등 고정 정산 구간의 시작/종료를 계산.
     지급완료 처리는 이 고정 구간에서만 허용한다 (자유 날짜 조회와 분리). */
  function periodBounds(unit, refDateStr) {
    if (!unit) return null;
    var ref = parseDateTime(refDateStr, false) || parseDateTime(today, false);
    var start, end;
    if (unit === "일별") {
      start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0);
      end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59);
    } else if (unit === "주별") {
      var mondayOffset = (ref.getDay() + 6) % 7;
      var monday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - mondayOffset);
      start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0);
      end = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59);
    } else if (unit === "월별") {
      start = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0);
      end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59);
    } else {
      return null;
    }
    return { start: start, end: end };
  }
  function cycleLabel(unit, bounds) {
    if (!unit || !bounds) return "정산 회차를 선택해주세요.";
    return unit + " 회차 · " + dateTimeInputValue(bounds.start, false).replace("T", " ") + " ~ " + dateTimeInputValue(bounds.end, true).replace("T", " ");
  }
  function currentCycleBounds() {
    var unitSel = byId("fTimeUnit");
    var baseInput = byId("settlementCycleBase");
    return unitSel ? periodBounds(unitSel.value, baseInput ? baseInput.value : today) : null;
  }
  function initSettlementCycle() {
    var filter = document.querySelector(".settlement-filter-line");
    var unitSel = byId("fTimeUnit");
    var fromInput = byId("fFrom");
    var toInput = byId("fTo");
    if (!filter || !unitSel || !fromInput || !toInput) return null;
    Array.prototype.slice.call(unitSel.options).forEach(function (option) {
      if (!option.value) option.remove();
    });
    unitSel.value = unitSel.value || "일별";
    filter.parentNode.insertBefore(document.createElement("div"), filter);
    var panel = filter.previousSibling;
    panel.className = "settlement-cycle-panel";
    panel.innerHTML =
      '<div class="settlement-cycle-panel__head"><div><div class="settlement-cycle-panel__title">정산 회차</div><div class="settlement-cycle-panel__desc">지급완료는 고정된 회차 범위에서만 처리됩니다.</div></div><button type="button" class="admin-btn admin-btn--primary admin-btn--sm" id="cycleSettleBtn">지급완료 처리</button></div>' +
      '<div class="settlement-cycle-panel__controls"><label>정산 유형</label><span id="settlementCycleUnitSlot"></span><label>기준일</label><input type="date" id="settlementCycleBase" value="' + today + '" /><span class="settlement-cycle-panel__range" id="settlementCycleRange"></span></div>';
    byId("settlementCycleUnitSlot").appendChild(unitSel);
    function updateCycle() {
      var bounds = currentCycleBounds();
      byId("settlementCycleRange").textContent = cycleLabel(unitSel.value, bounds);
    }
    unitSel.addEventListener("change", updateCycle);
    byId("settlementCycleBase").addEventListener("change", updateCycle);
    byId("cycleSettleBtn").addEventListener("click", function () {
      var checked = document.querySelectorAll(".row-check:checked,.sale-check:checked").length;
      if (!checked) A.showToast("정산 처리할 항목을 먼저 선택해주세요.");
      else byId("bulkStatusBtn").click();
    });
    updateCycle();
    return updateCycle;
  }
  function makeModal() {
    var el = byId("settlementModal");
    if (el) return el;
    document.body.insertAdjacentHTML("beforeend",
      '<div class="admin-modal" id="settlementModal">' +
        '<div class="admin-modal__overlay" data-settlement-close></div>' +
        '<div class="admin-modal__box admin-modal__box--lg">' +
          '<div class="admin-modal__header"><span class="admin-modal__title" id="settlementModalTitle"></span>' +
          '<button type="button" class="admin-modal__close admin-btn admin-btn--icon" data-settlement-close>×</button></div>' +
          '<div id="settlementModalBody"></div>' +
          '<div class="admin-modal__footer" id="settlementModalFooter"></div>' +
        '</div>' +
      '</div>');
    document.querySelectorAll("[data-settlement-close]").forEach(function (btn) {
      btn.addEventListener("click", closeModal);
    });
    return byId("settlementModal");
  }
  function openModal(title, body, footer) {
    makeModal();
    byId("settlementModalTitle").textContent = title;
    byId("settlementModalBody").innerHTML = body;
    byId("settlementModalFooter").innerHTML = footer || '<button type="button" class="admin-btn admin-btn--outline" data-settlement-close>닫기</button>';
    byId("settlementModal").classList.add("is-open");
    A.setBodyLocked(true);
    byId("settlementModalFooter").querySelectorAll("[data-settlement-close]").forEach(function (btn) { btn.addEventListener("click", closeModal); });
  }
  function closeModal() {
    var el = byId("settlementModal");
    if (el) el.classList.remove("is-open");
    A.setBodyLocked(false);
  }

  var configs = {
    branch: { title: "지사 정산", section: "지사별 정산", nameCol: "명칭", detailTitle: "판매 내역", detailName: "지사명", filePrefix: "지사정산", detailPrefix: "지사", rows: [
      { id:"branch-01", name:"지사_01", fee:7, sales:100000, count:17, amount:7000, status:"정산 완료", dueDate:"2026-07-07" },
      { id:"branch-02", name:"지사_02", fee:5, sales:324983, count:76, amount:16249, status:"정산 필요", dueDate:"2026-07-10" },
      { id:"branch-03", name:"지사_03", fee:3, sales:873093, count:43, amount:26193, status:"정산 필요", dueDate:"2026-07-14" },
      { id:"branch-04", name:"지사_04", fee:6, sales:98000, count:9, amount:5880, status:"정산중", dueDate:"2026-07-04" },
      { id:"branch-05", name:"지사_05", fee:4, sales:153400, count:12, amount:6136, status:"정산대기", dueDate:"2026-07-08" },
      { id:"branch-06", name:"지사_06", fee:5, sales:88000, count:8, amount:4400, status:"정산 보류", dueDate:"2026-07-06" },
      { id:"branch-07", name:"지사_07", fee:7, sales:210000, count:19, amount:14700, status:"정산 완료", dueDate:"2026-07-07" },
      { id:"branch-08", name:"지사_08", fee:5, sales:56000, count:6, amount:2800, status:"정산 필요", dueDate:"2026-08-06" },
      { id:"branch-09", name:"지사_09", fee:4, sales:45000, count:5, amount:1800, status:"정산대기", dueDate:"2026-11-04" },
      { id:"branch-10", name:"지사_10", fee:6, sales:67000, count:7, amount:4020, status:"정산중", dueDate:"2026-07-07" },
      { id:"branch-11", name:"지사_11", fee:3, sales:122000, count:11, amount:3660, status:"정산 필요", dueDate:"2026-07-08" },
      { id:"branch-12", name:"지사_12", fee:5, sales:91000, count:9, amount:4550, status:"정산 완료", dueDate:"2026-07-06" }
    ]},
    distributor: { title:"총판 정산", section:"총판별 정산", nameCol:"총판명", detailTitle:"총판 판매 내역", detailName:"총판명", filePrefix:"총판정산", detailPrefix:"총판", rows: [] },
    sales: { title:"영업 정산", section:"영업별 정산", nameCol:"영업명", detailTitle:"영업 판매 내역", detailName:"영업명", filePrefix:"영업정산", detailPrefix:"영업", rows: [] },
    brand: { title:"대리점 정산", section:"대리점별 정산", nameCol:"대리점명", detailTitle:"대리점 판매 내역", detailName:"대리점명", filePrefix:"대리점정산", detailPrefix:"대리점", rows: [] }
  };
  configs.distributor.rows = makeRows("dist", "총판_", 10, 5, true);
  configs.sales.rows = makeRows("sales", "영업_", 10, 4, true).map(function (r, i) { r.org = i % 2 ? "총판_02" : "지사_01"; return r; });
  configs.brand.rows = makeRows("brand", "대리점_", 12, 6, true).map(function (r, i) { r.client = i % 2 ? "SA 생성" : "CA 직접 운영"; r.branch = "지사_" + String(i % 4 + 1).padStart(2, "0"); return r; });

  function makeRows(prefix, label, count, baseFee) {
    var statusCycle = ["정산 필요", "정산대기", "정산중", "정산 완료", "정산 보류"];
    var dueCycle = ["2026-11-04", "2026-08-06", "2026-07-14", "2026-07-10", "2026-07-07", "2026-07-06"];
    var rows = [];
    for (var i = 1; i <= count; i++) {
      var sales = 80000 + i * 43120;
      var fee = baseFee + (i % 4);
      rows.push({ id:prefix + "-" + String(i).padStart(2, "0"), name:label + String(i).padStart(2, "0"), fee:fee, sales:sales, count:8 + i * 3, amount:whole(sales * fee / 100), status:statusCycle[i % statusCycle.length], dueDate:dueCycle[i % dueCycle.length] });
    }
    return rows;
  }

  function makeSalesRows(owner) {
    var products = [
      "[휴가필수]장보기 부터 여행까지 비스카 풀세트",
      "음식물 쓰레기 스트레스 줄이는, 보랄 음식물 처리기",
      "여름 시즌 한정 린넨 셔츠와 와이드 팬츠",
      "캠핑 필수품 접이식 테이블 패키지"
    ];
    var sellers = ["대리점_01", "대리점_02", "대리점_03", "대리점_04"];
    var statuses = owner && owner.id === "branch-01" ? ["정산 완료"] : STATUSES;
    var rows = [];
    for (var i = 0; i < 24; i++) {
      var amount = i % 2 ? 232100 : 12320;
      var status = statuses[i % statuses.length];
      rows.push({
        id:"sale-" + (i + 1), seller:sellers[i % sellers.length], brand:owner ? owner.name : "대리점_01",
        product:products[i % products.length], orderNo:"20260623897448210",
        soldAt:i % 2 ? "2026/07/07 12:10" : "2026/07/07 14:20",
        buyer:i % 2 ? "김링크" : "이허브", payMethod:i % 2 ? "카드" : "간편결제",
        sales:amount, cancel:i % 5 === 0 ? 1000 : 0, fee:owner ? owner.fee : 7,
        settlement:whole((amount - (i % 5 === 0 ? 1000 : 0)) * (owner ? owner.fee : 7) / 100),
        status:status, processedAt:status === "정산 완료" ? "2026/07/07 18:00" : "—",
        memo:"mock 거래 데이터"
      });
    }
    return rows;
  }

  function summarize(rows, override) {
    if (override) return override;
    var total = rows.length;
    var done = rows.filter(function (r) { return normalizeStatus(r.status) === "정산 완료"; });
    var need = rows.filter(function (r) { return normalizeStatus(r.status) !== "정산 완료"; });
    return {
      totalCount: total, doneCount: done.length, needCount: need.length,
      totalAmount: rows.reduce(function (s, r) { return s + Number(r.amount || r.settlement || 0); }, 0),
      doneAmount: done.reduce(function (s, r) { return s + Number(r.amount || r.settlement || 0); }, 0),
      needAmount: need.reduce(function (s, r) { return s + Number(r.amount || r.settlement || 0); }, 0)
    };
  }
  function renderKpi(summary) {
    byId("settlementKpiGrid").innerHTML = [
      ["총 정산 수", num(summary.totalCount), "건"],
      ["정산 완료 건", num(summary.doneCount), "건"],
      ["정산 필요 건", num(summary.needCount), "건"],
      ["정산 총액", num(summary.totalAmount), "원"],
      ["정산 완료 금액", num(summary.doneAmount), "원"],
      ["정산 필요 금액", num(summary.needAmount), "원"]
    ].map(function (k) {
      return '<div class="settlement-kpi"><div class="settlement-kpi__label">' + k[0] + '</div><div class="settlement-kpi__value">' + k[1] + '<span class="settlement-kpi__unit">' + k[2] + '</span></div></div>';
    }).join("");
  }
  function csvDate() { return today.replace(/-/g, ""); }
  function rowCsv(rows, cfg) {
    A.downloadCSV(cfg.filePrefix + "_" + csvDate() + ".csv", [cfg.nameCol, "수수료율", "총 판매금액", "정산 건수", "정산 금액", "정산 상태", "정산 예정일", "D-day"], rows.map(function (r) {
      return [r.name, r.fee + "%", r.sales, r.count, r.amount, r.status, r.dueDate, dday(r.dueDate)];
    }));
  }
  function saleCsv(rows, owner) {
    A.downloadCSV((owner.name + "_정산상세_" + csvDate() + ".csv").replace(/\s/g, ""), ["판매처", "판매 상품", "주문번호", "판매 일자", "판매금액", "수수료", "정산 금액", "정산 상태"], rows.map(function (r) {
      return [r.seller, r.product, r.orderNo, r.soldAt, r.sales, r.fee + "%", r.settlement, r.status];
    }));
  }

  function initList(type) {
    var cfg = configs[type];
    var rows = cfg.rows.slice();
    var filtered = rows.slice();
    var selected = {};
    var page = 1;
    var size = 10;
    var sortKey = "";
    var sortDir = 1;
    if (byId("pageTitle")) byId("pageTitle").textContent = cfg.title;
    if (byId("tableSectionTitle")) byId("tableSectionTitle").textContent = cfg.section;
    if (byId("nameHeader")) byId("nameHeader").textContent = cfg.nameCol;
    var updateCycle = initSettlementCycle();
    render();

    function applyFilter() {
      var name = byId("fName").value.trim();
      var status = byId("fStatus").value;
      var from = byId("fFrom").value;
      var to = byId("fTo").value;
      filtered = rows.filter(function (r) {
        if (name && r.name.indexOf(name) < 0) return false;
        if (status && normalizeStatus(r.status) !== status) return false;
        if (!inRange(r.dueDate, from, to)) return false;
        return true;
      });
      page = 1;
      render();
    }
    function render() {
      var sorted = filtered.slice();
      if (sortKey) sorted.sort(function (a, b) { return (a[sortKey] > b[sortKey] ? 1 : -1) * sortDir; });
      var slice = sorted.slice((page - 1) * size, page * size);
      var body = byId("settlementTableBody");
      body.innerHTML = slice.map(function (r) {
        var extra = type === "sales" ? '<td class="text-left">' + (r.org || "—") + '</td>' : type === "brand" ? '<td class="text-left">' + r.client + '</td><td class="text-left">' + r.branch + '</td>' : "";
        var done = normalizeStatus(r.status) === "정산 완료";
        return '<tr><td class="text-center"><input type="checkbox" class="row-check" data-id="' + r.id + '" ' + (selected[r.id] && !done ? "checked" : "") + (done ? " disabled" : "") + ' /></td>' +
          '<td class="text-left nowrap">' + r.name + '</td>' + extra +
          '<td class="text-center">' + r.fee + '%</td><td class="text-right">' + money(r.sales) + '</td><td class="text-center">' + r.count + '건</td>' +
          '<td class="text-right">' + num(r.amount) + '원</td><td class="text-center">' + statusBadge(r.status) + '</td>' +
          '<td class="text-center"><a class="admin-btn admin-btn--outline admin-btn--sm" href="ca-014-settlement-detail.html?type=' + type + '&id=' + r.id + '">상세 내역 보기</a></td></tr>';
      }).join("");
      byId("emptyState").style.display = slice.length ? "none" : "";
      renderKpi(type === "branch" && filtered.length === rows.length ? { totalCount:136, doneCount:17, needCount:119, totalAmount:1686309, doneAmount:294002, needAmount:1392307 } : summarize(filtered));
      A.renderPagination(byId("paginationWrap"), filtered.length, page, size, function (p) { page = p; render(); });
    }
    byId("searchBtn").addEventListener("click", applyFilter);
    byId("resetBtn").addEventListener("click", function () {
      ["fFrom", "fTo", "fName"].forEach(function (id) { byId(id).value = ""; });
      byId("fStatus").value = "";
      if (updateCycle) updateCycle();
      filtered = rows.slice(); page = 1; render();
    });
    byId("selectAllBtn").addEventListener("click", function () {
      filtered.forEach(function (r) { if (normalizeStatus(r.status) !== "정산 완료") selected[r.id] = true; });
      render();
    });
    byId("settlementTableBody").addEventListener("change", function (e) {
      if (e.target.classList.contains("row-check")) selected[e.target.dataset.id] = e.target.checked;
    });
    byId("settlementTableBody").addEventListener("click", function (e) {
      var sort = e.target.closest("[data-sort]");
      if (sort) { sortDir = sortKey === sort.dataset.sort ? -sortDir : 1; sortKey = sort.dataset.sort; render(); }
    });
    document.querySelectorAll("[data-sort]").forEach(function (btn) {
      btn.addEventListener("click", function () { sortDir = sortKey === btn.dataset.sort ? -sortDir : 1; sortKey = btn.dataset.sort; render(); });
    });
    byId("pageSize").addEventListener("change", function () { size = Number(this.value); page = 1; render(); });
    byId("downloadBtn").addEventListener("click", function () {
      var picked = rows.filter(function (r) { return selected[r.id] && normalizeStatus(r.status) !== "정산 완료"; });
      rowCsv(picked.length ? picked : filtered, cfg);
    });
    byId("bulkStatusBtn").addEventListener("click", function () {
      var picked = rows.filter(function (r) { return selected[r.id] && normalizeStatus(r.status) !== "정산 완료"; });
      if (!picked.length) { A.showToast("선택한 항목이 없습니다."); return; }
      openStatusModal(picked, render);
    });
  }

  /* 정산 완료(지급완료) 처리는 일정산·주정산·월정산 등 고정 구간(fTimeUnit)이
     선택된 상태에서만 허용한다. 자유 날짜 조회 상태에서는 조회만 가능하고
     지급완료 처리는 막는다 — 임의 구간으로 지급 처리되어 정산이 꼬이는 것을 방지. */
  function openStatusModal(targets, callback) {
    var unitSel = byId("fTimeUnit");
    var lockedUnit = unitSel ? unitSel.value : "";
    var bounds = currentCycleBounds();
    var statuses = ["정산 필요", "정산대기", "정산중", "정산 완료", "정산 보류"];
    var optionsHtml = statuses.map(function (s) {
      var disabled = (s === "정산 완료" && !lockedUnit) ? " disabled" : "";
      return "<option" + disabled + ">" + s + "</option>";
    }).join("");
    var hint = lockedUnit
      ? "고정된 " + cycleLabel(lockedUnit, bounds) + " 기준으로 정산 완료 처리됩니다."
      : "정산 완료(지급완료) 처리는 상단 정산 회차에서 일별·주별·월별 등 고정 구간을 선택한 뒤에만 가능합니다.";
    var alreadyDoneCount = targets.filter(function (r) { return normalizeStatus(r.status) === "정산 완료"; }).length;
    var warnHtml = alreadyDoneCount
      ? '<div class="admin-field-hint">선택한 ' + targets.length + '건 중 ' + alreadyDoneCount + '건은 이미 정산 완료 상태입니다. 다시 처리하면 중복 정산이 될 수 있으니 확인 후 진행해주세요.</div>'
      : "";
    openModal("선택항목 상태 변경", '<div class="admin-field"><label>변경 상태</label><select id="bulkStatusSelect">' + optionsHtml + '</select><div class="admin-field-hint">' + hint + '</div>' + warnHtml + '</div>',
      '<button type="button" class="admin-btn admin-btn--outline" data-settlement-close>취소</button><button type="button" class="admin-btn admin-btn--primary" id="bulkStatusSave">변경</button>');
    if (lockedUnit) byId("bulkStatusSelect").value = "정산 완료";
    byId("bulkStatusSave").addEventListener("click", function () {
      var next = byId("bulkStatusSelect").value;
      if (next === "정산 완료" && !lockedUnit) {
        A.showToast("정산 완료 처리는 고정된 정산 구간에서만 가능합니다.");
        return;
      }
      targets.forEach(function (r) { r.status = next; });
      closeModal();
      callback();
      A.showToast("상태가 변경되었습니다.");
    });
  }

  function initDetail() {
    var type = query("type") || "branch";
    var cfg = configs[type] || configs.branch;
    var owner = cfg.rows.find(function (r) { return r.id === (query("id") || "branch-01"); }) || cfg.rows[0];
    var rows = makeSalesRows(owner);
    var filtered = rows.slice();
    var selected = {};
    if (byId("detailName")) byId("detailName").textContent = owner.name;
    if (byId("detailFee")) byId("detailFee").textContent = "수수료율 " + owner.fee + "%";
    if (byId("detailTableTitle")) byId("detailTableTitle").textContent = cfg.detailTitle;
    var updateCycle = initSettlementCycle();
    render();

    function applyFilter() {
      var from = byId("fFrom").value;
      var to = byId("fTo").value;
      var status = byId("fStatus").value;
      filtered = rows.filter(function (r) {
        if (status && normalizeStatus(r.status) !== status) return false;
        if (!inRange(r.soldAt, from, to)) return false;
        return true;
      });
      render();
    }
    function render() {
      renderKpi(summarize(filtered, owner.id === "branch-01" && filtered.length === rows.length ? { totalCount:17, doneCount:17, needCount:0, totalAmount:7000, doneAmount:7000, needAmount:0 } : null));
      byId("salesTableBody").innerHTML = filtered.map(function (r) {
        var done = normalizeStatus(r.status) === "정산 완료";
        return '<tr><td class="text-center"><input type="checkbox" class="sale-check" data-id="' + r.id + '" ' + (selected[r.id] && !done ? "checked" : "") + (done ? " disabled" : "") + ' /></td>' +
          '<td class="text-left nowrap">' + r.seller + '</td><td class="text-left product-cell" title="' + r.product + '">' + r.product + '</td>' +
          '<td class="text-center nowrap">' + r.orderNo + '</td><td class="text-center nowrap">' + r.soldAt + '</td>' +
          '<td class="text-right">' + money(r.sales) + '</td><td class="text-center">' + r.fee + '%</td><td class="text-right">' + num(r.settlement) + '원</td>' +
          '<td class="text-center">' + statusBadge(r.status) + '</td><td class="text-center"><button type="button" class="admin-btn admin-btn--outline admin-btn--sm detail-sale-btn" data-id="' + r.id + '">상세보기</button></td></tr>';
      }).join("");
      byId("emptyState").style.display = filtered.length ? "none" : "";
    }
    byId("searchBtn").addEventListener("click", applyFilter);
    byId("resetBtn").addEventListener("click", function () { byId("fFrom").value = ""; byId("fTo").value = ""; byId("fStatus").value = ""; if (updateCycle) updateCycle(); filtered = rows.slice(); render(); });
    byId("selectAllBtn").addEventListener("click", function () { filtered.forEach(function (r) { if (normalizeStatus(r.status) !== "정산 완료") selected[r.id] = true; }); render(); });
    byId("downloadBtn").addEventListener("click", function () { saleCsv(filtered, owner); });
    byId("bulkStatusBtn").addEventListener("click", function () {
      var picked = rows.filter(function (r) { return selected[r.id] && normalizeStatus(r.status) !== "정산 완료"; });
      if (!picked.length) { A.showToast("선택한 항목이 없습니다."); return; }
      openStatusModal(picked, render);
    });
    byId("salesTableBody").addEventListener("change", function (e) {
      if (e.target.classList.contains("sale-check")) selected[e.target.dataset.id] = e.target.checked;
    });
    byId("salesTableBody").addEventListener("click", function (e) {
      var btn = e.target.closest(".detail-sale-btn");
      if (!btn) return;
      var r = rows.find(function (row) { return row.id === btn.dataset.id; });
      openModal("거래 상세", infoRows([
        ["판매처", r.seller], ["대리점", r.brand], ["상품명", r.product], ["주문번호", r.orderNo], ["구매자", r.buyer],
        ["결제수단", r.payMethod], ["판매일시", r.soldAt], ["판매금액", money(r.sales)], ["취소·환불금액", money(r.cancel)],
        ["적용 수수료율", r.fee + "%"], ["수수료", money((r.sales - r.cancel) * r.fee / 100)],
        ["정산금액", num(r.settlement) + "원"], ["정산상태", statusBadge(r.status)], ["정산 처리일", r.processedAt], ["관리자 메모", r.memo]
      ]));
    });
    byId("editInfoBtn").addEventListener("click", function () {
      openModal("정보 수정", '<div class="admin-field"><label>' + cfg.detailName + '</label><input type="text" value="' + owner.name + '" /></div><div class="admin-field"><label>수수료율</label><input type="number" value="' + owner.fee + '" /></div><p class="admin-field-hint">기존 조직 관리 정책 범위 내에서 수정됩니다.</p>');
    });
  }

  function infoRows(rows) {
    return '<div class="admin-info-grid">' + rows.map(function (r) {
      return '<div class="admin-info-row"><span class="admin-info-label">' + r[0] + '</span><span class="admin-info-value">' + r[1] + '</span></div>';
    }).join("") + '</div>';
  }

  var reserveRows = makeReserveRows();
  function makeReserveRows() {
    var types = ["지사", "총판", "영업", "대리점"];
    var statuses = ["적용 예정", "적용 중", "차감 예정", "차감 완료", "반환 완료", "해제"];
    var dues = ["2026-11-04", "2026-08-06", "2026-07-14", "2026-07-10", "2026-07-07", "2026-07-06"];
    var rows = [];
    for (var i = 1; i <= 12; i++) {
      var amount = 300000 + i * 85000;
      rows.push({ no:"RSV-2026-" + String(i).padStart(3, "0"), targetType:types[i % types.length], targetName:types[i % types.length] + "_" + String(i).padStart(2, "0"), org:i % 2 ? "지사_01" : "총판_02", method:i % 2 ? "정률" : "정액", value:i % 2 ? (i + 2) + "%" : money(amount), initial:amount, current:Math.round(amount * (0.8 + (i % 3) * 0.05)), applyDate:"2026-07-" + String(i).padStart(2, "0"), dueDate:dues[i % dues.length], status:statuses[i % statuses.length], reason:"거래 안정성 확보", memo:"mock 유보금" });
    }
    return rows;
  }
  function initReserve() {
    var filtered = reserveRows.slice();
    renderReserve();
    function renderReserve() {
      var summary = {
        totalCount: filtered.length,
        doneCount: filtered.filter(function (r) { return r.status === "적용 중"; }).length,
        needCount: filtered.filter(function (r) { return r.status === "차감 예정"; }).length,
        totalAmount: filtered.reduce(function (s, r) { return s + r.initial; }, 0),
        doneAmount: filtered.reduce(function (s, r) { return s + r.current; }, 0),
        needAmount: filtered.filter(function (r) { return r.status === "차감 예정"; }).reduce(function (s, r) { return s + r.current; }, 0)
      };
      byId("settlementKpiGrid").innerHTML = [
        ["전체 유보금 건수", num(summary.totalCount), "건"], ["유보금 적용 건", num(summary.doneCount), "건"], ["유보금 차감 예정 건", num(summary.needCount), "건"],
        ["전체 유보금액", num(summary.totalAmount), "원"], ["현재 보유 유보금", num(summary.doneAmount), "원"], ["차감 예정 금액", num(summary.needAmount), "원"]
      ].map(function (k) { return '<div class="settlement-kpi"><div class="settlement-kpi__label">' + k[0] + '</div><div class="settlement-kpi__value">' + k[1] + '<span class="settlement-kpi__unit">' + k[2] + '</span></div></div>'; }).join("");
      byId("reserveTableBody").innerHTML = filtered.map(function (r) {
        return '<tr><td class="text-center"><input type="checkbox" /></td><td>' + r.no + '</td><td class="text-center">' + r.targetType + '</td><td class="text-left">' + r.targetName + '</td><td class="text-left">' + r.org + '</td><td class="text-center">' + r.method + '</td><td class="text-center">' + r.value + '</td><td class="text-right">' + money(r.initial) + '</td><td class="text-right">' + money(r.current) + '</td><td class="text-center">' + A.formatDate(r.applyDate) + '</td><td class="text-center">' + A.formatDate(r.dueDate) + '</td><td class="text-center">' + dday(r.dueDate) + '</td><td class="text-center">' + A.badge(r.status, "admin-badge--sett-confirmed") + '</td><td class="text-center"><button type="button" class="admin-btn admin-btn--outline admin-btn--sm reserve-detail-btn" data-no="' + r.no + '">상세 내역</button></td></tr>';
      }).join("");
    }
    byId("searchBtn").addEventListener("click", function () {
      var type = byId("fTargetType").value, name = byId("fTargetName").value.trim(), status = byId("fReserveStatus").value, method = byId("fMethod").value;
      var applyFrom = byId("fApplyFrom").value, applyTo = byId("fApplyTo").value, dueDate = byId("fDueDate").value;
      filtered = reserveRows.filter(function (r) {
        if (type && r.targetType !== type) return false;
        if (name && r.targetName.indexOf(name) < 0) return false;
        if (status && r.status !== status) return false;
        if (method && r.method !== method) return false;
        if (!inRange(r.applyDate, applyFrom, applyTo)) return false;
        if (dueDate && !inRange(r.dueDate, dueDate, dueDate)) return false;
        return true;
      });
      renderReserve();
    });
    byId("resetBtn").addEventListener("click", function () { filtered = reserveRows.slice(); document.querySelectorAll(".reserve-filter input,.reserve-filter select").forEach(function (el) { el.value = ""; }); renderReserve(); });
    byId("downloadBtn").addEventListener("click", function () {
      A.downloadCSV("유보금정산_" + csvDate() + ".csv", ["유보금 번호", "대상 유형", "대상명", "연결 조직", "설정 방식", "설정값", "최초 유보금", "현재 유보금", "적용일", "차감 예정일", "D-day", "상태"], filtered.map(function (r) { return [r.no, r.targetType, r.targetName, r.org, r.method, r.value, r.initial, r.current, r.applyDate, r.dueDate, dday(r.dueDate), r.status]; }));
    });
    byId("reserveAddBtn").addEventListener("click", openReserveAdd);
    byId("reserveTableBody").addEventListener("click", function (e) {
      var btn = e.target.closest(".reserve-detail-btn");
      if (!btn) return;
      var r = reserveRows.find(function (row) { return row.no === btn.dataset.no; });
      openModal("유보금 상세", infoRows([["유보금 번호", r.no], ["대상 유형", r.targetType], ["대상명", r.targetName], ["연결 조직", r.org], ["설정 방식", r.method], ["설정값", r.value], ["최초 유보금", money(r.initial)], ["현재 유보금", money(r.current)], ["적용일", A.formatDate(r.applyDate)], ["차감 예정일", A.formatDate(r.dueDate)], ["D-day", dday(r.dueDate)], ["현재 상태", r.status], ["설정 사유", r.reason], ["관리자 메모", r.memo]]) + '<div class="admin-form-section" style="margin-top:16px;"><div class="admin-form-section__header"><span class="admin-form-section__title">내역</span></div><div class="admin-form-section__body">유보금 적립 · 차감 · 반환 · 설정 변경 이력 mock data</div></div>',
        '<button type="button" class="admin-btn admin-btn--outline" data-settlement-close>닫기</button><button type="button" class="admin-btn admin-btn--outline" id="reserveDeductBtn">유보금 차감</button><button type="button" class="admin-btn admin-btn--danger" id="reserveReleaseBtn">유보금 해제</button>');
    });
    function openReserveAdd() {
      openModal("유보금 등록", '<div class="admin-fields-row"><div class="admin-field"><label>대상 유형</label><select id="newTargetType"><option>지사</option><option>총판</option><option>영업</option><option>대리점</option></select></div><div class="admin-field"><label>대상명</label><input id="newTargetName" value="지사_13" /></div></div><div class="admin-field"><label>연결 조직</label><input id="newOrg" value="총판_01" /></div><div class="admin-fields-row"><div class="admin-field"><label>설정 방식</label><select id="newMethod"><option>정액</option><option>정률</option></select></div><div class="admin-field"><label>유보금 금액 또는 비율</label><input id="newValue" value="300000" /></div></div><div class="admin-fields-row"><div class="admin-field"><label>적용 시작일</label><input type="datetime-local" id="newApply" value="' + dateTimeInputValue(today, false) + '" /></div><div class="admin-field"><label>D-day</label><select id="newDday"><option value="30">D-30</option><option value="60">D-60</option><option value="90">D-90</option><option value="120">D-120</option></select></div></div><div class="admin-field"><label>차감 예정일</label><input type="datetime-local" id="newDue" value="' + dateTimeInputValue("2026-08-06", true) + '" /></div><div class="admin-field"><label>설정 사유</label><textarea id="newReason"></textarea></div><div class="admin-field"><label>관리자 메모</label><textarea id="newMemo"></textarea></div>',
        '<button type="button" class="admin-btn admin-btn--outline" data-settlement-close>취소</button><button type="button" class="admin-btn admin-btn--primary" id="reserveSaveBtn">저장</button>');
      byId("newDday").addEventListener("change", function () {
        var d = parseDateTime(byId("newApply").value, false);
        d.setDate(d.getDate() + Number(this.value));
        byId("newDue").value = dateTimeInputValue(d, true);
      });
      byId("reserveSaveBtn").addEventListener("click", function () {
        var amount = Number(byId("newValue").value.replace(/[^0-9.]/g, "")) || 0;
        reserveRows.unshift({ no:"RSV-2026-" + String(reserveRows.length + 1).padStart(3, "0"), targetType:byId("newTargetType").value, targetName:byId("newTargetName").value, org:byId("newOrg").value, method:byId("newMethod").value, value:byId("newMethod").value === "정액" ? money(amount) : byId("newValue").value + "%", initial:amount, current:amount, applyDate:byId("newApply").value, dueDate:byId("newDue").value, status:"적용 예정", reason:byId("newReason").value, memo:byId("newMemo").value });
        filtered = reserveRows.slice();
        closeModal();
        renderReserve();
        A.showToast("유보금이 등록되었습니다.");
      });
    }
  }

  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });
  document.addEventListener("DOMContentLoaded", function () {
    var mode = document.body.dataset.settlementMode;
    if (mode === "list") initList(document.body.dataset.settlementType || "branch");
    if (mode === "detail") initDetail();
    if (mode === "reserve") initReserve();
  });
})();
