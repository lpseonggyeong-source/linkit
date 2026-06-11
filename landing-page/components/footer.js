/**
 * 링크잇 공통 Footer 컴포넌트  (기준: subpage-integrated.html)
 * 사용법: </main> 바로 뒤에 <div id="footer-root"></div> 와 이 스크립트를 로드
 */
(function () {
  'use strict';

  /* ── CSS 주입  (style.css의 .footer 규칙을 덮어씀) ── */
  var css =
    '.footer{' +
      'min-height:381px;padding:58px var(--side,40px) 52px;' +
      'background:#191919;color:rgba(255,255,255,.7);' +
    '}' +
    '.footer__inner{' +
      'width:min(100%,var(--content,var(--container,1120px)));' +
      'margin:0 auto;' +
    '}' +
    /* style.css 의 !important 를 덮어쓰기 위해 동일하게 !important 사용 */
    '.footer__phone{' +
      'margin-bottom:9px;font-size:24px!important;font-weight:800;' +
      'color:#fff!important;line-height:1.35;' +
    '}' +
    '.footer__hours{font-size:14px;line-height:1.45;color:#dedede;}' +
    '.footer__company{' +
      'margin-top:49px;display:flex;flex-direction:column;' +
      'gap:4px;font-size:12px;line-height:1.5;color:rgba(255,255,255,.7);' +
    '}' +
    '.footer__copy{' +
      'margin-top:11px;font-size:12px;line-height:1.5;color:rgba(255,255,255,.5);' +
    '}';

  if (!document.getElementById('footer-component-style')) {
    var styleEl = document.createElement('style');
    styleEl.id = 'footer-component-style';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  /* ── HTML 삽입 ── */
  var placeholder = document.getElementById('footer-root');
  if (placeholder) {
    placeholder.outerHTML =
      '<footer class="footer">' +
        '<div class="footer__inner">' +
          '<p class="footer__phone">고객센터 02-1234-1234</p>' +
          '<p class="footer__hours">평일 10:00 - 18:00 (주말/공휴일 제외)<br />help@linkit.com</p>' +
          '<div class="footer__company">' +
            '<p>상호명 (주)링크잇 | 대표이사 000 | 사업자등록번호 123-45-67890</p>' +
            '<p>통신판매업신고번호 2024-서울강남-0000 | 본사 서울특별시 강남구 테헤란로 123</p>' +
            '<p>이용약관 | 개인정보처리방침</p>' +
          '</div>' +
          '<p class="footer__copy">© 2026 LINKIT Inc. All rights reserved.</p>' +
        '</div>' +
      '</footer>';
  }
}());
