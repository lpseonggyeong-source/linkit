(function () {
  var CHAPTERS = [
    { num: '1', name: '대시보드',       href: 'guide-ch1.html', color: '#64748b' },
    { num: '2', name: '상품관리',       href: 'guide-ch2.html', color: '#ea580c' },
    { num: '3', name: '주문관리',       href: 'guide-ch3.html', color: '#2563eb' },
    { num: '4', name: '상점 생성/관리', href: 'guide-ch4.html', color: '#475569' },
    { num: '5', name: '셀러 관리',      href: 'guide-ch5.html', color: '#e62e21' },
    { num: '6', name: '정산관리',       href: 'guide-ch6.html', color: '#0d9488' },
    { num: '7', name: '공지사항',       href: 'guide-ch7.html', color: '#7c3aed' },
    { num: '8', name: '환경설정',       href: 'guide-ch8.html', color: '#64748b' },
  ];

  var currentFile = location.pathname.split('/').pop() || 'guide-ch1.html';
  var activeCh = CHAPTERS.find(function (c) { return c.href === currentFile; }) || CHAPTERS[0];

  /* ── 상단 헤더 삽입 ── */
  var header = document.createElement('header');
  header.className = 'guide-header';
  header.innerHTML =
    '<a class="gh-logo" href="guide-ch1.html">' +
      '<span class="gh-logo-badge">Link it</span>' +
      '<span class="gh-logo-label">어드민 가이드</span>' +
    '</a>' +
    '<span class="gh-divider"></span>' +
    '<span class="gh-chapter-name">Ch' + activeCh.num + '. ' + activeCh.name + '</span>';
  document.body.insertBefore(header, document.body.firstChild);

  /* ── 왼쪽 사이드바 삽입 (챕터 목록만) ── */
  var chapterItems = CHAPTERS.map(function (ch) {
    var isActive = ch.href === currentFile;
    return '<a class="gn-ch-item' + (isActive ? ' active' : '') + '" href="' + ch.href + '">' +
      '<span class="gn-ch-dot" style="background:' + ch.color + '"></span>' +
      '<span class="gn-ch-num">' + ch.num + '</span>' +
      ch.name +
      '</a>';
  }).join('');

  var nav = document.createElement('nav');
  nav.className = 'guide-nav';
  nav.id = 'guideNav';
  nav.innerHTML =
    '<div class="gn-group-label">챕터</div>' +
    chapterItems;

  /* ── 오른쪽 TOC 삽입 ── */
  var toc = document.createElement('aside');
  toc.className = 'guide-toc';
  toc.id = 'guideToc';
  toc.innerHTML = '<div class="gt-label">목차</div><div id="gt-list"></div>';

  var bodyWrap = document.querySelector('.body-wrap');
  if (bodyWrap) {
    var spacer = document.createElement('div');
    spacer.className = 'guide-nav-spacer';
    bodyWrap.insertBefore(spacer, bodyWrap.firstChild);
    bodyWrap.insertBefore(nav, spacer);
    bodyWrap.appendChild(toc);
  }

  /* ── 오른쪽 TOC 섹션 목록 구축 ── */
  var innerTabs = document.querySelector('.inner-tabs');
  if (innerTabs) {
    buildTabbedToc(innerTabs);
  } else {
    buildSimpleToc();
  }

  function buildSimpleToc() {
    var tocList = document.getElementById('gt-list');
    var items = [], idx = 0;

    document.querySelectorAll('.guide-section').forEach(function (sec) {
      idx++;
      if (!sec.id) sec.id = 'sec-' + idx;
      var pill = sec.querySelector('.step-pill');
      var title = sec.querySelector('.sec-title');
      if (!title) return;
      var numTxt = pill ? pill.textContent.trim() : idx;
      var titleTxt = title.textContent.trim();

      var t = document.createElement('a');
      t.className = 'gt-item';
      t.href = '#' + sec.id;
      t.textContent = numTxt + '. ' + titleTxt;
      t.addEventListener('click', function (e) { e.preventDefault(); sec.scrollIntoView({ behavior: 'smooth' }); });
      if (tocList) tocList.appendChild(t);

      items.push({ sec: sec, tocLink: t });
    });
    observe(items);
  }

  function buildTabbedToc(tabBar) {
    var tabs = tabBar.querySelectorAll('.inner-tab');
    var panes = document.querySelectorAll('.tab-pane');
    var tocList = document.getElementById('gt-list');
    var allItems = [];

    tabs.forEach(function (tab, ti) {
      var pane = panes[ti];
      if (!pane) return;
      var idx = 0;
      pane.querySelectorAll('.guide-section').forEach(function (sec) {
        idx++;
        if (!sec.id) sec.id = 't' + ti + '-s' + idx;
        var pill = sec.querySelector('.step-pill');
        var title = sec.querySelector('.sec-title');
        if (!title) return;
        var numTxt = pill ? pill.textContent.trim() : idx;
        var titleTxt = title.textContent.trim();

        var t = document.createElement('a');
        t.className = 'gt-item';
        t.href = '#' + sec.id;
        t.dataset.ti = ti;
        t.textContent = numTxt + '. ' + titleTxt;
        t.addEventListener('click', function (e) {
          e.preventDefault();
          if (!pane.classList.contains('active')) { tab.click(); setTimeout(function () { sec.scrollIntoView({ behavior: 'smooth' }); }, 120); }
          else sec.scrollIntoView({ behavior: 'smooth' });
        });
        if (tocList) tocList.appendChild(t);

        allItems.push({ sec: sec, tocLink: t, ti: ti });
      });
    });

    function syncTabs() {
      var act = Array.from(tabs).findIndex(function (t) { return t.classList.contains('active'); });
      if (tocList) {
        tocList.querySelectorAll('.gt-item').forEach(function (t) {
          t.style.display = (parseInt(t.dataset.ti) === act) ? '' : 'none';
        });
      }
    }
    syncTabs();
    tabs.forEach(function (t) { t.addEventListener('click', function () { setTimeout(syncTabs, 60); }); });
    observe(allItems.map(function (o) { return { sec: o.sec, tocLink: o.tocLink }; }));
  }

  function observe(items) {
    if (!items.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        items.forEach(function (it) { it.tocLink.classList.remove('active'); });
        var m = items.find(function (it) { return it.sec === e.target; });
        if (m) {
          m.tocLink.classList.add('active');
          m.tocLink.scrollIntoView({ block: 'nearest' });
        }
      });
    }, { threshold: 0, rootMargin: '-56px 0px -55% 0px' });
    items.forEach(function (it) { io.observe(it.sec); });
  }
})();
