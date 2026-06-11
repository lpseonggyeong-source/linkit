/**
 * 링크잇 공통 헤더 컴포넌트
 * 페이지에 <div id="header-root"></div> 를 놓고 이 스크립트를 바로 뒤에 로드하면
 * 헤더 HTML 삽입 → active 상태 자동 설정 → 스크롤 동작 초기화까지 처리합니다.
 */
(function () {
  'use strict';

  /* ── 현재 페이지 파악 → active 항목 결정 ── */
  var filename = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var ACTIVE_MAP = {
    'subpage-modular.html':    'modular',
    'subpage-linkpay.html':    'linkpay',
    'subpage-integrated.html': 'integrated',
  };
  var active = ACTIVE_MAP[filename] || null;

  /* ── 헤더 전용 CSS 주입 (style.css 없이도 동작) ── */
  var css =
    '.site-header--sub{' +
      'position:fixed;inset:0 0 auto;z-index:100;width:100%;' +
      'height:var(--header-h,56px);padding:0 var(--side,40px);' +
      'color:#fff;background:#ee3d1c;box-shadow:none;' +
      'transition:background 180ms ease,box-shadow 180ms ease,color 180ms ease;' +
    '}' +
    '.site-header--sub.is-scrolled{' +
      'color:#191919;background:rgba(255,255,255,.96);' +
      'box-shadow:0 1px 16px rgba(0,0,0,.08);' +
    '}' +
    '.site-header--sub .site-header__inner{' +
      'width:min(100%,var(--content,1120px));height:100%;margin:0 auto;' +
      'display:flex;align-items:center;justify-content:space-between;gap:40px;' +
    '}' +
    '.site-header--sub .site-header__logo img{' +
      'width:122px;height:auto;display:block;filter:brightness(0) invert(1);' +
    '}' +
    '.site-header--sub.is-scrolled .site-header__logo img{filter:none;}' +
    '.site-header--sub .site-header__nav{' +
      'display:flex;align-items:center;gap:34px;font-size:15px;font-weight:500;' +
    '}' +
    '.site-header--sub .site-header__nav a{color:inherit;text-decoration:none;}' +
    '.site-header--sub .site-header__actions{' +
      'display:flex;align-items:center;gap:10px;' +
    '}' +
    '.site-header--sub .site-header__login{' +
      'min-width:82px;padding:8px 22px 9px;border:1px solid currentColor;' +
      'border-radius:999px;font-size:14px;font-weight:500;' +
      'text-align:center;color:inherit;text-decoration:none;' +
    '}' +
    '.site-header--sub .site-header__menu-btn{' +
      'display:none;width:34px;height:34px;padding:0;border:1px solid currentColor;' +
      'border-radius:999px;background:transparent;color:inherit;align-items:center;' +
      'justify-content:center;cursor:pointer;' +
    '}' +
    '.site-header--sub .site-header__menu-icon{' +
      'position:relative;width:16px;height:12px;display:block;' +
    '}' +
    '.site-header--sub .site-header__menu-icon::before,' +
    '.site-header--sub .site-header__menu-icon::after,' +
    '.site-header--sub .site-header__menu-icon span{' +
      'content:"";position:absolute;left:0;width:16px;height:2px;' +
      'border-radius:2px;background:currentColor;transition:transform 160ms ease,top 160ms ease,opacity 160ms ease;' +
    '}' +
    '.site-header--sub .site-header__menu-icon::before{top:0;}' +
    '.site-header--sub .site-header__menu-icon span{top:5px;}' +
    '.site-header--sub .site-header__menu-icon::after{top:10px;}' +
    '.site-header--sub.is-menu-open .site-header__menu-icon::before{top:5px;transform:rotate(45deg);}' +
    '.site-header--sub.is-menu-open .site-header__menu-icon span{opacity:0;}' +
    '.site-header--sub.is-menu-open .site-header__menu-icon::after{top:5px;transform:rotate(-45deg);}' +
    '.nav-active{position:relative;}' +
    '.nav-active::after{' +
      'content:"";position:absolute;left:0;right:0;bottom:-4px;' +
      'height:2px;background:currentColor;border-radius:1px;' +
    '}' +
    '@media(max-width:768px){' +
      '.site-header--sub .site-header__inner{gap:12px;}' +
      '.site-header--sub .site-header__nav{' +
        'position:absolute;top:calc(var(--header-h,56px) + 10px);' +
        'left:var(--side,20px);right:var(--side,20px);display:none;' +
        'padding:10px;border:1px solid rgba(0,0,0,.08);border-radius:16px;' +
        'background:rgba(255,255,255,.98);box-shadow:0 16px 40px rgba(0,0,0,.14);' +
        'color:#191919;flex-direction:column;align-items:stretch;gap:2px;font-size:15px;' +
      '}' +
      '.site-header--sub.is-menu-open .site-header__nav{display:flex;}' +
      '.site-header--sub .site-header__nav a{' +
        'display:flex;align-items:center;min-height:42px;padding:0 14px;border-radius:10px;' +
      '}' +
      '.site-header--sub .site-header__nav a.nav-active{' +
        'background:#fef1ee;color:#ee3d1c;font-weight:700;' +
      '}' +
      '.site-header--sub .site-header__nav a.nav-active::after{display:none;}' +
      '.site-header--sub .site-header__logo img{width:96px;}' +
      '.site-header--sub .site-header__login{min-width:70px;padding:7px 16px;font-size:13px;}' +
      '.site-header--sub .site-header__menu-btn{display:inline-flex;}' +
    '}';

  if (!document.getElementById('site-header-style')) {
    var styleEl = document.createElement('style');
    styleEl.id = 'site-header-style';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  /* ── 네비게이션 항목 ── */
  var NAV = [
    { key: 'modular',    href: 'subpage-modular.html',    label: '모듈형 쇼핑몰' },
    { key: 'linkpay',    href: 'subpage-linkpay.html',    label: '링크결제'      },
    { key: 'integrated', href: 'subpage-integrated.html', label: '통합 관리'     },
  ];

  var navHTML = NAV.map(function (item) {
    var cls     = item.key === active ? ' class="nav-active"' : '';
    var current = item.key === active ? ' aria-current="page"' : '';
    return '<a href="' + item.href + '"' + cls + current + '>' + item.label + '</a>';
  }).join('');

  /* ── 헤더 HTML 삽입 ── */
  var placeholder = document.getElementById('header-root');
  if (placeholder) {
    placeholder.outerHTML =
      '<header class="site-header site-header--sub" data-header>' +
        '<div class="site-header__inner">' +
          '<a class="site-header__logo" href="index.html" aria-label="링크잇 홈">' +
            '<img src="assets/logo.svg" alt="링크잇" />' +
          '</a>' +
          '<nav class="site-header__nav" aria-label="서비스 메뉴">' +
            navHTML +
          '</nav>' +
          '<div class="site-header__actions">' +
            '<button class="site-header__menu-btn" type="button" aria-label="서비스 메뉴 열기" aria-expanded="false" aria-controls="site-mobile-nav">' +
              '<span class="site-header__menu-icon" aria-hidden="true"><span></span></span>' +
            '</button>' +
            '<a class="site-header__login" href="login.html">로그인</a>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  /* ── 스크롤 동작 초기화 ── */
  function initScroll() {
    var header = document.querySelector('[data-header]');
    if (!header) return;
    var sync = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    sync();
    window.addEventListener('scroll', sync, { passive: true });
  }

  function initMobileMenu() {
    var header = document.querySelector('[data-header]');
    if (!header) return;
    var button = header.querySelector('.site-header__menu-btn');
    var nav = header.querySelector('.site-header__nav');
    if (!button || !nav) return;

    nav.id = 'site-mobile-nav';

    var setOpen = function (open) {
      header.classList.toggle('is-menu-open', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.setAttribute('aria-label', open ? '서비스 메뉴 닫기' : '서비스 메뉴 열기');
    };

    button.addEventListener('click', function () {
      setOpen(!header.classList.contains('is-menu-open'));
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });

    document.addEventListener('click', function (event) {
      if (!header.contains(event.target)) setOpen(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initScroll();
      initMobileMenu();
    });
  } else {
    initScroll();
    initMobileMenu();
  }
}());
