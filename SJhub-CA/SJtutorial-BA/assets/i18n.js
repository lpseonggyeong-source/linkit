/* SJ Hub BA 관리자 사용설명서 — 한국어/中文 번역 코어
   페이지는 <script>window.I18N = { key: {ko:"...", zh:"..."}, ... }</script> 를 정의하고
   본문에는 data-i18n="key" 속성을 단 요소를 배치한다.
   실제 DOM 조립(헤더/사이드바/목차)은 guide-nav.js가 이 모듈을 호출해서 처리한다. */
window.BAI18N = (function () {
  "use strict";
  var LANG_KEY = "baManualLang";

  function getDict() {
    var d = {};
    if (window.I18N) Object.assign(d, window.I18N);
    return d;
  }

  function getLang() {
    return localStorage.getItem(LANG_KEY) || "ko";
  }

  function applyLang(lang) {
    var dict = getDict();
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var entry = dict[key];
      if (!entry) return;
      var text = entry[lang] != null ? entry[lang] : entry.ko;
      if (text != null) el.innerHTML = text;
    });
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "ko";
  }

  function setLang(lang, onChanged) {
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang);
    if (typeof onChanged === "function") onChanged(lang);
  }

  function buildSwitch(mountEl, onChanged) {
    if (!mountEl || mountEl.querySelector(".lang-switch")) return;
    var current = getLang();
    var wrap = document.createElement("div");
    wrap.className = "lang-switch";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Language switch");
    wrap.innerHTML =
      '<button type="button" class="lang-switch__btn' + (current === "ko" ? " is-active" : "") + '" data-lang="ko">한국어</button>' +
      '<button type="button" class="lang-switch__btn' + (current === "zh" ? " is-active" : "") + '" data-lang="zh">中文</button>';
    mountEl.appendChild(wrap);
    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-lang]");
      if (!btn) return;
      var lang = btn.getAttribute("data-lang");
      if (lang === getLang()) return;
      wrap.querySelectorAll(".lang-switch__btn").forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-lang") === lang);
      });
      setLang(lang, onChanged);
    });
  }

  return { getLang: getLang, setLang: setLang, applyLang: applyLang, buildSwitch: buildSwitch };
})();
