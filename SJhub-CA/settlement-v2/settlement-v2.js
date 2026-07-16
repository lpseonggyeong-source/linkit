/* ============================================================
   SJ Hub CA 정산 개선판 (settlement-v2) — v2.4
   클라이언트 레퍼런스 테이블(2026-07-15) 기준으로 데이터 값 정렬.

   [v2.4] 테이블 데이터·공식 확정 (클라이언트 레퍼런스 테이블)
   - 4개 정산 페이지 공통 컬럼:
     명칭 | (소속/출처) | 수수료율 | 총 판매금액 | 정산 건수 | 수수료 | 정산 예정 금액 | 상세
   - 공식: 수수료 = round(총판매금액 × 수수료율)
           정산 예정 금액 = 총판매금액 − 수수료
   - 데이터 값은 클라이언트 레퍼런스(지사)와 운영 스크린샷(총판·영업·대리점) 시리즈 사용
   - 각 레벨의 수수료는 자기율로 독립 계산 (차등 분배 모델 폐기 — 클라이언트 수치 확정)
   - 정산 상태 컬럼 없음(v2.3), 상태 워크플로우(변경·지급완료·필터·이력)는 유지
   - 상세 내역은 목록 집계와 정확히 일치하도록 분해 생성 (합계 = 총판매금액, 수수료 합 = 수수료)

   [v2.1~v2.3에서 유지되는 것]
   - 유보금: 결제 원금 기준 자동 적립(수동 등록 없음) · 한도 도달 시 적립 중단+인출 알림 ·
     90일+ 보유 시 사용등록 기록 · 사용(사유 필수) — 대리점 지급 시 추가 차감은
     유보금·예치금 관리에서 처리 (목록 컬럼에는 미표시, 레퍼런스 레이아웃 준수)
   - 예치금: 등록/차감 수동, 사유 필수, 잔액 검증
   - 원장 삭제 금지 → 역분개(정정)
   - 상태 전이표: 필요→대기→중→완료 / 어디서든→보류 / 완료→중(완료 취소, 사유 필수)
   - 지급완료는 '정산중' 상태만, 기준일 단위 기록
   ============================================================ */
(function () {
  "use strict";
  var A = window.AdminShared;
  var TODAY = "2026-07-07";

  /* ───────── 1. 정산 집계 데이터 (클라이언트 레퍼런스 값) ───────── */
  function lcg(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function fee(sales, rate) { return Math.round(sales * rate / 100); }
  function addDays(dateStr, delta) {
    var p = dateStr.split("-").map(Number);
    var d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().slice(0, 10);
  }
  /* 대상별 정산 주기(D+N) — 행 인덱스(0~9)에 순환 배분, 4개 페이지 공통 */
  var CYCLE_DAYS = [7, 3, 15, 1, 7, 3, 15, 1, 7, 3];

  /* 지사 — 클라이언트 레퍼런스 테이블 그대로 */
  var BRANCH_DATA = [
    [7, 100000, 17], [5, 324983, 76], [3, 873093, 43], [6, 98000, 9], [4, 153400, 12],
    [5, 88000, 8], [7, 210000, 19], [5, 56000, 6], [4, 45000, 5], [6, 67000, 7]
  ];
  /* 총판·영업·대리점 — 운영 스크린샷 시리즈: sales = 80,000 + i×43,120 · count = 8 + i×3 */
  var DIST_FEES  = [6, 7, 8, 5, 6, 7, 8, 5, 6, 7];
  var SALES_FEES = [5, 6, 7, 4, 5, 6, 7, 4, 5, 6];
  var BRAND_FEES = [7, 8, 9, 6, 7, 8, 9, 6, 7, 8];
  var BRAND_SOURCES = ["영업 등록", "총판 등록", "지사 등록", "CA 직접 등록", "대리점 직접 신청"];

  function seriesRow(i) { return { sales: 80000 + i * 43120, count: 8 + i * 3 }; }
  function pad2(n) { return String(n).padStart(2, "0"); }

  var BRANCHES = BRANCH_DATA.map(function (d, idx) {
    var i = idx + 1;
    return { id: "br" + pad2(i), name: "지사_" + pad2(i), fee: d[0], sales: d[1], count: d[2], cycleDays: CYCLE_DAYS[idx] };
  });
  var DISTS = DIST_FEES.map(function (f, idx) {
    var i = idx + 1, s = seriesRow(i);
    return { id: "dt" + pad2(i), name: "총판_" + pad2(i), fee: f, sales: s.sales, count: s.count,
             parentName: "지사_" + pad2((idx % 4) + 1), cycleDays: CYCLE_DAYS[idx] };
  });
  var SALESREPS = SALES_FEES.map(function (f, idx) {
    var i = idx + 1, s = seriesRow(i);
    var dist = DISTS[idx % 6];
    return { id: "sl" + pad2(i), name: "영업_" + pad2(i), fee: f, sales: s.sales, count: s.count,
             parentName: dist.name, grandName: dist.parentName, cycleDays: CYCLE_DAYS[idx] };
  });
  var BRANDS = BRAND_FEES.map(function (f, idx) {
    var i = idx + 1, s = seriesRow(i);
    var source = BRAND_SOURCES[idx % BRAND_SOURCES.length];
    var manager = source === "영업 등록" ? "영업_" + pad2((idx % 4) + 1)
                : source === "총판 등록" ? "총판_" + pad2((idx % 3) + 1)
                : source === "지사 등록" ? "지사_" + pad2((idx % 4) + 1)
                : "—"; /* CA 직접 등록 · 대리점 직접 신청 → 관리 조직 없음 */
    return { id: "bd" + pad2(i), name: "대리점_" + pad2(i), fee: f, sales: s.sales, count: s.count,
             source: source, managerName: manager, cycleDays: CYCLE_DAYS[idx] };
  });
  function brandById(id) { for (var i = 0; i < BRANDS.length; i++) if (BRANDS[i].id === id) return BRANDS[i]; return null; }

  /* ───────── 2. 유보금·예치금 (대리점 단위 — v2.1/v2.2 정책 유지) ─────────
     유보금: 결제 원금 기준 rate% 자동 적립(수동 등록 없음), 한도 도달 시 중단+인출 알림.
     mock 적립: 대리점 총판매금액을 7일(07-01~07-07)로 나눈 일매출 기준으로 일별 적립 생성 */
  var RETENTION_CONF = {
    bd01: { rate: 10, limit: 2000000 }, bd02: { rate: 10, limit: 1000000 },
    bd03: { rate: 15, limit: 500000 },  bd04: { rate: 10, limit: 2000000 },
    bd05: { rate: 20, limit: 1200000 }, bd06: { rate: 10, limit: 800000 },
    bd07: { rate: 10, limit: 1000000 }, bd08: { rate: 15, limit: 600000 },
    bd09: { rate: 10, limit: 30000 },   bd10: { rate: 10, limit: 900000 }
  };
  function retConf(id) { return RETENTION_CONF[id] || { rate: 0, limit: 0 }; }

  var RET_LOGS = {
    bd03: [{ at: "2026-03-15 10:00", type: "적립(이월)", amount: 120000, reason: "구 시스템 유보금 이월", by: "system" }],
    bd05: [{ at: "2026-07-03 14:20", type: "사용", amount: -20000, reason: "결제 취소 환불 보전 (주문 202607011000012)", by: "관리자A" }]
  };
  var DEP_LOGS = {
    bd04: [{ at: "2026-06-25 09:00", type: "등록", amount: 5000000, reason: "계약 보증 예치금", by: "관리자A" }],
    bd07: [
      { at: "2026-07-01 11:30", type: "등록", amount: 300000, reason: "프로모션 보증", by: "관리자B" },
      { at: "2026-07-05 16:00", type: "차감", amount: -50000, reason: "취소 건 보전", by: "관리자A" }
    ]
  };
  function logsOf(store, id) { if (!store[id]) store[id] = []; return store[id]; }

  /* 대리점 일매출 분해 (7일, 합계 = 총판매금액) — 유보 적립 산출용 */
  function dailyBases(brand) {
    var rand = lcg(Number(brand.id.replace(/\D/g, "")) * 7919 + 11);
    var remaining = brand.sales, out = [];
    for (var d = 1; d <= 7; d++) {
      var left = 8 - d;
      var amt = d === 7 ? remaining : Math.max(0, Math.round(remaining / left * (0.5 + rand())));
      if (amt > remaining) amt = remaining;
      remaining -= amt;
      out.push({ day: "2026-07-0" + d, base: amt });
    }
    return out;
  }
  /* 유보금 원장: 일별 자동 적립(원금×유보율, 한도 캡) + 수동 이벤트 시간순 재생 */
  function retentionLedger(brandId) {
    var conf = retConf(brandId);
    var b = brandById(brandId);
    var events = [];
    if (b && conf.rate > 0) dailyBases(b).forEach(function (x) {
      if (x.base > 0) events.push({ at: x.day + " 23:59", kind: "auto", base: x.base, day: x.day });
    });
    logsOf(RET_LOGS, brandId).forEach(function (e) { events.push({ at: e.at, kind: "manual", e: e }); });
    events.sort(function (a, b2) { return a.at < b2.at ? -1 : 1; });
    var bal = 0, rows = [];
    events.forEach(function (ev) {
      if (ev.kind === "manual") {
        bal += ev.e.amount;
        rows.push({ at: ev.e.at, type: ev.e.type, amount: ev.e.amount, reason: ev.e.reason, by: ev.e.by, balance: bal, manual: true, ref: ev.e });
      } else {
        var want = Math.round(ev.base * conf.rate / 100);
        var room = Math.max(0, conf.limit - bal);
        var acc = Math.min(want, room);
        if (acc <= 0) return; /* 한도 도달 — 적립 중단 */
        bal += acc;
        rows.push({
          at: ev.at, type: "적립", amount: acc,
          reason: "일매출 " + money(ev.base) + "에 대한 유보금(" + conf.rate + "%, 결제 원금 기준)" + (acc < want ? " — 한도로 부분 적립" : ""),
          by: "자동", balance: bal
        });
      }
    });
    return { rows: rows, balance: bal, conf: conf };
  }
  function daysBetween(a, b) { return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000); }
  function retentionStatus(brandId) {
    var led = retentionLedger(brandId);
    var conf = led.conf;
    var overLimit = conf.limit > 0 && led.balance >= conf.limit;
    var firstAccrual = null, lastUseReg = null;
    led.rows.forEach(function (r) {
      if ((r.type === "적립" || r.type === "적립(이월)") && r.amount > 0 && !firstAccrual) firstAccrual = r.at.slice(0, 10);
      if (r.type === "사용등록") lastUseReg = r.at.slice(0, 10);
    });
    var heldDays = firstAccrual ? daysBetween(firstAccrual, TODAY) : 0;
    var needUseReg = led.balance > 0 && heldDays >= 90 && (!lastUseReg || daysBetween(lastUseReg, TODAY) >= 90);
    return { ledger: led, balance: led.balance, conf: conf, overLimit: overLimit, firstAccrual: firstAccrual, heldDays: heldDays, lastUseReg: lastUseReg, needUseReg: needUseReg };
  }
  function depositBalance(brandId) { return logsOf(DEP_LOGS, brandId).reduce(function (s, e) { return s + e.amount; }, 0); }
  function depositLastAt(brandId) {
    var logs = logsOf(DEP_LOGS, brandId);
    return logs.length ? logs.map(function (e) { return e.at; }).sort().pop() : "—";
  }
  function nowStr() { return TODAY + " " + new Date().toTimeString().slice(0, 5); }

  /* ───────── 3. 정산 로우 파생 ─────────
     수수료 = round(총판매금액 × 수수료율) · 지불해야 할 정산 금액 = 총판매금액 − 수수료
     정산 상태는 거래(건) 단위로 관리 — 상세 페이지에서 조회·변경 */
  function toRow(src, ownerType) {
    var f = fee(src.sales, src.fee);
    return {
      ownerType: ownerType, ownerId: src.id, name: src.name, ownFee: src.fee,
      parentName: src.parentName, grandName: src.grandName,
      source: src.source, managerName: src.managerName,
      sales: src.sales, count: src.count, fee: f, payable: src.sales - f
    };
  }
  /* 거래 단위 상태 저장소 (owner id → 상태 배열, 상세 행과 인덱스 정렬)
     상태 3단계: 정산 필요 → 정산중 → 정산 완료 */
  var STATUSES = ["정산 필요", "정산중", "정산 완료"];
  var txStatusStore = {};
  function getTxStatuses(owner) {
    if (!txStatusStore[owner.id]) {
      var idNum = Number(owner.id.replace(/\D/g, ""));
      var arr = [];
      for (var i = 0; i < owner.count; i++) {
        /* 3단계 상태를 고르게 순환 배분 — 모든 대상에서 필요/중/완료가 골고루 보이도록 함 */
        arr.push(STATUSES[(i + idNum) % STATUSES.length]);
      }
      txStatusStore[owner.id] = arr;
    }
    return txStatusStore[owner.id];
  }
  var detailCache = {};
  function detailRowsOf(owner, ownerType) {
    if (!detailCache[owner.id]) detailCache[owner.id] = makeDetailRows(owner, ownerType);
    return detailCache[owner.id];
  }
  /* 거래 단위 KPI 집계: 총 정산 수 / 완료 건 / 필요 건(미완료) / 정산 총액 / 완료 금액 / 필요 금액.
     취소 건은 정산 대상이 아니므로 전부 제외(전체 거래 상태 추적 축 — 오늘 정산 대상 축과는 별개). */
  function txAgg(owner, ownerType) {
    var rows = detailRowsOf(owner, ownerType);
    var sts = getTxStatuses(owner);
    var agg = { total: 0, done: 0, need: 0, totalAmt: 0, doneAmt: 0, needAmt: 0 };
    rows.forEach(function (r, i) {
      if (r.cancelled) return;
      agg.total++;
      agg.totalAmt += r.settle;
      if (sts[i] === "정산 완료") { agg.done++; agg.doneAmt += r.settle; }
      else { agg.need++; agg.needAmt += r.settle; }
    });
    return agg;
  }
  function kpi6(agg) {
    return kpiHtml([
      ["총 정산 수", num(agg.total), "건"],
      ["정산 완료 건", num(agg.done), "건"],
      ["정산 필요 건", num(agg.need), "건"],
      ["정산 총액", num(agg.totalAmt), "원"],
      ["정산 완료 금액", num(agg.doneAmt), "원"],
      ["정산 필요 금액", num(agg.needAmt), "원"]
    ]);
  }
  var PAGE_DATA = {
    branch:      { title: "지사 정산 (개선판)",   list: BRANCHES,  ownerType: "지사",   extraCols: [], cols: function () { return ""; } },
    distributor: { title: "총판 정산 (개선판)",   list: DISTS,     ownerType: "총판",   extraCols: ["소속 지사"],
                   cols: function (r) { return "<td class='text-left'>" + r.parentName + "</td>"; } },
    sales:       { title: "영업 정산 (개선판)",   list: SALESREPS, ownerType: "영업",   extraCols: ["소속 총판", "소속 지사"],
                   cols: function (r) { return "<td class='text-left'>" + r.parentName + "</td><td class='text-left'>" + (r.grandName || "—") + "</td>"; } },
    brand:       { title: "대리점 정산 (개선판)", list: BRANDS,    ownerType: "대리점", extraCols: ["신청 출처", "관리 조직"],
                   cols: function (r) { return "<td class='text-left'>" + r.source + "</td><td class='text-left'>" + r.managerName + "</td>"; } }
  };
  function findOwner(type, id) {
    var list = PAGE_DATA[type].list;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }

  /* 상세 내역 분해: count건의 거래로 분해 — 판매금액 합 = 총판매금액, 수수료 합 = 수수료 (마지막 행이 반올림 흡수) */
  var PRODUCTS = [
    "[휴가필수]장보기 부터 여행까지 비스카 풀세트",
    "음식물 쓰레기 스트레스 줄이는, 보랄 음식물 처리기",
    "여름 시즌 한정 린넨 셔츠와 와이드 팬츠",
    "캠핑 필수품 접이식 테이블 패키지"
  ];
  /* 결제 건별 paidDate를 정산 기준일(TODAY)로부터 최대 WINDOW_DAYS일 이전까지 분산 생성.
     각 결제 건의 수수료·유보금은 "결제 시점"에 확정되어 저장되는 값으로 취급 —
     이후 조직/수수료율이 바뀌어도 과거 건은 재계산하지 않는다(당일 정산 계산 기준 5번 규칙). */
  var WINDOW_DAYS = 16; /* 최대 정산주기(D+15)를 확실히 포함하는 범위 */
  function makeDetailRows(owner, ownerType) {
    var rand = lcg(Number(owner.id.replace(/\D/g, "")) * 104729 + 7);
    var totalFee = fee(owner.sales, owner.fee);
    var targetDay = addDays(TODAY, -owner.cycleDays);
    var remaining = owner.sales, feeSum = 0, rows = [];
    for (var i = 1; i <= owner.count; i++) {
      var left = owner.count - i;
      var amt;
      if (left === 0) amt = remaining;
      else {
        amt = Math.max(100, Math.round(remaining / (left + 1) * (0.5 + rand()) / 10) * 10);
        if (amt > remaining - left * 100) amt = remaining - left * 100;
      }
      remaining -= amt;
      var f = left === 0 ? totalFee - feeSum : fee(amt, owner.fee);
      feeSum += f;
      /* 정산 대상일(정산주기 매칭일)에 거래 밀도를 높여 하루치 매출이 여러 건으로 구성되게 함
         (그래야 소액 취소 1~2건이 하루치 매출을 항상 압도하지 않음) */
      var paidDate = (i % 8 === 0) ? targetDay : addDays(TODAY, -Math.floor(rand() * WINDOW_DAYS));
      var hh = pad2(9 + Math.floor(rand() * 12)), mm = pad2(Math.floor(rand() * 60));
      rows.push({
        seller: ownerType === "대리점" ? owner.name : "대리점_" + pad2((i % 4) + 1),
        product: PRODUCTS[i % PRODUCTS.length],
        orderNo: paidDate.replace(/-/g, "") + String(1000 + i * 17 + Number(owner.id.replace(/\D/g, "")) * 131),
        paidDate: paidDate, soldAt: paidDate + " " + hh + ":" + mm,
        buyer: i % 2 ? "김링크" : "이허브",
        payMethod: i % 2 ? "카드" : "간편결제",
        sales: amt, rate: owner.fee, fee: f,
        cancelled: false, cancelDate: null,
        settle: 0 /* 아래에서 최종 계산 */
      });
    }

    /* 정산 대상일에 취소되지 않은 거래가 최소 1건은 있도록 보정 —
       실제로는 없을 수도 있는 케이스지만 데모 상 "오늘 정산 대상"이 항상 보이도록 함 */
    var hasTarget = rows.some(function (r) { return r.paidDate === targetDay; });
    if (!hasTarget && rows.length) {
      var r0 = rows[0];
      r0.paidDate = targetDay;
      r0.soldAt = targetDay + " " + r0.soldAt.slice(11);
    }

    /* 오늘(TODAY) 취소된 이전 결제 건 — 정산 대상일이 아닌 날짜의 거래 중 금액이 작은 순으로
       1~2건만 골라 "오늘 취소" 처리한다(취소액이 하루치 매출을 항상 압도하지 않도록 함). */
    var cancelCount = owner.count >= 20 ? 2 : 1;
    var candidates = rows.filter(function (r) { return r.paidDate !== targetDay && r.paidDate !== TODAY; })
      .sort(function (a, b) { return a.sales - b.sales; });
    for (var c = 0; c < cancelCount && c < candidates.length; c++) {
      candidates[c].cancelled = true;
      candidates[c].cancelDate = TODAY;
    }
    /* 당일 결제 + 당일 취소 데모(모든 계산에서 제외되는 케이스) — 마지막 거래로 시연 */
    var lastRow = rows[rows.length - 1];
    if (lastRow.paidDate !== targetDay) {
      lastRow.paidDate = TODAY;
      lastRow.soldAt = TODAY + " " + lastRow.soldAt.slice(11);
      lastRow.cancelled = true;
      lastRow.cancelDate = TODAY;
    }

    /* 정산 금액(이득) 계산 — CA·영업조직 페이지는 수수료 자체가 이득, 대리점은 결제금액 − 플랫폼수수료 − 유보금.
       유보금은 결제일 순서로 순차 적립하며 유보금·예치금 화면의 기존 누적 잔액을 시작점으로 한도를 캡한다. */
    if (ownerType === "대리점") {
      var conf = retConf(owner.id);
      var bal = retentionStatus(owner.id).balance;
      rows.slice().sort(function (a, b) { return a.paidDate < b.paidDate ? -1 : 1; }).forEach(function (r) {
        if (r.cancelled) { r.retention = 0; r.settle = 0; return; }
        var want = Math.round(r.sales * conf.rate / 100);
        var room = Math.max(0, conf.limit - bal);
        var acc = Math.min(want, room);
        bal += acc;
        r.retention = acc;
        r.settle = r.sales - r.fee - acc;
      });
    } else {
      rows.forEach(function (r) { r.settle = r.cancelled ? 0 : r.fee; });
    }
    return rows;
  }

  /* 오늘(TODAY) 기준 대상의 당일 정산 계산 —
     1) 정산대상매출 = 정산주기(D+N)만큼 이전 날짜(targetDay)에 결제된 금액 합
     2) 오늘 취소된 이전 결제 건(당일 결제·당일 취소 제외)의 금액을 차감 → 당일 정산 계산 기준금액
        (이 차감은 상점의 실제 현금 정산액에만 영향 — 영업조직 수수료는 결제 시점에 이미 확정·저장된
        값이라 다른 날짜의 취소로 소급 차감되지 않는다)
     3) 영업조직(지사·총판·영업)의 수수료(=이득=정산 금액) = 정산대상매출 × 수수료율 — 취소차감 미반영.
        수수료 = 지불해야 할 정산 금액 = 정산 금액 = 판매금액(매출액) × 수수료율.
     4) 대리점(상점)의 정산액 = 당일 정산 계산 기준금액 − 플랫폼수수료 − 유보금
        (플랫폼수수료·유보금은 취소차감이 반영된 기준금액 기준으로 계산) */
  function todaySettlement(owner, ownerType, baseDate) {
    var base = baseDate || TODAY;
    var targetDay = addDays(base, -owner.cycleDays);
    var rows = detailRowsOf(owner, ownerType);
    var targetRows = rows.filter(function (r) { return r.paidDate === targetDay && !(r.cancelled && r.paidDate === base); });
    var targetRevenue = 0; targetRows.forEach(function (r) { targetRevenue += r.sales; });
    var cancelRows = rows.filter(function (r) { return r.cancelled && r.cancelDate === base && r.paidDate !== base; });
    var cancelAmt = 0; cancelRows.forEach(function (r) { cancelAmt += r.sales; });
    var baseAmt = targetRevenue - cancelAmt;
    var out = { targetDay: targetDay, targetRows: targetRows, targetRevenue: targetRevenue, cancelRows: cancelRows, cancelAmt: cancelAmt, baseAmt: baseAmt, count: targetRows.length };
    if (ownerType === "대리점") {
      var feeAmt = fee(Math.max(baseAmt, 0), owner.fee);
      var rst = retentionStatus(owner.id);
      var room = Math.max(0, rst.conf.limit - rst.balance);
      var retAmt = Math.min(Math.round(Math.max(baseAmt, 0) * rst.conf.rate / 100), room);
      out.fee = feeAmt;
      out.retention = retAmt;
      out.settle = baseAmt - feeAmt - retAmt;
    } else {
      var orgFee = fee(Math.max(targetRevenue, 0), owner.fee);
      out.fee = orgFee;
      out.settle = orgFee;
    }
    return out;
  }

  /* ───────── 4. 상태 전이 (3단계: 필요 → 중 → 완료) ───────── */
  var TRANSITIONS = {
    "정산 필요": ["정산중"],
    "정산중":   ["정산 완료", "정산 필요"],
    "정산 완료": ["정산중"]           /* = 완료 취소 (사유 필수) */
  };
  /* 상태별 전용 색상 뱃지: 필요=빨강 / 중=주황 / 완료=초록 */
  function statusBadge(s) {
    if (s === "정산 필요") return '<span class="v2-st v2-st--need">정산 필요</span>';
    if (s === "정산중")   return '<span class="v2-st v2-st--ing">정산중</span>';
    if (s === "정산 완료") return '<span class="v2-st v2-st--done">정산 완료</span>';
    return '<span class="v2-muted">' + s + "</span>";
  }

  /* ───────── 5. 공용 UI ───────── */
  function byId(id) { return document.getElementById(id); }
  function query(name) { return new URLSearchParams(location.search).get(name); }
  function money(n) { return A.formatCurrency(Math.round(n)); }
  function num(n) { return Math.round(n).toLocaleString("ko-KR"); }

  function makeModal() {
    if (byId("v2Modal")) return;
    document.body.insertAdjacentHTML("beforeend",
      '<div class="admin-modal" id="v2Modal"><div class="admin-modal__overlay" data-v2-close></div>' +
      '<div class="admin-modal__box admin-modal__box--lg"><div class="admin-modal__header">' +
      '<span class="admin-modal__title" id="v2ModalTitle"></span>' +
      '<button type="button" class="admin-modal__close admin-btn admin-btn--icon" data-v2-close>×</button></div>' +
      '<div id="v2ModalBody"></div><div class="admin-modal__footer" id="v2ModalFooter"></div></div></div>');
    document.querySelectorAll("[data-v2-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
  }
  function openModal(title, body, footer) {
    makeModal();
    byId("v2ModalTitle").textContent = title;
    byId("v2ModalBody").innerHTML = body;
    byId("v2ModalFooter").innerHTML = footer || '<button type="button" class="admin-btn admin-btn--outline" data-v2-close>닫기</button>';
    byId("v2Modal").classList.add("is-open");
    A.setBodyLocked(true);
    byId("v2ModalFooter").querySelectorAll("[data-v2-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
  }
  function closeModal() { var el = byId("v2Modal"); if (el) el.classList.remove("is-open"); A.setBodyLocked(false); }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  function infoRows(rows) {
    return '<div class="admin-info-grid">' + rows.map(function (r) {
      return '<div class="admin-info-row"><span class="admin-info-label">' + r[0] + '</span><span class="admin-info-value">' + r[1] + '</span></div>';
    }).join("") + "</div>";
  }

  function buildSidebar() {
    var page = location.pathname.split("/").pop() || "index.html";
    function sc(f) { return "admin-sidebar__sub" + (f === page ? " is-active" : ""); }
    var isSett = /settlement/.test(page);
    var aside = byId("adminSidebar");
    if (!aside) return;
    aside.innerHTML =
      '<div class="admin-sidebar__logo"><a href="index.html" class="admin-sidebar__logo-link">SJ Hub</a>' +
      '<span class="admin-sidebar__role-badge">CA·V2</span></div>' +
      '<nav class="admin-sidebar__nav">' +
      '<div class="admin-sidebar__group"><a href="index.html" class="admin-sidebar__main' + (page === "index.html" ? " is-active" : "") + '"><span>개선판 안내</span></a></div>' +
      '<div class="admin-sidebar__group"><a href="../ca-009-organization-list.html" class="admin-sidebar__main"><span>조직 관리 (원본)</span></a></div>' +
      '<div class="admin-sidebar__group"><a href="../ca-002-brand-list.html" class="admin-sidebar__main"><span>대리점 관리 (원본)</span></a></div>' +
      '<div class="admin-sidebar__group">' +
      '<a href="ca-013-settlement.html" class="admin-sidebar__main' + (isSett ? " is-active" : "") + '"><span>정산관리 (개선판)</span></a>' +
      '<a href="ca-013-settlement.html" class="' + sc("ca-013-settlement.html") + '">지사 정산</a>' +
      '<a href="ca-019-settlement-distributor.html" class="' + sc("ca-019-settlement-distributor.html") + '">총판 정산</a>' +
      '<a href="ca-020-settlement-sales.html" class="' + sc("ca-020-settlement-sales.html") + '">영업 정산</a>' +
      '<a href="ca-021-settlement-brand.html" class="' + sc("ca-021-settlement-brand.html") + '">대리점 정산</a>' +
      '<a href="ca-022-settlement-reserve.html" class="' + sc("ca-022-settlement-reserve.html") + '">유보금·예치금</a>' +
      "</div>" +
      '<div class="admin-sidebar__group"><a href="../ca-001-dashboard.html" class="admin-sidebar__main"><span>원본 어드민으로</span></a></div>' +
      "</nav>";
  }

  /* 정산 기준일 패널 — 상태 처리(변경·지급완료)가 기준일 단위로 기록됨 */
  function renderRunPanel(container, onChange) {
    container.innerHTML =
      '<div class="v2-cycle"><div class="v2-cycle__head">' +
      '<span class="v2-cycle__title">정산 기준일</span>' +
      '<span class="v2-cycle__desc">정산 처리(상태 변경·지급완료)는 상세 내역 페이지에서 거래 단위로 처리되며, 선택한 기준일로 기록됩니다</span>' +
      '<div class="v2-cycle__actions"><button type="button" class="admin-btn admin-btn--primary admin-btn--sm" id="cyclePayBtn">지급완료 처리</button></div></div>' +
      '<div class="v2-cycle__controls"><label>기준일</label><input type="date" id="runBase" value="' + TODAY + '" />' +
      '<span class="v2-cycle__range" id="runRange"></span></div></div>';
    function current() {
      var d = byId("runBase").value || TODAY;
      byId("runRange").textContent = d + " 정산 런";
      return { date: d, key: "run|" + d };
    }
    byId("runBase").addEventListener("change", function () { onChange(current()); });
    return current();
  }

  function kpiHtml(items) {
    return items.map(function (k) {
      return '<div class="settlement-kpi"><div class="settlement-kpi__label">' + k[0] + '</div><div class="settlement-kpi__value">' + k[1] + '<span class="settlement-kpi__unit">' + k[2] + "</span></div></div>";
    }).join("");
  }
  function sum(rows, key) { return rows.reduce(function (s, r) { return s + r[key]; }, 0); }

  function warnBanner(html) {
    var main = document.querySelector(".admin-main");
    if (main) main.insertAdjacentHTML("afterbegin", '<div class="v2-warn-banner"><b>확인 필요</b> — ' + html + "</div>");
  }

  /* ───────── 6. 목록 화면 ───────── */
  function retentionAlertHtml(r) {
    var rst = retentionStatus(r.ownerId);
    var out = "";
    if (rst.overLimit) out += ' <a href="ca-022-settlement-reserve.html" title="유보금 한도 도달 — 인출 필요" style="font-size:10px;font-weight:800;color:#DC2626;text-decoration:none">⚠한도</a>';
    if (rst.needUseReg) out += ' <a href="ca-022-settlement-reserve.html" style="font-size:10px;font-weight:800;color:#B45309;text-decoration:none" title="90일+ 보유 — 사용등록 필요">⏱90일+</a>';
    return out;
  }

  function initList(type) {
    var cfg = PAGE_DATA[type];
    var isBrand = type === "brand";
    if (isBrand) {
      var alerts = BRANDS.map(function (b) { return retentionStatus(b.id); });
      var over = alerts.filter(function (a) { return a.overLimit; }).length;
      var longh = alerts.filter(function (a) { return a.needUseReg; }).length;
      if (over || longh) warnBanner(
        (over ? "유보금 한도 도달(인출 필요) " + over + "곳" : "") + (over && longh ? " · " : "") +
        (longh ? "90일+ 보유(사용등록 필요) " + longh + "곳" : "") +
        ' — <a href="ca-022-settlement-reserve.html" style="color:#7f1d1d;font-weight:700">유보금·예치금 관리에서 처리</a>'
      );
    }
    byId("pageTitle").innerHTML = cfg.title.replace(" (개선판)", "") + '<span class="v2-badge">개선판 v2</span>';
    document.title = cfg.title + " — SJ Hub CA";

    var run = null, rows = [], filtered = [], page = 1, size = 10, sortKey = "", sortDir = 1;
    var nameCol = isBrand ? "대리점명" : cfg.ownerType + "명";

    /* 스펙 컬럼: 명칭 - (소속/출처) - 수수료율 - 총 판매금액 - 정산 건수 - 수수료 - 지불해야 할 정산 금액 - 상세내역 */
    byId("tableHead").innerHTML = "<tr><th>" + nameCol + "</th>" +
      cfg.extraCols.map(function (c) { return "<th>" + c + "</th>"; }).join("") +
      "<th class='text-center'><button type='button' class='admin-sort-btn' data-sort='ownFee'>수수료율</button></th>" +
      "<th class='text-right'><button type='button' class='admin-sort-btn' data-sort='sales'>총 판매금액</button></th>" +
      "<th>정산 건수</th>" +
      "<th class='text-right'><button type='button' class='admin-sort-btn' data-sort='fee'>수수료</button></th>" +
      "<th class='text-right'><button type='button' class='admin-sort-btn' data-sort='payable'>지불해야 할 정산 금액</button></th>" +
      "<th>상세내역</th></tr>";

    function recompute() {
      rows = cfg.list.map(function (src) { return toRow(src, cfg.ownerType); });
      applyFilter();
    }
    function applyFilter() {
      var name = byId("fName").value.trim();
      filtered = rows.filter(function (r) {
        if (name && r.name.indexOf(name) < 0) return false;
        return true;
      });
      page = 1;
      render();
    }
    function render() {
      var sorted = filtered.slice();
      if (sortKey) sorted.sort(function (a, b) { return (a[sortKey] > b[sortKey] ? 1 : -1) * sortDir; });
      var slice = sorted.slice((page - 1) * size, page * size);
      byId("settlementTableBody").innerHTML = slice.map(function (r) {
        return "<tr>" +
          "<td class='text-left nowrap'>" + r.name + (isBrand ? retentionAlertHtml(r) : "") + "</td>" + cfg.cols(r) +
          "<td class='text-center'>" + r.ownFee + "%</td>" +
          "<td class='text-right'>" + num(r.sales) + "원</td>" +
          "<td class='text-center'>" + r.count + "건</td>" +
          "<td class='text-right v2-hold'>" + num(r.fee) + "원</td>" +
          "<td class='text-right v2-payable'>" + num(r.payable) + "원</td>" +
          "<td class='text-center'><a class='admin-btn admin-btn--outline admin-btn--sm' href='ca-014-settlement-detail.html?type=" + type + "&id=" + r.ownerId + "&base=" + run.date + "'>상세 내역 보기</a></td></tr>";
      }).join("");
      byId("emptyState").style.display = slice.length ? "none" : "";
      /* KPI 6종 — 거래(건) 단위 집계: 상세 페이지 상태와 항상 일치 */
      var agg = { total: 0, done: 0, need: 0, totalAmt: 0, doneAmt: 0, needAmt: 0 };
      filtered.forEach(function (r) {
        var src = findOwner(type, r.ownerId);
        var a = txAgg(src, cfg.ownerType);
        agg.total += a.total; agg.done += a.done; agg.need += a.need;
        agg.totalAmt += a.totalAmt; agg.doneAmt += a.doneAmt; agg.needAmt += a.needAmt;
      });
      byId("settlementKpiGrid").innerHTML = kpi6(agg);
      A.renderPagination(byId("paginationWrap"), filtered.length, page, size, function (p) { page = p; render(); });
    }

    run = renderRunPanel(byId("cyclePanel"), function (c) { run = c; recompute(); });
    byId("cyclePayBtn").style.display = "none"; /* 지급완료·상태 변경은 상세 페이지에서 */
    recompute();

    byId("searchBtn").addEventListener("click", applyFilter);
    byId("resetBtn").addEventListener("click", function () { byId("fName").value = ""; applyFilter(); });
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-sort]");
      if (btn) { sortDir = sortKey === btn.dataset.sort ? -sortDir : 1; sortKey = btn.dataset.sort; render(); }
    });
    byId("pageSize").addEventListener("change", function () { size = Number(this.value); page = 1; render(); });
    byId("downloadBtn").addEventListener("click", function () {
      var headers = [nameCol].concat(cfg.extraCols, ["수수료율", "총 판매금액", "정산 건수", "수수료", "지불해야 할 정산 금액", "기준일"]);
      A.downloadCSV(cfg.title.replace(/\s/g, "") + "_" + run.date + ".csv", headers,
        filtered.map(function (r) {
          var extra = type === "distributor" ? [r.parentName]
                    : type === "sales" ? [r.parentName, r.grandName || ""]
                    : type === "brand" ? [r.source, r.managerName] : [];
          return [r.name].concat(extra, [r.ownFee + "%", r.sales, r.count, r.fee, r.payable, run.date]);
        }));
    });
  }

  /* 상태 변경 모달 — 거래(건) 단위. targets = [{status, apply(next)}] */
  function openTransitionModal(targets, runDate, rerender) {
    if (!targets.length) { A.showToast("선택한 항목이 없습니다."); return; }
    var statuses = {};
    targets.forEach(function (t) { statuses[t.status] = true; });
    if (Object.keys(statuses).length > 1) { A.showToast("서로 다른 상태의 항목은 함께 변경할 수 없습니다. 같은 상태끼리 선택해주세요."); return; }
    var from = targets[0].status;
    var allowed = TRANSITIONS[from] || [];
    if (!allowed.length) { A.showToast("'" + from + "' 상태에서 변경 가능한 상태가 없습니다."); return; }
    var isCancel = from === "정산 완료";
    var options = allowed.map(function (s) {
      var label = isCancel && s === "정산중" ? "정산중 (완료 취소)" : s;
      return "<option value='" + s + "'>" + label + "</option>";
    }).join("");
    openModal("선택항목 상태 변경 — " + targets.length + "건 (" + from + ")",
      "<div class='admin-field'><label>변경 상태</label><select id='transSelect'>" + options + "</select>" +
      "<div class='admin-field-hint'>허용된 전이: " + from + " → " + allowed.join(" / ") + " · 처리 기준일: " + runDate + "</div></div>" +
      (isCancel ? "<div class='admin-field'><label>완료 취소 사유 (필수)</label><textarea id='transReason' placeholder='오지급·중복 처리 등 사유를 입력해주세요.'></textarea></div>" : ""),
      "<button type='button' class='admin-btn admin-btn--outline' data-v2-close>취소</button><button type='button' class='admin-btn admin-btn--primary' id='transSaveBtn'>변경</button>");
    byId("transSaveBtn").addEventListener("click", function () {
      var next = byId("transSelect").value;
      var reason = isCancel ? (byId("transReason").value || "").trim() : "";
      if (isCancel && !reason) { A.showToast("완료 취소 사유를 입력해주세요."); return; }
      targets.forEach(function (t) { t.apply(next); });
      closeModal(); rerender();
      A.showToast(targets.length + "건 상태가 '" + next + "'(으)로 변경되었습니다.");
    });
  }

  /* 지급완료 모달 — '정산중' 거래만 완료 처리 */
  function openPayModal(targets, runDate, rerender) {
    if (!targets.length) { A.showToast("지급완료 처리할 항목을 먼저 선택해주세요."); return; }
    var eligible = targets.filter(function (t) { return t.status === "정산중"; });
    var skipped = targets.length - eligible.length;
    if (!eligible.length) { A.showToast("'정산중' 상태의 항목만 지급완료 처리할 수 있습니다. (정산 필요 → 정산중 → 정산 완료 순서로 진행)"); return; }
    var payTotal = eligible.reduce(function (s, t) { return s + (t.settle || 0); }, 0);
    openModal("지급완료 처리",
      "<p style='font-size:13.5px'>선택 " + targets.length + "건 중 <b>" + eligible.length + "건</b>(정산중)을 지급완료 처리합니다." +
      (skipped ? " <span style='color:#B45309'>" + skipped + "건은 '정산중' 상태가 아니어서 제외됩니다.</span>" : "") + "</p>" +
      "<div class='admin-field-hint' style='margin-top:8px'>처리 기준일: " + runDate + " · 지급 금액 합계: <b>" + num(payTotal) + "원</b></div>" +
      "<div class='admin-field-hint'>지불해야 할 정산 금액 = 판매금액 − 수수료. 유보금 대상 대리점은 지급 시 유보금이 추가 차감됩니다 (유보금·예치금 관리 참조).</div>",
      "<button type='button' class='admin-btn admin-btn--outline' data-v2-close>취소</button><button type='button' class='admin-btn admin-btn--primary' id='paySaveBtn'>지급완료</button>");
    byId("paySaveBtn").addEventListener("click", function () {
      eligible.forEach(function (t) { t.apply("정산 완료"); });
      closeModal(); rerender();
      A.showToast(eligible.length + "건 지급완료 처리되었습니다.");
    });
  }

  /* ───────── 7. 상세 화면 — 정산 상태·상태 변경·상태별 필터는 여기서 관리 ───────── */
  function initDetail() {
    var type = query("type") || "branch";
    var id = query("id");
    var base = query("base") || TODAY;
    var isBrand = type === "brand";
    var cfg = PAGE_DATA[type];
    var owner = findOwner(type, id);
    var listPage = { branch: "ca-013-settlement.html", distributor: "ca-019-settlement-distributor.html", sales: "ca-020-settlement-sales.html", brand: "ca-021-settlement-brand.html" }[type];
    byId("backLink").href = listPage;

    var run = { date: base, key: "run|" + base };
    var detailRows = detailRowsOf(owner, cfg.ownerType);
    var sts = getTxStatuses(owner);
    var filtered = [];          /* [{row, idx}] */
    var selected = {};          /* idx → true */
    byId("detailName").textContent = owner.name;
    document.title = owner.name + " 정산 상세 — SJ Hub CA (v2)";

    function ownerCard() {
      var ts = todaySettlement(owner, cfg.ownerType, run.date);
      var retHtml = "";
      if (isBrand) {
        var rst = retentionStatus(owner.id);
        retHtml = "<div class='kv'><b>유보금 잔액</b> " + num(rst.balance) + "원 / 한도 " + num(rst.conf.limit) + "원 (" + rst.conf.rate + "%, 결제 원금 기준)" +
          (rst.overLimit ? " <span style='color:#DC2626;font-weight:800;font-size:11px'>⚠인출 필요</span>" : "") +
          (rst.needUseReg ? " <span style='color:#B45309;font-weight:800;font-size:11px'>⏱사용등록 필요</span>" : "") +
          " <a href='ca-022-settlement-reserve.html' style='font-size:11px'>관리</a></div>" +
          "<div class='kv'><b>예치금</b> " + num(depositBalance(owner.id)) + "원 <a href='ca-022-settlement-reserve.html?tab=deposit' style='font-size:11px'>관리</a></div>";
      }
      var todayHtml =
        "<div class='kv'><b>정산주기</b> D+" + owner.cycleDays + "</div>" +
        "<div class='kv'><b>정산 대상일</b> " + ts.targetDay + "</div>" +
        "<div class='kv'><b>정산 대상 매출</b> " + num(ts.targetRevenue) + "원 (" + ts.count + "건)</div>" +
        (isBrand ? (
          (ts.cancelAmt ? "<div class='kv'><b>오늘 취소 차감</b> <span style='color:#DC2626;font-weight:700'>−" + num(ts.cancelAmt) + "원</span> (" + ts.cancelRows.length + "건)</div>" : "") +
          "<div class='kv'><b>당일 정산 계산 기준금액</b> " + num(ts.baseAmt) + "원</div>" +
          "<div class='kv'><b>플랫폼 수수료</b> " + num(ts.fee) + "원</div>" +
          "<div class='kv'><b>유보금 차감</b> " + num(ts.retention) + "원</div>" +
          "<div class='kv'><b>오늘 지급 정산액</b> <b style='color:#166534'>" + num(ts.settle) + "원</b></div>"
        ) : (
          "<div class='kv'><b>수수료(이득) = 정산 금액</b> <b style='color:#166534'>" + num(ts.settle) + "원</b></div>" +
          "<div class='kv v2-muted' style='font-size:11px'>수수료 = 정산 대상 매출 × 수수료율 (오늘 취소된 다른 결제 건과는 무관 — 상점 정산에서만 차감)</div>"
        ));
      byId("ownerCard").innerHTML =
        "<div class='kv'><b>유형</b> " + (isBrand ? "대리점 (" + owner.source + ")" : cfg.ownerType) + "</div>" +
        (isBrand ? "<div class='kv'><b>관리 조직</b> " + owner.managerName + "</div>"
                 : "<div class='kv'><b>소속</b> " + (owner.parentName || "CA 직속") + (owner.grandName ? " / " + owner.grandName : "") + "</div>") +
        "<div class='kv'><b>수수료율</b> " + owner.fee + "%</div>" +
        "<div class='kv'><b>총 판매금액(전체 기간)</b> " + num(owner.sales) + "원</div>" +
        todayHtml + retHtml;
    }

    /* KPI 6종 — 거래 상태(정산필요/중/완료) 전체 이력 집계. 취소 건 제외.
       '오늘 정산 대상만 보기' 토글과는 별개 축 — 토글 상태와 무관하게 항상 전체 이력 기준(목록 페이지와 동일). */
    function kpiAgg() {
      var st = byId("fStatus").value;
      var agg = { total: 0, done: 0, need: 0, totalAmt: 0, doneAmt: 0, needAmt: 0 };
      detailRows.forEach(function (r, i) {
        if (r.cancelled) return;
        if (st && sts[i] !== st) return;
        agg.total++;
        agg.totalAmt += r.settle;
        if (sts[i] === "정산 완료") { agg.done++; agg.doneAmt += r.settle; }
        else { agg.need++; agg.needAmt += r.settle; }
      });
      return agg;
    }

    function applyFilter() {
      var st = byId("fStatus").value;
      var onlyToday = byId("fToday").checked;
      var ts = todaySettlement(owner, cfg.ownerType, run.date);
      var targetSet = {}; ts.targetRows.forEach(function (r) { targetSet[detailRows.indexOf(r)] = true; });
      /* 취소 차감은 상점(대리점) 정산액 계산에만 관여 — 영업조직 페이지에서는 취소 건을 노출하지 않는다 */
      var cancelSet = {};
      if (isBrand) ts.cancelRows.forEach(function (r) { cancelSet[detailRows.indexOf(r)] = true; });
      filtered = [];
      detailRows.forEach(function (r, i) {
        if (r.cancelled && !cancelSet[i]) return; /* 취소 건은 대리점의 '오늘 취소 차감' 대상일 때만 노출 */
        if (onlyToday && !(targetSet[i] || cancelSet[i])) return;
        if (st && !r.cancelled && sts[i] !== st) return;
        filtered.push({ row: r, idx: i });
      });
      selected = {};
      render();
    }
    function render() {
      byId("settlementKpiGrid").innerHTML = kpi6(kpiAgg());
      byId("salesTableBody").innerHTML = filtered.map(function (x) {
        var r = x.row, i = x.idx;
        var statusCell = r.cancelled ? "<span class='v2-muted' style='font-weight:800'>취소(오늘 차감)</span>" : statusBadge(sts[i]);
        var checkCell = r.cancelled ? "" : "<input type='checkbox' class='tx-check' data-i='" + i + "' " + (selected[i] ? "checked" : "") + " />";
        return "<tr" + (r.cancelled ? " style='opacity:.65'" : "") + "><td class='text-center'>" + checkCell + "</td>" +
          "<td class='text-left nowrap'>" + r.seller + "</td>" +
          "<td class='text-left product-cell' title='" + r.product + "'>" + r.product + "</td>" +
          "<td class='text-center nowrap'>" + r.orderNo + "</td>" +
          "<td class='text-center nowrap'>" + r.soldAt + "</td>" +
          "<td class='text-right'>" + num(r.sales) + "원</td>" +
          "<td class='text-center'>" + r.rate + "%</td>" +
          "<td class='text-right v2-hold'>" + num(r.fee) + "원</td>" +
          "<td class='text-right v2-payable'>" + num(r.settle) + "원</td>" +
          "<td class='text-center'>" + statusCell + "</td>" +
          "<td class='text-center'><button type='button' class='admin-btn admin-btn--outline admin-btn--sm sale-btn' data-i='" + i + "'>상세보기</button></td></tr>";
      }).join("");
      byId("emptyState").style.display = filtered.length ? "none" : "";
      ownerCard();
    }

    function pickedTargets() {
      var out = [];
      filtered.forEach(function (x) {
        if (!selected[x.idx] || x.row.cancelled) return;
        out.push({
          status: sts[x.idx], settle: x.row.settle,
          apply: (function (i) { return function (next) { sts[i] = next; }; })(x.idx)
        });
      });
      return out;
    }

    renderRunPanel(byId("cyclePanel"), function (c) { run = c; applyFilter(); });
    byId("runBase").value = base;
    byId("runRange").textContent = base + " 정산 런";
    byId("fToday").addEventListener("change", applyFilter);
    applyFilter();

    byId("searchBtn").addEventListener("click", applyFilter);
    byId("resetBtn").addEventListener("click", function () { byId("fStatus").value = ""; byId("fToday").checked = true; applyFilter(); });
    byId("selectAllBtn").addEventListener("click", function () {
      filtered.forEach(function (x) { if (!x.row.cancelled) selected[x.idx] = true; });
      render();
    });
    byId("salesTableBody").addEventListener("change", function (e) {
      if (e.target.classList.contains("tx-check")) selected[Number(e.target.dataset.i)] = e.target.checked;
    });
    byId("bulkStatusBtn").addEventListener("click", function () { openTransitionModal(pickedTargets(), run.date, render); });
    byId("cyclePayBtn").addEventListener("click", function () { openPayModal(pickedTargets(), run.date, render); });
    byId("downloadBtn").addEventListener("click", function () {
      A.downloadCSV(owner.name + "_정산상세_" + run.date + ".csv",
        ["판매처", "판매 상품", "주문번호", "결제 일시", "판매금액", "수수료율", "수수료", "정산 금액", "정산 상태"],
        filtered.map(function (x) { return [x.row.seller, x.row.product, x.row.orderNo, x.row.soldAt, x.row.sales, x.row.rate + "%", x.row.fee, x.row.settle, x.row.cancelled ? "취소" : sts[x.idx]]; }));
    });
    byId("salesTableBody").addEventListener("click", function (e) {
      var btn = e.target.closest(".sale-btn");
      if (!btn) return;
      var i = Number(btn.dataset.i);
      var r = detailRows[i];
      var rows = [
        ["판매처", r.seller], ["상품명", r.product], ["주문번호", r.orderNo],
        ["구매자", r.buyer], ["결제수단", r.payMethod], ["결제 일시", r.soldAt],
        ["판매금액", money(r.sales)], ["적용 수수료율", r.rate + "%"], ["수수료", money(r.fee)]
      ];
      if (isBrand && !r.cancelled) rows.push(["유보금 차감", money(r.retention || 0)]);
      rows.push(["정산 금액", money(r.settle)]);
      rows.push(r.cancelled ? ["정산 상태", "<span style='color:#DC2626;font-weight:800'>취소 (" + r.cancelDate + ")</span>"] : ["정산 상태", statusBadge(sts[i])]);
      openModal("거래 상세 — " + r.orderNo, infoRows(rows));
    });
  }

  /* ───────── 8. 유보금·예치금 관리 (탭 화면) ───────── */
  function initRetentionDeposit() {
    var tab = query("tab") === "deposit" ? "deposit" : "retention";
    var nameFilter = "", statusFilter = "";

    function allStatuses() { return BRANDS.map(function (b) { return { brand: b, rst: retentionStatus(b.id) }; }); }

    function renderKpis() {
      var list = allStatuses();
      var over = list.filter(function (x) { return x.rst.overLimit; });
      var longh = list.filter(function (x) { return x.rst.needUseReg; });
      var retTotal = list.reduce(function (s, x) { return s + x.rst.balance; }, 0);
      var depTotal = BRANDS.reduce(function (s, b) { return s + depositBalance(b.id); }, 0);
      byId("settlementKpiGrid").innerHTML = kpiHtml([
        ["유보금 총 잔액", num(retTotal), "원"],
        ["인출 필요 (한도 도달)", num(over.length), "곳"],
        ["사용등록 필요 (90일+)", num(longh.length), "곳"],
        ["예치금 총 잔액", num(depTotal), "원"]
      ]);
      var old = byId("retAlertBanner");
      if (old) old.remove();
      if (over.length || longh.length) {
        var msgs = [];
        if (over.length) msgs.push("<b>인출 알림</b>: " + over.map(function (x) { return x.brand.name; }).join(", ") + " — 유보금이 한도에 도달해 적립이 중단되었습니다. 초과 보유분 인출 처리가 필요합니다.");
        if (longh.length) msgs.push("<b>사용등록 알림</b>: " + longh.map(function (x) { return x.brand.name + "(" + x.rst.heldDays + "일)"; }).join(", ") + " — 90일 이상 무사고 보유 중입니다. 사용등록을 기록해주세요.");
        byId("settlementKpiGrid").insertAdjacentHTML("beforebegin", '<div class="v2-warn-banner" id="retAlertBanner">' + msgs.join("<br>") + "</div>");
      }
    }

    function switchTab(next) {
      tab = next;
      byId("tabRetention").className = "admin-btn admin-btn--sm " + (tab === "retention" ? "admin-btn--primary" : "admin-btn--outline");
      byId("tabDeposit").className = "admin-btn admin-btn--sm " + (tab === "deposit" ? "admin-btn--primary" : "admin-btn--outline");
      byId("retentionSection").style.display = tab === "retention" ? "" : "none";
      byId("depositSection").style.display = tab === "deposit" ? "" : "none";
      byId("fRetStatus").style.display = tab === "retention" ? "" : "none";
      renderTables();
    }

    function renderTables() {
      renderKpis();
      var list = allStatuses().filter(function (x) {
        if (nameFilter && x.brand.name.indexOf(nameFilter) < 0) return false;
        if (tab === "retention" && statusFilter) {
          if (statusFilter === "인출 필요" && !x.rst.overLimit) return false;
          if (statusFilter === "사용등록 필요" && !x.rst.needUseReg) return false;
          if (statusFilter === "정상" && (x.rst.overLimit || x.rst.needUseReg)) return false;
        }
        return true;
      });

      if (tab === "retention") {
        byId("retTableBody").innerHTML = list.map(function (x) {
          var rst = x.rst, pct = rst.conf.limit ? Math.min(100, Math.round(rst.balance / rst.conf.limit * 100)) : 0;
          var barColor = rst.overLimit ? "#DC2626" : pct >= 80 ? "#F59E0B" : "#2563EB";
          var stBadge = rst.overLimit ? "<span style='color:#DC2626;font-weight:800;font-size:12px'>⚠ 인출 필요</span>"
            : rst.needUseReg ? "<span style='color:#B45309;font-weight:800;font-size:12px'>⏱ 사용등록 필요</span>"
            : "<span style='color:#166534;font-weight:700;font-size:12px'>정상</span>";
          var lastAt = rst.ledger.rows.length ? rst.ledger.rows[rst.ledger.rows.length - 1].at.slice(0, 10) : "—";
          return "<tr>" +
            "<td class='text-left nowrap'>" + x.brand.name + "</td>" +
            "<td class='text-left'>" + x.brand.managerName + "</td>" +
            "<td class='text-center'>" + rst.conf.rate + "%<div class='v2-muted' style='font-size:10px'>원금 기준</div></td>" +
            "<td class='text-right'>" + num(rst.conf.limit) + "원</td>" +
            "<td class='text-right'><b>" + num(rst.balance) + "원</b></td>" +
            "<td style='min-width:120px'><div style='background:#EEF2F7;border-radius:99px;height:8px;overflow:hidden'><div style='width:" + pct + "%;height:8px;background:" + barColor + "'></div></div><div class='v2-muted' style='font-size:10.5px;margin-top:2px'>" + pct + "%</div></td>" +
            "<td class='text-center'>" + stBadge + "</td>" +
            "<td class='text-center nowrap'>" + (rst.firstAccrual ? rst.heldDays + "일" : "—") + "</td>" +
            "<td class='text-center nowrap'>" + lastAt + "</td>" +
            "<td class='text-center'><button type='button' class='admin-btn admin-btn--outline admin-btn--sm ret-open-btn' data-id='" + x.brand.id + "'>내역·관리</button></td></tr>";
        }).join("");
        byId("retEmpty").style.display = list.length ? "none" : "";
      } else {
        byId("depTableBody").innerHTML = list.map(function (x) {
          var bal = depositBalance(x.brand.id);
          return "<tr>" +
            "<td class='text-left nowrap'>" + x.brand.name + "</td>" +
            "<td class='text-left'>" + x.brand.managerName + "</td>" +
            "<td class='text-right'><b>" + num(bal) + "원</b></td>" +
            "<td class='text-center nowrap'>" + depositLastAt(x.brand.id).slice(0, 10) + "</td>" +
            "<td class='text-center'><button type='button' class='admin-btn admin-btn--outline admin-btn--sm dep-open-btn' data-id='" + x.brand.id + "'>내역·관리</button></td></tr>";
        }).join("");
        byId("depEmpty").style.display = list.length ? "none" : "";
      }
    }

    function openRetention(brandId) {
      var b = brandById(brandId);
      var rst = retentionStatus(brandId);
      var rows = rst.ledger.rows.slice().reverse();
      var actionBar =
        "<div class='admin-fields-row' style='align-items:flex-end'>" +
        "<div class='admin-field'><label>유보금 사용 — 금액</label><input type='number' id='retUseAmt' placeholder='차감할 금액' /></div>" +
        "<div class='admin-field' style='flex:2'><label>사용 사유 (필수)</label><input type='text' id='retUseReason' placeholder='예: 결제 취소 환불 보전 (주문번호)' /></div>" +
        "<div class='admin-field'><label>&nbsp;</label><button type='button' class='admin-btn admin-btn--danger admin-btn--sm' id='retUseBtn'>사용하기</button></div>" +
        "</div>" +
        "<div class='admin-field-hint'>유보금은 결제 원금의 " + rst.conf.rate + "%씩 자동 적립(한도까지)되므로 수동 등록은 없습니다. 사용(차감)만 수동 처리합니다.</div>";
      var extraActions = "";
      if (rst.overLimit) {
        extraActions += "<div class='v2-warn-banner' style='margin-top:10px'><b>⚠ 한도 도달</b> — 잔액 " + num(rst.balance) + "원 / 한도 " + num(rst.conf.limit) + "원. 적립이 중단된 상태입니다. " +
          "<button type='button' class='admin-btn admin-btn--danger admin-btn--sm' id='retWithdrawBtn' style='margin-left:8px'>인출 처리</button></div>";
      }
      if (rst.needUseReg) {
        extraActions += "<div class='v2-warn-banner' style='margin-top:10px;background:#FFF8E1;border-color:#F5E0A3;color:#7C5E00'><b>⏱ 90일+ 무사고 보유</b> — 최초 적립 " + rst.firstAccrual + " (" + rst.heldDays + "일 경과)" +
          (rst.lastUseReg ? " · 최근 사용등록 " + rst.lastUseReg : " · 사용등록 기록 없음") +
          "<div class='admin-fields-row' style='margin-top:8px;align-items:flex-end'>" +
          "<div class='admin-field' style='flex:2'><label>사용등록 메모</label><input type='text' id='retRegMemo' placeholder='예: 3개월 무사고 확인 — 유보금 유지/반환 결정 내용' /></div>" +
          "<div class='admin-field'><label>&nbsp;</label><button type='button' class='admin-btn admin-btn--primary admin-btn--sm' id='retRegBtn'>사용등록 기록</button></div>" +
          "</div></div>";
      }
      var summary =
        "<div class='v2-owner-card' style='margin-top:0'>" +
        "<div class='kv'><b>적립 비율</b> " + rst.conf.rate + "% (결제 원금 기준)</div>" +
        "<div class='kv'><b>한도</b> " + num(rst.conf.limit) + "원</div>" +
        "<div class='kv'><b>현재 잔액</b> <b style='color:#1D4ED8'>" + num(rst.balance) + "원</b></div>" +
        "<div class='kv'><b>보유 기간</b> " + (rst.firstAccrual ? rst.heldDays + "일 (최초 " + rst.firstAccrual + ")" : "—") + "</div>" +
        "</div>";
      openModal(b.name + " — 유보금 내역",
        summary + actionBar + extraActions +
        "<div class='v2-history' style='margin-top:14px;max-height:320px;overflow:auto'><table>" +
        "<tr><th>일시</th><th>구분</th><th class='text-right'>금액</th><th>잔액</th><th>발생 근거</th><th>처리자</th><th></th></tr>" +
        (rows.length ? rows.map(function (r, i) {
          var color = r.amount > 0 ? "#DC2626" : r.amount < 0 ? "#2563EB" : "#667085";
          return "<tr><td class='nowrap'>" + r.at + "</td><td>" + r.type + "</td>" +
            "<td style='text-align:right;color:" + color + ";font-weight:700'>" + (r.amount ? (r.amount > 0 ? "+" : "") + num(r.amount) : "—") + "</td>" +
            "<td style='text-align:right'>" + num(r.balance) + "</td><td>" + r.reason + "</td><td>" + r.by + "</td>" +
            "<td>" + (r.manual && r.amount !== 0 ? "<button type='button' class='admin-btn admin-btn--outline admin-btn--sm ret-rev-btn' data-i='" + (rows.length - 1 - i) + "'>역분개</button>" : "") + "</td></tr>";
        }).join("") : "<tr><td colspan='7' style='text-align:center;color:#98A2B3'>내역이 없습니다.</td></tr>") +
        "</table></div>" +
        "<div class='admin-field-hint' style='margin-top:6px'>자동 적립 내역은 삭제·수정할 수 없습니다. 수동 처리 건의 정정은 삭제 대신 <b>역분개</b>로 기록됩니다.</div>");

      byId("retUseBtn").addEventListener("click", function () {
        var amt = Number(byId("retUseAmt").value) || 0;
        var reason = (byId("retUseReason").value || "").trim();
        if (amt <= 0) { A.showToast("사용 금액을 입력해주세요."); return; }
        if (amt > rst.balance) { A.showToast("잔액(" + num(rst.balance) + "원)을 초과할 수 없습니다."); return; }
        if (!reason) { A.showToast("사용 사유를 입력해주세요."); return; }
        logsOf(RET_LOGS, brandId).push({ at: nowStr(), type: "사용", amount: -amt, reason: reason, by: "관리자" });
        closeModal(); renderTables();
        A.showToast("유보금 " + num(amt) + "원 사용 처리되었습니다.");
      });
      var wBtn = byId("retWithdrawBtn");
      if (wBtn) wBtn.addEventListener("click", function () {
        var amt = rst.balance;
        logsOf(RET_LOGS, brandId).push({ at: nowStr(), type: "인출", amount: -amt, reason: "한도 도달 인출 처리 (한도 " + num(rst.conf.limit) + "원)", by: "관리자" });
        closeModal(); renderTables();
        A.showToast("유보금 " + num(amt) + "원 인출 처리되었습니다. 적립이 재개됩니다.");
      });
      var regBtn = byId("retRegBtn");
      if (regBtn) regBtn.addEventListener("click", function () {
        var memo = (byId("retRegMemo").value || "").trim();
        if (!memo) { A.showToast("사용등록 메모를 입력해주세요."); return; }
        logsOf(RET_LOGS, brandId).push({ at: nowStr(), type: "사용등록", amount: 0, reason: memo, by: "관리자" });
        closeModal(); renderTables();
        A.showToast("사용등록이 기록되었습니다. (" + TODAY + ")");
      });
      byId("v2ModalBody").addEventListener("click", function (e) {
        var rb = e.target.closest(".ret-rev-btn");
        if (!rb) return;
        var entry = rst.ledger.rows[Number(rb.dataset.i)];
        if (!entry || !entry.ref) return;
        var reason = prompt("역분개 사유를 입력해주세요.", "");
        if (!reason) return;
        logsOf(RET_LOGS, brandId).push({ at: nowStr(), type: "정정(역분개)", amount: -entry.ref.amount, reason: "[" + entry.type + " " + num(entry.ref.amount) + "원 역분개] " + reason, by: "관리자" });
        closeModal(); renderTables();
        A.showToast("역분개가 기록되었습니다.");
      });
    }

    function openDeposit(brandId) {
      var b = brandById(brandId);
      var logs = logsOf(DEP_LOGS, brandId).slice().reverse();
      var bal = depositBalance(brandId);
      openModal(b.name + " — 예치금 내역",
        "<div class='v2-owner-card' style='margin-top:0'><div class='kv'><b>현재 잔액</b> <b style='color:#1D4ED8'>" + num(bal) + "원</b></div>" +
        "<div class='kv'><b>용도</b> <span class='v2-muted' style='font-size:12px'>정산 완료 후 결제 취소 발생 시 보전용 — 미리 받아두는 대비금</span></div></div>" +
        "<div class='admin-fields-row' style='align-items:flex-end'>" +
        "<div class='admin-field'><label>예치금 등록 — 금액</label><input type='number' id='depAddAmt' placeholder='금액' /></div>" +
        "<div class='admin-field' style='flex:2'><label>등록 사유 (필수)</label><input type='text' id='depAddReason' placeholder='예: 계약 보증 예치금' /></div>" +
        "<div class='admin-field'><label>&nbsp;</label><button type='button' class='admin-btn admin-btn--primary admin-btn--sm' id='depAddBtn'>등록하기</button></div>" +
        "</div>" +
        "<div class='admin-fields-row' style='align-items:flex-end'>" +
        "<div class='admin-field'><label>예치금 사용 — 금액</label><input type='number' id='depUseAmt' placeholder='차감할 금액' /></div>" +
        "<div class='admin-field' style='flex:2'><label>차감 사유 (필수)</label><input type='text' id='depUseReason' placeholder='예: 취소 건 보전 (주문번호)' /></div>" +
        "<div class='admin-field'><label>&nbsp;</label><button type='button' class='admin-btn admin-btn--danger admin-btn--sm' id='depUseBtn'>차감하기</button></div>" +
        "</div>" +
        "<div class='v2-history' style='margin-top:14px;max-height:320px;overflow:auto'><table>" +
        "<tr><th>일시</th><th>구분</th><th class='text-right'>금액</th><th>발생 근거</th><th>처리자</th><th></th></tr>" +
        (logs.length ? logs.map(function (r, i) {
          var color = r.amount > 0 ? "#DC2626" : "#2563EB";
          return "<tr><td class='nowrap'>" + r.at + "</td><td>" + r.type + "</td>" +
            "<td style='text-align:right;color:" + color + ";font-weight:700'>" + (r.amount > 0 ? "+" : "") + num(r.amount) + "</td>" +
            "<td>" + r.reason + "</td><td>" + r.by + "</td>" +
            "<td><button type='button' class='admin-btn admin-btn--outline admin-btn--sm dep-rev-btn' data-i='" + (logs.length - 1 - i) + "'>역분개</button></td></tr>";
        }).join("") : "<tr><td colspan='6' style='text-align:center;color:#98A2B3'>내역이 없습니다.</td></tr>") +
        "</table></div>" +
        "<div class='admin-field-hint' style='margin-top:6px'>정정은 삭제 대신 <b>역분개</b>로 기록됩니다 — 원장 무결성 유지.</div>");

      byId("depAddBtn").addEventListener("click", function () {
        var amt = Number(byId("depAddAmt").value) || 0;
        var reason = (byId("depAddReason").value || "").trim();
        if (amt <= 0) { A.showToast("등록 금액을 입력해주세요."); return; }
        if (!reason) { A.showToast("등록 사유를 입력해주세요."); return; }
        logsOf(DEP_LOGS, brandId).push({ at: nowStr(), type: "등록", amount: amt, reason: reason, by: "관리자" });
        closeModal(); renderTables();
        A.showToast("예치금 " + num(amt) + "원 등록되었습니다.");
      });
      byId("depUseBtn").addEventListener("click", function () {
        var amt = Number(byId("depUseAmt").value) || 0;
        var reason = (byId("depUseReason").value || "").trim();
        var cur = depositBalance(brandId);
        if (amt <= 0) { A.showToast("차감 금액을 입력해주세요."); return; }
        if (amt > cur) { A.showToast("잔액(" + num(cur) + "원)을 초과할 수 없습니다."); return; }
        if (!reason) { A.showToast("차감 사유를 입력해주세요."); return; }
        logsOf(DEP_LOGS, brandId).push({ at: nowStr(), type: "차감", amount: -amt, reason: reason, by: "관리자" });
        closeModal(); renderTables();
        A.showToast("예치금 " + num(amt) + "원 차감되었습니다.");
      });
      byId("v2ModalBody").addEventListener("click", function (e) {
        var rb = e.target.closest(".dep-rev-btn");
        if (!rb) return;
        var entry = logsOf(DEP_LOGS, brandId)[Number(rb.dataset.i)];
        if (!entry) return;
        var reason = prompt("역분개 사유를 입력해주세요.", "");
        if (!reason) return;
        logsOf(DEP_LOGS, brandId).push({ at: nowStr(), type: "정정(역분개)", amount: -entry.amount, reason: "[" + entry.type + " " + num(entry.amount) + "원 역분개] " + reason, by: "관리자" });
        closeModal(); renderTables();
        A.showToast("역분개가 기록되었습니다.");
      });
    }

    byId("tabRetention").addEventListener("click", function () { switchTab("retention"); });
    byId("tabDeposit").addEventListener("click", function () { switchTab("deposit"); });
    byId("searchBtn").addEventListener("click", function () {
      nameFilter = byId("fName").value.trim();
      statusFilter = byId("fRetStatus").value;
      renderTables();
    });
    byId("resetBtn").addEventListener("click", function () {
      byId("fName").value = ""; byId("fRetStatus").value = "";
      nameFilter = ""; statusFilter = "";
      renderTables();
    });
    byId("retTableBody").addEventListener("click", function (e) {
      var btn = e.target.closest(".ret-open-btn");
      if (btn) openRetention(btn.dataset.id);
    });
    byId("depTableBody").addEventListener("click", function (e) {
      var btn = e.target.closest(".dep-open-btn");
      if (btn) openDeposit(btn.dataset.id);
    });
    byId("downloadBtn").addEventListener("click", function () {
      if (tab === "retention") {
        A.downloadCSV("유보금현황_v2.csv",
          ["대리점명", "관리 조직", "적립 비율(원금 기준)", "한도", "현재 잔액", "한도 사용률", "상태", "보유 기간(일)", "최초 적립일", "최근 사용등록"],
          allStatuses().map(function (x) {
            var r = x.rst;
            var st = r.overLimit ? "인출 필요" : r.needUseReg ? "사용등록 필요" : "정상";
            return [x.brand.name, x.brand.managerName, r.conf.rate + "%", r.conf.limit, r.balance, (r.conf.limit ? Math.round(r.balance / r.conf.limit * 100) : 0) + "%", st, r.heldDays, r.firstAccrual || "", r.lastUseReg || ""];
          }));
      } else {
        A.downloadCSV("예치금현황_v2.csv", ["대리점명", "관리 조직", "예치금 잔액", "최근 변동일"],
          BRANDS.map(function (b) { return [b.name, b.managerName, depositBalance(b.id), depositLastAt(b.id)]; }));
      }
    });

    switchTab(tab);
  }

  /* ───────── 9. 부트스트랩 ───────── */
  document.addEventListener("DOMContentLoaded", function () {
    buildSidebar();
    var mode = document.body.dataset.v2Mode;
    if (mode === "list") initList(document.body.dataset.v2Type || "branch");
    if (mode === "detail") initDetail();
    if (mode === "reserve") initRetentionDeposit();
  });
})();
