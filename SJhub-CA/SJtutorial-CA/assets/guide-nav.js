/* SJ Hub CA 관리자 사용설명서 — 상단헤더/좌측 챕터사이드바/우측 목차 자동 조립 + 탭 전환
   참고: Link it BA 어드민 가이드(guide-sidebar.js) 구조 */
(function () {
  "use strict";
  var CHAPTERS = [
    { num: "1", ko: "대시보드", zh: "主页", href: "01-dashboard.html", color: "#64748b" },
    { num: "2", ko: "조직관리", zh: "组织管理", href: "02-organization.html", color: "#ea580c" },
    { num: "3", ko: "상점관리", zh: "商店管理", href: "03-store.html", color: "#2563eb" },
    { num: "4", ko: "상품관리", zh: "商品管理", href: "04-product.html", color: "#475569" },
    { num: "5", ko: "주문관리", zh: "订单管理", href: "05-order.html", color: "#e62e21" },
    { num: "6", ko: "정산관리", zh: "结算管理", href: "06-settlement.html", color: "#0d9488" },
    { num: "7", ko: "공지사항", zh: "公告", href: "07-notice.html", color: "#7c3aed" },
    { num: "8", ko: "시스템설정", zh: "系统设置", href: "08-settings.html", color: "#64748b" }
  ];

  var APPENDIX = [
    { ko: "정산 계산 공식 안내서", zh: "结算计算公式说明书", href: "09-settlement-formula.html", color: "#0d9488" }
  ];

  var currentFile = location.pathname.split("/").pop() || "index.html";
  var activeCh = CHAPTERS.find(function (c) { return c.href === currentFile; }) || null;
  var activeApp = !activeCh ? (APPENDIX.find(function (a) { return a.href === currentFile; }) || null) : null;
  if (activeCh) document.documentElement.style.setProperty("--accent", activeCh.color);
  if (activeApp) document.documentElement.style.setProperty("--accent", activeApp.color);

  var header, nav, toc, tocItems = [], ioInstance = null;

  function chName(ch, lang) { return lang === "zh" ? ch.zh : ch.ko; }

  function renderHeader(lang) {
    if (!header) {
      header = document.createElement("header");
      header.className = "guide-header";
      document.body.insertBefore(header, document.body.firstChild);
    }
    header.innerHTML =
      '<a class="gh-logo" href="index.html"><span class="gh-logo-badge">CA</span><span class="gh-logo-label">' +
      (lang === "zh" ? "SJ Hub 使用说明书" : "SJ Hub 사용설명서") + "</span></a>" +
      (activeCh
        ? '<span class="gh-divider"></span><span class="gh-chapter-name">Ch' + activeCh.num + ". " + chName(activeCh, lang) + "</span>"
        : activeApp
        ? '<span class="gh-divider"></span><span class="gh-chapter-name">' + (lang === "zh" ? "附录 · " : "부록 · ") + chName(activeApp, lang) + "</span>"
        : '<span class="gh-divider"></span><span class="gh-chapter-name">' + (lang === "zh" ? "首页" : "표지") + "</span>") +
      '<div id="langSwitchMount" style="margin-left:auto"></div>';
    CAI18N.buildSwitch(header.querySelector("#langSwitchMount"), onLangChanged);
  }

  function renderNav(lang) {
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "guide-nav";
      nav.id = "guideNav";
    }
    var items = CHAPTERS.map(function (ch) {
      var isActive = !!(activeCh && ch.href === activeCh.href);
      return '<a class="gn-ch-item' + (isActive ? " active" : "") + '" href="' + ch.href + '">' +
        '<span class="gn-ch-dot" style="background:' + ch.color + '"></span>' +
        '<span class="gn-ch-num">' + ch.num + "</span>" + chName(ch, lang) + "</a>";
    }).join("");
    var appItems = APPENDIX.map(function (a) {
      var isActive = !!(activeApp && a.href === activeApp.href);
      return '<a class="gn-ch-item' + (isActive ? " active" : "") + '" href="' + a.href + '">' +
        '<span class="gn-ch-dot" style="background:' + a.color + '"></span>' +
        '<span class="gn-ch-num">·</span>' + chName(a, lang) + "</a>";
    }).join("");
    nav.innerHTML =
      '<a class="gn-home-item" href="index.html">' + (lang === "zh" ? "📘 说明书首页" : "📘 설명서 홈") + "</a>" +
      '<div class="gn-group-label">' + (lang === "zh" ? "章节" : "챕터") + "</div>" + items +
      '<div class="gn-group-label">' + (lang === "zh" ? "附录" : "부록") + "</div>" + appItems;
  }

  function buildToc() {
    var sections = document.querySelectorAll(".guide-section");
    if (!sections.length) return;
    toc = document.createElement("aside");
    toc.className = "guide-toc";
    toc.id = "guideToc";
    toc.innerHTML = '<div class="gt-label" data-toc-label></div><div id="gt-list"></div>';
    var list = toc.querySelector("#gt-list");
    var idx = 0;
    sections.forEach(function (sec) {
      idx++;
      if (!sec.id) sec.id = "sec-" + idx;
      var pill = sec.querySelector(".step-pill");
      var title = sec.querySelector(".sec-title");
      if (!title) return;
      var numTxt = pill ? pill.textContent.trim() : String(idx);
      var a = document.createElement("a");
      a.className = "gt-item";
      a.href = "#" + sec.id;
      a.textContent = numTxt + ". " + title.textContent.trim();
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var pane = sec.closest(".tab-pane");
        if (pane && !pane.classList.contains("active")) {
          var idxTab = Array.prototype.indexOf.call(document.querySelectorAll(".tab-pane"), pane);
          var tabBtn = document.querySelectorAll(".inner-tab")[idxTab];
          if (tabBtn) tabBtn.click();
          setTimeout(function () { sec.scrollIntoView({ behavior: "smooth" }); }, 150);
        } else {
          sec.scrollIntoView({ behavior: "smooth" });
        }
      });
      list.appendChild(a);
      tocItems.push({ sec: sec, link: a });
    });
    observeToc();
  }

  function observeToc() {
    if (ioInstance) ioInstance.disconnect();
    if (!tocItems.length) return;
    ioInstance = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        tocItems.forEach(function (it) { it.link.classList.remove("active"); });
        var m = tocItems.find(function (it) { return it.sec === e.target; });
        if (m) m.link.classList.add("active");
      });
    }, { threshold: 0, rootMargin: "-56px 0px -55% 0px" });
    tocItems.forEach(function (it) { ioInstance.observe(it.sec); });
  }

  function refreshTocText() {
    tocItems.forEach(function (it) {
      var pill = it.sec.querySelector(".step-pill");
      var title = it.sec.querySelector(".sec-title");
      if (!title) return;
      var numTxt = pill ? pill.textContent.trim() : "";
      it.link.textContent = numTxt + ". " + title.textContent.trim();
    });
    var label = toc && toc.querySelector("[data-toc-label]");
    if (label) label.textContent = CAI18N.getLang() === "zh" ? "本页目录" : "이 페이지 목차";
  }

  function mountLayout() {
    var bodyWrap = document.querySelector(".body-wrap");
    if (!bodyWrap) return;
    var spacer = document.createElement("div");
    spacer.className = "guide-nav-spacer";
    bodyWrap.insertBefore(spacer, bodyWrap.firstChild);
    bodyWrap.insertBefore(nav, spacer);
    if (toc) bodyWrap.appendChild(toc);
  }

  function onLangChanged(lang) {
    renderHeader(lang);
    renderNav(lang);
    refreshTocText();
  }

  window.switchTab = function (id, el) {
    document.querySelectorAll(".tab-pane").forEach(function (p) { p.classList.remove("active"); });
    document.querySelectorAll(".inner-tab").forEach(function (t) { t.classList.remove("active"); });
    var pane = document.getElementById("tab-" + id);
    if (pane) pane.classList.add("active");
    el.classList.add("active");
    var bar = document.querySelector(".inner-tabs");
    if (bar) window.scrollTo({ top: bar.offsetTop - 50, behavior: "smooth" });
  };

  document.addEventListener("DOMContentLoaded", function () {
    var lang = CAI18N.getLang();
    CAI18N.applyLang(lang);
    renderHeader(lang);
    renderNav(lang);
    buildToc();
    mountLayout();
    refreshTocText();
  });
})();
