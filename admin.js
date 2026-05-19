/* admin.js — link it 어드민 공통 JavaScript */

/* ═══════════════════════════════════════════════════════════════════
   [MOCK DATA INDEX] 백엔드 연동 시 교체 필요한 항목 전체 목록
   grep "[MOCK]" 로 이 파일 전체에서 모든 위치를 검색할 수 있습니다.
   ───────────────────────────────────────────────────────────────────
   JS (admin.js)
    1. CATEGORIES          ~ line 447   → GET /api/categories
    2. SECTIONS            ~ line 1378  → GET /api/display/sections
    3. SECTION_PRODUCTS    ~ line 1388  → GET /api/display/sections/{id}/products
    4. ALL_PRODUCTS (진열)  ~ line 1410  → GET /api/products
    5. SUB_CATEGORY_MAP    ~ line 1425  → GET /api/categories/{id}/subcategories
    6. getNoticeMockData() ~ line 2030  → GET /api/notices
    7. sellerData          ~ line 2305  → GET /api/sellers
    8. productData         ~ line 2727  → GET /api/products  (상품목록 페이지)
    9. NAMES/PHONES/ADDRS  ~ line 2901  → GET /api/orders    (구매자·배송지 정보)
   10. PRODUCTS (주문용)    ~ line 2905  → GET /api/products  (주문 연동)
   11. buildOrderData()    ~ line 2925  → GET /api/orders

   HTML (하드코딩 숫자/텍스트)
    - index.html      오늘/이번달 현황 수치  → GET /api/dashboard/stats
    - index.html      주문내역 테이블 4건    → GET /api/orders?limit=4&sort=latest
    - order-list.html 주문 상태 요약 수치   → GET /api/orders/summary
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Active nav highlight ── */
  function setActiveNav() {
    var current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-page]").forEach(function (el) {
      if (el.dataset.page === current) {
        el.classList.add("is-active");
      }
    });
  }

  /* ── Sidebar component (render + mobile toggle) ── */
  function initSidebar() {
    var sidebar = document.getElementById("adminSidebar");
    if (!sidebar) return;

    /* ── 1. Render canonical nav HTML ── */
    var page = location.pathname.split("/").pop() || "index.html";

    /* sub-page → parent main-link href */
    var SUB_TO_MAIN = {
      "product-create.html":  "product-list.html",
      "category.html":        "product-list.html",
      "product-list.html":    "product-list.html",
      "product-display.html": "product-list.html",
      "order-list.html":      "order-list.html",
      "design.html":          "design.html",
      "design-editor.html":   "design.html",
      "seller-list.html":     "seller-list.html",
      "notice.html":          "notice.html",
      "settings.html":        "settings.html",
      "index-after.html":     "index.html",
      "index-before.html":    "index.html",
    };
    var activeMain = SUB_TO_MAIN[page] || page;

    function mc(href) {
      return "admin-sidebar__main" + (href === activeMain ? " is-active" : "");
    }
    function sc(href) {
      return "admin-sidebar__sub" + (href === page ? " is-active" : "");
    }
    function icon(src) {
      return '<img class="admin-sidebar__nav-icon" src="assets/SideNav/' + src + '" width="20" height="20" alt="" />';
    }

    sidebar.innerHTML =
      '<div class="admin-sidebar__logo">' +
        '<a href="index.html" class="admin-sidebar__logo-link">link it</a>' +
      '</div>' +
      '<nav class="admin-sidebar__nav">' +

        '<div class="admin-sidebar__group">' +
          '<a href="index.html" class="' + mc("index.html") + '">' +
            icon("icon-1.svg") +
            '<span>대시보드</span>' +
          '</a>' +
        '</div>' +

        '<div class="admin-sidebar__group">' +
          '<a href="product-list.html" class="' + mc("product-list.html") + '">' +
            icon("icon-2.svg") +
            '<span>상품관리</span>' +
          '</a>' +
          '<a href="product-create.html" class="' + sc("product-create.html") + '">상품 등록</a>' +
          '<a href="category.html" class="' + sc("category.html") + '">카테고리 관리</a>' +
          '<a href="product-list.html" class="' + sc("product-list.html") + '">상품목록</a>' +
          '<a href="product-display.html" class="' + sc("product-display.html") + '">상품진열</a>' +
        '</div>' +

        '<div class="admin-sidebar__group">' +
          '<a href="order-list.html" class="' + mc("order-list.html") + '">' +
            icon("icon.svg") +
            '<span>주문관리</span>' +
          '</a>' +
          '<a href="order-list.html" class="' + sc("order-list.html") + '">주문내역</a>' +
        '</div>' +

        '<div class="admin-sidebar__group">' +
          '<a href="design.html" class="' + mc("design.html") + '">' +
            icon("icon-3.svg") +
            '<span>디자인</span>' +
          '</a>' +
          '<a href="design.html" class="' + sc("design.html") + '">디자인 관리</a>' +
        '</div>' +

        '<div class="admin-sidebar__group">' +
          '<a href="seller-list.html" class="' + mc("seller-list.html") + '">' +
            icon("icon-4.svg") +
            '<span>셀러 관리</span>' +
          '</a>' +
          '<a href="seller-list.html" class="' + sc("seller-list.html") + '">셀러 목록</a>' +
        '</div>' +

        '<div class="admin-sidebar__group">' +
          '<a href="notice.html" class="' + mc("notice.html") + '">' +
            icon("icon-5.svg") +
            '<span>공지사항</span>' +
          '</a>' +
        '</div>' +

        '<div class="admin-sidebar__group">' +
          '<a href="settings.html" class="' + mc("settings.html") + '">' +
            icon("icon-6.svg") +
            '<span>환경설정</span>' +
          '</a>' +
        '</div>' +

        '<div class="admin-sidebar__divider"></div>' +

        '<div class="admin-sidebar__group">' +
          '<a href="../login.html" class="admin-sidebar__main admin-sidebar__main--logout">' +
            icon("icon-7.svg") +
            '<span>로그아웃</span>' +
          '</a>' +
        '</div>' +

      '</nav>';

    /* ── 2. Mobile hamburger toggle ── */
    var hamburger = document.getElementById("adminHamburger");
    var overlay = document.getElementById("adminOverlay");
    if (!hamburger) return;

    function openSidebar() {
      sidebar.classList.add("is-open");
      if (overlay) overlay.classList.add("is-visible");
    }
    function closeSidebar() {
      sidebar.classList.remove("is-open");
      if (overlay) overlay.classList.remove("is-visible");
    }

    hamburger.addEventListener("click", function (e) {
      e.stopPropagation();
      sidebar.classList.contains("is-open") ? closeSidebar() : openSidebar();
    });

    if (overlay) {
      overlay.addEventListener("click", closeSidebar);
    }
  }

  /* ── Product save btn ── */
  function initProductSave() {
    var btn = document.querySelector("#productSaveBtn");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var form = document.querySelector("#productForm");
      if (!form) return;
      var nameField = form.querySelector("[name='productName']");
      if (nameField && !nameField.value.trim()) {
        alert("상품명을 입력해주세요.");
        nameField.focus();
        return;
      }
      var priceField = form.querySelector("[name='productPrice']");
      if (priceField && !priceField.value.trim()) {
        alert("판매가를 입력해주세요.");
        priceField.focus();
        return;
      }
      /* form.submit(); */
      alert("저장되었습니다.");
      location.href = "product-list.html";
    });
  }

  /* ── Category save btn ── */
  function initCategorySave() {
    var btn = document.querySelector("#categorySaveBtn");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var nameField = document.querySelector("#categoryName");
      if (nameField && !nameField.value.trim()) {
        alert("카테고리명을 입력해주세요.");
        nameField.focus();
        return;
      }
      /* form.submit(); */
      alert("카테고리가 추가되었습니다.");
      if (nameField) nameField.value = "";
    });
  }

  /* ── Settings save btn ── */
  function initSettingsSave() {
    var btn = document.querySelector("#settingsSaveBtn");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      /* form.submit(); */
      alert("설정이 저장되었습니다.");
    });
  }

  /* ── Design save btn (handled by initDesignPage IIFE) ── */
  function initDesignSave() { /* no-op */ }

  /* ── Notice write btn ── */
  function initNoticeWrite() {
    var btn = document.querySelector("#noticeWriteBtn");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      /* navigate or open modal */
      alert("공지사항 작성 페이지로 이동합니다.");
    });
  }

  /* ── Search / filter btn ── */
  function initSearchBtns() {
    document.querySelectorAll("[data-action='search']").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        /* form.submit() or fetch filtering */
      });
    });
  }

  /* ── Product create: 탭 전환 / 옵션 행 추가·삭제 / 에디터 / 이미지 업로드 ── */
  function initProductCreate() {

    /* 1. 상세 페이지 설정 탭 전환 */
    var tabBtns = document.querySelectorAll(".product-tab-btn");
    var panels  = document.querySelectorAll(".product-detail-panel");
    if (tabBtns.length) {
      tabBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          tabBtns.forEach(function (b) {
            b.classList.remove("is-active");
            b.setAttribute("aria-selected", "false");
          });
          btn.classList.add("is-active");
          btn.setAttribute("aria-selected", "true");

          var target = "panel-" + btn.dataset.tab;
          panels.forEach(function (panel) {
            panel.classList.toggle("is-active", panel.id === target);
          });
        });
      });
    }

    /* 2. 옵션 항목 추가 (+) */
    var TRASH_SVG = [
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
        ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
        '<polyline points="3 6 5 6 21 6"/>',
        '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
      "</svg>"
    ].join("");

    var optAddRowBtn = document.getElementById("optAddRowBtn");
    var optionBody   = document.getElementById("optionInputBody");
    if (optAddRowBtn && optionBody) {
      optAddRowBtn.addEventListener("click", function () {
        var tr = document.createElement("tr");
        tr.innerHTML =
          '<td><input type="text" name="optName[]" placeholder="옵션명" /></td>' +
          '<td><input type="text" name="optValue[]" placeholder="값을 쉼표로 구분" /></td>' +
          '<td><input type="text" name="optCost[]" placeholder="추가 비용 (쉼표 구분)" /></td>' +
          '<td class="product-option-del-cell">' +
            '<button type="button" class="product-opt-del-row" aria-label="옵션 삭제">' +
              TRASH_SVG +
            '</button>' +
          '</td>';
        optionBody.appendChild(tr);
        tr.querySelector("input").focus();
      });
    }

    /* 3. 옵션 행 삭제 (이벤트 위임 — 초기 행 + 동적 행 모두 처리) */
    if (optionBody) {
      optionBody.addEventListener("click", function (e) {
        var delBtn = e.target.closest(".product-opt-del-row");
        if (!delBtn) return;
        var rows = optionBody.querySelectorAll("tr");
        if (rows.length <= 1) return; /* 마지막 행은 삭제 불가 */
        delBtn.closest("tr").remove();
      });
    }

    /* 4. 옵션 저장 → 조합 테이블 자동 생성 */
    var optSaveBtn  = document.getElementById("optSaveBtn");
    var optComboBody = document.getElementById("optComboBody");
    var comboTitle  = document.querySelector(".product-option-combo-title");
    if (optSaveBtn && optComboBody) {
      optSaveBtn.addEventListener("click", function () {
        /* 각 행에서 옵션값 수집 */
        var rows = optionBody ? optionBody.querySelectorAll("tr") : [];
        var groups = [];
        rows.forEach(function (row) {
          var valInput  = row.querySelector("[name='optValue[]']");
          var costInput = row.querySelector("[name='optCost[]']");
          var vals  = valInput  ? valInput.value.split(",").map(function (v) { return v.trim(); }).filter(Boolean) : [];
          var costs = costInput ? costInput.value.split(",").map(function (v) { return v.trim(); }) : [];
          if (vals.length) groups.push({ vals: vals, costs: costs });
        });

        if (!groups.length) {
          alert("옵션값을 입력한 뒤 저장하세요.");
          return;
        }

        /* Cartesian product */
        var combos = groups.reduce(function (acc, group) {
          var next = [];
          acc.forEach(function (prefix) {
            group.vals.forEach(function (val, i) {
              next.push({
                label: prefix.label ? prefix.label + " / " + val : val,
                cost:  group.costs[i] !== undefined ? group.costs[i] : ""
              });
            });
          });
          return next;
        }, [{ label: "", cost: "" }]);

        /* 조합 테이블 갱신 */
        optComboBody.innerHTML = "";
        combos.forEach(function (combo) {
          var tr = document.createElement("tr");
          tr.innerHTML =
            '<td style="text-align:center;"><input type="checkbox" name="optUse[]" checked style="accent-color:var(--admin-red);cursor:pointer;" /></td>' +
            '<td>' + combo.label + '</td>' +
            '<td><input type="number" class="product-tbl-input" name="optStock[]" value="0" min="0" /></td>' +
            '<td><input type="number" class="product-tbl-input" name="optAddCost[]" value="' + (combo.cost || 0) + '" min="0" /></td>';
          optComboBody.appendChild(tr);
        });

        if (comboTitle) {
          comboTitle.textContent = "옵션 조합 (" + combos.length + "개)";
        }

        /* 조합 섹션으로 스크롤 */
        optComboBody.closest(".admin-table-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    /* 5. 옵션 조합 사용여부 전체 선택/해제 */
    var allUse = document.getElementById("optAllUse");
    if (allUse) {
      allUse.addEventListener("change", function () {
        document.querySelectorAll("[name='optUse[]']").forEach(function (cb) {
          cb.checked = allUse.checked;
        });
      });
    }

    /* 6. WYSIWYG 에디터 툴바 */
    document.querySelectorAll(".product-editor-toolbar-btn[data-cmd]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var cmd = btn.dataset.cmd;
        if (cmd === "createLink") {
          var url = prompt("링크 URL을 입력하세요:");
          if (url) document.execCommand(cmd, false, url);
        } else if (cmd === "insertImage") {
          var src = prompt("이미지 URL을 입력하세요:");
          if (src) document.execCommand(cmd, false, src);
        } else {
          document.execCommand(cmd, false, null);
        }
        var editor = document.getElementById("editorContent");
        if (editor) editor.focus();
        /* active 상태 토글 반영 */
        btn.classList.toggle("is-active", document.queryCommandState(cmd));
      });
    });

    /* 7. 상세 이미지 파일 업로드 미리보기 */
    var detailInput   = document.getElementById("detailImgInput");
    var previewGrid   = document.getElementById("detailPreviewGrid");
    if (detailInput && previewGrid) {
      detailInput.addEventListener("change", function (e) {
        Array.prototype.forEach.call(e.target.files, function (file) {
          if (!file.type.startsWith("image/")) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            var item = document.createElement("div");
            item.className = "product-detail-preview-item";
            item.innerHTML =
              '<img src="' + ev.target.result + '" alt="미리보기" />' +
              '<button type="button" class="product-detail-preview-del" aria-label="이미지 삭제">' +
                '&times;' +
              '</button>';
            previewGrid.appendChild(item);
          };
          reader.readAsDataURL(file);
        });
        e.target.value = "";
      });

      previewGrid.addEventListener("click", function (e) {
        if (e.target.classList.contains("product-detail-preview-del")) {
          e.target.parentElement.remove();
        }
      });
    }

    /* 8. 대표이미지 슬롯 클릭 → 파일 업로드 */
    var productImgInput = document.getElementById("productImgInput");
    var imgSlots = document.querySelectorAll(".product-img-slot");
    var currentSlot = null;
    if (productImgInput && imgSlots.length) {
      imgSlots.forEach(function (slot) {
        slot.addEventListener("click", function () {
          currentSlot = slot;
          productImgInput.value = "";
          productImgInput.click();
        });
        slot.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            currentSlot = slot;
            productImgInput.value = "";
            productImgInput.click();
          }
        });
      });

      productImgInput.addEventListener("change", function (e) {
        var file = e.target.files[0];
        if (!file || !currentSlot) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          currentSlot.innerHTML = '<img src="' + ev.target.result + '" alt="상품 이미지" />';
          currentSlot.classList.add("has-image");
        };
        reader.readAsDataURL(file);
      });
    }
  }

  /* ── Category page ── */
  function initCategoryPage() {
    var categoryList = document.getElementById("categoryList");
    if (!categoryList) return;

    /* [MOCK] GET /api/categories — { id, name, sub: [{ id, name, count, visible }] } */
    var CATEGORIES = [
      {
        id: 1, name: "의류",
        sub: [
          { id: 11, name: "상의",          count: 120, visible: true  },
          { id: 12, name: "하의",          count: 120, visible: true  },
          { id: 13, name: "홈웨어",        count: 120, visible: true  },
          { id: 14, name: "하위 카테고리 1", count: 0,   visible: false }
        ]
      },
      { id: 2, name: "뷰티",    sub: [] },
      { id: 3, name: "인테리어", sub: [] },
      { id: 4, name: "가전",    sub: [] },
      { id: 5, name: "캠핑",    sub: [] }
    ];

    var selectedCatId    = null;
    var pendingDeleteSubId = null;

    /* SVG 아이콘 상수 */
    var ICON_DRAG = [
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">',
        '<circle cx="5"  cy="4"  r="1.5" fill="currentColor"/>',
        '<circle cx="5"  cy="8"  r="1.5" fill="currentColor"/>',
        '<circle cx="5"  cy="12" r="1.5" fill="currentColor"/>',
        '<circle cx="11" cy="4"  r="1.5" fill="currentColor"/>',
        '<circle cx="11" cy="8"  r="1.5" fill="currentColor"/>',
        '<circle cx="11" cy="12" r="1.5" fill="currentColor"/>',
      "</svg>"
    ].join("");

    var ICON_EDIT = [
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"',
        ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>',
        '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
      "</svg>"
    ].join("");

    var ICON_TRASH = [
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"',
        ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
        '<polyline points="3 6 5 6 21 6"/>',
        '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
      "</svg>"
    ].join("");

    /* DOM 참조 */
    var categoryEmpty       = document.getElementById("categoryEmpty");
    var subCategoryContent  = document.getElementById("subCategoryContent");
    var subCategoryTableBody = document.getElementById("subCategoryTableBody");
    var addSubCategoryBtn   = document.getElementById("addSubCategoryBtn");
    var addModal            = document.getElementById("categoryAddModal");
    var deleteModal         = document.getElementById("categoryDeleteModal");
    var newSubCatParent     = document.getElementById("newSubCatParent");

    function getCategoryById(id) {
      return CATEGORIES.find(function (c) { return c.id === id; }) || null;
    }

    function getSubById(subId) {
      var found = null;
      CATEGORIES.forEach(function (cat) {
        cat.sub.forEach(function (s) {
          if (s.id === subId) found = s;
        });
      });
      return found;
    }

    /* ── 좌측 카테고리 리스트 렌더 ── */
    function renderCategoryList() {
      categoryList.innerHTML = CATEGORIES.map(function (cat) {
        var isActive = selectedCatId === cat.id;

        var subListHtml = "";
        if (isActive && cat.sub.length > 0) {
          subListHtml = '<ul class="category-sub-list">' +
            cat.sub.map(function (sub) {
              return [
                '<li class="category-sub-list__item" data-sub-id="' + sub.id + '">',
                  '<span class="category-drag-handle">' + ICON_DRAG + '</span>',
                  '<span class="category-sub-list__name">' + esc(sub.name) + '</span>',
                  '<div class="category-sub-list__actions">',
                    '<button type="button" class="category-icon-btn"',
                      ' aria-label="' + esc(sub.name) + ' 수정"',
                      ' data-action="edit-sub" data-sub-id="' + sub.id + '">',
                      ICON_EDIT,
                    '</button>',
                    '<button type="button" class="category-icon-btn category-icon-btn--danger"',
                      ' aria-label="' + esc(sub.name) + ' 삭제"',
                      ' data-action="delete-sub" data-sub-id="' + sub.id + '">',
                      ICON_TRASH,
                    '</button>',
                  '</div>',
                '</li>'
              ].join("");
            }).join("") +
          '</ul>';
        }

        var addBtnHtml = isActive
          ? [
              '<button type="button" class="category-add-sub-btn"',
                ' data-action="add-sub" data-cat-id="' + cat.id + '"',
                ' aria-label="' + esc(cat.name) + ' 하위 카테고리 추가">',
                esc(cat.name) + " 하위 카테고리 추가",
              '</button>'
            ].join("")
          : "";

        return [
          '<li class="category-list__item' + (isActive ? ' is-active' : '') + '"',
              ' data-cat-id="' + cat.id + '">',
            '<div class="category-list__row" role="button" tabindex="0"',
                ' aria-pressed="' + isActive + '">',
              '<span class="category-drag-handle">' + ICON_DRAG + '</span>',
              '<span class="category-list__name">' + esc(cat.name) + '</span>',
            '</div>',
            subListHtml,
            addBtnHtml,
          '</li>'
        ].join("");
      }).join("");

      /* 클릭 이벤트 */
      categoryList.querySelectorAll(".category-list__row").forEach(function (row) {
        row.addEventListener("click", function () {
          var id = parseInt(row.closest(".category-list__item").dataset.catId, 10);
          selectedCatId = (selectedCatId === id) ? null : id;
          renderCategoryList();
          renderSubPanel();
        });
        row.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            row.click();
          }
        });
      });

      categoryList.querySelectorAll('[data-action="delete-sub"]').forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          openDeleteModal(parseInt(btn.dataset.subId, 10));
        });
      });

      categoryList.querySelectorAll('[data-action="add-sub"]').forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          openAddModal();
        });
      });
    }

    /* ── 우측 하위 카테고리 패널 렌더 ── */
    function renderSubPanel() {
      if (!selectedCatId) {
        if (categoryEmpty) categoryEmpty.style.display = "flex";
        if (subCategoryContent) subCategoryContent.style.display = "none";
        return;
      }

      var cat = getCategoryById(selectedCatId);
      if (!cat) return;

      if (categoryEmpty) categoryEmpty.style.display = "none";
      if (subCategoryContent) subCategoryContent.style.display = "block";

      if (!subCategoryTableBody) return;

      if (cat.sub.length === 0) {
        subCategoryTableBody.innerHTML =
          '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--admin-muted); font-size:13px;">' +
          '하위 카테고리가 없습니다.</td></tr>';
        return;
      }

      subCategoryTableBody.innerHTML = cat.sub.map(function (sub, idx) {
        return [
          '<tr>',
            '<td><span class="category-drag-handle">' + ICON_DRAG + '</span></td>',
            '<td>' + (idx + 1) + '</td>',
            '<td>' + esc(sub.name) + '</td>',
            '<td>' + sub.count + '</td>',
            '<td>',
              '<label class="category-toggle" aria-label="' + esc(sub.name) + ' 노출 상태">',
                '<input type="checkbox" ' + (sub.visible ? 'checked' : '') +
                  ' data-sub-id="' + sub.id + '" />',
                '<span class="category-toggle__track"></span>',
              '</label>',
            '</td>',
            '<td>',
              '<div class="category-table-actions">',
                '<button type="button" class="category-icon-btn"',
                  ' aria-label="' + esc(sub.name) + ' 수정">',
                  ICON_EDIT,
                '</button>',
                '<button type="button" class="category-icon-btn category-icon-btn--danger"',
                  ' aria-label="' + esc(sub.name) + ' 삭제"',
                  ' data-action="delete-sub" data-sub-id="' + sub.id + '">',
                  ICON_TRASH,
                '</button>',
              '</div>',
            '</td>',
          '</tr>'
        ].join("");
      }).join("");

      /* 토글 이벤트 */
      subCategoryTableBody.querySelectorAll(".category-toggle input").forEach(function (toggle) {
        toggle.addEventListener("change", function () {
          var sub = getSubById(parseInt(toggle.dataset.subId, 10));
          if (sub) sub.visible = toggle.checked;
        });
      });

      /* 테이블 삭제 버튼 */
      subCategoryTableBody.querySelectorAll('[data-action="delete-sub"]').forEach(function (btn) {
        btn.addEventListener("click", function () {
          openDeleteModal(parseInt(btn.dataset.subId, 10));
        });
      });
    }

    /* ── 모달 제어 ── */
    function openAddModal() {
      if (!addModal) return;
      if (newSubCatParent && selectedCatId) {
        newSubCatParent.value = String(selectedCatId);
      }
      addModal.classList.add("is-open");
      var nameInput = document.getElementById("newSubCatName");
      if (nameInput) setTimeout(function () { nameInput.focus(); }, 50);
    }

    function closeAddModal() {
      if (!addModal) return;
      addModal.classList.remove("is-open");
      var form = document.getElementById("categoryAddForm");
      if (form) form.reset();
    }

    function openDeleteModal(subId) {
      if (!deleteModal) return;
      pendingDeleteSubId = subId;

      var sub = getSubById(subId);
      var subName  = sub ? sub.name  : "";
      var subCount = sub ? sub.count : 0;

      var nameEl  = document.getElementById("deleteSubName");
      var countEl = document.getElementById("deleteSubCount");
      if (nameEl)  nameEl.textContent  = subName;
      if (countEl) countEl.textContent = subCount;

      /* 이동 대상 옵션 채우기 (현재 선택 카테고리의 나머지 sub) */
      var moveTarget = document.getElementById("deleteMoveTarget");
      if (moveTarget) {
        var options = '<option value="">카테고리를 선택하세요</option>';
        CATEGORIES.forEach(function (cat) {
          cat.sub.forEach(function (s) {
            if (s.id !== subId) {
              options += '<option value="' + s.id + '">' +
                esc(cat.name) + " / " + esc(s.name) +
              '</option>';
            }
          });
        });
        moveTarget.innerHTML = options;
      }

      deleteModal.classList.add("is-open");
    }

    function closeDeleteModal() {
      if (!deleteModal) return;
      deleteModal.classList.remove("is-open");
      pendingDeleteSubId = null;
    }

    /* ── 이벤트 바인딩 ── */
    if (addSubCategoryBtn) {
      addSubCategoryBtn.addEventListener("click", openAddModal);
    }

    document.getElementById("addModalOverlay")   &&
      document.getElementById("addModalOverlay").addEventListener("click", closeAddModal);
    document.getElementById("addModalCancelBtn") &&
      document.getElementById("addModalCancelBtn").addEventListener("click", closeAddModal);
    document.getElementById("deleteModalOverlay")   &&
      document.getElementById("deleteModalOverlay").addEventListener("click", closeDeleteModal);
    document.getElementById("deleteModalCancelBtn") &&
      document.getElementById("deleteModalCancelBtn").addEventListener("click", closeDeleteModal);

    var categoryAddForm = document.getElementById("categoryAddForm");
    if (categoryAddForm) {
      categoryAddForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var nameInput = document.getElementById("newSubCatName");
        if (!nameInput || !nameInput.value.trim()) {
          if (nameInput) nameInput.focus();
          return;
        }
        var parentId = parseInt(document.getElementById("newSubCatParent").value, 10);
        var cat = getCategoryById(parentId);
        if (cat) {
          cat.sub.push({ id: Date.now(), name: nameInput.value.trim(), count: 0, visible: true });
          closeAddModal();
          renderCategoryList();
          if (selectedCatId === parentId) renderSubPanel();
        }
      });
    }

    var deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
    if (deleteConfirmBtn) {
      deleteConfirmBtn.addEventListener("click", function () {
        if (pendingDeleteSubId === null) return;
        CATEGORIES.forEach(function (cat) {
          cat.sub = cat.sub.filter(function (s) { return s.id !== pendingDeleteSubId; });
        });
        closeDeleteModal();
        renderCategoryList();
        renderSubPanel();
      });
    }

    /* Escape 키로 모달 닫기 */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeAddModal();
        closeDeleteModal();
      }
    });

    /* XSS 방지 간단 이스케이프 */
    function esc(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    /* 초기 렌더 */
    renderCategoryList();
    renderSubPanel();
  }

  /* ══════════════════════════════════════════════
     주문내역 페이지 — order-list.html 전용 함수
     ══════════════════════════════════════════════ */

  var ORDER_STATUSES = ["상품 준비중", "취소 준비중", "취소완료", "배송준비중", "배송중"];

  var STATUS_BADGE_MAP = {
    "상품 준비중": "admin-badge--preparing",
    "취소 준비중": "admin-badge--cancel-pending",
    "취소완료":    "admin-badge--cancel",
    "배송준비중":  "admin-badge--delivery-ready",
    "배송중":      "admin-badge--shipping"
  };

  function getStatusBadgeClass(status) {
    return STATUS_BADGE_MAP[status] || "admin-badge--inactive";
  }

  /**
   * Badge component factory — Figma node 742:5111
   *
   * @param {string}  label       - Display text
   * @param {string}  variant     - One of: preparing | shipping | cancel | pending |
   *                                cancel-pending | delivery-ready | active | inactive |
   *                                notice | important
   * @param {boolean} [dropdown]  - Append chevron (dropdown variant)
   * @returns {string} HTML string
   *
   * Usage:
   *   el.innerHTML = createBadge("배송중", "shipping");
   *   el.innerHTML = createBadge("상품 준비중", "preparing", true);
   */
  function createBadge(label, variant, dropdown) {
    var cls = "admin-badge admin-badge--" + variant;
    if (dropdown) cls += " admin-badge--dropdown";
    return '<span class="' + cls + '">' + label + '</span>';
  }

  /* 전체 선택 체크박스 */
  function initOrderSelection() {
    var selectAll = document.getElementById("orderSelectAll");
    if (!selectAll) return;

    selectAll.addEventListener("change", function () {
      document.querySelectorAll(".order-row-check").forEach(function (cb) {
        cb.checked = selectAll.checked;
      });
    });

    document.addEventListener("change", function (e) {
      if (!e.target.classList.contains("order-row-check")) return;
      var all = document.querySelectorAll(".order-row-check");
      var checked = document.querySelectorAll(".order-row-check:checked");
      if (selectAll) selectAll.checked = (all.length > 0 && all.length === checked.length);
    });
  }

  function getCheckedOrderIds() {
    var ids = [];
    document.querySelectorAll(".order-row-check:checked").forEach(function (cb) {
      ids.push(cb.dataset.orderId);
    });
    return ids;
  }

  /* 선택 주문 일괄 상태 변경 */
  function initOrderStatusChange() {
    var btn = document.getElementById("orderStatusSaveBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var ids = getCheckedOrderIds();
      if (!ids.length) { alert("상태를 변경할 주문을 선택해주세요."); return; }
      var sel = document.getElementById("orderStatusSelect");
      if (!sel || !sel.value) { alert("변경할 상태를 선택해주세요."); return; }
      var newStatus = sel.value;
      /* 선택된 row의 badge 업데이트 */
      ids.forEach(function (id) {
        var curr = document.querySelector('[data-order-current="' + id + '"]');
        if (curr) {
          curr.textContent = newStatus;
          curr.className = "admin-badge t-label-2-md " + getStatusBadgeClass(newStatus);
        }
        /* row dropdown의 current 표시도 갱신 */
        var row = document.querySelector('tr[data-order-id="' + id + '"]');
        if (row) {
          row.querySelectorAll(".admin-order-status__option").forEach(function (o) {
            o.classList.toggle("is-current", o.dataset.status === newStatus);
          });
        }
      });
      alert("선택한 주문의 상태가 변경되었습니다.");
      sel.value = "";
    });
  }

  /* row별 처리 상태 인라인 드롭다운 */
  function initOrderRowStatus() {
    var container = document.getElementById("orderTableBody");
    if (!container) return;

    /* 다른 드롭다운 닫기 */
    function closeAllDropdowns(except) {
      document.querySelectorAll(".admin-order-status__dropdown.is-open").forEach(function (dd) {
        if (dd !== except) dd.classList.remove("is-open");
      });
    }

    container.addEventListener("click", function (e) {
      var toggle = e.target.closest(".admin-order-status__toggle");
      if (toggle) {
        e.stopPropagation();
        var dd = toggle.closest(".admin-order-status").querySelector(".admin-order-status__dropdown");
        if (!dd) return;
        var isOpen = dd.classList.contains("is-open");
        closeAllDropdowns(null);
        if (!isOpen) dd.classList.add("is-open");
        return;
      }

      var opt = e.target.closest(".admin-order-status__option");
      if (opt) {
        e.stopPropagation();
        var orderId = opt.closest("tr").dataset.orderId;
        var newStatus = opt.dataset.status;
        /* toggle 버튼의 badge 업데이트 */
        var curr = document.querySelector('[data-order-current="' + orderId + '"]');
        if (curr) {
          curr.textContent = newStatus;
          curr.className = "admin-badge t-label-2-md " + getStatusBadgeClass(newStatus);
        }
        /* option 현재 표시 갱신 */
        opt.closest(".admin-order-status__dropdown").querySelectorAll(".admin-order-status__option").forEach(function (o) {
          o.classList.toggle("is-current", o.dataset.status === newStatus);
        });
        opt.closest(".admin-order-status__dropdown").classList.remove("is-open");
        alert("주문 상태가 변경되었습니다.");
        return;
      }
    });

    document.addEventListener("click", function () { closeAllDropdowns(null); });
  }

  /* 주문번호 클릭 → 인보이스 생성 */
  function initOrderInvoice() {
    document.addEventListener("click", function (e) {
      if (e.target.classList.contains("admin-order-no")) {
        alert("인보이스가 생성되었습니다.");
      }
    });
  }

  /* 배송지 수정 모달 */
  function initOrderAddressModal() {
    var modal   = document.getElementById("orderAddressModal");
    var overlay = document.getElementById("orderAddressOverlay");
    var cancelBtn = document.getElementById("orderAddressCancelBtn");
    var saveBtn   = document.getElementById("orderAddressSaveBtn");
    if (!modal) return;

    function openModal(data) {
      document.getElementById("oaReceiverName").value    = data.name    || "";
      document.getElementById("oaReceiverPhone").value   = data.phone   || "";
      document.getElementById("oaReceiverAddr").value    = data.addr    || "";
      document.getElementById("oaReceiverAddrDetail").value = data.addrDetail || "";
      modal.classList.add("is-open");
      setTimeout(function () { document.getElementById("oaReceiverName").focus(); }, 50);
    }
    function closeModal() { modal.classList.remove("is-open"); }

    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".admin-order-address");
      if (!btn) return;
      openModal({
        name:       btn.dataset.name,
        phone:      btn.dataset.phone,
        addr:       btn.dataset.addr,
        addrDetail: btn.dataset.addrDetail
      });
    });

    if (overlay)   overlay.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (saveBtn)   saveBtn.addEventListener("click", function () {
      alert("배송지 정보가 수정되었습니다.");
      closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  /* 배송자료 다운로드 */
  function initOrderExport() {
    var btn = document.getElementById("orderExportBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var ids = getCheckedOrderIds();
      if (!ids.length) { alert("배송자료를 다운로드할 주문을 선택해주세요."); return; }
      alert("선택한 주문의 배송자료를 다운로드합니다.");
    });
  }

  /* 송장번호 업로드 */
  function initInvoiceUpload() {
    var btn   = document.getElementById("orderInvoiceUploadBtn");
    var input = document.getElementById("orderInvoiceFileInput");
    if (!btn || !input) return;
    btn.addEventListener("click", function () { input.value = ""; input.click(); });
    input.addEventListener("change", function () {
      if (input.files && input.files.length) {
        alert("송장 번호 파일이 선택되었습니다.");
        input.value = "";
      }
    });
  }

  /* 검색 버튼 */
  function initOrderSearch() {
    var btn = document.getElementById("orderSearchBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      /* TODO: 실제 API 연동 시 필터 파라미터 전송 */
    });
  }

  /* ══════════════════════════════════════════════
     상품목록 페이지 — product-list.html 전용 함수
     ══════════════════════════════════════════════ */

  /* 모달 열기/닫기 헬퍼 */
  function openProdModal(id)  { var m = document.getElementById(id); if (m) m.classList.add("is-open"); }
  function closeProdModal(id) { var m = document.getElementById(id); if (m) m.classList.remove("is-open"); }

  var currentProdEditId   = null;
  var currentProdDeleteId = null;
  var currentProdCopyId   = null;

  /* 검색 / 필터 */
  function initProductListFilter() {
    var btn = document.getElementById("productFilterSearchBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      alert("검색 조건이 적용되었습니다.");
    });
    var inp = document.getElementById("productSearchInput");
    if (inp) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") btn.click(); });
  }

  /* 옵션정보 팝업 */
  function initProductOptionModal() {
    var modal    = document.getElementById("productOptionModal");
    var overlay  = document.getElementById("optionModalOverlay");
    var closeBtn = document.getElementById("optionModalCloseBtn");
    if (!modal) return;

    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".product-option-btn");
      if (!btn) return;
      var tr   = btn.closest("tr");
      var name = tr ? (tr.querySelector(".admin-product-name") || {}).textContent || "" : "";
      var el   = document.getElementById("optionModalProductName");
      if (el) el.textContent = name;
      openProdModal("productOptionModal");
    });

    if (closeBtn) closeBtn.addEventListener("click", function () { closeProdModal("productOptionModal"); });
    if (overlay)  overlay.addEventListener("click",  function () { closeProdModal("productOptionModal"); });
  }

  /* 상품 정보 수정 모달 */
  function initProductEditModal() {
    var modal    = document.getElementById("productEditModal");
    var overlay  = document.getElementById("editModalOverlay");
    var closeBtn = document.getElementById("editModalCloseBtn");
    var saveBtn  = document.getElementById("editModalSaveBtn");
    if (!modal) return;

    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".product-edit-btn");
      if (!btn) return;
      var tr = btn.closest("tr");
      currentProdEditId = tr ? tr.dataset.productId : null;
      openProdModal("productEditModal");
    });

    if (closeBtn) closeBtn.addEventListener("click", function () { closeProdModal("productEditModal"); });
    if (overlay)  overlay.addEventListener("click",  function () { closeProdModal("productEditModal"); });

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var nameField  = document.getElementById("editProductName");
        var priceField = document.getElementById("editProductPrice");
        if (nameField && !nameField.value.trim()) {
          alert("상품명을 입력해주세요.");
          nameField.focus();
          return;
        }
        if (priceField && !priceField.value.trim()) {
          alert("판매가를 입력해주세요.");
          priceField.focus();
          return;
        }
        alert("상품 정보가 수정되었습니다.");
        closeProdModal("productEditModal");
      });
    }
  }

  /* 카테고리 변경 모달 */
  function initProductCategoryModal() {
    var modal    = document.getElementById("productCatModal");
    var overlay  = document.getElementById("catModalOverlay");
    var closeBtn = document.getElementById("catModalCloseBtn");
    var applyBtn = document.getElementById("catModalApplyBtn");
    var openBtn  = document.getElementById("editCatChangeBtn");
    if (!modal) return;

    var CAT_MAP = {
      "의류":    ["상의", "하의", "홈웨어", "잡화"],
      "뷰티":    ["스킨케어", "메이크업", "헤어케어", "바디케어"],
      "홈/리빙": ["가구", "조명", "주방", "욕실"],
      "식품":    ["신선식품", "가공식품", "음료", "건강식품"]
    };
    var selDepth1 = "", selDepth2 = "";

    function renderDepth2(cat) {
      var panel = document.getElementById("productCatDepth2");
      if (!panel) return;
      panel.innerHTML = "";
      (CAT_MAP[cat] || []).forEach(function (sub) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "admin-product-cat-item product-cat-depth2-item";
        b.dataset.cat = sub;
        b.textContent = sub;
        b.addEventListener("click", function () {
          selDepth2 = sub;
          document.querySelectorAll(".product-cat-depth2-item").forEach(function (x) { x.classList.remove("is-selected"); });
          b.classList.add("is-selected");
          var el = document.getElementById("catSelectedLabel");
          if (el) el.textContent = selDepth1 + " > " + selDepth2;
        });
        panel.appendChild(b);
      });
    }

    document.querySelectorAll(".product-cat-depth1-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selDepth1 = this.dataset.cat;
        selDepth2 = "";
        document.querySelectorAll(".product-cat-depth1-item").forEach(function (b) { b.classList.remove("is-selected"); });
        this.classList.add("is-selected");
        var el = document.getElementById("catSelectedLabel");
        if (el) el.textContent = selDepth1;
        renderDepth2(selDepth1);
      });
    });

    if (openBtn)  openBtn.addEventListener("click",  function () { openProdModal("productCatModal"); });
    if (closeBtn) closeBtn.addEventListener("click", function () { closeProdModal("productCatModal"); });
    if (overlay)  overlay.addEventListener("click",  function () { closeProdModal("productCatModal"); });

    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        if (!selDepth1) { alert("카테고리를 선택해주세요."); return; }
        var catText   = selDepth1 + (selDepth2 ? " > " + selDepth2 : "");
        var display   = document.getElementById("editCatDisplay");
        if (display) display.textContent = catText;
        alert("카테고리가 변경되었습니다.");
        closeProdModal("productCatModal");
      });
    }
  }

  /* 상세 페이지 탭 전환 */
  function initProductDetailTabs() {
    if (!document.querySelector(".admin-product-detail-tab")) return;
    document.querySelectorAll(".admin-product-detail-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = this.dataset.tab;
        document.querySelectorAll(".admin-product-detail-tab").forEach(function (t) { t.classList.remove("is-active"); });
        document.querySelectorAll(".admin-product-tab-panel").forEach(function (p) { p.classList.remove("is-active"); });
        this.classList.add("is-active");
        var panel = document.getElementById(target);
        if (panel) panel.classList.add("is-active");
      });
    });

    /* 이미지 업로드 박스 */
    var uploadBox = document.getElementById("productDetailUploadBox");
    var uploadInput = document.getElementById("productDetailImageInput");
    if (uploadBox && uploadInput) {
      uploadBox.addEventListener("click", function () { uploadInput.value = ""; uploadInput.click(); });
      uploadInput.addEventListener("change", function () {
        var filesEl = document.getElementById("productDetailUploadFiles");
        if (filesEl) filesEl.textContent = uploadInput.files.length ? uploadInput.files.length + "개 파일 선택됨" : "";
      });
    }
  }

  /* 상품 복사 모달 */
  function initProductCopy() {
    var modal     = document.getElementById("productCopyModal");
    var overlay   = document.getElementById("copyModalOverlay");
    var cancelBtn = document.getElementById("copyModalCancelBtn");
    var confirmBtn = document.getElementById("copyModalConfirmBtn");
    if (!modal) return;

    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".product-copy-btn");
      if (!btn) return;
      var tr = btn.closest("tr");
      currentProdCopyId = tr ? tr.dataset.productId : null;
      var name = tr ? (tr.querySelector(".admin-product-name") || {}).textContent || "상품" : "상품";
      var el = document.getElementById("copyModalProductName");
      if (el) el.textContent = name.trim();
      openProdModal("productCopyModal");
    });

    if (cancelBtn)  cancelBtn.addEventListener("click",  function () { closeProdModal("productCopyModal"); });
    if (overlay)    overlay.addEventListener("click",    function () { closeProdModal("productCopyModal"); });
    if (confirmBtn) confirmBtn.addEventListener("click", function () {
      alert("상품이 복사되었습니다.");
      closeProdModal("productCopyModal");
    });
  }

  /* 상품 삭제 모달 */
  function initProductDelete() {
    var modal     = document.getElementById("productDeleteModal");
    var overlay   = document.getElementById("deleteModalOverlay");
    var cancelBtn = document.getElementById("deleteModalCancelBtn");
    var confirmBtn = document.getElementById("deleteModalConfirmBtn");
    if (!modal) return;

    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".product-delete-btn");
      if (!btn) return;
      var tr = btn.closest("tr");
      currentProdDeleteId = tr ? tr.dataset.productId : null;
      openProdModal("productDeleteModal");
    });

    if (cancelBtn)  cancelBtn.addEventListener("click",  function () { closeProdModal("productDeleteModal"); });
    if (overlay)    overlay.addEventListener("click",    function () { closeProdModal("productDeleteModal"); });
    if (confirmBtn) confirmBtn.addEventListener("click", function () {
      if (currentProdDeleteId) {
        var tr = document.querySelector("tr[data-product-id='" + currentProdDeleteId + "']");
        if (tr) tr.remove();
      }
      alert("상품이 삭제되었습니다.");
      closeProdModal("productDeleteModal");
    });
  }

  /* 판매여부 상태 변경 */
  function initProductStatusChange() {
    var STATUS_MSG = {
      "판매마감": "해당 상품의 판매를 마감하시겠습니까?\n판매마감 상태에서는 고객이 상품을 구매할 수 없습니다.",
      "품절":    "해당 상품을 품절 상태로 변경하시겠습니까?\n품절 상태에서는 상품은 노출될 수 있지만 구매는 불가능합니다.",
      "판매중":  "해당 상품을 판매 중 상태로 변경하시겠습니까?"
    };
    var STATUSES  = ["판매중", "판매마감", "품절"];
    var CLS_MAP   = { "판매중": "active", "판매마감": "closed", "품절": "soldout" };

    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".product-status-btn");
      if (!btn) return;
      var current = btn.dataset.status || "판매중";
      var idx  = STATUSES.indexOf(current);
      var next = STATUSES[(idx + 1) % STATUSES.length];
      var msg  = STATUS_MSG[next] || "상태를 변경하시겠습니까?";
      if (!confirm(msg)) return;
      btn.textContent = next;
      btn.dataset.status = next;
      btn.className = "admin-product-status-btn product-status-btn admin-product-status-btn--" + (CLS_MAP[next] || "active");
      alert("판매 상태가 변경되었습니다.");
    });
  }

  /* 판매링크 복사 */
  function initProductLinkCopy() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".product-link-copy-btn");
      if (!btn) return;
      var link = btn.dataset.link || "https://linkit.kr/product/mock";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).catch(function () {}).finally(function () {
          alert("상품 판매 링크가 복사되었습니다.");
        });
      } else {
        alert("상품 판매 링크가 복사되었습니다.");
      }
    });
  }

  /* ESC로 상품 모달 닫기 */
  function initProductModalEsc() {
    var IDS = ["productOptionModal", "productEditModal", "productCatModal", "productCopyModal", "productDeleteModal"];
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      IDS.forEach(function (id) { closeProdModal(id); });
    });
  }

  /* ── 드롭다운 텍스트 컬러 동기화 ── */
  function syncSelectColor(sel) {
    sel.classList.toggle("has-value", sel.value !== "");
  }
  window.syncSelectColor = syncSelectColor;

  function initSelectColors() {
    document.querySelectorAll(".admin-order-select-wrap select").forEach(function (sel) {
      syncSelectColor(sel);
      sel.addEventListener("change", function () { syncSelectColor(sel); });
    });
  }

  /* ── Init ── */
  document.addEventListener("DOMContentLoaded", function () {
    setActiveNav();
    initSidebar();
    initProductSave();
    initProductCreate();
    initCategorySave();
    initSettingsSave();
    initDesignSave();
    initNoticeWrite();
    initSearchBtns();
    initCategoryPage();
    /* 주문내역 */
    initOrderSelection();
    initOrderStatusChange();
    initOrderRowStatus();
    initOrderInvoice();
    initOrderAddressModal();
    initOrderExport();
    initInvoiceUpload();
    initOrderSearch();
    /* 상품목록 */
    initProductListFilter();
    initProductOptionModal();
    initProductEditModal();
    initProductCategoryModal();
    initProductDetailTabs();
    initProductCopy();
    initProductDelete();
    initProductStatusChange();
    initProductLinkCopy();
    initProductModalEsc();
    initSelectColors();
    /* 상품 진열 */
    if (window.initProductDisplayPage) window.initProductDisplayPage();
    /* 공지사항 */
    if (window.renderDashboardNotices) window.renderDashboardNotices();
    if (window.initNoticePage) window.initNoticePage();
    /* 셀러 관리 */
    if (window.initSellerPage) window.initSellerPage();
    /* 상품목록 */
    if (window.initProductListPage) window.initProductListPage();
    /* 주문내역 */
    if (window.initOrderListPage) window.initOrderListPage();
    /* 환경설정 */
    if (window.initSettingsPage) window.initSettingsPage();
    /* 디자인 관리 */
    if (window.initDesignPage) window.initDesignPage();
    if (window.initDesignEditorPage) window.initDesignEditorPage();
  });
})();

/* ══════════════════════════════════════════════════════
   상품 진열 페이지 (product-display.html) 전용 함수
   ══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── [MOCK] 아래 세 변수는 백엔드 연동 시 API 응답으로 교체 ── */

  /* [MOCK] GET /api/display/sections — { id, name, source } */
  var SECTIONS = [
    { id: 1, name: "오늘의 라이브 쇼핑", source: "default" },
    { id: 2, name: "BEST 상품",           source: "default" },
    { id: 3, name: "이번주 HOT",          source: "default" },
    { id: 4, name: "SALE 상품",           source: "default" },
    { id: 5, name: "신상품 추천",         source: "custom"  },
    { id: 6, name: "MD 추천 상품",        source: "custom"  }
  ];

  /* [MOCK] GET /api/display/sections/{id}/products — { id, productName, thumbnail, sellerName, displayStatus } */
  var SECTION_PRODUCTS = {
    1: [
      { id: 101, productName: "(국내제작)(여리핏/데일리룩) 긴팔 티셔츠", thumbnail: "", sellerName: "어반무드",   displayStatus: "공개" },
      { id: 102, productName: "(단독진행) 러블리무드 리본 블라우스",       thumbnail: "", sellerName: "루미데이",   displayStatus: "공개" },
      { id: 103, productName: "(1+1구성) 모던 세라믹 머그컵 세트",        thumbnail: "", sellerName: "바이엘로",   displayStatus: "비공개" },
      { id: 104, productName: "프리미엄 캐시미어 터틀넥 니트",            thumbnail: "", sellerName: "소프트플랭크", displayStatus: "공개" },
      { id: 105, productName: "수분 진정 에센스 50ml",                   thumbnail: "", sellerName: "루미데이",   displayStatus: "공개" }
    ],
    2: [
      { id: 106, productName: "(한정수량) 미니멀 우드 사이드 테이블",      thumbnail: "", sellerName: "소프트플랭크", displayStatus: "공개" },
      { id: 107, productName: "고밀도 메모리폼 방석",                     thumbnail: "", sellerName: "바이엘로",   displayStatus: "공개" }
    ],
    3: [],
    4: [
      { id: 108, productName: "SALE - 린넨 와이드 팬츠 (30% 할인)",      thumbnail: "", sellerName: "어반무드",   displayStatus: "공개" },
      { id: 109, productName: "SALE - 콜드브루 글라스 세트",             thumbnail: "", sellerName: "바이엘로",   displayStatus: "비공개" }
    ],
    5: [],
    6: []
  };

  /* [MOCK] GET /api/products — { id, productName, thumbnail, sellerName, categoryDepth1, categoryDepth2, salesPeriod, createdAt, updatedAt } */
  var ALL_PRODUCTS = [
    { id: 201, productName: "(한정수량) 미니멀 우드 사이드 테이블",      thumbnail: "", sellerName: "소프트플랭크", categoryDepth1: "인테리어", categoryDepth2: "가구",    salesPeriod: "2026-05-15\n10:02", createdAt: "2026-05-15", updatedAt: "2026-05-16" },
    { id: 202, productName: "(국내제작) 쫀쫀 신축성 슬림 티셔츠",       thumbnail: "", sellerName: "어반무드",    categoryDepth1: "의류",    categoryDepth2: "상의",    salesPeriod: "2026-05-15\n10:02", createdAt: "2026-05-14", updatedAt: "2026-05-15" },
    { id: 203, productName: "수분 진정 에센스 50ml",                    thumbnail: "", sellerName: "루미데이",    categoryDepth1: "뷰티",    categoryDepth2: "스킨케어", salesPeriod: "2026-05-20\n00:00", createdAt: "2026-05-13", updatedAt: "2026-05-14" },
    { id: 204, productName: "고밀도 메모리폼 방석 (라지)",               thumbnail: "", sellerName: "바이엘로",   categoryDepth1: "인테리어", categoryDepth2: "가구",    salesPeriod: "2026-05-18\n10:00", createdAt: "2026-05-12", updatedAt: "2026-05-13" },
    { id: 205, productName: "린넨 와이드 팬츠 (베이지/블랙)",           thumbnail: "", sellerName: "어반무드",    categoryDepth1: "의류",    categoryDepth2: "하의",    salesPeriod: "2026-05-25\n10:00", createdAt: "2026-05-11", updatedAt: "2026-05-12" },
    { id: 206, productName: "세라믹 머그컵 2P 세트",                   thumbnail: "", sellerName: "바이엘로",   categoryDepth1: "인테리어", categoryDepth2: "주방",    salesPeriod: "2026-05-22\n09:00", createdAt: "2026-05-10", updatedAt: "2026-05-11" },
    { id: 207, productName: "두피 케어 샴푸 300ml",                    thumbnail: "", sellerName: "루미데이",    categoryDepth1: "뷰티",    categoryDepth2: "헤어",    salesPeriod: "2026-06-01\n10:00", createdAt: "2026-05-09", updatedAt: "2026-05-10" },
    { id: 208, productName: "캐시미어 터틀넥 니트 (그레이)",            thumbnail: "", sellerName: "소프트플랭크", categoryDepth1: "의류",    categoryDepth2: "상의",    salesPeriod: "2026-05-30\n10:00", createdAt: "2026-05-08", updatedAt: "2026-05-09" },
    { id: 209, productName: "미니 무선 청소기 (화이트)",               thumbnail: "", sellerName: "바이엘로",   categoryDepth1: "가전",    categoryDepth2: "청소",    salesPeriod: "2026-06-05\n10:00", createdAt: "2026-05-07", updatedAt: "2026-05-08" },
    { id: 210, productName: "리본 블라우스 (크림/핑크)",               thumbnail: "", sellerName: "루미데이",    categoryDepth1: "의류",    categoryDepth2: "상의",    salesPeriod: "2026-05-28\n10:00", createdAt: "2026-05-06", updatedAt: "2026-05-07" },
    { id: 211, productName: "아로마 디퓨저 세트 (유칼립투스)",         thumbnail: "", sellerName: "소프트플랭크", categoryDepth1: "인테리어", categoryDepth2: "인테리어소품", salesPeriod: "2026-06-10\n10:00", createdAt: "2026-05-05", updatedAt: "2026-05-06" },
    { id: 212, productName: "스킨케어 기초 4종 세트",                 thumbnail: "", sellerName: "루미데이",    categoryDepth1: "뷰티",    categoryDepth2: "스킨케어", salesPeriod: "2026-06-15\n10:00", createdAt: "2026-05-04", updatedAt: "2026-05-05" }
  ];

  /* [MOCK] GET /api/categories/{id}/subcategories — { [categoryName]: string[] } */
  var SUB_CATEGORY_MAP = {
    "의류":    ["상의", "하의", "홈웨어", "잡화"],
    "뷰티":    ["스킨케어", "헤어", "메이크업"],
    "인테리어": ["가구", "주방", "인테리어소품"],
    "가전":    ["청소", "주방가전", "영상음향"]
  };

  /* ── 상태 변수 ── */
  var selectedSectionId   = null;
  var currentDisplayItems = [];  /* 현재 섹션 진열 상품 (작업 중) */
  var savedDisplayItems   = [];  /* 마지막 저장 상태 */
  var baseProducts        = [];  /* 우측 기준 상품 목록 (현재 섹션 제외) */
  var filteredAllProducts = [];  /* 검색/필터 적용 결과 */
  var isRightPanelActive  = false; /* 우측 패널 활성화 여부 */
  var isDirty = false;

  /* ── SVG 아이콘 상수 ── */
  var ICON_DRAG = [
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">',
      '<circle cx="5"  cy="4"  r="1.5" fill="currentColor"/>',
      '<circle cx="5"  cy="8"  r="1.5" fill="currentColor"/>',
      '<circle cx="5"  cy="12" r="1.5" fill="currentColor"/>',
      '<circle cx="11" cy="4"  r="1.5" fill="currentColor"/>',
      '<circle cx="11" cy="8"  r="1.5" fill="currentColor"/>',
      '<circle cx="11" cy="12" r="1.5" fill="currentColor"/>',
    '</svg>'
  ].join("");

  var ICON_TRASH = [
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
      ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
      '<polyline points="3 6 5 6 21 6"/>',
      '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    '</svg>'
  ].join("");

  var ICON_IMG = [
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"',
      ' stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
      '<rect x="3" y="3" width="18" height="18" rx="2"/>',
      '<circle cx="8.5" cy="8.5" r="1.5"/>',
      '<polyline points="21 15 16 10 5 21"/>',
    '</svg>'
  ].join("");

  /* ── XSS 방지 ── */
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ── 섹션명 조회 ── */
  function getSectionName(id) {
    var sec = SECTIONS.find(function (s) { return s.id === id; });
    return sec ? sec.name : "";
  }

  /* ── 버튼 활성화 제어 ── */
  function setDisplayBtn(el, enabled) {
    if (!el) return;
    el.disabled = !enabled;
    el.setAttribute("aria-disabled", String(!enabled));
    if (enabled) {
      el.style.pointerEvents = "";
      el.style.opacity = "";
    }
  }

  /* ── 왼쪽 진열 테이블 렌더 ── */
  function renderDisplayList() {
    var tbody  = document.getElementById("displayProductBody");
    var table  = document.getElementById("displayProductTable");
    var empty  = document.getElementById("displayEmptyMsg");
    var countEl = document.getElementById("displayProductCount");
    if (!tbody) return;

    var count = currentDisplayItems.length;
    if (countEl) countEl.textContent = count;

    if (count === 0) {
      if (table) table.style.display = "none";
      if (empty) empty.style.display = "";
      return;
    }
    if (table) table.style.display = "";
    if (empty) empty.style.display = "none";

    tbody.innerHTML = "";
    currentDisplayItems.forEach(function (item, idx) {
      var isPublic = item.displayStatus === "공개";
      var tr = document.createElement("tr");
      tr.dataset.displayId = item.id;

      tr.innerHTML =
        '<td style="text-align:center;">' +
          '<span class="admin-display-drag" aria-label="드래그해서 순서 변경">' + ICON_DRAG + '</span>' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<div class="admin-product-thumb">' +
            (item.thumbnail
              ? '<img src="' + esc(item.thumbnail) + '" alt="' + esc(item.productName) + '" />'
              : ICON_IMG
            ) +
          '</div>' +
        '</td>' +
        '<td>' +
          '<span class="admin-product-name" title="' + esc(item.productName) + '">' + esc(item.productName) + '</span>' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<button type="button"' +
            ' class="admin-product-status-btn ' +
            (isPublic ? 'admin-product-status-btn--active' : 'admin-product-status-btn--soldout') + '"' +
            ' data-display-id="' + item.id + '"' +
            ' data-role="toggle-vis"' +
            ' aria-label="공개 상태 토글">' +
            (isPublic ? '공개' : '비공개') +
          '</button>' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<button type="button"' +
            ' class="admin-product-icon-btn admin-product-icon-btn--danger"' +
            ' data-display-id="' + item.id + '"' +
            ' data-role="delete-vis"' +
            ' aria-label="진열에서 제거">' +
            ICON_TRASH +
          '</button>' +
        '</td>';
      tbody.appendChild(tr);
    });

    markDirty();
  }

  /* ── 우측 패널 초기 empty 상태로 리셋 ── */
  function resetRightPanel() {
    isRightPanelActive = false;
    baseProducts = [];
    filteredAllProducts = [];
    var initEmpty = document.getElementById("displayAllInitEmpty");
    var srchEmpty = document.getElementById("displayAllEmpty");
    var table     = document.getElementById("displayAllTable");
    var tbody     = document.getElementById("displayAllBody");
    if (initEmpty) initEmpty.style.display = "";
    if (srchEmpty) srchEmpty.style.display = "none";
    if (table)     table.style.display = "none";
    if (tbody)     tbody.innerHTML = "";
    var allCheck = document.getElementById("displaySelectAll");
    if (allCheck) { allCheck.checked = false; allCheck.indeterminate = false; }
    /* 필터·검색 초기화 */
    var cat1 = document.getElementById("displayCat1Filter");
    var cat2 = document.getElementById("displayCat2Filter");
    var searchInput = document.getElementById("displaySearchInput");
    if (cat1) { cat1.value = ""; if (window.syncSelectColor) window.syncSelectColor(cat1); }
    if (cat2) { cat2.innerHTML = '<option value="">하위 카테고리</option>'; if (window.syncSelectColor) window.syncSelectColor(cat2); }
    if (searchInput) searchInput.value = "";
  }

  /* ── 우측 패널 활성화: 현재 섹션 상품 제외한 목록 표시 ── */
  function activateRightPanel() {
    isRightPanelActive = true;
    var excludedIds = currentDisplayItems.map(function (p) { return p.id; });
    baseProducts = ALL_PRODUCTS.filter(function (p) {
      return excludedIds.indexOf(p.id) === -1;
    });
    filteredAllProducts = baseProducts.slice();
    applySortAndRender();
  }

  /* ── 오른쪽 전체 상품 테이블 렌더 ── */
  function renderAllProducts(products) {
    var tbody     = document.getElementById("displayAllBody");
    var initEmpty = document.getElementById("displayAllInitEmpty");
    var srchEmpty = document.getElementById("displayAllEmpty");
    var table     = document.getElementById("displayAllTable");
    if (!tbody) return;

    /* 초기 empty 항상 숨김 (이미 활성화된 상태) */
    if (initEmpty) initEmpty.style.display = "none";

    if (!products.length) {
      tbody.innerHTML = "";
      if (table)     table.style.display = "none";
      if (srchEmpty) srchEmpty.style.display = "";
      return;
    }
    if (srchEmpty) srchEmpty.style.display = "none";
    if (table)     table.style.display = "";

    tbody.innerHTML = "";
    products.forEach(function (prod) {
      var tr = document.createElement("tr");
      tr.dataset.productId = prod.id;

      tr.innerHTML =
        '<td style="text-align:center;">' +
          '<input type="checkbox" class="display-product-check"' +
            ' data-product-id="' + prod.id + '"' +
            ' aria-label="' + esc(prod.productName) + ' 선택"' +
            ' style="accent-color:var(--admin-red);cursor:pointer;" />' +
        '</td>' +
        '<td style="text-align:center;">' +
          '<div class="admin-product-thumb">' +
            (prod.thumbnail
              ? '<img src="' + esc(prod.thumbnail) + '" alt="' + esc(prod.productName) + '" />'
              : ICON_IMG
            ) +
          '</div>' +
        '</td>' +
        '<td>' +
          '<span class="admin-product-name" title="' + esc(prod.productName) + '">' + esc(prod.productName) + '</span>' +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  /* ── dirty 상태 마킹 ── */
  function markDirty() {
    isDirty = true;
    updateActionButtons();
  }

  /* ── 액션 버튼 상태 동기화 ── */
  function updateActionButtons() {
    var sectionSelected = selectedSectionId !== null;
    setDisplayBtn(document.getElementById("displayAddProductBtn"), sectionSelected);
    setDisplayBtn(document.getElementById("displayResetBtn"), sectionSelected && isDirty);
    setDisplayBtn(document.getElementById("displayApplyBtn"), sectionSelected);
    updateAddBtnState();
  }

  /* ── 추가 버튼 활성 여부 ── */
  function updateAddBtnState() {
    var hasChecked = document.querySelectorAll(".display-product-check:checked").length > 0;
    var sectionSelected = selectedSectionId !== null;
    setDisplayBtn(document.getElementById("displayAddBtn"), sectionSelected && hasChecked);
    setDisplayBtn(document.getElementById("displayClearBtn"), hasChecked);
  }

  /* ── 모달 open/close ── */
  function openDisplayModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add("is-open");
  }
  function closeDisplayModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove("is-open");
  }

  /* ── 섹션 선택 ── */
  function initDisplaySectionSelect() {
    var sel = document.getElementById("displaySectionSelect");
    if (!sel) return;

    sel.addEventListener("change", function () {
      var val = parseInt(sel.value, 10);
      resetRightPanel();
      if (!val) {
        selectedSectionId = null;
        currentDisplayItems = [];
        savedDisplayItems   = [];
        isDirty = false;
        renderDisplayList();
        updateActionButtons();
        return;
      }
      selectedSectionId = val;
      var src = (SECTION_PRODUCTS[val] || []).map(function (p) { return Object.assign({}, p); });
      currentDisplayItems = src;
      savedDisplayItems   = src.map(function (p) { return Object.assign({}, p); });
      isDirty = false;
      renderDisplayList();
      updateActionButtons();
    });
  }

  /* ── 카테고리 필터 ── */
  function initDisplayProductSearch() {
    var cat1 = document.getElementById("displayCat1Filter");
    var cat2 = document.getElementById("displayCat2Filter");
    if (!cat1 || !cat2) return;

    cat1.addEventListener("change", function () {
      var subs = SUB_CATEGORY_MAP[cat1.value] || [];
      cat2.innerHTML = '<option value="">하위 카테고리</option>';
      cat2.value = "";
      if (window.syncSelectColor) window.syncSelectColor(cat2);
      subs.forEach(function (sub) {
        var opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        cat2.appendChild(opt);
      });
    });

    var searchInput = document.getElementById("displaySearchInput");
    var searchBtn   = document.getElementById("displaySearchBtn");

    function doSearch() {
      if (!isRightPanelActive) return;
      var keyword = searchInput ? searchInput.value.trim() : "";
      var c1 = cat1.value;
      var c2 = cat2.value;

      filteredAllProducts = baseProducts.filter(function (p) {
        var matchC1 = !c1 || p.categoryDepth1 === c1;
        var matchC2 = !c2 || p.categoryDepth2 === c2;
        var matchKw = !keyword || p.productName.includes(keyword);
        return matchC1 && matchC2 && matchKw;
      });

      applySortAndRender();
    }

    if (searchBtn) searchBtn.addEventListener("click", doSearch);
    if (searchInput) {
      searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") doSearch();
      });
    }
  }

  /* ── 정렬 ── */
  function initDisplayProductSort() {
    var sel = document.getElementById("displaySortSelect");
    if (!sel) return;
    sel.addEventListener("change", applySortAndRender);
  }

  function applySortAndRender() {
    if (!isRightPanelActive) return;
    var sel = document.getElementById("displaySortSelect");
    var val = sel ? sel.value : "newest";
    var list = filteredAllProducts.slice();

    list.sort(function (a, b) {
      if (val === "newest")      return b.createdAt.localeCompare(a.createdAt);
      if (val === "oldest")      return a.createdAt.localeCompare(b.createdAt);
      if (val === "updatedDesc") return b.updatedAt.localeCompare(a.updatedAt);
      if (val === "updatedAsc")  return a.updatedAt.localeCompare(b.updatedAt);
      if (val === "nameAsc")     return a.productName.localeCompare(b.productName, "ko");
      if (val === "nameDesc")    return b.productName.localeCompare(a.productName, "ko");
      return 0;
    });

    renderAllProducts(list);
    syncSelectAll();
  }

  /* ── 전체 선택 checkbox 동기화 ── */
  function syncSelectAll() {
    var all = document.getElementById("displaySelectAll");
    if (!all) return;
    var checks = document.querySelectorAll(".display-product-check");
    var checked = document.querySelectorAll(".display-product-check:checked");
    all.checked = checks.length > 0 && checks.length === checked.length;
    all.indeterminate = checked.length > 0 && checked.length < checks.length;
  }

  /* ── checkbox 선택 ── */
  function initDisplayProductSelection() {
    var allCheck = document.getElementById("displaySelectAll");
    var allBody  = document.getElementById("displayAllBody");
    if (!allCheck || !allBody) return;

    allCheck.addEventListener("change", function () {
      document.querySelectorAll(".display-product-check").forEach(function (cb) {
        cb.checked = allCheck.checked;
      });
      updateAddBtnState();
    });

    allBody.addEventListener("change", function (e) {
      if (!e.target.classList.contains("display-product-check")) return;
      syncSelectAll();
      updateAddBtnState();
    });

    /* 선택 해제 */
    var clearBtn = document.getElementById("displayClearBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        document.querySelectorAll(".display-product-check").forEach(function (cb) {
          cb.checked = false;
        });
        if (allCheck) allCheck.checked = false;
        updateAddBtnState();
      });
    }
  }

  /* ── 우측 '추가' 버튼 → 확인 모달 ── */
  function initDisplayProductAdd() {
    var addBtn = document.getElementById("displayAddBtn");
    if (!addBtn) return;

    addBtn.addEventListener("click", function () {
      if (!selectedSectionId) {
        alert("먼저 섹션을 선택해주세요.");
        return;
      }
      var checked = document.querySelectorAll(".display-product-check:checked");
      if (!checked.length) {
        alert("진열할 상품을 선택해주세요.");
        return;
      }
      var sectionName = getSectionName(selectedSectionId);
      var desc = document.getElementById("displayConfirmDesc");
      if (desc) {
        desc.innerHTML =
          '<strong style="color:var(--admin-red);">' + esc(sectionName) + '</strong>' +
          '에 <strong>' + checked.length + '</strong>개의 상품을 진열하시겠습니까?';
      }
      openDisplayModal("displayConfirmModal");
    });
  }

  /* ── 확인 모달 ── */
  function initDisplayConfirmModal() {
    var cancelBtn = document.getElementById("displayConfirmCancelBtn");
    var okBtn     = document.getElementById("displayConfirmOkBtn");
    var overlay   = document.getElementById("displayConfirmOverlay");
    if (!okBtn) return;

    if (cancelBtn) cancelBtn.addEventListener("click", function () { closeDisplayModal("displayConfirmModal"); });
    if (overlay)   overlay.addEventListener("click",   function () { closeDisplayModal("displayConfirmModal"); });

    okBtn.addEventListener("click", function () {
      var checked = document.querySelectorAll(".display-product-check:checked");
      var added = [];
      checked.forEach(function (cb) {
        var pid = parseInt(cb.dataset.productId, 10);
        var alreadyIn = currentDisplayItems.some(function (p) { return p.id === pid; });
        if (!alreadyIn) {
          var prod = ALL_PRODUCTS.find(function (p) { return p.id === pid; });
          if (prod) {
            added.push({ id: prod.id, productName: prod.productName, thumbnail: prod.thumbnail, sellerName: prod.sellerName, displayStatus: "공개" });
          }
        }
      });
      currentDisplayItems = currentDisplayItems.concat(added);

      var sectionName = getSectionName(selectedSectionId);
      var completeDesc = document.getElementById("displayCompleteDesc");
      if (completeDesc) {
        completeDesc.innerHTML =
          '<strong style="color:var(--admin-red);">' + esc(sectionName) + '</strong>' +
          '에 <strong>' + checked.length + '</strong>개의 상품 진열이 완료되었습니다.';
      }

      closeDisplayModal("displayConfirmModal");
      renderDisplayList();
      /* 우측: 방금 추가된 상품 제외하여 재계산 */
      if (isRightPanelActive) activateRightPanel();
      openDisplayModal("displayCompleteModal");
    });
  }

  /* ── 완료 모달 ── */
  function initDisplayCompleteModal() {
    var okBtn   = document.getElementById("displayCompleteOkBtn");
    var overlay = document.getElementById("displayCompleteOverlay");
    if (!okBtn) return;

    function closeAndReset() {
      closeDisplayModal("displayCompleteModal");
      /* 우측 패널 체크 상태 초기화 (테이블은 activateRightPanel이 이미 재렌더) */
      document.querySelectorAll(".display-product-check").forEach(function (cb) { cb.checked = false; });
      var allCheck = document.getElementById("displaySelectAll");
      if (allCheck) { allCheck.checked = false; allCheck.indeterminate = false; }
      updateAddBtnState();
    }

    okBtn.addEventListener("click", closeAndReset);
    if (overlay) overlay.addEventListener("click", closeAndReset);
  }

  /* ── 좌측 '+ 상품 추가' 버튼 ── */
  function initDisplayAddProductBtn() {
    var btn = document.getElementById("displayAddProductBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!selectedSectionId) {
        alert("먼저 섹션을 선택해주세요.");
        return;
      }
      activateRightPanel();
    });
  }

  /* ── 공개/비공개 토글 (이벤트 위임) ── */
  function initDisplayStatusToggle() {
    var tbody = document.getElementById("displayProductBody");
    if (!tbody) return;

    tbody.addEventListener("click", function (e) {
      var btn = e.target.closest('[data-role="toggle-vis"]');
      if (!btn) return;
      var pid = parseInt(btn.dataset.displayId, 10);
      var item = currentDisplayItems.find(function (p) { return p.id === pid; });
      if (!item) return;
      item.displayStatus = item.displayStatus === "공개" ? "비공개" : "공개";
      renderDisplayList();
    });
  }

  /* ── 진열 상품 삭제 (이벤트 위임) ── */
  function initDisplayDelete() {
    var tbody = document.getElementById("displayProductBody");
    if (!tbody) return;

    tbody.addEventListener("click", function (e) {
      var btn = e.target.closest('[data-role="delete-vis"]');
      if (!btn) return;
      var pid = parseInt(btn.dataset.displayId, 10);
      if (!confirm("해당 상품을 섹션에서 제거하시겠습니까?")) return;
      currentDisplayItems = currentDisplayItems.filter(function (p) { return p.id !== pid; });
      renderDisplayList();
    });
  }

  /* ── 되돌리기 ── */
  function initDisplayReset() {
    var btn = document.getElementById("displayResetBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!confirm("변경사항을 되돌리시겠습니까?")) return;
      currentDisplayItems = savedDisplayItems.map(function (p) { return Object.assign({}, p); });
      isDirty = false;
      renderDisplayList();
      updateActionButtons();
      alert("변경사항이 되돌려졌습니다.");
    });
  }

  /* ── 적용 ── */
  function initDisplayApply() {
    var btn = document.getElementById("displayApplyBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!selectedSectionId) return;
      if (!confirm("변경사항을 저장하시겠습니까?")) return;
      /* mock 저장: 메모리에 반영 */
      savedDisplayItems = currentDisplayItems.map(function (p) { return Object.assign({}, p); });
      SECTION_PRODUCTS[selectedSectionId] = savedDisplayItems.map(function (p) { return Object.assign({}, p); });
      isDirty = false;
      updateActionButtons();
      alert("변경사항이 저장되었습니다.");
    });
  }

  /* ── ESC 키로 모달 닫기 ── */
  function initDisplayModalEsc() {
    var MODAL_IDS = ["displayConfirmModal", "displayCompleteModal"];
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      MODAL_IDS.forEach(function (id) { closeDisplayModal(id); });
    });
  }

  /* ── 진입점 ── */
  function initProductDisplayPage() {
    if (!document.getElementById("displaySectionSelect")) return;

    initDisplaySectionSelect();
    initDisplayProductSearch();
    initDisplayProductSort();
    initDisplayProductSelection();
    initDisplayProductAdd();
    initDisplayConfirmModal();
    initDisplayCompleteModal();
    initDisplayAddProductBtn();
    initDisplayStatusToggle();
    initDisplayDelete();
    initDisplayReset();
    initDisplayApply();
    initDisplayModalEsc();

    renderDisplayList();
    updateActionButtons();
  }

  /* DOMContentLoaded에서 호출되도록 전역 노출 */
  window.initProductDisplayPage = initProductDisplayPage;

})();

/* ══════════════════════════════════════════════════════
   공지사항 — 공통 데이터 및 페이지 함수
   ══════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ── HTML 이스케이프 ── */
  function escN(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* [MOCK] GET /api/notices — { id, title, author, date, time, isImportant, content } */
  function getNoticeMockData() {
    var c1 = "안녕하세요. 링크잇입니다.\n보다 안정적인 서비스 제공을 위해 아래와 같이 시스템 점검을 진행할 예정입니다.\n\n■ 점검 일정: 2026년 05월 30일(토) 23:00 ~ 23:59 (약 1시간)\n■ 점검 대상: 전체 서비스\n■ 점검 내용: 서버 안정화 및 기능 업데이트\n\n점검 시간 동안 서비스 이용이 제한될 수 있으니 양해 부탁드립니다.\n더 나은 서비스로 보답하겠습니다.\n\n감사합니다.";
    var c2 = "안녕하세요. 링크잇입니다.\n보다 안정적인 서비스 제공을 위해 아래와 같이 긴급 시스템 점검을 진행합니다.\n\n■ 점검 일정: 2026년 05월 20일(수) 10:00 ~ 11:00 (약 1시간)\n■ 점검 대상: 전체 서비스\n■ 점검 내용: 서버 성능 개선 및 긴급 패치 적용\n\n중요 공지: 해당 점검은 서비스 안정화를 위한 필수 작업으로, 점검 시간 준수를 부탁드립니다.\n이용에 불편을 드려 죄송합니다.\n\n감사합니다.";
    var c3 = "안녕하세요. 링크잇입니다.\n고객님의 더욱 편리한 쇼핑 경험을 위해 모바일 앱이 새롭게 업데이트되었습니다.\n\n■ 업데이트 버전: v3.2.0\n■ 업데이트 일시: 2026-05-01 00:05\n■ 주요 변경 사항\n  - 상품 상세 페이지 이미지 슬라이더 개선\n  - 장바구니 UX 개선 및 속도 향상\n  - 결제 프로세스 안정성 향상\n  - 기타 버그 수정\n\n앱스토어 및 구글플레이에서 최신 버전으로 업데이트하시면 이용 가능합니다.\n감사합니다.";
    var c4 = "안녕하세요. 링크잇입니다.\n보다 편리한 쇼핑 경험을 위한 앱 업데이트가 진행되었습니다.\n\n■ 업데이트 버전: v3.1.5\n■ 업데이트 일시: 2026-04-30\n■ 주요 변경 사항\n  - 검색 기능 개선\n  - 찜하기 기능 안정성 향상\n  - 기타 UI/UX 개선\n\n자동 업데이트가 지원되지 않는 경우 앱스토어에서 직접 업데이트해 주세요.\n감사합니다.";
    var c5 = "안녕하세요. 링크잇입니다.\n더 나은 사용자 경험을 위해 앱 업데이트가 진행되었습니다.\n\n■ 업데이트 버전: v3.1.4\n■ 업데이트 일시: 2026-04-27\n■ 주요 변경 사항\n  - 알림 기능 개선\n  - 로그인 프로세스 안정화\n  - 성능 최적화\n\n감사합니다.";
    var c6 = "안녕하세요. 링크잇입니다.\n아래와 같이 서비스 점검을 진행할 예정입니다.\n\n■ 점검 일정: 2026년 04월 30일(목) 23:00 ~ 23:59 (약 1시간)\n■ 점검 대상: 전체 서비스\n■ 점검 내용: 서버 안정화 작업\n\n점검 시간 동안 서비스 이용이 일시 제한됩니다.\n이용에 불편을 드려 죄송합니다.\n\n감사합니다.";
    var c7 = "안녕하세요. 링크잇입니다.\n2026년 4월 1일 기준으로 모바일 앱 기능이 새롭게 개선되었습니다.\n\n■ 주요 변경 사항\n  - 홈 화면 개편 (개인화 추천 기능 추가)\n  - 쿠폰 및 포인트 UI 개선\n  - 배송 조회 기능 강화\n  - 접근성 개선 (시각 장애 지원)\n\n더욱 편리해진 링크잇 앱을 이용해 주세요.\n감사합니다.";
    var c8 = "안녕하세요. 링크잇입니다.\n아래와 같이 정기 서비스 점검을 진행합니다.\n\n■ 점검 일정: 2026년 03월 22일(일) 10:03 ~ 11:03 (약 1시간)\n■ 점검 대상: 전체 서비스\n■ 점검 내용: 정기 유지보수 및 보안 패치\n\n이용에 불편을 드려 죄송합니다.\n감사합니다.";
    var c9 = "안녕하세요. 링크잇입니다.\n아래와 같이 서비스 점검을 진행할 예정입니다.\n\n■ 점검 일정: 2026년 03월 30일(월) 23:00 ~ 23:59 (약 1시간)\n■ 점검 대상: 전체 서비스\n■ 점검 내용: 3월 말 정기 점검 및 기능 업데이트\n\n감사합니다.";
    var c10 = "안녕하세요. 링크잇 운영팀입니다.\n안정적인 서비스 제공을 위한 서버 이전 작업을 아래와 같이 진행합니다.\n\n■ 작업 일시: 2026년 03월 15일(일) 09:03 ~ 11:03 (약 2시간)\n■ 영향 범위: 전체 서비스\n■ 작업 내용: 서버 인프라 이전 및 네트워크 성능 개선\n\n작업 시간 동안 일시적으로 서비스 접속이 불가할 수 있습니다.\n불편을 드려 죄송하며, 보다 빠르고 안정적인 서비스로 보답하겠습니다.\n\n감사합니다.";
    var c11 = "안녕하세요. 링크잇입니다.\n2026년 3월 1일부터 링크잇 서비스 이용 약관이 개정됩니다.\n\n■ 시행 일자: 2026년 03월 01일\n■ 주요 변경 내용\n  - 제7조 (서비스 이용 범위) 일부 개정\n  - 제12조 (개인정보 처리) 항목 추가\n  - 제15조 (분쟁 해결) 조항 명확화\n\n변경된 약관은 링크잇 앱 내 '설정 > 이용약관'에서 확인하실 수 있습니다.\n\n감사합니다.";
    var c12 = "안녕하세요. 링크잇입니다.\n개인정보 보호법 개정에 따라 개인정보 처리방침이 아래와 같이 변경됩니다.\n\n■ 시행 일자: 2026년 02월 15일\n■ 주요 변경 내용\n  - 수집하는 개인정보 항목 명확화\n  - 개인정보 보유 기간 세분화\n  - 이용자 권리 행사 절차 구체화\n\n변경된 처리방침은 링크잇 홈페이지 및 앱 내에서 확인하실 수 있습니다.\n궁금한 사항은 고객센터로 문의해 주세요.\n\n감사합니다.";

    return [
      { id: 1,  title: "서비스 점검 안내(5/30)",                                                                                    author: "링크잇", date: "2026-05-23", time: "12:00", isImportant: false, content: c1  },
      { id: 2,  title: "서비스 안정화를 위한 시스템 점검 안내드립니다",                                                             author: "링크잇", date: "2026-05-20", time: "10:00", isImportant: true,  content: c2  },
      { id: 3,  title: "고객님의 더욱 편리한 쇼핑 경험을 위해 모바일 앱 기능이 새롭게 개선되었습니다(2026/05/01기준)",              author: "관리자", date: "2026-05-01", time: "00:05", isImportant: false, content: c3  },
      { id: 4,  title: "보다 편리한 쇼핑 경험을 위한 앱 업데이트가 진행되었습니다",                                                 author: "링크잇", date: "2026-04-30", time: "16:03", isImportant: false, content: c4  },
      { id: 5,  title: "보다 편리한 쇼핑 경험을 위한 앱 업데이트가 진행되었습니다",                                                 author: "링크잇", date: "2026-04-27", time: "18:00", isImportant: false, content: c5  },
      { id: 6,  title: "서비스 점검 안내(4/30)",                                                                                    author: "링크잇", date: "2026-04-20", time: "16:03", isImportant: false, content: c6  },
      { id: 7,  title: "모바일 앱 기능이 새롭게 개선되었습니다(2026/04/01기준)",                                                    author: "링크잇", date: "2026-03-30", time: "00:03", isImportant: false, content: c7  },
      { id: 8,  title: "서비스 점검 안내",                                                                                          author: "링크잇", date: "2026-03-22", time: "10:03", isImportant: false, content: c8  },
      { id: 9,  title: "서비스 점검 안내(3/30)",                                                                                    author: "관리자", date: "2026-03-20", time: "16:03", isImportant: false, content: c9  },
      { id: 10, title: "안정적인 서비스 제공을 위한 서버 이전 작업 안내",                                                          author: "관리자", date: "2026-03-15", time: "09:03", isImportant: false, content: c10 },
      { id: 11, title: "링크잇 서비스 이용 약관 개정 안내",                                                                        author: "링크잇", date: "2026-02-28", time: "09:00", isImportant: false, content: c11 },
      { id: 12, title: "개인정보 처리방침 변경 안내",                                                                              author: "링크잇", date: "2026-02-10", time: "09:00", isImportant: false, content: c12 }
    ];
  }

  /* ── 대시보드 공지사항 렌더링 ── */
  function renderDashboardNotices() {
    var list = document.getElementById("dashboardNoticeList");
    if (!list) return;
    var notices = getNoticeMockData().slice(0, 5);
    list.innerHTML = notices.map(function (n) {
      var badgeClass = n.isImportant ? "admin-badge--important" : "admin-badge--notice";
      var badgeText  = n.isImportant ? "중요" : "공지";
      return '<a href="notice.html?id=' + n.id + '" class="admin-notice-item">' +
        '<span class="admin-badge ' + badgeClass + ' t-label-2-sb">' + badgeText + '</span>' +
        '<span class="admin-notice-title t-body-2-rg">' + escN(n.title) + '</span>' +
        '<span class="admin-notice-date t-body-3-rg">' + n.date + '</span>' +
      '</a>';
    }).join("");
  }

  /* ── 공지사항 페이지 상태 ── */
  var noticeCurrentPage = 1;
  var noticeItemsPerPage = 10;
  var noticeCurrentFilter = "";

  /* ── 공지사항 페이지 초기화 (진입점) ── */
  function initNoticePage() {
    if (!document.getElementById("noticeListView")) return;
    initNoticeNavigation();
    initNoticePageFromQuery();
  }

  function initNoticePageFromQuery() {
    var params = new URLSearchParams(location.search);
    var rawId = params.get("id");
    if (rawId) {
      var notices = getNoticeMockData();
      var notice = null;
      for (var i = 0; i < notices.length; i++) {
        if (String(notices[i].id) === String(rawId)) { notice = notices[i]; break; }
      }
      if (notice) {
        showNoticeDetail(notice);
      } else {
        alert("해당 공지사항을 찾을 수 없습니다.");
        showNoticeList();
      }
    } else {
      showNoticeList();
    }
  }

  /* ── 목록 화면 표시 ── */
  function showNoticeList() {
    var lv = document.getElementById("noticeListView");
    var dv = document.getElementById("noticeDetailView");
    if (lv) lv.style.display = "";
    if (dv) dv.style.display = "none";
    initNoticeSearch();
    renderNoticeList(getNoticeMockData(), noticeCurrentPage);
  }

  /* ── 상세 화면 표시 ── */
  function showNoticeDetail(notice) {
    var lv = document.getElementById("noticeListView");
    var dv = document.getElementById("noticeDetailView");
    if (lv) lv.style.display = "none";
    if (dv) dv.style.display = "";
    renderNoticeDetail(notice);
  }

  /* ── 목록 렌더링 ── */
  function renderNoticeList(notices, page) {
    var filtered = notices;
    if (noticeCurrentFilter) {
      var kw = noticeCurrentFilter.toLowerCase();
      filtered = notices.filter(function (n) {
        return n.title.toLowerCase().indexOf(kw) !== -1;
      });
    }

    var total = filtered.length;
    var start = (page - 1) * noticeItemsPerPage;
    var pageItems = filtered.slice(start, start + noticeItemsPerPage);
    var tbody = document.getElementById("noticeTableBody");
    if (!tbody) return;

    if (total === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="admin-notice-empty">검색 결과가 없습니다.</td></tr>';
      renderNoticePagination(0, 1);
      return;
    }

    tbody.innerHTML = pageItems.map(function (n, idx) {
      var num = start + idx + 1;
      var badge = n.isImportant
        ? '<span class="admin-badge admin-badge--important t-label-2-sb" style="margin-right:6px;">중요</span>'
        : '';
      return '<tr>' +
        '<td class="admin-notice-col-num">' + num + '</td>' +
        '<td>' +
          '<a href="notice.html?id=' + n.id + '" class="admin-notice-title-link">' +
            badge + escN(n.title) +
          '</a>' +
        '</td>' +
        '<td class="admin-notice-col-author">' + escN(n.author) + '</td>' +
        '<td class="admin-notice-col-date">' + n.date + ' ' + n.time + '</td>' +
      '</tr>';
    }).join("");

    renderNoticePagination(total, page);
  }

  /* ── 페이지네이션 렌더링 ── */
  function renderNoticePagination(total, current) {
    var container = document.getElementById("noticePagination");
    if (!container) return;
    var totalPages = Math.max(1, Math.ceil(total / noticeItemsPerPage));
    if (totalPages <= 1) { container.innerHTML = ""; return; }

    var html =
      '<button type="button" class="admin-page-btn" data-notice-prev aria-label="이전 페이지">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>' +
      '</button>';
    for (var i = 1; i <= totalPages; i++) {
      html += '<button type="button" class="admin-page-btn' + (i === current ? " is-active" : "") +
        '" data-notice-page="' + i + '" aria-label="' + i + ' 페이지"' +
        (i === current ? ' aria-current="page"' : '') + '>' + i + '</button>';
    }
    html +=
      '<button type="button" class="admin-page-btn" data-notice-next aria-label="다음 페이지">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</button>';

    container.innerHTML = html;

    container.querySelector("[data-notice-prev]").addEventListener("click", function () {
      if (noticeCurrentPage > 1) {
        noticeCurrentPage--;
        renderNoticeList(getNoticeMockData(), noticeCurrentPage);
      }
    });
    container.querySelector("[data-notice-next]").addEventListener("click", function () {
      if (noticeCurrentPage < totalPages) {
        noticeCurrentPage++;
        renderNoticeList(getNoticeMockData(), noticeCurrentPage);
      }
    });
    container.querySelectorAll("[data-notice-page]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        noticeCurrentPage = parseInt(this.dataset.noticePage, 10);
        renderNoticeList(getNoticeMockData(), noticeCurrentPage);
      });
    });
  }

  /* ── 검색 초기화 ── */
  function initNoticeSearch() {
    var input = document.getElementById("noticeSearchInput");
    var btn   = document.getElementById("noticeSearchBtn");
    if (!input || !btn) return;

    function doSearch() {
      noticeCurrentFilter = input.value.trim();
      noticeCurrentPage = 1;
      renderNoticeList(getNoticeMockData(), 1);
    }

    btn.addEventListener("click", doSearch);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") doSearch();
    });
  }

  /* ── 상세 렌더링 ── */
  function renderNoticeDetail(notice) {
    var notices = getNoticeMockData();
    var idx = -1;
    for (var i = 0; i < notices.length; i++) {
      if (notices[i].id === notice.id) { idx = i; break; }
    }
    var prev = idx > 0 ? notices[idx - 1] : null;
    var next = idx < notices.length - 1 ? notices[idx + 1] : null;

    /* badge */
    var badgeEl = document.getElementById("noticeDetailBadge");
    if (badgeEl) {
      badgeEl.innerHTML = notice.isImportant
        ? '<span class="admin-badge admin-badge--important t-label-2-sb">중요</span>'
        : '<span class="admin-badge admin-badge--notice t-label-2-sb">공지</span>';
    }

    /* title */
    var titleEl = document.getElementById("noticeDetailTitle");
    if (titleEl) titleEl.textContent = notice.title;

    /* meta */
    var authorEl = document.getElementById("noticeDetailAuthor");
    if (authorEl) authorEl.textContent = notice.author;
    var dateEl = document.getElementById("noticeDetailDate");
    if (dateEl) dateEl.textContent = notice.date + " " + notice.time;

    /* content (pre-line for line breaks) */
    var contentEl = document.getElementById("noticeDetailContent");
    if (contentEl) contentEl.textContent = notice.content;

    /* 이전글/다음글 */
    var navEl = document.getElementById("noticeNav");
    if (navEl) {
      var makeNavItem = function (label, item) {
        var inner = item
          ? '<a href="notice.html?id=' + item.id + '" class="admin-notice-nav-link">' + escN(item.title) + '</a>'
          : '<span class="admin-notice-nav-none">' + label + '이 없습니다.</span>';
        return '<div class="admin-notice-nav-row">' +
          '<span class="admin-notice-nav-label">' + label + '</span>' +
          inner +
        '</div>';
      };
      navEl.innerHTML = makeNavItem("이전글", prev) + makeNavItem("다음글", next);
    }
  }

  /* ── 브라우저 뒤로/앞으로 처리 ── */
  function initNoticeNavigation() {
    window.addEventListener("popstate", function () {
      initNoticePageFromQuery();
    });
  }

  /* ── 전역 노출 ── */
  window.getNoticeMockData      = getNoticeMockData;
  window.renderDashboardNotices = renderDashboardNotices;
  window.initNoticePage         = initNoticePage;

})();

/* ══════════════════════════════════════════════════════
   셀러 관리 페이지 (seller-list.html) 전용 함수
   ══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── 아이콘 SVG 상수 ── */
  var ICON_EDIT = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  var ICON_DEL  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';

  /* [MOCK] GET /api/sellers — { id, sellerName, sellerId, productCount, status, registeredDate } */
  var sellerData = [
    { id: 1,  sellerName: "어반무드",     sellerId: "urbanmood",     productCount: 128, status: "승인", registeredDate: "2026-04-30" },
    { id: 2,  sellerName: "바이엘르",     sellerId: "byelle",        productCount: 54,  status: "승인", registeredDate: "2026-04-30" },
    { id: 3,  sellerName: "루미데이",     sellerId: "lumiday",       productCount: 305, status: "정지", registeredDate: "2026-04-30" },
    { id: 4,  sellerName: "모노픽",       sellerId: "monopick",      productCount: 0,   status: "정지", registeredDate: "2026-04-30" },
    { id: 5,  sellerName: "소프트블랭크", sellerId: "softblank",     productCount: 89,  status: "승인", registeredDate: "2026-04-27" },
    { id: 6,  sellerName: "오브젝트홈",   sellerId: "objecthome",    productCount: 211, status: "승인", registeredDate: "2026-04-24" },
    { id: 7,  sellerName: "헤이클로젯",   sellerId: "heycloset",     productCount: 17,  status: "정지", registeredDate: "2026-04-23" },
    { id: 8,  sellerName: "포레스트키친", sellerId: "forestkitchen", productCount: 220, status: "승인", registeredDate: "2026-04-10" },
    { id: 9,  sellerName: "라이크선데이", sellerId: "likesunday",    productCount: 3,   status: "승인", registeredDate: "2026-04-05" },
    { id: 10, sellerName: "누벨르",       sellerId: "nouvelle",      productCount: 442, status: "승인", registeredDate: "2026-03-30" },
    { id: 11, sellerName: "밀라노키친",   sellerId: "milanokitchen", productCount: 76,  status: "승인", registeredDate: "2026-03-25" },
    { id: 12, sellerName: "그레이룸",     sellerId: "greyroom",      productCount: 188, status: "승인", registeredDate: "2026-03-20" },
    { id: 13, sellerName: "블루포레",     sellerId: "bluefore",      productCount: 34,  status: "정지", registeredDate: "2026-03-15" },
    { id: 14, sellerName: "라라클로젯",   sellerId: "laracloset",    productCount: 95,  status: "승인", registeredDate: "2026-03-10" },
    { id: 15, sellerName: "소울홈",       sellerId: "soulhome",      productCount: 147, status: "승인", registeredDate: "2026-03-05" },
    { id: 16, sellerName: "핑크무드",     sellerId: "pinkmood",      productCount: 23,  status: "정지", registeredDate: "2026-02-28" },
    { id: 17, sellerName: "데일리하우스", sellerId: "dailyhouse",    productCount: 312, status: "승인", registeredDate: "2026-02-20" },
    { id: 18, sellerName: "블랑제리",     sellerId: "boulangerie",   productCount: 8,   status: "승인", registeredDate: "2026-02-15" },
    { id: 19, sellerName: "마르쉐",       sellerId: "marche",        productCount: 67,  status: "승인", registeredDate: "2026-02-10" },
    { id: 20, sellerName: "비아블루",     sellerId: "viablue",       productCount: 155, status: "정지", registeredDate: "2026-02-05" },
    { id: 21, sellerName: "플로라홈",     sellerId: "florahome",     productCount: 41,  status: "승인", registeredDate: "2026-01-30" },
    { id: 22, sellerName: "오뜨쿠진",     sellerId: "hautecuisine",  productCount: 280, status: "승인", registeredDate: "2026-01-25" },
    { id: 23, sellerName: "모닝글로리",   sellerId: "morningglory",  productCount: 119, status: "승인", registeredDate: "2026-01-20" },
    { id: 24, sellerName: "르블랑",       sellerId: "leblanc",       productCount: 0,   status: "정지", registeredDate: "2026-01-15" },
    { id: 25, sellerName: "세이지그린",   sellerId: "sagegreen",     productCount: 73,  status: "승인", registeredDate: "2026-01-10" },
    { id: 26, sellerName: "플럼스튜디오", sellerId: "plumstudio",    productCount: 198, status: "승인", registeredDate: "2026-01-05" }
  ];
  var nextId = 27;

  /* ── 검색·페이지 상태 ── */
  var currentStatusFilter = "";
  var currentKeyword = "";
  var currentPage = 1;
  var itemsPerPage = 10;

  /* ── Guard: seller-list.html 외에서는 실행 안 함 ── */
  function getRoot() { return document.getElementById("sellerTableBody"); }

  /* ── 필터링 ── */
  function getFiltered() {
    return sellerData.filter(function (s) {
      var statusOk  = !currentStatusFilter || s.status === currentStatusFilter;
      var keywordOk = !currentKeyword ||
        s.sellerName.indexOf(currentKeyword) !== -1 ||
        s.sellerId.indexOf(currentKeyword) !== -1 ||
        s.productCount.toString().indexOf(currentKeyword) !== -1;
      return statusOk && keywordOk;
    });
  }

  /* ── 목록 렌더링 ── */
  function renderSellerList() {
    var tbody = getRoot();
    if (!tbody) return;

    var filtered = getFiltered();
    var total = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    if (currentPage > totalPages) currentPage = 1;

    var start = (currentPage - 1) * itemsPerPage;
    var slice = filtered.slice(start, start + itemsPerPage);

    if (!slice.length) {
      tbody.innerHTML =
        '<tr class="admin-seller-empty-row"><td colspan="7">검색 결과가 없습니다.</td></tr>';
      renderSellerPagination(0, 1);
      return;
    }

    tbody.innerHTML = slice.map(function (s, idx) {
      var num = start + idx + 1;
      var badgeClass = s.status === "승인"
        ? "admin-badge--seller-approved"
        : "admin-badge--seller-suspended";

      return '<tr>' +
        '<td style="text-align:center;" class="t-body-3-rg" style="color:var(--admin-muted);">' + num + '</td>' +
        '<td>' + escSeller(s.sellerName) + '</td>' +
        '<td style="text-align:center; color:var(--admin-muted);" class="t-body-3-rg">' + escSeller(s.sellerId) + '</td>' +
        '<td style="text-align:center;">' + s.productCount.toLocaleString() + '</td>' +
        '<td style="text-align:center;">' +
          '<span class="admin-badge ' + badgeClass + ' t-label-2-sb">' + s.status + '</span>' +
        '</td>' +
        '<td style="text-align:center; color:var(--admin-muted);" class="t-body-3-rg">' + s.registeredDate + '</td>' +
        '<td>' +
          '<div class="admin-product-actions" style="justify-content:center;">' +
            '<button type="button" class="admin-btn admin-btn--outline admin-btn--sm seller-edit-btn" data-id="' + s.id + '" aria-label="정보수정">정보수정</button>' +
            '<button type="button" class="admin-product-icon-btn admin-product-icon-btn--danger seller-del-btn" data-id="' + s.id + '" aria-label="셀러 삭제">' +
              ICON_DEL +
            '</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join("");

    renderSellerPagination(total, currentPage);
    bindRowActions();
  }

  /* ── 페이지네이션 ── */
  function renderSellerPagination(total, current) {
    var wrap = document.getElementById("sellerPagination");
    if (!wrap) return;

    var totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    if (total === 0) { wrap.innerHTML = ""; return; }

    var html = "";

    /* 이전 */
    html += '<button type="button" class="admin-page-btn seller-page-nav" data-dir="prev"' +
      (current <= 1 ? ' disabled style="opacity:.4;cursor:default;"' : "") + ' aria-label="이전 페이지">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>' +
    '</button>';

    /* 페이지 번호 — 최대 5개 노출 */
    var WINDOW = 2;
    var startPage = Math.max(1, current - WINDOW);
    var endPage   = Math.min(totalPages, current + WINDOW);

    if (startPage > 1) {
      html += '<button type="button" class="admin-page-btn seller-page-btn" data-page="1">1</button>';
      if (startPage > 2) html += '<span class="admin-page-btn" style="border:none;background:none;cursor:default;">…</span>';
    }
    for (var p = startPage; p <= endPage; p++) {
      html += '<button type="button" class="admin-page-btn seller-page-btn' + (p === current ? " is-active" : "") + '" data-page="' + p + '">' + p + '</button>';
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += '<span class="admin-page-btn" style="border:none;background:none;cursor:default;">…</span>';
      html += '<button type="button" class="admin-page-btn seller-page-btn" data-page="' + totalPages + '">' + totalPages + '</button>';
    }

    /* 다음 */
    html += '<button type="button" class="admin-page-btn seller-page-nav" data-dir="next"' +
      (current >= totalPages ? ' disabled style="opacity:.4;cursor:default;"' : "") + ' aria-label="다음 페이지">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>' +
    '</button>';

    wrap.innerHTML = html;

    wrap.querySelectorAll(".seller-page-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentPage = parseInt(btn.dataset.page, 10);
        renderSellerList();
      });
    });
    wrap.querySelectorAll(".seller-page-nav").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        if (btn.dataset.dir === "prev" && currentPage > 1) currentPage--;
        else if (btn.dataset.dir === "next") currentPage++;
        renderSellerList();
      });
    });
  }

  /* ── 행 내부 버튼 바인딩 ── */
  function bindRowActions() {
    /* 정보수정 */
    document.querySelectorAll(".seller-edit-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = parseInt(btn.dataset.id, 10);
        openEditModal(id);
      });
    });
    /* 삭제 */
    document.querySelectorAll(".seller-del-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = parseInt(btn.dataset.id, 10);
        deleteSeller(id);
      });
    });
  }

  /* ── 검색 ── */
  function initSellerSearch() {
    var statusSel = document.getElementById("sellerStatusFilter");
    var searchInput = document.getElementById("sellerSearchInput");
    var searchBtn = document.getElementById("sellerSearchBtn");
    if (!statusSel || !searchInput || !searchBtn) return;

    function doSearch() {
      currentStatusFilter = statusSel.value;
      currentKeyword = searchInput.value.trim();
      currentPage = 1;
      renderSellerList();
    }

    searchBtn.addEventListener("click", doSearch);
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") doSearch();
    });

    /* 드롭다운 색상 동기화 */
    if (window.syncSelectColor) {
      window.syncSelectColor(statusSel);
      statusSel.addEventListener("change", function () { window.syncSelectColor(statusSel); });
    }
  }

  /* ── 등록 모달 ── */
  function initSellerCreateModal() {
    var modal = document.getElementById("sellerCreateModal");
    var overlay = document.getElementById("sellerCreateOverlay");
    var openBtn = document.getElementById("sellerCreateBtn");
    var cancelBtn = document.getElementById("sellerCreateCancelBtn");
    var submitBtn = document.getElementById("sellerCreateSubmitBtn");
    if (!modal || !openBtn) return;

    function openModal() {
      document.getElementById("createSellerName").value = "";
      document.getElementById("createSellerId").value = "";
      document.getElementById("createSellerPw").value = "";
      var toggle = document.getElementById("createSellerStatus");
      toggle.checked = false;
      updateToggleLabel("createSellerStatus", "createSellerStatusLabel");
      modal.classList.add("is-open");
    }
    function closeModal() { modal.classList.remove("is-open"); }

    openBtn.addEventListener("click", openModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (overlay) overlay.addEventListener("click", closeModal);

    if (submitBtn) {
      submitBtn.addEventListener("click", function () {
        var name = document.getElementById("createSellerName").value.trim();
        var sid  = document.getElementById("createSellerId").value.trim();
        var pw   = document.getElementById("createSellerPw").value.trim();
        var checked = document.getElementById("createSellerStatus").checked;

        if (!name) { alert("셀러명을 입력해주세요."); document.getElementById("createSellerName").focus(); return; }
        if (!sid)  { alert("셀러 아이디를 입력해주세요."); document.getElementById("createSellerId").focus(); return; }
        if (!pw)   { alert("비밀번호를 입력해주세요."); document.getElementById("createSellerPw").focus(); return; }

        sellerData.unshift({
          id: nextId++,
          sellerName: name,
          sellerId: sid,
          productCount: 0,
          status: checked ? "승인" : "정지",
          registeredDate: new Date().toISOString().slice(0, 10)
        });

        closeModal();
        currentPage = 1;
        renderSellerList();
        alert("셀러가 등록되었습니다.");
      });
    }
  }

  /* ── 수정 모달 ── */
  function initSellerEditModal() {
    var modal = document.getElementById("sellerEditModal");
    var overlay = document.getElementById("sellerEditOverlay");
    var cancelBtn = document.getElementById("sellerEditCancelBtn");
    var submitBtn = document.getElementById("sellerEditSubmitBtn");
    if (!modal) return;

    function closeModal() { modal.classList.remove("is-open"); }

    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
    if (overlay) overlay.addEventListener("click", closeModal);

    if (submitBtn) {
      submitBtn.addEventListener("click", function () {
        var id   = parseInt(document.getElementById("editSellerHiddenId").value, 10);
        var name = document.getElementById("editSellerName").value.trim();
        var sid  = document.getElementById("editSellerLoginId").value.trim();
        var pw   = document.getElementById("editSellerPw").value;
        var checked = document.getElementById("editSellerStatus").checked;

        if (!name) { alert("셀러명을 입력해주세요."); document.getElementById("editSellerName").focus(); return; }
        if (!sid)  { alert("셀러 아이디를 입력해주세요."); document.getElementById("editSellerLoginId").focus(); return; }

        var seller = findSeller(id);
        if (seller) {
          seller.sellerName = name;
          seller.sellerId   = sid;
          seller.status     = checked ? "승인" : "정지";
        }

        closeModal();
        renderSellerList();
        alert("셀러 정보가 수정되었습니다.");
      });
    }
  }

  /* ── 수정 모달 open (데이터 주입) ── */
  function openEditModal(id) {
    var modal = document.getElementById("sellerEditModal");
    if (!modal) return;
    var seller = findSeller(id);
    if (!seller) return;

    document.getElementById("editSellerHiddenId").value  = seller.id;
    document.getElementById("editSellerName").value     = seller.sellerName;
    document.getElementById("editSellerLoginId").value  = seller.sellerId;
    document.getElementById("editSellerPw").value       = "******";

    var toggle = document.getElementById("editSellerStatus");
    toggle.checked = seller.status === "승인";
    updateToggleLabel("editSellerStatus", "editSellerStatusLabel");

    modal.classList.add("is-open");
  }

  /* ── 삭제 ── */
  function deleteSeller(id) {
    if (!confirm("셀러를 삭제하시겠습니까?")) return;
    sellerData = sellerData.filter(function (s) { return s.id !== id; });
    renderSellerList();
    alert("셀러가 삭제되었습니다.");
  }

  /* ── 비밀번호 보기 토글 ── */
  function initSellerPasswordToggle() {
    document.querySelectorAll(".admin-seller-pw-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetId = btn.dataset.target;
        var input = document.getElementById(targetId);
        if (!input) return;

        var isText = input.type === "text";
        input.type = isText ? "password" : "text";
        btn.setAttribute("aria-label", isText ? "비밀번호 보기" : "비밀번호 숨기기");

        var eyeOff = btn.querySelector(".icon-eye-off");
        var eyeOn  = btn.querySelector(".icon-eye-on");
        if (eyeOff) eyeOff.style.display = isText ? "" : "none";
        if (eyeOn)  eyeOn.style.display  = isText ? "none" : "";
      });
    });
  }

  /* ── 상태 토글 텍스트 연동 ── */
  function initSellerStatusToggle() {
    ["createSellerStatus", "editSellerStatus"].forEach(function (inputId) {
      var labelId = inputId === "createSellerStatus"
        ? "createSellerStatusLabel"
        : "editSellerStatusLabel";
      var input = document.getElementById(inputId);
      if (!input) return;
      input.addEventListener("change", function () {
        updateToggleLabel(inputId, labelId);
      });
    });
  }

  function updateToggleLabel(inputId, labelId) {
    var input = document.getElementById(inputId);
    var label = document.getElementById(labelId);
    if (!input || !label) return;
    label.textContent = input.checked ? "승인" : "정지";
  }

  /* ── ESC로 모달 닫기 ── */
  function initSellerEsc() {
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      ["sellerCreateModal", "sellerEditModal"].forEach(function (id) {
        var m = document.getElementById(id);
        if (m) m.classList.remove("is-open");
      });
    });
  }

  /* ── 유틸 ── */
  function escSeller(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findSeller(id) {
    for (var i = 0; i < sellerData.length; i++) {
      if (sellerData[i].id === id) return sellerData[i];
    }
    return null;
  }

  /* ── 진입점 ── */
  function initSellerPage() {
    if (!getRoot()) return;
    renderSellerList();
    initSellerSearch();
    initSellerCreateModal();
    initSellerEditModal();
    initSellerPasswordToggle();
    initSellerStatusToggle();
    initSellerEsc();
  }

  window.initSellerPage = initSellerPage;

})();

/* ══════════════════════════════════════════════════════
   상품 목록 페이지 (product-list.html) — mock + pagination
   [MOCK] 아래 IMGS, CHANNELS, STATUSES, productData를 API로 교체
   ══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* [MOCK] 아래 IMGS·CHANNELS는 productData의 img·channel 값과 쌍임 — API 연동 시 productData로 통합 */
  var IMGS = [
    "assets/긴팔.png","assets/긴팔-1.png","assets/sleeveless.png",
    "assets/블라우스.png","assets/mug.png","assets/pants.png",
    "assets/hood.png","assets/longsleeves.png","assets/minibag.png"
  ];
  var CHANNELS = ["오로라","셀러A","셀러B","루미","어반무드"];
  var STATUSES = [
    {key:"판매중",  cls:"admin-product-status-btn--active"},
    {key:"판매마감",cls:"admin-product-status-btn--closed"},
    {key:"품절",   cls:"admin-product-status-btn--soldout"}
  ];

  /* [MOCK] GET /api/products — { id, img, name, orig, sale, period, periodEnd, statusIdx, stock, sold, channel, regDate } */
  var productData = [
    {id:1,  img:"assets/긴팔.png",     name:"(국내제작)(여리핏/데일리룩/쫀쫀신축성) 메이드 스퀘어넥 슬림 골지 긴팔 티셔츠", orig:"40,000원", sale:"35,000원", period:"2026-07-31", periodEnd:"23:59 까지 판매", statusIdx:0, stock:125, sold:88,  channel:"오로라", regDate:"2026-04-01"},
    {id:2,  img:"assets/sleeveless.png",name:"ELLE PARIS PDRN 콜라겐 녹는실 탄력 앰플",                                      orig:"55,000원", sale:"49,000원", period:"2026-06-30", periodEnd:"23:59 까지 판매", statusIdx:0, stock:200, sold:156, channel:"오로라", regDate:"2026-04-05"},
    {id:3,  img:"assets/블라우스.png",  name:"(단독진행)(봄신상/러블리무드/레이어드추천) 루에느 리본 퍼프 블라우스",          orig:"45,000원", sale:"38,000원", period:"2026-05-15", periodEnd:"10:00 까지 판매", statusIdx:1, stock:0,   sold:210, channel:"셀러A", regDate:"2026-03-20"},
    {id:4,  img:"assets/mug.png",      name:"(1+1구성) 모던 세라믹 머그컵 세트",                                             orig:"28,000원", sale:"22,000원", period:"2026-08-31", periodEnd:"23:59 까지 판매", statusIdx:0, stock:80,  sold:45,  channel:"셀러B", regDate:"2026-04-10"},
    {id:5,  img:"assets/pants.png",    name:"(기획특가) 와이드 핀턱 밴딩 슬랙스",                                            orig:"58,000원", sale:"52,000원", period:"2026-06-01", periodEnd:"18:00 까지 판매", statusIdx:2, stock:0,   sold:320, channel:"오로라", regDate:"2026-03-15"},
    {id:6,  img:"assets/longsleeves.png",name:"[써머세일] 오가닉 코튼 스트라이프 오버핏 셔츠",                               orig:"39,000원", sale:"32,000원", period:"2026-09-30", periodEnd:"23:59 까지 판매", statusIdx:0, stock:150, sold:72,  channel:"셀러A", regDate:"2026-04-15"},
    {id:7,  img:"assets/minibag.png",  name:"[기획] 프리미엄 레더 미니 크로스백",                                            orig:"120,000원",sale:"99,000원", period:"2026-12-31", periodEnd:"23:59 까지 판매", statusIdx:0, stock:30,  sold:15,  channel:"오로라", regDate:"2026-04-20"},
    {id:8,  img:"assets/긴팔-1.png",   name:"청량한 여름 린넨 블렌드 와이드 팬츠",                                           orig:"62,000원", sale:"55,000원", period:"2026-07-15", periodEnd:"23:59 까지 판매", statusIdx:0, stock:95,  sold:63,  channel:"셀러B", regDate:"2026-04-25"},
    {id:9,  img:"assets/hood.png",     name:"내추럴 우드 스탠딩 데스크 라이트",                                              orig:"89,000원", sale:"75,000원", period:"2026-05-31", periodEnd:"23:59 까지 판매", statusIdx:1, stock:10,  sold:28,  channel:"셀러A", regDate:"2026-04-02"},
    {id:10, img:"assets/블라우스.png",  name:"비건 시카 진정 수분 크림 50ml",                                                orig:"35,000원", sale:"29,000원", period:"2026-10-15", periodEnd:"23:59 까지 판매", statusIdx:0, stock:180, sold:94,  channel:"오로라", regDate:"2026-05-01"},
    {id:11, img:"assets/긴팔.png",     name:"캐시미어 블렌드 터틀넥 니트 풀오버",                                            orig:"89,000원", sale:"72,000원", period:"2026-11-30", periodEnd:"23:59 까지 판매", statusIdx:0, stock:60,  sold:41,  channel:"루미",  regDate:"2026-04-08"},
    {id:12, img:"assets/sleeveless.png",name:"[리뉴얼] 비타민C 브라이트닝 세럼 30ml",                                       orig:"42,000원", sale:"36,000원", period:"2026-08-15", periodEnd:"23:59 까지 판매", statusIdx:0, stock:300, sold:187, channel:"셀러B", regDate:"2026-03-25"},
    {id:13, img:"assets/pants.png",    name:"(데일리룩) 스트레치 조거 팬츠 / 베이지",                                        orig:"32,000원", sale:"27,000원", period:"2026-07-01", periodEnd:"23:59 까지 판매", statusIdx:0, stock:110, sold:98,  channel:"오로라", regDate:"2026-04-12"},
    {id:14, img:"assets/hood.png",     name:"[봄기획] 오버핏 루즈핏 후드 집업",                                              orig:"55,000원", sale:"45,000원", period:"2026-06-15", periodEnd:"23:59 까지 판매", statusIdx:2, stock:0,   sold:253, channel:"셀러A", regDate:"2026-03-10"},
    {id:15, img:"assets/mug.png",      name:"핸드메이드 도자기 머그컵 / 민트",                                               orig:"22,000원", sale:"18,500원", period:"2026-09-01", periodEnd:"23:59 까지 판매", statusIdx:0, stock:45,  sold:32,  channel:"루미",  regDate:"2026-04-18"},
    {id:16, img:"assets/minibag.png",  name:"[단독] 리얼 스웨이드 버킷백 / 카멜",                                            orig:"98,000원", sale:"82,000원", period:"2026-12-15", periodEnd:"23:59 까지 판매", statusIdx:0, stock:20,  sold:11,  channel:"어반무드",regDate:"2026-04-22"},
    {id:17, img:"assets/긴팔-1.png",   name:"(국내제작) 실크 터치 플리츠 스커트 / 아이보리",                                  orig:"48,000원", sale:"41,000원", period:"2026-08-20", periodEnd:"23:59 까지 판매", statusIdx:0, stock:75,  sold:54,  channel:"셀러B", regDate:"2026-04-03"},
    {id:18, img:"assets/블라우스.png",  name:"[기획전] 리넨 나시 블라우스 3color",                                            orig:"29,000원", sale:"24,000원", period:"2026-06-30", periodEnd:"23:59 까지 판매", statusIdx:1, stock:0,   sold:178, channel:"오로라", regDate:"2026-03-05"},
    {id:19, img:"assets/longsleeves.png",name:"프리미엄 메리노울 롱슬리브 티셔츠",                                           orig:"65,000원", sale:"55,000원", period:"2026-11-15", periodEnd:"23:59 까지 판매", statusIdx:0, stock:88,  sold:67,  channel:"루미",  regDate:"2026-04-28"},
    {id:20, img:"assets/sleeveless.png",name:"히알루론산 콜라겐 스킨 에센스 50ml",                                           orig:"38,000원", sale:"32,000원", period:"2026-09-15", periodEnd:"23:59 까지 판매", statusIdx:0, stock:220, sold:143, channel:"셀러A", regDate:"2026-05-02"},
    {id:21, img:"assets/pants.png",    name:"[써머] 린넨 와이드 팬츠 2color",                                                orig:"45,000원", sale:"38,000원", period:"2026-07-31", periodEnd:"23:59 까지 판매", statusIdx:0, stock:135, sold:112, channel:"어반무드",regDate:"2026-04-14"},
    {id:22, img:"assets/긴팔.png",     name:"(기획특가) 쿨링 기능성 스포츠 레깅스",                                          orig:"35,000원", sale:"29,000원", period:"2026-08-31", periodEnd:"23:59 까지 판매", statusIdx:0, stock:160, sold:128, channel:"셀러B", regDate:"2026-04-07"},
    {id:23, img:"assets/hood.png",     name:"[단독진행] 클래식 체크 울 머플러",                                              orig:"52,000원", sale:"44,000원", period:"2026-12-31", periodEnd:"23:59 까지 판매", statusIdx:0, stock:40,  sold:22,  channel:"루미",  regDate:"2026-04-16"},
    {id:24, img:"assets/mug.png",      name:"오가닉 핸드크림 3종 선물세트",                                                  orig:"28,000원", sale:"23,000원", period:"2026-10-31", periodEnd:"23:59 까지 판매", statusIdx:0, stock:85,  sold:61,  channel:"오로라", regDate:"2026-04-19"},
    {id:25, img:"assets/minibag.png",  name:"[봄신상] 미니멀 캔버스 에코백",                                                 orig:"18,000원", sale:"15,000원", period:"2026-09-30", periodEnd:"23:59 까지 판매", statusIdx:0, stock:250, sold:198, channel:"셀러A", regDate:"2026-04-24"},
    {id:26, img:"assets/긴팔-1.png",   name:"자수 포인트 셔링 원피스 / 플라워",                                              orig:"58,000원", sale:"49,000원", period:"2026-07-20", periodEnd:"23:59 까지 판매", statusIdx:0, stock:55,  sold:43,  channel:"어반무드",regDate:"2026-04-26"},
    {id:27, img:"assets/블라우스.png",  name:"[기획] 싱글 버튼 트위드 자켓",                                                  orig:"115,000원",sale:"95,000원", period:"2026-11-01", periodEnd:"23:59 까지 판매", statusIdx:2, stock:0,   sold:87,  channel:"루미",  regDate:"2026-03-18"},
    {id:28, img:"assets/sleeveless.png",name:"바이오 셀룰로오스 마스크팩 10매",                                              orig:"32,000원", sale:"26,000원", period:"2026-08-10", periodEnd:"23:59 까지 판매", statusIdx:0, stock:500, sold:312, channel:"셀러B", regDate:"2026-03-28"},
    {id:29, img:"assets/longsleeves.png",name:"(국내제작) 레이어드 티셔츠 세트",                                             orig:"42,000원", sale:"35,000원", period:"2026-07-25", periodEnd:"23:59 까지 판매", statusIdx:0, stock:90,  sold:76,  channel:"오로라", regDate:"2026-04-29"},
    {id:30, img:"assets/pants.png",    name:"[단독] 스트라이프 테일러드 팬츠",                                                orig:"68,000원", sale:"58,000원", period:"2026-10-01", periodEnd:"23:59 까지 판매", statusIdx:0, stock:35,  sold:19,  channel:"셀러A", regDate:"2026-05-03"},
    {id:31, img:"assets/긴팔.png",     name:"퍼프 소매 크롭 니트 가디건",                                                    orig:"48,000원", sale:"40,000원", period:"2026-09-20", periodEnd:"23:59 까지 판매", statusIdx:0, stock:70,  sold:55,  channel:"어반무드",regDate:"2026-04-11"},
    {id:32, img:"assets/hood.png",     name:"[특가] 오가닉 코튼 남여공용 후드티",                                            orig:"38,000원", sale:"32,000원", period:"2026-08-25", periodEnd:"23:59 까지 판매", statusIdx:0, stock:120, sold:89,  channel:"루미",  regDate:"2026-04-13"},
    {id:33, img:"assets/minibag.png",  name:"이탈리안 크로코 패턴 클러치백",                                                 orig:"78,000원", sale:"65,000원", period:"2026-12-20", periodEnd:"23:59 까지 판매", statusIdx:1, stock:0,   sold:134, channel:"셀러B", regDate:"2026-04-17"},
    {id:34, img:"assets/mug.png",      name:"핸드드립 전용 도자기 드리퍼 세트",                                              orig:"55,000원", sale:"46,000원", period:"2026-11-20", periodEnd:"23:59 까지 판매", statusIdx:0, stock:28,  sold:14,  channel:"오로라", regDate:"2026-05-05"}
  ];

  var ICON_EDIT = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  var ICON_DEL  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';

  var PAGE_SIZE   = 10;
  var currentPage = 1;
  var filteredData = productData.slice();

  function renderProductList() {
    var tbody = document.getElementById("productTableBody");
    if (!tbody) return;

    var start = (currentPage - 1) * PAGE_SIZE;
    var rows  = filteredData.slice(start, start + PAGE_SIZE);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding:40px 16px; color:var(--admin-muted);">검색 결과가 없습니다.</td></tr>';
      renderProductPagination();
      return;
    }

    tbody.innerHTML = rows.map(function (p, idx) {
      var num    = start + idx + 1;
      var st     = STATUSES[p.statusIdx];
      return '<tr data-product-id="' + p.id + '">' +
        '<td style="text-align:center;">' + num + '</td>' +
        '<td style="text-align:center;"><div class="admin-product-thumb"><img src="' + p.img + '" alt="상품 이미지" /></div></td>' +
        '<td><span class="admin-product-name">' + p.name + '</span></td>' +
        '<td><div class="admin-product-price"><span class="admin-product-price__original">' + p.orig + '</span><span class="admin-product-price__sale">' + p.sale + '</span></div></td>' +
        '<td><div class="admin-product-period">' + p.period + '<br /><span class="admin-product-period__time">' + p.periodEnd + '</span></div></td>' +
        '<td style="text-align:center;"><button type="button" class="admin-product-option-btn product-option-btn" aria-label="옵션 관리">관리</button></td>' +
        '<td style="text-align:center;"><button type="button" class="admin-product-status-btn product-status-btn ' + st.cls + '" data-status="' + st.key + '" aria-label="판매 상태 변경">' + st.key + '</button></td>' +
        '<td style="text-align:center;">' + p.stock + '</td>' +
        '<td style="text-align:center;">' + p.sold + '</td>' +
        '<td><div class="admin-product-link"><span class="admin-product-link__channel">' + p.channel + '</span><button type="button" class="admin-product-link__copy product-link-copy-btn" data-link="https://linkit.kr/product/' + p.id + '" aria-label="링크 복사">링크 복사</button></div></td>' +
        '<td class="t-body-3-rg" style="text-align:center; color:var(--admin-muted);">' + p.regDate + '</td>' +
        '<td><div class="admin-product-actions">' +
          '<button type="button" class="admin-btn admin-btn--outline admin-btn--sm product-copy-btn" aria-label="상품 복사">상품복사</button>' +
          '<button type="button" class="admin-product-icon-btn product-edit-btn" aria-label="상품 수정">' + ICON_EDIT + '</button>' +
          '<button type="button" class="admin-product-icon-btn admin-product-icon-btn--danger product-delete-btn" aria-label="상품 삭제">' + ICON_DEL + '</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');

    renderProductPagination();
  }

  function renderProductPagination() {
    var pag = document.getElementById("productPagination");
    if (!pag) return;

    var total = filteredData.length;
    var totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    if (totalPages <= 1) { pag.innerHTML = ''; return; }

    var ICON_PREV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';
    var ICON_NEXT = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

    var html = '';
    html += '<button type="button" class="admin-page-btn" data-pl-page="prev" aria-label="이전 페이지"' + (currentPage === 1 ? ' disabled' : '') + '>' + ICON_PREV + '</button>';

    var group = Math.floor((currentPage - 1) / 5);
    var startP = group * 5 + 1;
    var endP   = Math.min(startP + 4, totalPages);

    for (var i = startP; i <= endP; i++) {
      html += '<button type="button" class="admin-page-btn' + (i === currentPage ? ' is-active' : '') + '" data-pl-page="' + i + '" aria-label="' + i + ' 페이지"' + (i === currentPage ? ' aria-current="page"' : '') + '>' + i + '</button>';
    }
    if (endP < totalPages) {
      html += '<span class="admin-page-btn" style="border:none;background:none;cursor:default;color:var(--admin-muted);" aria-hidden="true">…</span>';
      html += '<button type="button" class="admin-page-btn" data-pl-page="' + totalPages + '" aria-label="' + totalPages + ' 페이지">' + totalPages + '</button>';
    }

    html += '<button type="button" class="admin-page-btn" data-pl-page="next" aria-label="다음 페이지"' + (currentPage === totalPages ? ' disabled' : '') + '>' + ICON_NEXT + '</button>';
    pag.innerHTML = html;
  }

  function initProductListPage() {
    var pag = document.getElementById("productPagination");
    if (!pag) return;

    filteredData = productData.slice();
    currentPage  = 1;
    renderProductList();

    pag.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-pl-page]");
      if (!btn || btn.disabled) return;
      var val = btn.getAttribute("data-pl-page");
      var total = filteredData.length;
      var totalPages = Math.ceil(total / PAGE_SIZE) || 1;
      if (val === "prev") { if (currentPage > 1) currentPage--; }
      else if (val === "next") { if (currentPage < totalPages) currentPage++; }
      else { currentPage = parseInt(val, 10); }
      renderProductList();
    });

    /* 검색/필터 버튼 */
    var filterBtn = document.getElementById("productFilterApplyBtn");
    var searchInput = document.getElementById("productNameSearch");
    var statusSelect = document.getElementById("productStatusFilter");

    function applyFilter() {
      var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var statusVal = statusSelect ? statusSelect.value : '';
      filteredData = productData.filter(function (p) {
        var matchName = !keyword || p.name.toLowerCase().indexOf(keyword) !== -1;
        var matchStatus = !statusVal || STATUSES[p.statusIdx].key === statusVal;
        return matchName && matchStatus;
      });
      currentPage = 1;
      renderProductList();
    }

    if (filterBtn) filterBtn.addEventListener("click", applyFilter);
    if (searchInput) searchInput.addEventListener("keydown", function (e) { if (e.key === "Enter") applyFilter(); });
  }

  window.initProductListPage = initProductListPage;

})();

/* ══════════════════════════════════════════════════════
   주문 내역 페이지 (order-list.html) — mock + pagination
   [MOCK] NAMES, PHONES, ADDRS, PRODUCTS, buildOrderData()를 API로 교체
   ══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var ORDER_STATUS_BADGE = {
    "상품 준비중": "admin-badge--preparing",
    "취소 준비중": "admin-badge--cancel-pending",
    "취소완료":    "admin-badge--cancel",
    "배송준비중":  "admin-badge--delivery-ready",
    "배송중":      "admin-badge--shipping"
  };
  var ALL_ORDER_STATUSES = ["상품 준비중","취소 준비중","취소완료","배송준비중","배송중"];

  /* [MOCK] GET /api/orders — 아래 NAMES·PHONES·ADDRS·PRODUCTS·buildOrderData()를 실제 API 응답으로 교체
     응답 스키마: { id, orderNo, img, name, opt, ship, total, buyerName, buyerPhone, addr, addrDetail, status, orderDate, orderTime, procDate } */
  var NAMES   = ["이정인","김수연","박민준","최지혜","정하은","윤서진","강현우","이서연","한지수","오민서","류지호","나윤지","백승현","임채원","조예린","서동현","허가은","신민호","권소연","안재원","황지은","문성훈","김다은","이승우","박지연","최현진","윤아름","정민성","강다희","오준혁","홍나리","배성민","장은서","노태양"];
  var PHONES  = ["01073752743","01012345678","01098765432","01055556666","01033334444","01077778888","01011112222","01099990000","01044445555","01066667777","01022223333","01088889999","01055544433","01077766655","01033322211","01099988877","01011100099","01022211188","01055533377","01077755544","01088877766","01033311155","01099933344","01011155566","01022244477","01055566688","01077788899","01099900011","01011133344","01022255566","01055511122","01088833344","01033366677","01077700088"];
  var ADDRS   = ["서울시 강남구 테헤란로 123/456호","경기도 성남시 분당구 판교로 200/101동 1502호","서울시 마포구 홍익로 10/202호","부산시 해운대구 마린시티로 50/305호","서울시 송파구 올림픽로 300/701호","인천시 연수구 송도국제대로 100/1204호","대구시 수성구 범어로 77/803호","서울시 용산구 이태원로 55/102호","광주시 서구 상무대로 999/501호","대전시 유성구 대학로 99/303호","서울시 종로구 세종대로 100/201호","경기도 수원시 영통구 광교로 52/505호","서울시 강서구 마곡중앙로 161/1001호","부산시 부산진구 중앙대로 668/402호","서울시 서초구 반포대로 58/302호","경기도 고양시 일산동구 중앙로 1200/801호","서울시 중구 남대문로 81/603호","대구시 달서구 달구벌대로 1700/301호","서울시 동작구 노량진로 1/102호","경기도 안양시 만안구 안양로 155/704호","서울시 영등포구 여의대방로 65/506호","인천시 남동구 인주대로 585/201호","경기도 의정부시 의정부로 140/303호","서울시 성북구 화랑로 32/401호","경기도 부천시 원미구 중동로 155/802호","서울시 강북구 도봉로 339/201호","경기도 김포시 사우동 사우로 77/903호","서울시 노원구 동일로 1322/1105호","경기도 평택시 평택로 101/201호","서울시 광진구 능동로 120/501호","경기도 화성시 동탄대로 537/702호","서울시 관악구 관악로 1/301호","경기도 파주시 금빛로 100/401호","서울시 은평구 은평로 195/203호"];

  /* [MOCK] 주문용 상품 표본 — 실제 주문 API 응답의 orderItems 배열로 교체 */
  var PRODUCTS = [
    {name:"(국내제작)(여리핏/데일리룩/쫀쫀신축성) 메이드 스퀘어넥 슬림 골지 긴팔 티셔츠", img:"assets/긴팔.png",      opt:"레드/S*1 = 35,000원",     ship:2500,  total:37500},
    {name:"(단독진행)(봄신상/러블리무드/레이어드추천) 루에느 리본 퍼프 블라우스",         img:"assets/블라우스.png",   opt:"블루/S*2 = 70,000원",     ship:0,     total:70000},
    {name:"(1+1구성) 모던 세라믹 머그컵 세트",                                          img:"assets/mug.png",        opt:"올리브그린/4P*1 = 22,800원",ship:2500, total:25300},
    {name:"(기획특가) 와이드 핀턱 밴딩 슬랙스",                                         img:"assets/pants.png",      opt:"블랙/M*1 = 28,000원",     ship:3000,  total:31000},
    {name:"[써머세일] 오가닉 코튼 스트라이프 오버핏 셔츠",                               img:"assets/longsleeves.png",opt:"화이트/L*1 = 32,000원",   ship:2500,  total:34500},
    {name:"ELLE PARIS PDRN 콜라겐 녹는실 탄력 앰플",                                    img:"assets/sleeveless.png", opt:"1개 = 49,000원",           ship:0,     total:49000},
    {name:"[기획] 프리미엄 레더 미니 크로스백",                                          img:"assets/minibag.png",    opt:"카멜/1개 = 99,000원",     ship:3000,  total:102000},
    {name:"청량한 여름 린넨 블렌드 와이드 팬츠",                                         img:"assets/긴팔-1.png",     opt:"베이지/M*1 = 55,000원",   ship:0,     total:55000},
    {name:"내추럴 우드 스탠딩 데스크 라이트",                                            img:"assets/hood.png",       opt:"화이트/1개 = 75,000원",   ship:2500,  total:77500},
    {name:"비건 시카 진정 수분 크림 50ml",                                               img:"assets/블라우스.png",   opt:"1개 = 29,000원",           ship:0,     total:29000}
  ];

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function orderStatusDropdown(current) {
    return ALL_ORDER_STATUSES.map(function (s) {
      return '<button type="button" class="admin-order-status__option' + (s === current ? ' is-current' : '') + '" data-status="' + s + '" role="menuitem">' + s + '</button>';
    }).join('');
  }

  /* [MOCK] buildOrderData()는 위 배열들로 34건 주문을 생성하는 임시 함수
     API 연동 시: orderData = await fetch('/api/orders').then(r => r.json()) 으로 교체 */
  function buildOrderData() {
    var base = new Date(2026, 3, 30); // 2026-04-30
    var orders = [];
    for (var i = 0; i < 34; i++) {
      var d    = new Date(base.getTime() - i * 22 * 3600000);
      var dateStr = d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate());
      var timeStr = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
      var proc = new Date(d.getTime() + 86400000);
      var procStr = proc.getFullYear() + '-' + pad2(proc.getMonth()+1) + '-' + pad2(proc.getDate());
      var prod    = PRODUCTS[i % PRODUCTS.length];
      var statusKey = ALL_ORDER_STATUSES[i % ALL_ORDER_STATUSES.length];
      var addrParts = ADDRS[i].split('/');
      orders.push({
        id: i + 1,
        orderNo: '2026012345' + pad2(6789 + i).toString().slice(-4),
        img: prod.img,
        name: prod.name,
        opt: prod.opt,
        ship: prod.ship,
        total: prod.total,
        buyerName: NAMES[i],
        buyerPhone: PHONES[i],
        addr: addrParts[0],
        addrDetail: addrParts[1] || '',
        status: statusKey,
        orderDate: dateStr,
        orderTime: timeStr,
        procDate: procStr
      });
    }
    return orders;
  }

  var orderData    = buildOrderData();
  var filteredOrders = orderData.slice();
  var currentPage  = 1;
  var PAGE_SIZE    = 10;

  function renderOrderList() {
    var tbody = document.getElementById("orderTableBody");
    if (!tbody) return;

    var start = (currentPage - 1) * PAGE_SIZE;
    var rows  = filteredOrders.slice(start, start + PAGE_SIZE);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding:40px 16px; color:var(--admin-muted);">검색 결과가 없습니다.</td></tr>';
      renderOrderPagination();
      return;
    }

    tbody.innerHTML = rows.map(function (o, idx) {
      var num     = start + idx + 1;
      var badgeCls = ORDER_STATUS_BADGE[o.status] || "admin-badge--preparing";
      var fmtShip  = o.ship === 0 ? '0원' : o.ship.toLocaleString() + '원';
      var fmtTotal = o.total.toLocaleString() + '원';
      return '<tr data-order-id="' + o.id + '">' +
        '<td style="text-align:center;"><input type="checkbox" class="order-row-check" data-order-id="' + o.id + '" aria-label="주문 ' + o.id + ' 선택" style="accent-color:var(--admin-red);cursor:pointer;" /></td>' +
        '<td>' + num + '</td>' +
        '<td><div class="admin-order-product__img"><img src="' + o.img + '" alt="상품 이미지" /></div></td>' +
        '<td><button type="button" class="admin-order-no">' + o.orderNo + '</button></td>' +
        '<td><div class="admin-order-product"><span class="admin-order-product__name">' + o.name + '</span></div></td>' +
        '<td><div class="admin-order-purchase-info">' + o.opt + '</div></td>' +
        '<td><div class="admin-order-payment"><div class="admin-order-payment__shipping">배송비: ' + fmtShip + '</div><div class="admin-order-payment__total">총 ' + fmtTotal + '</div></div></td>' +
        '<td><div class="admin-order-buyer">' + o.buyerName + '<br />' + o.buyerPhone + '</div></td>' +
        '<td><button type="button" class="admin-order-address" data-name="' + o.buyerName + '" data-phone="' + o.buyerPhone + '" data-addr="' + o.addr + '" data-addr-detail="' + o.addrDetail + '" aria-label="배송지 수정">' + o.buyerName + '<br />' + o.buyerPhone + '<br />' + o.addr + '<br />' + o.addrDetail + '</button></td>' +
        '<td style="text-align:center;"><div class="admin-order-status">' +
          '<button type="button" class="admin-order-status__toggle" aria-haspopup="true" aria-label="상태 변경">' +
            '<span class="admin-badge ' + badgeCls + ' t-label-2-md" data-order-current="' + o.id + '">' + o.status + '</span>' +
            '<span class="admin-order-status__change-label">상태변경</span>' +
          '</button>' +
          '<div class="admin-order-status__dropdown" role="menu">' + orderStatusDropdown(o.status) + '</div>' +
        '</div></td>' +
        '<td><div class="admin-order-date">' + o.orderDate + '<br /><span class="admin-order-date__time">' + o.orderTime + '</span></div></td>' +
        '<td><div class="admin-order-date">' + o.procDate + '</div></td>' +
      '</tr>';
    }).join('');

    renderOrderPagination();
  }

  function renderOrderPagination() {
    var pag = document.getElementById("orderPagination");
    if (!pag) return;

    var total      = filteredOrders.length;
    var totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    if (totalPages <= 1) { pag.innerHTML = ''; return; }

    var ICON_PREV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';
    var ICON_NEXT = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';

    var html = '';
    html += '<button type="button" class="admin-page-btn" data-ol-page="prev" aria-label="이전 페이지"' + (currentPage === 1 ? ' disabled' : '') + '>' + ICON_PREV + '</button>';

    var group  = Math.floor((currentPage - 1) / 5);
    var startP = group * 5 + 1;
    var endP   = Math.min(startP + 4, totalPages);

    for (var i = startP; i <= endP; i++) {
      html += '<button type="button" class="admin-page-btn' + (i === currentPage ? ' is-active' : '') + '" data-ol-page="' + i + '" aria-label="' + i + ' 페이지"' + (i === currentPage ? ' aria-current="page"' : '') + '>' + i + '</button>';
    }
    if (endP < totalPages) {
      html += '<span class="admin-page-btn" style="border:none;background:none;cursor:default;color:var(--admin-muted);" aria-hidden="true">…</span>';
      html += '<button type="button" class="admin-page-btn" data-ol-page="' + totalPages + '" aria-label="' + totalPages + ' 페이지">' + totalPages + '</button>';
    }

    html += '<button type="button" class="admin-page-btn" data-ol-page="next" aria-label="다음 페이지"' + (currentPage === totalPages ? ' disabled' : '') + '>' + ICON_NEXT + '</button>';
    pag.innerHTML = html;
  }

  function initOrderListPage() {
    var pag = document.getElementById("orderPagination");
    if (!pag) return;

    filteredOrders = orderData.slice();
    currentPage    = 1;
    renderOrderList();

    pag.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-ol-page]");
      if (!btn || btn.disabled) return;
      var val = btn.getAttribute("data-ol-page");
      var totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
      if (val === "prev") { if (currentPage > 1) currentPage--; }
      else if (val === "next") { if (currentPage < totalPages) currentPage++; }
      else { currentPage = parseInt(val, 10); }
      renderOrderList();
    });

    /* 검색 버튼 */
    var searchBtn   = document.getElementById("orderSearchBtn");
    var searchInput = document.getElementById("orderSearchInput");
    var statusSel   = document.getElementById("orderStatusFilter");

    function applyOrderFilter() {
      var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
      var statusVal = statusSel ? statusSel.value : '';
      filteredOrders = orderData.filter(function (o) {
        var matchName   = !keyword || o.name.toLowerCase().indexOf(keyword) !== -1 || o.orderNo.indexOf(keyword) !== -1;
        var matchStatus = !statusVal || o.status === statusVal;
        return matchName && matchStatus;
      });
      currentPage = 1;
      renderOrderList();
    }

    if (searchBtn)   searchBtn.addEventListener("click", applyOrderFilter);
    if (searchInput) searchInput.addEventListener("keydown", function (e) { if (e.key === "Enter") applyOrderFilter(); });
  }

  window.initOrderListPage = initOrderListPage;

})();

/* ══════════════════════════════════════════════════════
   환경설정 페이지 (settings.html) 전용 함수
   ══════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Mock Data ── */
  var settingsData = {
    login: {
      id: "링크페이먼츠"
    },
    business: {
      businessName:    "링크페이먼츠",
      businessNumber:  "012-34-56789",
      mailOrderNumber: "1234-서울강남-1234",
      address:         "서울시 서초구 바우뫼로 200",
      weekdayStart:    "09:00",
      weekdayEnd:      "18:00",
      lunchStart:      "12:00",
      lunchEnd:        "13:00",
      phone:           "010-1234-5678",
      bankAccount:     "12-01345-4567",
      accountHolder:   "홍길동",
      courier:         "cj 대한통운",
      jejuFee:         "3500",
      islandFee:       "5000"
    },
    cancelReturn: {
      mode:   "image",
      text:   "",
      images: []
    }
  };

  /* ── 헬퍼: 모달 열기/닫기 ── */
  function openModal(id)  {
    var el = document.getElementById(id);
    if (el) el.classList.add("is-open");
  }
  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove("is-open");
  }

  /* ── 사업자 정보 화면에 반영 ── */
  function renderSettingsData() {
    var b = settingsData.business;

    function setVal(id, v) {
      var el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = v || '';
      else el.textContent = v || '';
    }

    setVal("dispLoginId",       settingsData.login.id);
    setVal("dispBizName",       b.businessName);
    setVal("dispBizNumber",     b.businessNumber);
    setVal("dispMailOrder",     b.mailOrderNumber);
    setVal("dispAddress",       b.address);
    setVal("dispWeekdayHours",  "평일 " + b.weekdayStart + "~" + b.weekdayEnd);
    setVal("dispLunchHours",    "점심 " + b.lunchStart + "~" + b.lunchEnd);
    setVal("dispPhone",         b.phone);
    setVal("dispBankAccount",   b.bankAccount);
    setVal("dispAccountHolder", b.accountHolder);
    setVal("dispCourier",       b.courier);
    setVal("dispJejuFee",       "제주 " + Number(b.jejuFee).toLocaleString() + "원");
    setVal("dispIslandFee",     "도서/산간 " + Number(b.islandFee).toLocaleString() + "원");
  }

  /* ── 비밀번호 보기 토글 (settings 모달 전용) ── */
  function initSettingsPasswordToggle() {
    var modal = document.getElementById("settingsPwModal");
    if (!modal) return;

    modal.addEventListener("click", function (e) {
      var btn = e.target.closest(".admin-seller-pw-toggle");
      if (!btn) return;
      var targetId = btn.getAttribute("data-target");
      var inp = document.getElementById(targetId);
      if (!inp) return;
      var isHidden = inp.type === "password";
      inp.type = isHidden ? "text" : "password";
      var eyeOff = btn.querySelector(".icon-eye-off");
      var eyeOn  = btn.querySelector(".icon-eye-on");
      if (eyeOff) eyeOff.style.display = isHidden ? "none" : "";
      if (eyeOn)  eyeOn.style.display  = isHidden ? ""     : "none";
      btn.setAttribute("aria-label", isHidden ? "비밀번호 숨기기" : "비밀번호 보기");
    });
  }

  /* ── 비밀번호 변경 모달 ── */
  function initPasswordChangeModal() {
    var openBtn   = document.getElementById("openPwModalBtn");
    var cancelBtn = document.getElementById("settingsPwCancelBtn");
    var submitBtn = document.getElementById("settingsPwSubmitBtn");
    var overlay   = document.getElementById("settingsPwOverlay");
    if (!openBtn) return;

    function resetPwModal() {
      ["pwCurrent","pwNew","pwConfirm"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { el.value = ''; el.type = 'password'; }
      });
      document.querySelectorAll("#settingsPwModal .icon-eye-off").forEach(function (el) { el.style.display = ''; });
      document.querySelectorAll("#settingsPwModal .icon-eye-on").forEach(function  (el) { el.style.display = 'none'; });
      var err = document.getElementById("pwMismatchError");
      if (err) err.classList.remove("is-visible");
    }

    openBtn.addEventListener("click", function () {
      resetPwModal();
      openModal("settingsPwModal");
    });

    function closePw() { closeModal("settingsPwModal"); }
    if (cancelBtn) cancelBtn.addEventListener("click", closePw);
    if (overlay)   overlay.addEventListener("click",   closePw);

    if (submitBtn) submitBtn.addEventListener("click", function () {
      var cur  = (document.getElementById("pwCurrent")  || {}).value || '';
      var nw   = (document.getElementById("pwNew")      || {}).value || '';
      var conf = (document.getElementById("pwConfirm")  || {}).value || '';
      var err  = document.getElementById("pwMismatchError");

      if (!cur)  { alert("현재 비밀번호를 입력해주세요."); return; }
      if (!nw)   { alert("새 비밀번호를 입력해주세요."); return; }
      if (!conf) { alert("비밀번호 확인을 입력해주세요."); return; }

      if (nw !== conf) {
        if (err) err.classList.add("is-visible");
        return;
      }
      if (err) err.classList.remove("is-visible");
      alert("비밀번호가 변경되었습니다.");
      closePw();
    });
  }

  /* ── 사업자 정보 수정 모달 ── */
  function initBusinessEditModal() {
    var openBtn   = document.getElementById("openBizModalBtn");
    var cancelBtn = document.getElementById("settingsBizCancelBtn");
    var submitBtn = document.getElementById("settingsBizSubmitBtn");
    var overlay   = document.getElementById("settingsBizOverlay");
    if (!openBtn) return;

    function populateBizModal() {
      var b = settingsData.business;
      var map = {
        editBizName:       b.businessName,
        editBizNumber:     b.businessNumber,
        editMailOrder:     b.mailOrderNumber,
        editAddress:       b.address,
        editWeekdayStart:  b.weekdayStart,
        editWeekdayEnd:    b.weekdayEnd,
        editLunchStart:    b.lunchStart,
        editLunchEnd:      b.lunchEnd,
        editPhone:         b.phone,
        editBankAccount:   b.bankAccount,
        editAccountHolder: b.accountHolder,
        editCourier:       b.courier,
        editJejuFee:       b.jejuFee,
        editIslandFee:     b.islandFee
      };
      Object.keys(map).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = map[id] || '';
      });
    }

    openBtn.addEventListener("click", function () {
      populateBizModal();
      openModal("settingsBizModal");
    });

    function closeBiz() { closeModal("settingsBizModal"); }
    if (cancelBtn) cancelBtn.addEventListener("click", closeBiz);
    if (overlay)   overlay.addEventListener("click",   closeBiz);

    if (submitBtn) submitBtn.addEventListener("click", function () {
      var bizName  = (document.getElementById("editBizName")  || {}).value || '';
      var phone    = (document.getElementById("editPhone")    || {}).value || '';
      var courier  = (document.getElementById("editCourier")  || {}).value || '';

      if (!bizName) { alert("사업자 명을 입력해주세요."); return; }
      if (!phone)   { alert("대표 연락처를 입력해주세요."); return; }
      if (!courier) { alert("택배사를 입력해주세요."); return; }

      /* mock data 업데이트 */
      settingsData.business.businessName    = bizName;
      settingsData.business.businessNumber  = (document.getElementById("editBizNumber")     || {}).value || settingsData.business.businessNumber;
      settingsData.business.mailOrderNumber = (document.getElementById("editMailOrder")     || {}).value || settingsData.business.mailOrderNumber;
      settingsData.business.address         = (document.getElementById("editAddress")       || {}).value || settingsData.business.address;
      settingsData.business.weekdayStart    = (document.getElementById("editWeekdayStart")  || {}).value || settingsData.business.weekdayStart;
      settingsData.business.weekdayEnd      = (document.getElementById("editWeekdayEnd")    || {}).value || settingsData.business.weekdayEnd;
      settingsData.business.lunchStart      = (document.getElementById("editLunchStart")    || {}).value || settingsData.business.lunchStart;
      settingsData.business.lunchEnd        = (document.getElementById("editLunchEnd")      || {}).value || settingsData.business.lunchEnd;
      settingsData.business.phone           = phone;
      settingsData.business.bankAccount     = (document.getElementById("editBankAccount")   || {}).value || settingsData.business.bankAccount;
      settingsData.business.accountHolder   = (document.getElementById("editAccountHolder") || {}).value || settingsData.business.accountHolder;
      settingsData.business.courier         = courier;
      settingsData.business.jejuFee         = (document.getElementById("editJejuFee")       || {}).value || settingsData.business.jejuFee;
      settingsData.business.islandFee       = (document.getElementById("editIslandFee")     || {}).value || settingsData.business.islandFee;

      renderSettingsData();
      alert("사업자 정보가 수정되었습니다.");
      closeBiz();
    });
  }

  /* ── 주문 취소 / 반품 탭 ── */
  function initCancelReturnTabs() {
    var tabText  = document.getElementById("tabText");
    var tabImage = document.getElementById("tabImage");
    if (!tabText || !tabImage) return;

    function activate(activeTab, inactiveTab, activePanelId, inactivePanelId) {
      activeTab.classList.add("is-active");
      activeTab.setAttribute("aria-selected", "true");
      inactiveTab.classList.remove("is-active");
      inactiveTab.setAttribute("aria-selected", "false");
      var activePanel   = document.getElementById(activePanelId);
      var inactivePanel = document.getElementById(inactivePanelId);
      if (activePanel)   activePanel.classList.add("is-active");
      if (inactivePanel) inactivePanel.classList.remove("is-active");
    }

    tabText.addEventListener("click",  function () { activate(tabText,  tabImage, "panelText",  "panelImage"); });
    tabImage.addEventListener("click", function () { activate(tabImage, tabText,  "panelImage", "panelText");  });
  }

  /* ── 이미지 업로드 파일 선택 ── */
  function initCancelReturnImageUpload() {
    var input = document.getElementById("cancelReturnImgInput");
    var label = document.getElementById("cancelReturnFileLabel");
    if (!input || !label) return;

    input.addEventListener("change", function () {
      var files = input.files;
      if (!files || !files.length) {
        label.textContent = "JPG / PNG · 클릭하거나 파일을 여기에 끌어다 놓으세요";
        return;
      }
      if (files.length === 1) {
        label.textContent = files[0].name;
      } else {
        label.textContent = files.length + "개 파일 선택됨";
      }
    });

    /* 드래그 앤 드롭 */
    var zone = input.nextElementSibling;
    if (zone) {
      zone.addEventListener("dragover", function (e) { e.preventDefault(); zone.style.borderColor = "var(--admin-heading)"; });
      zone.addEventListener("dragleave", function ()  { zone.style.borderColor = ''; });
      zone.addEventListener("drop", function (e) {
        e.preventDefault();
        zone.style.borderColor = '';
        var dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length) {
          input.files = dt.files;
          input.dispatchEvent(new Event("change"));
        }
      });
    }
  }

  /* ── 내용 직접 입력 저장 ── */
  function initSaveReturnText() {
    var btn = document.getElementById("saveReturnTextBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var ta = document.getElementById("cancelReturnText");
      settingsData.cancelReturn.text = ta ? ta.value : '';
      settingsData.cancelReturn.mode = "text";
      alert("안내 내용이 저장되었습니다.");
    });
  }

  /* ── ESC 키로 모달 닫기 ── */
  function initSettingsEsc() {
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      closeModal("settingsPwModal");
      closeModal("settingsBizModal");
    });
  }

  /* ── 진입점 ── */
  function initSettingsPage() {
    if (!document.getElementById("openPwModalBtn") &&
        !document.getElementById("openBizModalBtn")) return;

    renderSettingsData();
    initSettingsPasswordToggle();
    initPasswordChangeModal();
    initBusinessEditModal();
    initCancelReturnTabs();
    initCancelReturnImageUpload();
    initSaveReturnText();
    initSettingsEsc();
  }

  window.initSettingsPage = initSettingsPage;

})();


/* ══════════════════════════════════════════════════════
   디자인 관리 (design.html)
   ══════════════════════════════════════════════════════ */
(function () {

  /* ─────────────────────────────────────────
     초기 스냅샷 (변경 감지용)
     HTML의 value 속성이 곧 백엔드에서 주입하는 데이터
  ───────────────────────────────────────── */
  var savedSnapshot = "";

  /* 스냅샷 생성 (모든 폼 필드 값 수집) */
  var FIELD_IDS = [
    "designHeaderName",
    "designMarketName", "designMarketDesc",
    "designMarketHomeUrl", "designMarketInstagram", "designMarketYoutube",
    "designSection1Name", "designSection2Name",
    "designSection3Name", "designSection4Name",
    "designFooterPhone", "designFooterHours", "designFooterEmail",
    "designFooterCompany", "designFooterCeo", "designFooterBizNum",
    "designFooterCommerceNum", "designFooterAddr",
    "designFooterTermsUrl", "designFooterPrivacyUrl", "designFooterCopy"
  ];

  function getSnapshot() {
    var data = {};
    FIELD_IDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) data[id] = el.value;
    });
    var mLayout = document.querySelector('[name="designMainBannerLayout"]:checked');
    data["designMainBannerLayout"] = mLayout ? mLayout.value : "";
    var sLayout = document.querySelector('[name="designSubBannerLayout"]:checked');
    data["designSubBannerLayout"] = sLayout ? sLayout.value : "";
    return JSON.stringify(data);
  }

  function checkChanges() {
    var btn = document.getElementById("designSaveBtn");
    if (btn) btn.disabled = (getSnapshot() === savedSnapshot);
  }

  /* ─────────────────────────────────────────
     탭 전환
  ───────────────────────────────────────── */
  function initTabs() {
    var tabs = document.querySelectorAll(".admin-design-edit-tab");
    var panels = document.querySelectorAll(".admin-design-edit-panel");
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
        });
        panels.forEach(function (p) { p.classList.remove("is-active"); });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        var target = document.getElementById("designPanel" + cap(tab.dataset.tab));
        if (target) target.classList.add("is-active");
      });
    });
  }

  /* ─────────────────────────────────────────
     실시간 미리보기 동기화
  ───────────────────────────────────────── */
  function initPreviewSync() {
    /* 단순 1:1 동기화 */
    var syncMap = {
      "designHeaderName":  "adpHeaderName",
      "designMarketName":  "adpMarketName",
      "designMarketDesc":  "adpMarketDesc",
      "designSection1Name": "adpSection1Name",
      "designSection2Name": "adpSection2Name",
      "designSection3Name": "adpSection3Name",
      "designSection4Name": "adpSection4Name",
      "designFooterPhone":  "adpFooterPhone",
      "designFooterHours":  "adpFooterHours",
      "designFooterEmail":  "adpFooterEmail",
      "designFooterCopy":   "adpFooterCopy"
    };
    Object.keys(syncMap).forEach(function (inputId) {
      var input   = document.getElementById(inputId);
      var preview = document.getElementById(syncMap[inputId]);
      if (!input || !preview) return;
      input.addEventListener("input", function () {
        preview.textContent = input.value;
        checkChanges();
      });
    });

    /* 설명 글자수 카운터 */
    var descInput = document.getElementById("designMarketDesc");
    if (descInput) {
      descInput.addEventListener("input", function () {
        var counter = document.getElementById("designMarketDescLen");
        if (counter) counter.textContent = descInput.value.length;
      });
    }

    /* 푸터 사업자 정보 (여러 필드 → 하나의 preview 블록) */
    var bizFields = ["designFooterCompany", "designFooterCeo", "designFooterBizNum",
                     "designFooterCommerceNum", "designFooterAddr"];
    bizFields.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", function () {
        updateBizPreview();
        checkChanges();
      });
    });

    /* 나머지 필드 변경 감지 */
    var watchOnly = ["designMarketHomeUrl", "designMarketInstagram", "designMarketYoutube",
                     "designFooterTermsUrl", "designFooterPrivacyUrl"];
    watchOnly.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", checkChanges);
    });
  }

  function updateBizPreview() {
    var biz = document.getElementById("adpFooterBiz");
    if (!biz) return;
    var company    = gv("designFooterCompany");
    var ceo        = gv("designFooterCeo");
    var bizNum     = gv("designFooterBizNum");
    var comNum     = gv("designFooterCommerceNum");
    var addr       = gv("designFooterAddr");
    biz.innerHTML  =
      "상호명 " + h(company) + " | 대표이사 " + h(ceo) +
      " | 사업자등록번호 " + h(bizNum) + " |<br>" +
      "통신판매업신고번호 " + h(comNum) + " |<br>" + h(addr);
  }

  /* ─────────────────────────────────────────
     이미지 업로드
  ───────────────────────────────────────── */
  function initUploadZones() {
    document.querySelectorAll(".admin-design-upload-zone").forEach(function (zone) {
      var input     = zone.querySelector(".admin-design-upload-input");
      var removeBtn = zone.querySelector(".admin-design-upload-zone__remove");
      var preview   = zone.querySelector(".admin-design-upload-zone__preview");
      var target    = zone.dataset.target;

      if (input) {
        input.addEventListener("change", function () {
          var file = input.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function (e) {
            if (preview) preview.src = e.target.result;
            zone.classList.add("has-image");
            setBannerImg(target, e.target.result, true);
            checkChanges();
          };
          reader.readAsDataURL(file);
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          if (input) input.value = "";
          if (preview) preview.src = "";
          zone.classList.remove("has-image");
          setBannerImg(target, "", false);
          checkChanges();
        });
      }
    });
  }

  function setBannerImg(target, url, show) {
    var imgId = target === "main" ? "adpMainBannerImg" : "adpSubBannerImg";
    var phId  = target === "main" ? "adpMainBannerPlaceholder" : "adpSubBannerPlaceholder";
    var img = document.getElementById(imgId);
    var ph  = document.getElementById(phId);
    if (img) { img.src = url; img.style.display = show ? "block" : "none"; }
    if (ph)  { ph.style.display = show ? "none" : "flex"; }
  }

  /* ─────────────────────────────────────────
     레이아웃 라디오 변경 감지
  ───────────────────────────────────────── */
  function initLayoutRadios() {
    document.querySelectorAll('[name="designMainBannerLayout"], [name="designSubBannerLayout"]')
      .forEach(function (radio) {
        radio.addEventListener("change", checkChanges);
      });
  }

  /* ─────────────────────────────────────────
     저장 버튼
  ───────────────────────────────────────── */
  function initSaveBtn() {
    var btn = document.getElementById("designSaveBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      savedSnapshot = getSnapshot();
      btn.disabled = true;
      /* TODO: 실제 저장 API 호출 위치 */
    });
  }

  /* ─────────────────────────────────────────
     템플릿 선택 화면
  ───────────────────────────────────────── */
  var TPL_IMAGES = {
    "미니멀":    "assets/design-img/preview-img/preview-minimal.png",
    "모던":      "assets/design-img/preview-img/preview-modern.png",
    "러블리":    "assets/design-img/preview-img/preview-lovely.png",
    "링크리스트": "assets/design-img/preview-img/preview-linklist.png",
    "오가닉":    "assets/design-img/preview-img/preview-organic.png"
  };

  function initTemplateGrid() {
    document.querySelectorAll('[data-action="preview"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var card = btn.closest(".admin-design-tpl-card");
        var tpl  = card ? card.dataset.template : "";
        openPreviewModal(tpl);
      });
    });
  }

  /* ─────────────────────────────────────────
     미리보기 모달
  ───────────────────────────────────────── */
  function openPreviewModal(tplName) {
    var modal = document.getElementById("designPreviewModal");
    var body  = document.getElementById("designPreviewModalBody");
    if (!modal || !body) return;
    var src = TPL_IMAGES[tplName] || TPL_IMAGES["미니멀"];
    body.innerHTML = '<img src="' + src + '" alt="디자인 미리보기" style="width:100%;display:block;" />';
    modal.style.display = "flex";
  }

  function initPreviewModal() {
    var overlay  = document.getElementById("designPreviewModalOverlay");
    var closeBtn = document.getElementById("designPreviewModalClose");
    function close() {
      var modal = document.getElementById("designPreviewModal");
      if (modal) modal.style.display = "none";
    }
    if (overlay)  overlay.addEventListener("click", close);
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ─────────────────────────────────────────
     유틸
  ───────────────────────────────────────── */
  function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
  function gv(id) { var el = document.getElementById(id); return el ? el.value : ""; }
  function h(str) {
    return String(str || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ─────────────────────────────────────────
     진입점: 템플릿 선택 화면 (design.html)
  ───────────────────────────────────────── */
  function initDesignPage() {
    if (!document.querySelector(".admin-design-template-grid")) return;
    initTemplateGrid();
    initPreviewModal();
  }

  /* ─────────────────────────────────────────
     진입점: 에디터 화면 (design-editor.html)
  ───────────────────────────────────────── */
  function initDesignEditorPage() {
    if (!document.getElementById("designEditorScreen")) return;
    initTabs();
    initPreviewSync();
    initLayoutRadios();
    initUploadZones();
    initSaveBtn();
    updateBizPreview();
    savedSnapshot = getSnapshot();
  }

  window.initDesignPage = initDesignPage;
  window.initDesignEditorPage = initDesignEditorPage;

})();
