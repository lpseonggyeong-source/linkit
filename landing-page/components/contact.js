/**
 * 링크잇 공통 Contact 섹션 컴포넌트  (기준: subpage-integrated.html)
 * 사용법: <div id="contact-root"></div> 바로 뒤에 이 스크립트를 로드
 */
(function () {
  'use strict';

  /* ── CSS 주입 ── */
  var css =
    '.sec-contact{' +
      'min-height:385px;padding:59px var(--side,40px);' +
      'background:#ee3d1c;color:#fff;' +
    '}' +
    '.sec-contact__inner{width:min(100%,739px);margin:0 auto;}' +
    '.sec-contact__title{' +
      'margin-bottom:16px;' +
      'font-family:var(--font-display,"Paperlogy","Noto Sans KR",sans-serif);' +
      'font-size:36px;font-weight:700;line-height:1.26;' +
    '}' +
    '.sec-contact__panel{' +
      'width:100%;padding:24px;border-radius:16px;background:#fff;' +
      'display:flex;align-items:center;gap:16px;' +
    '}' +
    '.sec-contact__mark{flex-shrink:0;}' +
    '.sec-contact__mark img{width:142px;height:111px;display:block;object-fit:contain;}' +
    '.sec-contact__form-wrap{flex:1;min-width:0;}' +
    '.sec-contact__form{display:flex;align-items:center;gap:8px;}' +
    '.sec-contact__input{' +
      'flex:1;min-width:0;height:48px;padding:0 16px;' +
      'border:0;outline:0;border-radius:999px;' +
      'background:#eee;font-size:16px;color:#404040;font:inherit;' +
    '}' +
    '.sec-contact__input::placeholder{color:#404040;opacity:1;}' +
    '.sec-contact__btn{' +
      'flex:0 0 auto;width:145px;height:48px;border-radius:999px;' +
      'background:#ee3d1c;color:#fff;border:0;cursor:pointer;' +
      'font-size:16px;font-weight:700;white-space:nowrap;font-family:inherit;' +
    '}' +
    '.sec-contact__policy{margin-top:4px;padding-left:16px;font-size:12px;color:#404040;}' +
    '.sec-contact__policy a{color:#009dff;text-decoration:underline;text-underline-offset:2px;}' +
    '@media(max-width:768px){' +
      '.sec-contact__title{font-size:30px;}' +
      '.sec-contact__panel{flex-direction:column;align-items:stretch;}' +
      '.sec-contact__mark{width:100%;height:auto;display:flex;justify-content:center;}' +
      '.sec-contact__form{flex-direction:column;align-items:stretch;}' +
      '.sec-contact__input{flex:0 0 auto;width:100%;height:48px;}' +
      '.sec-contact__btn{width:100%;}' +
    '}';

  if (!document.getElementById('contact-component-style')) {
    var styleEl = document.createElement('style');
    styleEl.id = 'contact-component-style';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  /* ── HTML 삽입 ── */
  var placeholder = document.getElementById('contact-root');
  if (placeholder) {
    placeholder.outerHTML =
      '<section class="sec-contact" id="contact" aria-labelledby="contact-title">' +
        '<div class="sec-contact__inner">' +
          '<h2 id="contact-title" class="sec-contact__title">' +
            '무료 상담으로<br />부담없이 시작하세요' +
          '</h2>' +
          '<div class="sec-contact__panel">' +
            '<div class="sec-contact__mark" aria-hidden="true">' +
              '<img src="assets/contact-img.png" alt="" />' +
            '</div>' +
            '<div class="sec-contact__form-wrap">' +
              '<form class="sec-contact__form">' +
                '<label class="sr-only" for="contact-email">이메일</label>' +
                '<input id="contact-email" class="sec-contact__input"' +
                  ' type="email" placeholder="이메일을 입력하세요" />' +
                '<button type="submit" class="sec-contact__btn">무료 상담 신청</button>' +
              '</form>' +
              '<p class="sec-contact__policy">' +
                '당사 <a href="#">개인정보 처리방침</a>을 확인하실 수 있습니다.' +
              '</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>';
  }
}());
