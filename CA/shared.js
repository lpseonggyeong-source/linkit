/* shared.js — link it CA/BA 어드민 공통 JavaScript */

(function () {
  "use strict";

  /* ─── Utility ─── */
  function formatCurrency(n) {
    if (n == null || n === "") return "—";
    return Number(n).toLocaleString("ko-KR") + "원";
  }
  function formatNumber(n) {
    if (n == null) return "—";
    return Number(n).toLocaleString("ko-KR");
  }
  function formatDate(s) {
    if (!s) return "—";
    return String(s).replace(/-/g, ".");
  }

  /* ─── Sidebar icons (inline SVG) ─── */
  var ICONS = {
    dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',
    brand:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    product:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    order:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>',
    seller:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    design:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
    settlement:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    notice:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    settings:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    logout:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  };

  function si(key) {
    return '<span class="admin-sidebar__nav-icon" aria-hidden="true">' + (ICONS[key] || "") + "</span>";
  }

  /* ─── CA Sidebar ─── */
  function buildCASidebar() {
    var page = location.pathname.split("/").pop() || "ca-001-dashboard.html";
    var SUB_TO_MAIN = {
      "ca-001-dashboard.html":          "ca-001-dashboard.html",
      "ca-002-brand-list.html":         "ca-002-brand-list.html",
      "ca-003-brand-register.html":     "ca-002-brand-list.html",
      "ca-006-product-list.html":       "ca-006-product-list.html",
      "ca-007-order-list.html":         "ca-007-order-list.html",
      "ca-009-seller-list.html":        "ca-009-seller-list.html",
      "ca-012-seller-brand.html":       "ca-009-seller-list.html",
      "ca-014-settlement-detail.html":       "ca-014-settlement-detail.html",
      "ca-016-notice.html":                  "ca-016-notice.html",
      "ca-017-settings.html":                "ca-017-settings.html",
    };
    var activeMain = SUB_TO_MAIN[page] || page;
    function mc(h) { return "admin-sidebar__main" + (h === activeMain ? " is-active" : ""); }
    function sc(h) { return "admin-sidebar__sub" + (h === page ? " is-active" : ""); }

    return (
      '<div class="admin-sidebar__logo">' +
        '<a href="ca-001-dashboard.html" class="admin-sidebar__logo-link">link it</a>' +
        '<span class="admin-sidebar__role-badge">CA</span>' +
      "</div>" +
      '<nav class="admin-sidebar__nav">' +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-001-dashboard.html" class="' + mc("ca-001-dashboard.html") + '">' + si("dashboard") + "<span>대시보드</span></a>" +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-002-brand-list.html" class="' + mc("ca-002-brand-list.html") + '">' + si("brand") + "<span>브랜드 관리</span></a>" +
          '<a href="ca-002-brand-list.html" class="' + sc("ca-002-brand-list.html") + '">계약 브랜드 목록</a>' +
          '<a href="ca-003-brand-register.html" class="' + sc("ca-003-brand-register.html") + '">브랜드 등록 신청</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-006-product-list.html" class="' + mc("ca-006-product-list.html") + '">' + si("product") + "<span>상품 관리</span></a>" +
          '<a href="ca-006-product-list.html" class="' + sc("ca-006-product-list.html") + '">상품 목록</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-007-order-list.html" class="' + mc("ca-007-order-list.html") + '">' + si("order") + "<span>주문 관리</span></a>" +
          '<a href="ca-007-order-list.html" class="' + sc("ca-007-order-list.html") + '">전체 주문 내역</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-009-seller-list.html" class="' + mc("ca-009-seller-list.html") + '">' + si("seller") + "<span>셀러 관리</span></a>" +
          '<a href="ca-009-seller-list.html" class="' + sc("ca-009-seller-list.html") + '">셀러 목록</a>' +
          '<a href="ca-012-seller-brand.html" class="' + sc("ca-012-seller-brand.html") + '">셀러-브랜드 연결</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-014-settlement-detail.html" class="' + mc("ca-014-settlement-detail.html") + '">' + si("settlement") + "<span>정산관리</span></a>" +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-016-notice.html" class="' + mc("ca-016-notice.html") + '">' + si("notice") + "<span>공지사항</span></a>" +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-017-settings.html" class="' + mc("ca-017-settings.html") + '">' + si("settings") + "<span>환경설정</span></a>" +
        "</div>" +

        '<div class="admin-sidebar__divider"></div>' +

        '<div class="admin-sidebar__group">' +
          '<a href="../../login.html" class="admin-sidebar__main admin-sidebar__main--logout">' + si("logout") + "<span>로그아웃</span></a>" +
        "</div>" +

      "</nav>"
    );
  }

  /* ─── BA Sidebar ─── */
  function buildBASidebar() {
    var page = location.pathname.split("/").pop() || "ba-001-dashboard.html";
    var SUB_TO_MAIN = {
      "ba-001-dashboard.html":        "ba-001-dashboard.html",
      "ba-002-product-register.html": "ba-003-product-list.html",
      "ba-003-product-list.html":     "ba-003-product-list.html",
      "ba-006-order-list.html":       "ba-006-order-list.html",
      "ba-008-seller-list.html":      "ba-008-seller-list.html",
      "ba-010-design-template.html":  "ba-010-design-template.html",
      "ba-011-design-editor.html":    "ba-010-design-template.html",
      "ba-012-settlement.html":       "ba-012-settlement.html",
      "ba-014-notice-list.html":      "ba-014-notice-list.html",
      "ba-016-settings.html":         "ba-016-settings.html",
    };
    var activeMain = SUB_TO_MAIN[page] || page;
    function mc(h) { return "admin-sidebar__main" + (h === activeMain ? " is-active" : ""); }
    function sc(h) { return "admin-sidebar__sub" + (h === page ? " is-active" : ""); }

    return (
      '<div class="admin-sidebar__logo">' +
        '<a href="ba-001-dashboard.html" class="admin-sidebar__logo-link">link it</a>' +
        '<span class="admin-sidebar__role-badge">BA</span>' +
      "</div>" +
      '<nav class="admin-sidebar__nav">' +

        '<div class="admin-sidebar__group">' +
          '<a href="ba-001-dashboard.html" class="' + mc("ba-001-dashboard.html") + '">' + si("dashboard") + "<span>대시보드</span></a>" +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ba-003-product-list.html" class="' + mc("ba-003-product-list.html") + '">' + si("product") + "<span>상품 관리</span></a>" +
          '<a href="ba-002-product-register.html" class="' + sc("ba-002-product-register.html") + '">상품 등록</a>' +
          '<a href="ba-003-product-list.html" class="' + sc("ba-003-product-list.html") + '">상품 목록</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ba-006-order-list.html" class="' + mc("ba-006-order-list.html") + '">' + si("order") + "<span>주문 관리</span></a>" +
          '<a href="ba-006-order-list.html" class="' + sc("ba-006-order-list.html") + '">주문 내역</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ba-008-seller-list.html" class="' + mc("ba-008-seller-list.html") + '">' + si("seller") + "<span>셀러 관리</span></a>" +
          '<a href="ba-008-seller-list.html" class="' + sc("ba-008-seller-list.html") + '">연결 셀러 목록</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ba-010-design-template.html" class="' + mc("ba-010-design-template.html") + '">' + si("design") + "<span>디자인 관리</span></a>" +
          '<a href="ba-010-design-template.html" class="' + sc("ba-010-design-template.html") + '">템플릿 선택</a>' +
          '<a href="ba-011-design-editor.html" class="' + sc("ba-011-design-editor.html") + '">디자인 편집</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ba-012-settlement.html" class="' + mc("ba-012-settlement.html") + '">' + si("settlement") + "<span>정산 관리</span></a>" +
          '<a href="ba-012-settlement.html" class="' + sc("ba-012-settlement.html") + '">브랜드 매출 요약</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ba-014-notice-list.html" class="' + mc("ba-014-notice-list.html") + '">' + si("notice") + "<span>공지사항</span></a>" +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ba-016-settings.html" class="' + mc("ba-016-settings.html") + '">' + si("settings") + "<span>환경설정</span></a>" +
        "</div>" +

        '<div class="admin-sidebar__divider"></div>' +

        '<div class="admin-sidebar__group">' +
          '<a href="../../login.html" class="admin-sidebar__main admin-sidebar__main--logout">' + si("logout") + "<span>로그아웃</span></a>" +
        "</div>" +

      "</nav>"
    );
  }

  /* ─── Sidebar init ─── */
  function initSidebar() {
    var el = document.getElementById("adminSidebar");
    if (!el) return;
    var role = el.dataset.role || "ba";
    el.innerHTML = role === "ca" ? buildCASidebar() : buildBASidebar();
  }

  /* ─── Mobile hamburger ─── */
  function initMobile() {
    var btn = document.getElementById("adminHamburger");
    var sidebar = document.querySelector(".admin-sidebar");
    var overlay = document.getElementById("adminOverlay");
    if (!btn || !sidebar || !overlay) return;
    function open() { sidebar.classList.add("is-open"); overlay.classList.add("is-visible"); }
    function close() { sidebar.classList.remove("is-open"); overlay.classList.remove("is-visible"); }
    btn.addEventListener("click", open);
    overlay.addEventListener("click", close);
  }

  /* ─── Pagination renderer ─── */
  function renderPagination(container, total, current, pageSize, onPage) {
    if (!container) return;
    var pages = Math.ceil(total / pageSize);
    if (pages <= 1) { container.innerHTML = ""; return; }
    var html = "";
    if (current > 1) html += '<button class="admin-page-btn" data-p="' + (current - 1) + '">‹</button>';
    for (var i = 1; i <= pages; i++) {
      html += '<button class="admin-page-btn' + (i === current ? " is-active" : "") + '" data-p="' + i + '">' + i + "</button>";
    }
    if (current < pages) html += '<button class="admin-page-btn" data-p="' + (current + 1) + '">›</button>';
    container.innerHTML = html;
    container.querySelectorAll("[data-p]").forEach(function (b) {
      b.addEventListener("click", function () { onPage(+b.dataset.p); });
    });
  }

  /* ─── Badge helper ─── */
  function badge(text, cls) {
    return '<span class="admin-badge ' + cls + '">' + text + "</span>";
  }

  function orderBadge(status) {
    var map = {
      "상품 준비중":  "admin-badge--preparing",
      "취소 준비중":  "admin-badge--pending",
      "취소완료":     "admin-badge--cancel",
      "배송준비중":   "admin-badge--delivery-ready",
      "배송중":       "admin-badge--shipping",
    };
    return badge(status, map[status] || "admin-badge--inactive");
  }

  function approvalBadge(status) {
    var map = {
      "승인 완료": "admin-badge--approved",
      "승인 대기": "admin-badge--wait",
      "반려":      "admin-badge--rejected",
      "승인":      "admin-badge--approved",
      "정지":      "admin-badge--inactive",
    };
    return badge(status, map[status] || "admin-badge--inactive");
  }

  function settlementBadge(status) {
    var map = {
      "정산 예정":  "admin-badge--sett-expected",
      "정산 확정":  "admin-badge--sett-confirmed",
      "지급 완료":  "admin-badge--sett-paid",
      "미정산":     "admin-badge--sett-expected",
      "정산중":     "admin-badge--sett-confirmed",
      "정산완료":   "admin-badge--sett-paid",
    };
    return badge(status, map[status] || "admin-badge--inactive");
  }

  function sellerTypeBadge(type) {
    if (type === "업체 소속") return badge("업체 소속", "admin-badge--company");
    return badge("브랜드 직접", "admin-badge--brand-direct");
  }

  /* ─── Expose globals ─── */
  window.AdminShared = {
    formatCurrency: formatCurrency,
    formatNumber:   formatNumber,
    formatDate:     formatDate,
    renderPagination: renderPagination,
    badge:          badge,
    orderBadge:     orderBadge,
    approvalBadge:  approvalBadge,
    settlementBadge: settlementBadge,
    sellerTypeBadge: sellerTypeBadge,
    initSidebar:    initSidebar,
    initMobile:     initMobile,
  };

  /* ─── Auto init ─── */
  function autoInit() {
    initSidebar();
    initMobile();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }

})();
