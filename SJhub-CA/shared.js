/* shared.js — SJ Hub CA/BA 어드민 공통 JavaScript */

(function () {
  "use strict";

  /* ─── Utility ─── */
  function formatCurrency(n) {
    if (n == null || n === "") return "—";
    return Math.round(Number(n) || 0).toLocaleString("ko-KR") + "원";
  }
  function formatNumber(n) {
    if (n == null) return "—";
    return Math.round(Number(n) || 0).toLocaleString("ko-KR");
  }
  function formatDate(s) {
    if (!s) return "—";
    return String(s).replace(/-/g, ".");
  }
  function parseDate(s) {
    if (!s || s === "—") return null;
    var normalized = String(s).split("~")[0].trim().replace(/\./g, "-");
    var d = new Date(normalized + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }
  function dDay(dateValue) {
    var target = parseDate(dateValue);
    if (!target) return "—";
    var today = new Date("2026-07-13T00:00:00");
    var diff = Math.round((target - today) / 86400000);
    if (diff === 0) return "D-day";
    return diff > 0 ? "D-" + diff : "D+" + Math.abs(diff);
  }
  function maskPhone(v) {
    return String(v || "").replace(/^(01\d)-?(\d{3,4})-?(\d{4})$/, function(_, a, b, c) {
      return a + "-" + "*".repeat(b.length) + "-" + c;
    });
  }
  function maskBizNo(v) {
    return String(v || "").replace(/^(\d{3})-?(\d{2})-?(\d{5})$/, "$1-$2-*****");
  }
  function maskAccount(v) {
    var parts = String(v || "").split("-");
    if (parts.length >= 3) return parts[0] + "-***-" + parts.slice(2).join("-");
    return String(v || "").replace(/(\d{3,})(\d{3,6})$/, "***-$2");
  }
  function showToast(message) {
    var toast = document.getElementById("adminToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "adminToast";
      toast.className = "admin-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function() { toast.classList.remove("is-visible"); }, 2200);
  }
  function setBodyLocked(locked) {
    document.body.classList.toggle("admin-modal-open", !!locked);
  }
  function downloadCSV(filename, columns, rows) {
    var lines = [columns].concat(rows);
    var csv = lines.map(function(row) {
      return row.map(function(value) {
        return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\n");
    var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  /* ─── Language switcher ─── */
  var LANG_KEY = "sjHubAdminLang";
  var ZH_REPLACEMENTS = [
    ["SJ Hub CA 어드민", "SJ Hub CA 管理后台"],
    ["SJ Hub CA", "SJ Hub CA"],
    ["CA 직접 운영", "CA直接运营"],
    ["SA 생성", "SA创建"],
    ["운영 주체", "运营主体"],
    ["관리 주체", "管理主体"],
    ["상위지사", "上级分公司"],
    ["상위分公司", "上级分公司"],
    ["총 판매금액", "总销售金额"],
    ["총 销售金额", "总销售金额"],
    ["수수료율", "手续费率"],
    ["수수료 비율", "手续费比例"],
    ["수수료", "手续费"],
    ["적용매출일 기준", "按适用销售日筛选"],
    ["정산기간", "结算期间"],
    ["정산주기", "结算周期"],
    ["적용매출일", "适用销售日"],
    ["실매출액", "实际销售额"],
    ["CA 아래 지사, 총판, 영업의 위계와 운영 현황을 한 화면에서 관리합니다.", "在一个页面中管理CA下属销售分公司、销售总代理、业务员的层级和运营现状。"],
    ["CA 바로 아래 1단계 조직입니다. 총판과 영업 생성, 하위 조직의 운영 흐름을 관리합니다.", "CA直属一级组织。可创建总代理和业务员，并管理下级组织的运营流程。"],
    ["지사 아래 2단계 조직입니다. 소속 영업과 연결 대리점을 중심으로 정산 흐름을 관리합니다.", "分公司下属二级组织。围绕所属业务员和关联商家管理结算流程。"],
    ["현장 운영 단위입니다. 대리점 등록, 판매 현황 조회, 정산 정보를 확인합니다.", "现场运营单位。可登记商家、查看销售现状和结算信息。"],
    ["영업 조직 리스트", "销售组织列表"],
    ["영업 조직 등록", "登记销售组织"],
    ["영업 조직 요약", "销售组织汇总"],
    ["영업 조직 위계", "销售组织层级"],
    ["영업 조직 상세", "销售组织详情"],
    ["지사", "销售分公司"],
    ["총판", "销售总代理"],
    ["CA 하위", "CA下属"],
    ["1단계", "一级"],
    ["2단계", "二级"],
    ["3단계", "三级"],
    ["승인 완료 조직 기준", "以已批准组织为准"],
    ["총판과 영업을 하위 관리", "管理下级总代理和业务员"],
    ["소속 영업과 대리점 관리", "管理所属业务员和商家"],
    ["대리점 등록과 연결 실무 담당", "负责商家注册与关联实务"],
    ["조직 위계", "组织层级"],
    ["조직 구분", "组织类型"],
    ["상위 조직", "上级组织"],
    ["상위 조직 연결", "关联上级组织"],
    ["상위 조직 검색", "搜索上级组织"],
    ["상위 조직을 선택해주세요.", "请选择上级组织。"],
    ["지사, 총판, 영업명을 입력하세요", "请输入分公司、总代理或业务名称"],
    ["전체 조직", "全部组织"],
    ["하위 조직", "下级组织"],
    ["하위 총판 등록", "登记下级总代理"],
    ["하위 총판", "下级总代理"],
    ["하위 영업 등록", "登记下级业务员"],
    ["하위 영업", "下级业务员"],
    ["직속 영업", "直属业务员"],
    ["직접 연결 대리점", "直接关联商家"],
    ["활성 계정", "启用账号"],
    ["활성 상태", "启用状态"],
    ["판매 현황", "销售现状"],
    ["전체 펼침", "全部展开"],
    ["지사만 보기", "仅看分公司"],
    ["조회 결과", "查询结果"],
    ["검색어", "关键词"],
    ["명칭, 아이디, 담당자 검색", "搜索名称、ID、负责人"],
    ["명칭", "名称"],
    ["구분", "类型"],
    ["아이디", "ID"],
    ["담당자", "负责人"],
    ["누적 매출", "累计销售额"],
    ["조회된 영업 조직이 없습니다.", "没有查询到销售组织。"],
    ["등록을 준비합니다.", "登记准备中。"],
    ["수정 화면은 mock 상태입니다.", "编辑页面为mock状态。"],
    ["계약 대리점을 조회하고 승인 상태를 관리합니다.", "查询签约商家并管理审批状态。"],
    ["조회된 대리점이 없습니다.", "没有查询到商家。"],
    ["조회된 정산 데이터가 없습니다.", "没有查询到结算数据。"],
    ["기존 조직 관리 정책 범위 내에서 수정됩니다.", "将在现有组织管理政策范围内修改。"],
    ["영업 직접", "业务员直接"],
    ["영업 등록", "业务员登记"],
    ["영업 정산", "业务员结算"],
    ["영업별 정산", "按业务员结算"],
    ["영업 판매 내역", "业务员销售明细"],
    ["영업명", "业务员名称"],
    ["영업 소속", "业务员所属"],
    ["영업", "业务员"],
    ["지사 소속", "分公司所属"],
    ["총판 소속", "总代理所属"],
    ["대리점 직접 신청", "商家直接申请"],
    ["대리점 직접 등록", "商家直接注册"],
    ["대리점 직접", "商家直接"],
    ["대리점 등록 신청", "商家注册"],
    ["대리점 등록", "商家注册"],
    ["계약 대리점 목록", "商家列表"],
    ["대리점 매출 요약", "商家销售汇总"],
    ["대리점 판매 내역", "商家销售明细"],
    ["대리점 상세", "商家详情"],
    ["대리점 수정", "编辑商家"],
    ["대리점별 정산", "按商家结算"],
    ["대리점 정산", "商家结算"],
    ["대리점 관리", "商家管理"],
    ["대리점 선택", "选择商家"],
    ["전체 대리점", "全部商家"],
    ["대리점명", "商家名称"],
    ["대리점", "商家"],
    ["지사 등록", "分公司登记"],
    ["지사 정산", "分公司结算"],
    ["지사별 정산", "按分公司结算"],
    ["지사명", "分公司名称"],
    ["지사", "分公司"],
    ["총판 등록", "总代理登记"],
    ["총판 정산", "总代理结算"],
    ["총판별 정산", "按总代理结算"],
    ["총판 판매 내역", "总代理销售明细"],
    ["총판명", "总代理名称"],
    ["총판", "总代理"],
    ["CA 직접 등록", "CA直接登记"],
    ["운영사", "运营商"],
    ["소속 영업조직", "所属销售组织"],
    ["연결 대리점", "关联商家"],
    ["셀러-대리점 연결 관리", "卖家-商家关联管理"],
    ["연결 가능한 대리점", "可关联商家"],
    ["현재 연결된 대리점", "当前关联商家"],
    ["연결된 대리점", "已关联商家"],
    ["셀러 목록", "卖家列表"],
    ["셀러 관리", "卖家管理"],
    ["셀러명", "卖家名称"],
    ["셀러ID", "卖家ID"],
    ["셀러", "卖家"],
    ["상품 준비중", "商品准备中"],
    ["배송준비중", "准备发货"],
    ["취소 준비중", "取消处理中"],
    ["취소완료", "已取消"],
    ["배송중", "配送中"],
    ["주문 관리", "订单管理"],
    ["주문 내역", "店铺订单"],
    ["링크 주문 내역", "链接订单"],
    ["링크 店铺订单", "链接订单"],
    ["전체 주문 내역", "店铺订单"],
    ["주문번호", "订单号"],
    ["주문일", "下单日"],
    ["주문수", "订单数"],
    ["주문상태", "订单状态"],
    ["주문기간", "订单期间"],
    ["주문취소", "订单取消"],
    ["전체 주문 수", "总订单数"],
    ["상품 관리", "商品管理"],
    ["상품 목록", "商品列表"],
    ["상품 등록", "商品登记"],
    ["상품명", "商品名"],
    ["판매상품수", "销售商品数"],
    ["상품수", "商品数"],
    ["판매 상품", "销售商品"],
    ["총 매출", "总销售额"],
    ["판매금액", "销售金额"],
    ["매출", "销售额"],
    ["판매처", "销售方"],
    ["판매일시", "销售时间"],
    ["판매 일자", "销售日期"],
    ["판매채널", "销售渠道"],
    ["정산관리", "结算管理"],
    ["정산 관리", "结算管理"],
    ["정산 상세 내역", "结算详细明细"],
    ["지불해야 할 정산 금액", "应结算金额"],
    ["상세내역", "详情"],
    ["상세 내역 보기", "查看明细"],
    ["상세 내역", "明细"],
    ["상세보기", "查看详情"],
    ["기준일 정산 정보", "基准日结算信息"],
    ["아래 수치는 항상 현재 표시 중인 데이터에서 계산됩니다 (하드코딩 없음)", "以下数值始终根据当前显示的数据计算（无硬编码）"],
    ["기준일 내 검색", "基准日内搜索"],
    ["기준일", "基准日"],
    ["오늘의 정산 정보", "今日结算信息"],
    ["정산 기간", "结算期间"],
    ["정산상태 전체", "全部结算状态"],
    ["정산 상태", "结算状态"],
    ["정산 예정 금액", "应结算金额"],
    ["정산 예정일", "预计结算日"],
    ["정산 처리일", "结算处理日"],
    ["정산 필요 금액", "待结算金额"],
    ["정산 완료 금액", "已结算金额"],
    ["정산 완료 건", "已结算件数"],
    ["정산 필요 건", "待结算件数"],
    ["정산 건수", "结算件数"],
    ["정산 금액", "结算金额"],
    ["정산 총액", "应结算总额"],
    ["총 정산 수", "总结算件数"],
    ["정산 필요", "待结算"],
    ["정산대기", "等待结算"],
    ["정산중", "结算中"],
    ["정산 완료", "已结算"],
    ["정산 보류", "结算保留"],
    ["정산 예정", "预计结算"],
    ["정산 확정", "结算确认"],
    ["지급 완료", "已支付"],
    ["미정산", "未结算"],
    ["유보금 정산", "保证金结算"],
    ["전체 유보금 건수", "保证金总件数"],
    ["유보금 적용 건", "保证金适用件数"],
    ["유보금 차감 예정 건", "预计扣减件数"],
    ["전체 유보금액", "保证金总额"],
    ["현재 보유 유보금", "当前持有保证金"],
    ["차감 예정 금액", "预计扣减金额"],
    ["유보금 번호", "保证金编号"],
    ["대상 유형 전체", "全部对象类型"],
    ["대상 유형", "对象类型"],
    ["대상명", "对象名称"],
    ["연결 조직", "关联组织"],
    ["설정 방식", "设置方式"],
    ["설정값", "设置值"],
    ["최초 유보금", "初始保证金"],
    ["현재 유보금", "当前保证金"],
    ["적용일", "适用日"],
    ["적용 시작일", "适用开始日"],
    ["차감 예정일", "预计扣减日"],
    ["적용 예정", "预计适用"],
    ["적용 중", "适用中"],
    ["차감 예정", "预计扣减"],
    ["차감 완료", "扣减完成"],
    ["반환 완료", "返还完成"],
    ["유보금 차감", "扣减保证金"],
    ["유보금 해제", "解除保证金"],
    ["유보금 등록", "登记保证金"],
    ["유보금 금액 또는 비율", "保证金金额或比例"],
    ["설정 사유", "设置原因"],
    ["관리자 메모", "管理员备注"],
    ["대시보드", "主页"],
    ["조직 관리", "组织管理"],
    ["조직 리스트", "组织列表"],
    ["조직 등록 정보가 저장되었습니다.", "组织注册信息已保存。"],
    ["조직 등록", "组织注册"],
    ["기본 정보", "基本信息"],
    ["위계구분을 선택해주세요.", "请选择层级分类。"],
    ["위계구분", "层级分类"],
    ["명칭을 입력해주세요.", "请输入名称。"],
    ["명칭을 입력하세요", "请输入名称"],
    ["로그인 아이디를 입력해주세요.", "请输入登录ID。"],
    ["로그인 아이디", "登录ID"],
    ["로그인 비밀번호를 입력해주세요.", "请输入登录密码。"],
    ["로그인 비밀번호", "登录密码"],
    ["수수료율은 0~100 사이로 입력해주세요.", "手续费率请输入0到100之间的数值。"],
    ["간략한 메모를 작성하는 공간입니다.", "用于填写简短备注。"],
    ["간단 메모", "简短备注"],
    ["등록 안내", "注册说明"],
    ["여기서 등록하시면 운영사와 직접 연결됩니다. 영업조직의 연결이 필요한 경우에는 조직 리스트에서 선택해 연결하세요.", "在此注册后将与运营商直接连接。如需连接销售组织，请在组织列表中选择并连接。"],
    ["등록 하기", "登记"],
    ["공지사항", "公告"],
    ["환경설정", "环境设置"],
    ["로그아웃", "退出登录"],
    ["디자인 관리", "设计管理"],
    ["템플릿 선택", "选择模板"],
    ["디자인 편집", "设计编辑"],
    ["검색", "搜索"],
    ["초기화", "重置"],
    ["전체 선택", "全选"],
    ["선택항목 상태 변경", "更改所选状态"],
    ["엑셀 다운로드", "下载Excel"],
    ["목록으로", "返回列表"],
    ["취소", "取消"],
    ["저장", "保存"],
    ["변경", "更改"],
    ["닫기", "关闭"],
    ["수정", "编辑"],
    ["관리", "管理"],
    ["상세", "详情"],
    ["전체", "全部"],
    ["승인상태", "审批状态"],
    ["승인", "已批准"],
    ["정지", "停用"],
    ["신청출처", "申请来源"],
    ["등록일", "登记日"],
    ["승인 대기", "待审批"],
    ["승인 완료", "审批完成"],
    ["반려", "驳回"],
    ["상태", "状态"],
    ["활성", "启用"],
    ["비활성", "停用"],
    ["카테고리 선택", "选择分类"],
    ["카테고리", "分类"],
    ["은행 선택", "选择银行"],
    ["은행", "银行"],
    ["영업 조직 또는 영업 계정의 정산 정보를 등록합니다.", "登记销售组织或销售账号的结算信息。"],
    ["영업 계정 등록 정보", "销售账号注册信息"],
    ["이름을 입력해주세요.", "请输入姓名。"],
    ["이름", "姓名"],
    ["계좌번호", "账号"],
    ["계좌번호는 숫자와 하이픈만 입력해주세요.", "账号只能输入数字和连字符。"],
    ["숫자와 하이픈만 입력", "仅输入数字和连字符"],
    ["예금주", "账户名"],
    ["예금주를 입력해주세요.", "请输入账户名。"],
    ["예금주명", "账户名"],
    ["전화번호 형식을 확인해주세요.", "请确认电话号码格式。"],
    ["전화번호", "电话号码"],
    ["사업자 유형", "经营主体类型"],
    ["사업자등록번호 형식을 확인해주세요.", "请确认营业执照号码格式。"],
    ["사업자등록번호", "营业执照号"],
    ["신분증을 첨부해주세요.", "请上传身份证。"],
    ["신분증", "身份证"],
    ["mock 업로드: 파일명만 저장됩니다.", "模拟上传：仅保存文件名。"],
    ["어드민", "管理后台"],
    ["개인사업자", "个体工商户"],
    ["법인사업자", "法人企业"],
    ["개인", "个人"],
    ["상위 카테고리", "一级分类"],
    ["의류", "服装"],
    ["뷰티", "美妆"],
    ["라이프스타일", "生活方式"],
    ["푸드", "食品"],
    ["기타", "其他"],
    ["일별", "按日"],
    ["주별", "按周"],
    ["월별", "按月"],
    ["적용 기간", "适用期间"],
    ["시작일시", "开始时间"],
    ["종료일시", "结束时间"],
    ["건", "件"],
    ["원", "元"],
    ["개", "个"],
    ["명", "名"],
    ["대리점_", "商家_"],
    ["영업_", "业务员_"],
    ["지사_", "分公司_"],
    ["총판_", "总代理_"],
    ["셀러_", "卖家_"],
    ["담당자_", "负责人_"]
  ];
  var ZH_REPLACEMENTS_SORTED = ZH_REPLACEMENTS.slice().sort(function(a, b) {
    return b[0].length - a[0].length;
  });
  var ZH_ATTRS = ["placeholder", "title", "aria-label"];
  var translating = false;

  function getLang() {
    return localStorage.getItem(LANG_KEY) || "ko";
  }
  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    location.reload();
  }
  function translateText(text) {
    if (!text || !text.trim()) return text;
    var next = text;
    ZH_REPLACEMENTS_SORTED.forEach(function (pair) {
      next = next.split(pair[0]).join(pair[1]);
    });
    return next;
  }

  function translateTextNode(node) {
    if (!node || !node.nodeValue || !node.nodeValue.trim()) return;
    var translated = translateText(node.nodeValue);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }

  function translateElement(root) {
    if (getLang() !== "zh" || translating) return;
    translating = true;
    var scope = root && root.nodeType === 1 ? root : document.body;
    if (!scope) { translating = false; return; }
    scope.querySelectorAll("option").forEach(function (option) {
      if (!option.hasAttribute("value")) option.setAttribute("value", option.textContent.trim());
    });
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent || /^(SCRIPT|STYLE|NOSCRIPT)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      translateTextNode(node);
    });
    scope.querySelectorAll("input, textarea, option, button, a, [title], [aria-label]").forEach(function (el) {
      ZH_ATTRS.forEach(function (attr) {
        if (!el.hasAttribute(attr)) return;
        var translated = translateText(el.getAttribute(attr));
        if (translated !== el.getAttribute(attr)) el.setAttribute(attr, translated);
      });
    });
    document.documentElement.lang = "zh-CN";
    var translatedTitle = translateText(document.title);
    if (translatedTitle !== document.title) document.title = translatedTitle;
    translating = false;
  }

  function initTranslationObserver() {
    var pendingRoots = [];
    var pendingTextNodes = [];
    var scheduled = false;

    function scheduleTranslation() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        if (translating) return;
        var roots = pendingRoots.slice();
        var textNodes = pendingTextNodes.slice();
        pendingRoots = [];
        pendingTextNodes = [];

        translating = true;
        textNodes.forEach(function (node) {
          if (!node || !node.parentElement || !node.isConnected) return;
          translateTextNode(node);
        });
        translating = false;

        roots.forEach(function (root) {
          if (root && root.isConnected) translateElement(root);
        });
      });
    }

    var observer = new MutationObserver(function (mutations) {
      if (translating) return;
      mutations.forEach(function (mutation) {
        if (mutation.type === "characterData") {
          pendingTextNodes.push(mutation.target);
          return;
        }
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) pendingRoots.push(node);
          if (node.nodeType === 3) pendingTextNodes.push(node);
        });
      });
      if (pendingRoots.length || pendingTextNodes.length) scheduleTranslation();
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  function initLanguageSwitcher() {
    if (document.querySelector(".admin-lang-switch")) return;
    var main = document.querySelector(".admin-main") || document.body;
    var current = getLang();
    var wrap = document.createElement("div");
    wrap.className = "admin-lang-switch";
    wrap.setAttribute("aria-label", "Language switch");
    wrap.innerHTML =
      '<button type="button" class="admin-lang-switch__btn' + (current === "ko" ? " is-active" : "") + '" data-lang="ko">한국어</button>' +
      '<button type="button" class="admin-lang-switch__btn' + (current === "zh" ? " is-active" : "") + '" data-lang="zh">中文</button>';
    main.insertBefore(wrap, main.firstChild);
    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-lang]");
      if (!btn || btn.dataset.lang === getLang()) return;
      setLang(btn.dataset.lang);
    });
    translateElement(document.body);
    if (current === "zh") {
      initTranslationObserver();
    }
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
      "ca-009-organization-list.html":        "ca-009-organization-list.html",
      "ca-012-partner.html":       "ca-009-organization-list.html",
      "ca-018-org-register.html":       "ca-009-organization-list.html",
      "ca-013-settlement.html":         "ca-013-settlement.html",
      "ca-014-settlement-detail.html":  "ca-013-settlement.html",
      "ca-019-settlement-distributor.html": "ca-013-settlement.html",
      "ca-020-settlement-sales.html":   "ca-013-settlement.html",
      "ca-021-settlement-brand.html":   "ca-013-settlement.html",
      "ca-022-settlement-reserve.html": "ca-013-settlement.html",
      "ca-016-notice.html":                  "ca-016-notice.html",
      "ca-017-settings.html":                "ca-017-settings.html",
    };
    var activeMain = SUB_TO_MAIN[page] || page;
    function mc(h) { return "admin-sidebar__main" + (h === activeMain ? " is-active" : ""); }
    function sc(h) { return "admin-sidebar__sub" + (h === page ? " is-active" : ""); }

    return (
      '<div class="admin-sidebar__logo">' +
        '<a href="ca-001-dashboard.html" class="admin-sidebar__logo-link">SJ Hub</a>' +
        '<span class="admin-sidebar__role-badge">CA</span>' +
      "</div>" +
      '<nav class="admin-sidebar__nav">' +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-001-dashboard.html" class="' + mc("ca-001-dashboard.html") + '">' + si("dashboard") + "<span>대시보드</span></a>" +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-009-organization-list.html" class="' + mc("ca-009-organization-list.html") + '">' + si("seller") + "<span>조직 관리</span></a>" +
          '<a href="ca-009-organization-list.html" class="' + sc("ca-009-organization-list.html") + '">조직 리스트</a>' +
          '<a href="ca-018-org-register.html" class="' + sc("ca-018-org-register.html") + '">등록 하기</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-002-brand-list.html" class="' + mc("ca-002-brand-list.html") + '">' + si("brand") + "<span>대리점 관리</span></a>" +
          '<a href="ca-002-brand-list.html" class="' + sc("ca-002-brand-list.html") + '">계약 대리점 목록</a>' +
          '<a href="ca-003-brand-register.html" class="' + sc("ca-003-brand-register.html") + '">대리점 등록 신청</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-006-product-list.html" class="' + mc("ca-006-product-list.html") + '">' + si("product") + "<span>상품 관리</span></a>" +
          '<a href="ca-006-product-list.html" class="' + sc("ca-006-product-list.html") + '">상품 목록</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-007-order-list.html" class="' + mc("ca-007-order-list.html") + '">' + si("order") + "<span>주문 관리</span></a>" +
          '<a href="ca-007-order-list.html" class="' + sc("ca-007-order-list.html") + '">주문 내역</a>' +
          '<a href="ca-007-order-list.html" class="' + sc("ca-007-order-list.html") + '">링크 주문 내역</a>' +
        "</div>" +

        '<div class="admin-sidebar__group">' +
          '<a href="ca-013-settlement.html" class="' + mc("ca-013-settlement.html") + '">' + si("settlement") + "<span>정산관리</span></a>" +
          '<a href="ca-013-settlement.html" class="' + sc("ca-013-settlement.html") + '">지사 정산</a>' +
          '<a href="ca-019-settlement-distributor.html" class="' + sc("ca-019-settlement-distributor.html") + '">총판 정산</a>' +
          '<a href="ca-020-settlement-sales.html" class="' + sc("ca-020-settlement-sales.html") + '">영업 정산</a>' +
          '<a href="ca-021-settlement-brand.html" class="' + sc("ca-021-settlement-brand.html") + '">대리점 정산</a>' +
          '<a href="ca-022-settlement-reserve.html" class="' + sc("ca-022-settlement-reserve.html") + '">유보금 정산</a>' +
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
        '<a href="ba-001-dashboard.html" class="admin-sidebar__logo-link">SJ Hub</a>' +
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
          '<a href="ba-012-settlement.html" class="' + sc("ba-012-settlement.html") + '">대리점 매출 요약</a>' +
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
      "정산 필요":  "admin-badge--wait",
      "정산대기":   "admin-badge--sett-expected",
      "정산중":     "admin-badge--sett-confirmed",
      "정산대기":   "admin-badge--sett-confirmed",
      "정산완료":   "admin-badge--sett-paid",
      "정산 완료":  "admin-badge--sett-paid",
      "정산보류":   "admin-badge--rejected",
      "정산 보류":  "admin-badge--rejected",
    };
    return badge(status, map[status] || "admin-badge--inactive");
  }

  function sellerTypeBadge(type) {
    if (type === "지사 소속" || type === "총판 소속" || type === "영업 소속") return badge(type, "admin-badge--company");
    return badge("대리점 직접", "admin-badge--brand-direct");
  }

  /* ─── Expose globals ─── */
  window.AdminShared = {
    formatCurrency: formatCurrency,
    formatNumber:   formatNumber,
    formatDate:     formatDate,
    parseDate:      parseDate,
    dDay:           dDay,
    maskPhone:      maskPhone,
    maskBizNo:      maskBizNo,
    maskAccount:    maskAccount,
    showToast:      showToast,
    setBodyLocked:  setBodyLocked,
    downloadCSV:    downloadCSV,
    renderPagination: renderPagination,
    badge:          badge,
    orderBadge:     orderBadge,
    approvalBadge:  approvalBadge,
    settlementBadge: settlementBadge,
    sellerTypeBadge: sellerTypeBadge,
    initSidebar:    initSidebar,
    initMobile:     initMobile,
    initLanguageSwitcher: initLanguageSwitcher,
    translateElement: translateElement,
    translateText: translateText,
  };

  /* ─── Auto init ─── */
  function autoInit() {
    initSidebar();
    initMobile();
    initLanguageSwitcher();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    autoInit();
  }

})();
