const viewer = document.getElementById("viewer");
const pageContainer = document.getElementById("page-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageIndicator = document.getElementById("page-indicator");
const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");
const zoomLevelEl = document.getElementById("zoom-level");

let zoom = 100;
const ZOOM_STEP = 10;
const ZOOM_MIN = 30;
const ZOOM_MAX = 200;
let currentView = 1;

function getItems() {
  return Array.from(pageContainer.querySelectorAll(".viewer-item"));
}

function totalViews() {
  return getItems().length;
}

function labelOf(item) {
  return item.dataset.label || item.dataset.view;
}

function updateControls() {
  const total = totalViews();
  const item = getItems()[currentView - 1];
  pageIndicator.textContent = `${labelOf(item)}  (${currentView}/${total})`;
  prevBtn.disabled = currentView <= 1;
  nextBtn.disabled = currentView >= total;
}

// CSS zoom でレイアウトごとスケールするのでスクロール位置は getBoundingClientRect で取得
function scrollToView(index) {
  const items = getItems();
  const item = items[index];
  if (!item) return;
  const viewerTop = viewer.getBoundingClientRect().top;
  const itemTop = item.getBoundingClientRect().top;
  viewer.scrollTo({ top: viewer.scrollTop + (itemTop - viewerTop) - 32, behavior: "smooth" });
}

function goToView(n) {
  currentView = Math.max(1, Math.min(n, totalViews()));
  scrollToView(currentView - 1);
  updateControls();
}

prevBtn.addEventListener("click", () => goToView(currentView - 1));
nextBtn.addEventListener("click", () => goToView(currentView + 1));

function applyZoom() {
  pageContainer.style.zoom = zoom / 100;
  zoomLevelEl.textContent = `${zoom}%`;
}

// ビューア幅に対して最も幅広いアイテム(見開き)が収まるズームを計算
function fitToWidth() {
  pageContainer.style.zoom = 1;
  const available = viewer.clientWidth - 64; // 32px padding × 2
  const widest = Math.max(...getItems().map(el => el.offsetWidth));
  zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.floor(available / widest * 100)));
  applyZoom();
  updateControls();
}

zoomInBtn.addEventListener("click", () => {
  if (zoom < ZOOM_MAX) { zoom += ZOOM_STEP; applyZoom(); }
});
zoomOutBtn.addEventListener("click", () => {
  if (zoom > ZOOM_MIN) { zoom -= ZOOM_STEP; applyZoom(); }
});

viewer.addEventListener("scroll", () => {
  const viewerMid = viewer.getBoundingClientRect().top + 80;
  let closest = 0;
  let minDist = Infinity;
  getItems().forEach((item, i) => {
    const dist = Math.abs(item.getBoundingClientRect().top - viewerMid);
    if (dist < minDist) { minDist = dist; closest = i; }
  });
  const newView = closest + 1;
  if (newView !== currentView) {
    currentView = newView;
    updateControls();
  }
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitToWidth, 150);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "+" || e.key === "=") zoomInBtn.click();
  else if (e.key === "-") zoomOutBtn.click();
  else if (e.key === "ArrowRight" || e.key === "ArrowDown") goToView(currentView + 1);
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") goToView(currentView - 1);
});

// 初期表示: DOM 描画後にフィット計算
requestAnimationFrame(() => requestAnimationFrame(fitToWidth));

// ── アノテーション ──
const annotationData = [
  {
    title: "P1 パーキングシステム事業",
    intent: "ヒーロービジュアルと事業説明で、主力事業を印象的に伝える。",
    source: "旧パンフレット P6"
  },
  {
    title: "P2 製品紹介・IP2の特徴・魅力",
    intent: "製品ラインナップと4つの強みを掲載。事業内容をより具体的に訴求する。",
    source: "採用サイト「私たちを知る」ページ"
  },
  {
    title: "P3 職種紹介",
    intent: "技術系と事務系の全職種を一覧表示。写真には撮影する社員を入れる。事業開発はストックフォトで対応。",
    source: "採用サイト「仕事を知る」ページ"
  },
  {
    title: "P4 仕事の流れ・ビジョン",
    intent: "職種を理解した上で、その仕事が全体のフローの中でどんな役割を果たしているかを訴求。さらにIP2が取り組む未来への取り組みも紹介。",
    source: "旧パンフレット P7"
  },
  {
    title: "P5 福利厚生",
    intent: "採用サイトの福利厚生・制度から代表項目を抜粋し、見出しと内容のカードで働きやすさを伝える。",
    source: "採用サイト「福利厚生」ページ"
  },
  {
    title: "P6 人を知る（前半）",
    intent: "社員を8名抜粋し、インタビュー内容を掲載する。",
    source: "採用サイト「人を知る」ページ"
  },
  {
    title: "P7 人を知る（後半）",
    intent: "社員を8名抜粋し、インタビュー内容を掲載する。",
    source: "採用サイト「人を知る」ページ"
  },
  {
    title: "P8 会社概要・専攻と職種",
    intent: "最後に会社や採用に関する詳細情報を掲載。採用サイトへの動線も確保。",
    source: "旧パンフレット P8"
  }
];

(function setupAnnotations() {
  const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="white">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
  </svg>`;

  document.querySelectorAll(".a4-page").forEach((page, i) => {
    const data = annotationData[i] || { title: `ページ ${i + 1}`, intent: "（未設定）", source: "" };

    const wrap = document.createElement("div");
    wrap.className = "annotation-wrap";

    const btn = document.createElement("button");
    btn.className = "annotation-btn";
    btn.innerHTML = iconSVG;
    btn.title = "ページメモ";

    const popup = document.createElement("div");
    popup.className = "annotation-popup";
    popup.innerHTML = `
      <div class="annotation-popup-title">${data.title}</div>
      <div class="annotation-popup-section">意図・ねらい</div>
      <div class="annotation-popup-body">${data.intent}</div>
      <div class="annotation-popup-section">出典・参考</div>
      <div class="annotation-popup-body">${data.source}</div>
    `;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isActive = popup.classList.contains("active");
      document.querySelectorAll(".annotation-popup").forEach(p => p.classList.remove("active"));
      if (!isActive) popup.classList.add("active");
    });

    wrap.appendChild(btn);
    wrap.appendChild(popup);
    page.appendChild(wrap);
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".annotation-popup").forEach(p => p.classList.remove("active"));
  });
})();
