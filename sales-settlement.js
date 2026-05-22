/* ═══════════════════════════════════════════════════════════════════
   sales-settlement.js — 매출 관리 / 정산 페이지 전용 스크립트

   정산 단위: 판매 건당이 아닌 셀러(인플루언서)당 + 지정 기간 단위

   [MOCK DATA INDEX] 백엔드 연동 시 교체 필요한 항목
   ─────────────────────────────────────────────────────────────────
   1. settlementSummary    ~ line 30   → GET /api/settlement/summary
   2. settlementRecords    ~ line 54   → GET /api/settlement/records
   3. filterSettlementRecords()        → GET /api/settlement/records?{filters}
   4. updateSettlementRecord()         → PATCH /api/settlement/records/{id}
   5. 엑셀 다운로드 버튼               → GET /api/settlement/export?{filters}
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ────────────────────────────────────────────────────────────────
     [MOCK DATA 1] 매출 요약 (전체 집계)
     API 연결 시: GET /api/settlement/summary
     응답 예시:
       { totalSales, paidAmount, canceledRefundedAmount, feeAmount,
         expectedSettlementAmount, completedSettlementAmount,
         unsettledAmount, heldAmount }
  ─────────────────────────────────────────────────────────────────── */
  var _SD = window.MOCK_SETTLEMENT || {};
  var settlementSummary = _SD.summary || {};
  var settlementRecords = _SD.records || [];

  /* ────────────────────────────────────────────────────────────────
     로딩 상태 변수
     API 연결 시: fetch 시작 전 isLoading = true → showLoadingState()
                  fetch 완료 후 isLoading = false → hideLoadingState()
  ─────────────────────────────────────────────────────────────────── */
  var isLoading = false; // eslint-disable-line no-unused-vars

  /* 현재 열린 상세 모달의 레코드 ID */
  var currentDetailId = null;

  /* 모달 오픈 시점의 원본 데이터 (취소 시 비교 기준) */
  var originalDetailData = null;

  /* 현재 적용된 필터 (엑셀 다운로드 시에도 사용) */
  var currentFilters = {
    dateFrom:         "",
    dateTo:           "",
    settlementStatus: "",
    sellerName:       "",
  };

  /* ────────────────────────────────────────────────────────────────
     유틸 함수
  ─────────────────────────────────────────────────────────────────── */

  /**
   * formatCurrency(value)
   * 숫자 → "1,250,000원" 형식
   * [API 연결 후] 서버 포맷 문자열을 그대로 사용해도 무방
   */
  function formatCurrency(value) {
    if (typeof value !== "number" || isNaN(value)) return "0원";
    return value.toLocaleString("ko-KR") + "원";
  }

  /**
   * filterSettlementRecords(filters)
   * 현재 필터 조건에 맞는 정산 레코드 반환
   * [API 연결 시] GET /api/settlement/records?{filters} 호출로 교체
   *
   * 기간 필터 로직: 조회 범위와 정산 기간이 겹치는 레코드 반환
   *   → record.periodStart <= filter.dateTo
   *   → record.periodEnd   >= filter.dateFrom
   */
  function filterSettlementRecords(filters) {
    return settlementRecords.filter(function (rec) {

      /* 기간 필터 (정산 기간 overlap) */
      if (filters.dateFrom) {
        var periodEnd  = dotDateToObj(rec.periodEnd);
        var filterFrom = dashDateToObj(filters.dateFrom);
        if (periodEnd && filterFrom && periodEnd < filterFrom) return false;
      }
      if (filters.dateTo) {
        var periodStart = dotDateToObj(rec.periodStart);
        var filterTo    = dashDateToObj(filters.dateTo);
        if (periodStart && filterTo && periodStart > filterTo) return false;
      }

      /* 정산 상태 필터 (완전 일치) */
      if (filters.settlementStatus && rec.settlementStatus !== filters.settlementStatus) return false;

      /* 셀러명 필터 (완전 일치) */
      if (filters.sellerName && rec.sellerName !== filters.sellerName) return false;

      return true;
    });
  }

  /**
   * updateSettlementRecord(id, updatedData)
   * mock data 기준으로 정산 레코드 업데이트
   * [API 연결 시] PATCH /api/settlement/records/{id} body: updatedData 로 교체
   *               성공 응답 후 GET /api/settlement/records?{currentFilters} 재조회
   */
  function updateSettlementRecord(id, updatedData) {
    var target = null;
    for (var i = 0; i < settlementRecords.length; i++) {
      if (settlementRecords[i].id === id) { target = settlementRecords[i]; break; }
    }
    if (!target) return null;

    if (updatedData.settlementStatus !== undefined) target.settlementStatus = updatedData.settlementStatus;
    if (updatedData.settlementDate   !== undefined) target.settlementDate   = updatedData.settlementDate;
    if (updatedData.settlementMemo   !== undefined) target.settlementMemo   = updatedData.settlementMemo;
    if (updatedData.holdReason       !== undefined) target.holdReason       = updatedData.holdReason;

    return target;
  }

  /* ── 날짜 변환 헬퍼 ── */

  /* "YYYY.MM.DD" → Date */
  function dotDateToObj(str) {
    if (!str) return null;
    var p = str.split(".");
    return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null;
  }

  /* "YYYY-MM-DD" (input[type=date] 값) → Date */
  function dashDateToObj(str) {
    if (!str) return null;
    var p = str.split("-");
    return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null;
  }

  /* "YYYY-MM-DD" → "YYYY.MM.DD" */
  function dashToDot(str) { return str ? str.replace(/-/g, ".") : ""; }

  /* "YYYY.MM.DD" → "YYYY-MM-DD" */
  function dotToDash(str) { return str ? str.replace(/\./g, "-") : ""; }

  /* XSS 방지 */
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ────────────────────────────────────────────────────────────────
     SettlementStatusBadge
  ─────────────────────────────────────────────────────────────────── */
  function getBadgeClass(status) {
    switch (status) {
      case "정산 예정": return "admin-badge admin-badge--settlement-expected t-label-2-sb";
      case "정산 완료": return "admin-badge admin-badge--settlement-done t-label-2-sb";
      case "보류":      return "admin-badge admin-badge--settlement-hold t-label-2-sb";
      default:         return "admin-badge t-label-2-sb";
    }
  }

  function badgeHtml(status) {
    return '<span class="' + getBadgeClass(status) + '">' + esc(status) + '</span>';
  }

  /* ────────────────────────────────────────────────────────────────
     로딩 상태 토글
     [API 연결 시] fetch 전후로 호출
  ─────────────────────────────────────────────────────────────────── */
  function showLoadingState() {
    var el = document.getElementById("settlementLoadingState");
    if (el) el.style.display = "block";
    var card = document.getElementById("settlementTableCard");
    if (card) card.style.display = "none";
    var mob = document.getElementById("settlementMobileWrap");
    if (mob) mob.style.display = "none";
  }

  function hideLoadingState() {
    var el = document.getElementById("settlementLoadingState");
    if (el) el.style.display = "none";
    var card = document.getElementById("settlementTableCard");
    if (card) card.style.removeProperty("display");
    var mob = document.getElementById("settlementMobileWrap");
    if (mob) mob.style.removeProperty("display");
  }

  /* ────────────────────────────────────────────────────────────────
     SettlementSummaryCards
  ─────────────────────────────────────────────────────────────────── */
  var SUMMARY_CARDS = [
    { key: "totalSales",                label: "총매출",          sub: "전체 셀러 판매 합계" },
    { key: "paidAmount",                label: "결제 완료 금액",   sub: "결제 완료 주문 합계" },
    { key: "canceledRefundedAmount",    label: "취소/환불 금액",   sub: "취소·환불 처리 합계" },
    { key: "feeAmount",                 label: "수수료",           sub: "플랫폼 수수료 합계" },
    { key: "expectedSettlementAmount",  label: "정산 예정 금액",   sub: "정산 대기 중인 합계" },
    { key: "completedSettlementAmount", label: "정산 완료 금액",   sub: "정산 처리 완료 합계" },
    { key: "unsettledAmount",           label: "미정산 금액",      sub: "아직 정산 미처리" },
    { key: "heldAmount",                label: "보류 금액",        sub: "보류 상태 합계" },
  ];

  function renderSummaryCards(summary) {
    var grid = document.getElementById("settlementSummaryGrid");
    if (!grid) return;
    var html = "";
    SUMMARY_CARDS.forEach(function (cfg) {
      html +=
        '<div class="settlement-summary-card">' +
          '<div class="settlement-summary-card__label t-body-2-rg">' + cfg.label + '</div>' +
          '<div class="settlement-summary-card__amount">' + formatCurrency(summary[cfg.key]) + '</div>' +
          '<div class="settlement-summary-card__sub t-body-3-rg">' + cfg.sub + '</div>' +
        '</div>';
    });
    grid.innerHTML = html;
  }

  /* ────────────────────────────────────────────────────────────────
     SettlementTable — PC 테이블
     컬럼: 체크박스 | 정산 기간 | 셀러/인플루언서 | 주문 건수 |
           총 판매금액 | 취소/환불 | 수수료 | 정산 예정 금액 | 정산 상태 | 관리
  ─────────────────────────────────────────────────────────────────── */
  function renderSettlementTable(records) {
    var tbody      = document.getElementById("settlementTableBody");
    var emptyState = document.getElementById("settlementEmptyState");
    if (!tbody) return;

    if (records.length === 0) {
      tbody.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }
    if (emptyState) emptyState.style.display = "none";

    var html = "";
    records.forEach(function (rec) {
      /* [MOCK] 각 필드 → API 응답 필드명에 맞게 교체 */
      var period = esc(rec.periodStart) + " ~ " + esc(rec.periodEnd);
      html +=
        '<tr data-record-id="' + rec.id + '">' +
          '<td style="text-align:center;">' +
            '<input type="checkbox" class="settlement-row-check" data-record-id="' + rec.id + '"' +
            ' aria-label="' + esc(rec.sellerName) + ' ' + esc(rec.periodStart) + ' 선택"' +
            ' style="accent-color:var(--admin-red);cursor:pointer;" />' +
          '</td>' +
          '<td style="white-space:nowrap;" class="t-body-3-rg">' + period + '</td>' +
          '<td style="font-weight:600;">' + esc(rec.sellerName) + '</td>' +
          '<td style="text-align:center; color:var(--admin-muted);">' + rec.orderCount + '건</td>' +
          '<td style="text-align:right; font-weight:600;">' + formatCurrency(rec.totalSales) + '</td>' +
          '<td style="text-align:right; color:' + (rec.totalRefund > 0 ? 'var(--admin-red)' : 'var(--admin-muted)') + ';">' +
            (rec.totalRefund > 0 ? '-' + formatCurrency(rec.totalRefund) : '—') +
          '</td>' +
          '<td style="text-align:right; color:var(--admin-muted);">' + formatCurrency(rec.totalFee) + '</td>' +
          '<td style="text-align:right; font-weight:700; color:var(--admin-heading);">' +
            formatCurrency(rec.expectedSettlementAmount) +
          '</td>' +
          '<td style="text-align:center;">' + badgeHtml(rec.settlementStatus) + '</td>' +
          '<td style="text-align:center;">' +
            '<button type="button" class="admin-btn admin-btn--outline admin-btn--sm settlement-detail-btn"' +
            ' data-record-id="' + rec.id + '" aria-label="' + esc(rec.sellerName) + ' 상세보기">상세보기</button>' +
          '</td>' +
        '</tr>';
    });

    tbody.innerHTML = html;
    bindDetailBtns(tbody);

    var selectAll = document.getElementById("settlementSelectAll");
    if (selectAll) selectAll.checked = false;
  }

  /* ────────────────────────────────────────────────────────────────
     SettlementMobileCards — 모바일 카드 리스트
  ─────────────────────────────────────────────────────────────────── */
  function renderSettlementMobileCards(records) {
    var list = document.getElementById("settlementMobileList");
    if (!list) return;

    if (records.length === 0) {
      list.innerHTML = '<div class="settlement-empty-state" role="status">조회된 정산 내역이 없습니다.</div>';
      return;
    }

    var html = "";
    records.forEach(function (rec) {
      var period = esc(rec.periodStart) + " ~ " + esc(rec.periodEnd);
      html +=
        '<div class="settlement-mobile-card">' +
          '<div class="settlement-mobile-card__top">' +
            '<span class="settlement-mobile-card__order-no">' + esc(rec.sellerName) + '</span>' +
            badgeHtml(rec.settlementStatus) +
          '</div>' +
          '<div class="settlement-mobile-card__product t-body-3-rg" style="color:var(--admin-muted); margin-bottom:6px;">' + period + '</div>' +
          '<div class="settlement-mobile-card__seller t-body-3-rg">주문 ' + rec.orderCount + '건</div>' +
          '<div class="settlement-mobile-card__amount">' +
            '<span class="settlement-mobile-card__amount-label t-body-3-rg">정산 예정 금액</span>' +
            '<span class="settlement-mobile-card__amount-value t-label-1-sb">' +
              formatCurrency(rec.expectedSettlementAmount) +
            '</span>' +
          '</div>' +
          '<button type="button" class="admin-btn admin-btn--outline admin-btn--sm settlement-detail-btn"' +
          ' data-record-id="' + rec.id + '" style="width:100%; margin-top:10px;"' +
          ' aria-label="' + esc(rec.sellerName) + ' 상세보기">상세보기</button>' +
        '</div>';
    });

    list.innerHTML = html;
    bindDetailBtns(list);
  }

  /* 상세보기 버튼 이벤트 (테이블/모바일 공용) */
  function bindDetailBtns(container) {
    container.querySelectorAll(".settlement-detail-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openDetailModal(parseInt(this.getAttribute("data-record-id"), 10));
      });
    });
  }

  /* 전체 렌더링 진입점 */
  function renderAll(records) {
    renderSettlementTable(records);
    renderSettlementMobileCards(records);
  }

  /* ────────────────────────────────────────────────────────────────
     SettlementDetailPanel — 정산 상세 모달
  ─────────────────────────────────────────────────────────────────── */
  function findRecordById(id) {
    for (var i = 0; i < settlementRecords.length; i++) {
      if (settlementRecords[i].id === id) return settlementRecords[i];
    }
    return null;
  }

  function openDetailModal(id) {
    var rec = findRecordById(id);
    if (!rec) return;

    currentDetailId = id;
    originalDetailData = {
      settlementStatus: rec.settlementStatus,
      settlementDate:   rec.settlementDate,
      settlementMemo:   rec.settlementMemo,
      holdReason:       rec.holdReason,
    };

    /* 읽기 전용 필드 채우기 */
    /* [MOCK] 각 값 → API 응답 데이터로 교체 */
    setText("detailSellerName",         rec.sellerName);
    setText("detailPeriod",             rec.periodStart + " ~ " + rec.periodEnd);
    setText("detailOrderCount",         rec.orderCount + "건");
    setText("detailTotalSales",         formatCurrency(rec.totalSales));
    setText("detailTotalDeliveryFee",   formatCurrency(rec.totalDeliveryFee));
    setText("detailTotalDiscount",      formatCurrency(rec.totalDiscount));
    setText("detailTotalRefund",        rec.totalRefund > 0 ? formatCurrency(rec.totalRefund) : "—");
    setText("detailTotalFee",           formatCurrency(rec.totalFee));
    setText("detailExpectedSettlement", formatCurrency(rec.expectedSettlementAmount));

    /* 수정 가능 필드 채우기 */
    setVal("editSettlementStatus", rec.settlementStatus);
    setVal("editSettlementDate",   dotToDash(rec.settlementDate));
    setVal("editSettlementMemo",   rec.settlementMemo);
    setVal("editHoldReason",       rec.holdReason);

    toggleHoldReasonField(rec.settlementStatus === "보류");
    setSaveBtn(false);
    hideEl("holdReasonError");

    var modal = document.getElementById("settlementDetailModal");
    if (modal) modal.classList.add("is-open");
  }

  function closeDetailModal() {
    var modal = document.getElementById("settlementDetailModal");
    if (modal) modal.classList.remove("is-open");
    currentDetailId    = null;
    originalDetailData = null;
  }

  function toggleHoldReasonField(show) {
    var field = document.getElementById("holdReasonField");
    if (field) field.style.display = show ? "block" : "none";
  }

  function setSaveBtn(enabled) {
    var btn = document.getElementById("settlementDetailSaveBtn");
    if (btn) btn.disabled = !enabled;
  }

  function hideEl(id) { var el = document.getElementById(id); if (el) el.style.display = "none"; }
  function showEl(id) { var el = document.getElementById(id); if (el) el.style.display = "block"; }
  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  function setVal(id, v)  { var el = document.getElementById(id); if (el) el.value = v != null ? v : ""; }
  function getVal(id)     { var el = document.getElementById(id); return el ? el.value : ""; }

  /* 변경 감지 → 저장 버튼 활성/비활성 */
  function checkDetailChanged() {
    if (!originalDetailData) return;
    var changed = (
      getVal("editSettlementStatus") !== originalDetailData.settlementStatus ||
      getVal("editSettlementDate")   !== dotToDash(originalDetailData.settlementDate) ||
      getVal("editSettlementMemo")   !== (originalDetailData.settlementMemo || "") ||
      getVal("editHoldReason")       !== (originalDetailData.holdReason || "")
    );
    setSaveBtn(changed);
  }

  /* ────────────────────────────────────────────────────────────────
     정산 상세 모달 이벤트 바인딩
  ─────────────────────────────────────────────────────────────────── */
  function initDetailModal() {
    var overlay   = document.getElementById("settlementDetailOverlay");
    var closeBtn  = document.getElementById("settlementDetailClose");
    var cancelBtn = document.getElementById("settlementDetailCancelBtn");
    var saveBtn   = document.getElementById("settlementDetailSaveBtn");
    var statusSel = document.getElementById("editSettlementStatus");

    if (overlay)   overlay.addEventListener("click",  closeDetailModal);
    if (closeBtn)  closeBtn.addEventListener("click",  closeDetailModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeDetailModal);

    if (statusSel) {
      statusSel.addEventListener("change", function () {
        toggleHoldReasonField(this.value === "보류");
        hideEl("holdReasonError");
        checkDetailChanged();
      });
    }

    ["editSettlementDate", "editSettlementMemo", "editHoldReason"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input",  checkDetailChanged);
        el.addEventListener("change", checkDetailChanged);
      }
    });

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var status     = getVal("editSettlementStatus");
        var holdReason = getVal("editHoldReason").trim();

        if (status === "보류" && !holdReason) {
          showEl("holdReasonError");
          var holdField = document.getElementById("editHoldReason");
          if (holdField) holdField.focus();
          return;
        }
        hideEl("holdReasonError");

        /* [MOCK] PATCH /api/settlement/records/{currentDetailId} */
        var updated = updateSettlementRecord(currentDetailId, {
          settlementStatus: status,
          settlementDate:   dashToDot(getVal("editSettlementDate")),
          settlementMemo:   getVal("editSettlementMemo"),
          holdReason:       holdReason,
        });

        if (updated) {
          renderAll(filterSettlementRecords(currentFilters));
          closeDetailModal();
          alert("정산 정보가 저장되었습니다.");
        }
      });
    }
  }

  /* ────────────────────────────────────────────────────────────────
     SettlementFilter — 검색/필터 이벤트 바인딩
  ─────────────────────────────────────────────────────────────────── */
  function applyFilter() {
    currentFilters = {
      dateFrom:         getVal("settlementDateFrom"),
      dateTo:           getVal("settlementDateTo"),
      settlementStatus: getVal("settlementStatusFilter"),
      sellerName:       getVal("settlementSellerFilter"),
    };
    /* [API 연결 시] showLoadingState() → fetch → hideLoadingState() 순으로 교체 */
    renderAll(filterSettlementRecords(currentFilters));
  }

  function initFilter() {
    var searchBtn = document.getElementById("settlementSearchBtn");
    if (searchBtn) searchBtn.addEventListener("click", applyFilter);
  }

  /* ────────────────────────────────────────────────────────────────
     엑셀 다운로드 버튼
  ─────────────────────────────────────────────────────────────────── */
  function initExcelBtn() {
    var btn = document.getElementById("settlementExcelBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      // [TODO] GET /api/settlement/export?{currentFilters} → xlsx 다운로드
      alert("현재 필터 조건 기준으로 다운로드됩니다.");
    });
  }

  /* ────────────────────────────────────────────────────────────────
     전체 선택 체크박스
  ─────────────────────────────────────────────────────────────────── */
  function initSelectAll() {
    var selectAll = document.getElementById("settlementSelectAll");
    if (!selectAll) return;
    selectAll.addEventListener("change", function () {
      var checked = this.checked;
      document.querySelectorAll(".settlement-row-check").forEach(function (cb) { cb.checked = checked; });
    });
    document.addEventListener("change", function (e) {
      if (!e.target.classList.contains("settlement-row-check")) return;
      var all     = document.querySelectorAll(".settlement-row-check");
      var checked = document.querySelectorAll(".settlement-row-check:checked");
      if (selectAll) selectAll.checked = all.length > 0 && all.length === checked.length;
    });
  }

  /* ────────────────────────────────────────────────────────────────
     페이지 초기화
  ─────────────────────────────────────────────────────────────────── */
  function init() {
    /* [API 연결 시]
       showLoadingState();
       Promise.all([
         fetch('/api/settlement/summary').then(r => r.json()),
         fetch('/api/settlement/records').then(r => r.json()),
       ]).then(function(results) {
         renderSummaryCards(results[0]);
         renderAll(results[1]);
       }).finally(hideLoadingState);
    */
    renderSummaryCards(settlementSummary);
    renderAll(settlementRecords);
    initFilter();
    initDetailModal();
    initExcelBtn();
    initSelectAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
