// 프레스코 인물 영상: 막 구간마다 프레임 묶음을 스크롤 위치로 골라 그린다(pear.no와 같은 방식).
// 파일: assets/films/<id>/manifest.json 과 assets/films/<id>/<tier>/f_001.webp …
// manifest 예: { "count": 120, "size": [720, 1280], "tiers": [640, 1280] }  (tier = 장 높이 px)
// 파일이 아직 없으면 아무것도 그리지 않고, 페이지는 코드로 그린 대역을 보여 준다.
//
// 영상은 고정 카메라로, 배우가 크로마 그린 받침 위에 서 있다. 받침 윗면 가운데 = 세계의 받침대 윗면 가운데(0, 0).
// pin.at: 그 점의 장 안 위치(비율), pin.height: 장 높이를 세계 단위로(코드 대역의 키가 약 1000).
// map: [vh, 영상 진행 0~1] 꺾은선. track: 손 · 머리 위치 [[진행, 장 x 비율, 장 y 비율], …] — 영상이 오면 재서 채운다.
// 파일을 바꿔 넣을 때마다 올린다: 브라우저가 예전 장 · 그림을 캐시에서 꺼내 쓰지 않게
export const REV = '20261122e';
export const FILMS = [
  // 영상에서 잰 값(2026-11-19): 서 있을 때 발밑 가운데 = 장의 (.56, .955), 인물 키 ≈ 장 높이의 .94 → 장 높이 ≈ 1070
  // (예전) 혼자 하는 서막~2막 — p1-dialogue · p2-paper로 대체. 되돌리려면 from: 0, to: 585.04 로
  { id: 'act0-2', from: -4, to: -3, map: [[0, 0], [55, .05], [150, .33], [255, .56], [360, .86], [585, 1]], pin: { at: [.56, .955], height: 1070 },
    track: {
      head: [[0, .452, .056], [.1, .482, .056], [.2, .54, .07], [.3, .548, .076], [.6, .545, .078], [.7, .506, .067], [.8, .457, .057], [1, .456, .054]],
      lHand: [[0, .06, .49], [.1, .03, .38], [.2, .01, .16], [.3, .09, .03], [.6, .11, .02], [.68, .6, .45], [.78, .9, .25], [.88, .83, .12], [1, .82, .12]],
      paper: [[0, .85, .2], [.7, .9, .3], [.8, .85, .2], [1, .85, .19]],   // 손에 든 종이의 가운데
    } },
  // (예전) 혼자 쪽지에 쓰는 3막 — p3-sign으로 대체. 되돌리려면 from: 585.05, to: 840 으로
  { id: 'act3-4', from: -2, to: -1, map: [[585, 0], [700, .15], [760, .3], [840, .62], [940, 1]], pin: { at: [.56, .955], height: 1070 },
    track: {
      head: [[0, .463, .057], [.3, .435, .057], [.4, .422, .053], [.5, .546, .136], [.6, .537, .286], [.7, .465, .184], [.8, .471, .151], [1, .471, .151]],
      lHand: [[0, .49, .28], [.35, .49, .28], [.6, .62, .55], [1, .66, .54]],
    } },
  // 파트너 영상(4:3 와이드, 2026-11-20 밤): 막마다 파트너 한 명이 소품을 들고 들어온다. 이전 영상은 위 항목의 범위를 되돌리면 다시 쓴다
  // ── 파트너 영상(4:3, 같은 배우 기준 장에서 시작 → 기준점 모두 같음) ──
  // p1-dialogue: 서막(혼자 섬) → 희극의 뮤즈가 왼쪽에서 가면을 들고 들어와 대사를 주고받고 나간다. lHand = 대사 상대(뮤즈) 머리 쪽
  { id: 'p1-dialogue', from: 0, to: 300, map: [[0, 0], [110, 0], [150, .15], [255, .75], [300, 1]], pin: { at: [.4845, .9156], height: 1264 },
    track: { head: [[0, .452, .165], [1, .452, .165]], lHand: [[0, .3, .3], [.2, .16, .2], [.75, .16, .2], [.9, .3, .3], [1, .3, .3]] } },
  // p2-paper: 전령 소년이 신문을 건네고, 배우가 가로 신문을 활짝 펼쳐 읽는다. paper = 펼친 신문 가운데, paperOn = 인쇄가 보이기 시작하는 진행도
  { id: 'p2-paper', from: 300, to: 585.04, map: [[300, 0], [330, .1], [380, .45], [430, .8], [470, .92], [585, 1]], pin: { at: [.4845, .9156], height: 1264 },
    track: { lHand: [[0, .45, .4], [.6, .44, .38], [.8, .44, .345], [1, .44, .345]], paper: [[0, .44, .345], [1, .44, .345]], paperOn: [[0, 0, 0], [.82, 0, 0], [.9, 1, 0], [1, 1, 0]] } },
  // p3-sign: 서기관이 판을 내밀고 배우가 서명한 뒤 서기관이 받아 나간다. track.card = 판 위 쪽지 가운데(서명판이 떠오르는 자리)
  { id: 'p3-sign', from: 585.05, to: 840, map: [[585.05, 0], [690, .3], [760, .5], [790, .57], [840, .7]], pin: { at: [.4845, .9156], height: 1264 },
    track: { card: [[0, .6, .43], [.26, .56, .425], [.36, .57, .41], [.47, .6, .405], [.57, .62, .40], [.68, .54, .45], [1, .54, .45]] } },
  // p4-seat: 무대 일꾼이 돌 의자를 놓고 잔을 건넨 뒤 배우가 앉는다. 발밑 가운데 = (.4845, .9156), 배우 키 .791 → 장 높이 ≈ 1264
  // p4-seat — 흰 잔. 뒤 장면(p5 · p6)의 흰 잔과 이어진다
  { id: 'p4-seat', from: 840, to: 1240, map: [[840, 0], [900, .3], [960, .6], [1030, .85], [1100, 1]], pin: { at: [.4845, .9156], height: 1264 }, track: {} },
  // (예전) p4-cup: 같은 연기, 흙 잔 — 뒤 장면과 잔이 달라 뺐다. 되돌리려면 from: 840, to: 1240 으로
  { id: 'p4-cup', from: -8, to: -7, map: [[840, 0], [900, .3], [960, .6], [1030, .85], [1100, 1]], pin: { at: [.4845, .9156], height: 1264 }, track: {} },
  // p5-sculpt: 조각가가 앉은 배우의 머리 · 팔을 잰다(설계도 판 아래에서 빠르게 지나가고, 판이 걷힐 땐 혼자 앉아 있다)
  { id: 'p5-sculpt', from: 1240, to: 1420, map: [[1240, 0], [1305, .92], [1420, 1]], pin: { at: [.4845, .9156], height: 1264 }, pour: 300, track: {} },
  // p6-wreath: 소녀가 월계관을 씌우고 배우가 일어서며, 무대 일꾼이 돌 의자를 치운다(크레딧 동안)
  { id: 'p6-wreath', from: 1420, to: 1590, map: [[1420, 0], [1590, 1]], pin: { at: [.4845, .9156], height: 1264 }, track: {} },
  // p7-bow: 커튼콜 — 파트너 넷이 들어와 나란히 서고 다섯이 함께 인사한다
  { id: 'p7-bow', from: 1590, to: 1900, map: [[1590, 0], [1650, .35], [1700, .55], [1740, .8], [1800, 1]], pin: { at: [.4845, .9156], height: 1264 }, track: {} },
  // 앉아서 쪽지를 내려놓고(설계도 판 동안) → 크레딧 동안 일어서고 → 커튼콜에 인사
  // (예전) 앉음~인사 — p5-sculpt · p6-wreath · p7-bow로 대체. 되돌리려면 from: 1240, to: 1900 으로
  { id: 'act5-7', from: -6, to: -5, map: [[1240, 0], [1400, .3], [1500, .5], [1590, .7], [1690, 1]], pin: { at: [.56, .955], height: 1070 }, track: {} },
];

const piece = (pts, x) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return va + (vb - va) * (x - a) / (b - a); }
  return pts[pts.length - 1][1];
};

// opt.suffix: 같은 장 번호의 다른 묶음(예: '-bp' 설계도 선화), opt.only: 쓰는 막, opt.lazy: 그 막에 들어설 때 받기
// 발끝 높이: 단 윗면(깊이 58) 안쪽에 디디도록 앞 모서리보다 조금 위
const FOOT_Y = -26;
export function createFilm(canvas, opt = {}) {
  const ctx = canvas.getContext('2d');
  const sfx = opt.suffix || '';
  // 꺼 둔 막(to < 0)은 받지 않는다
  const films = FILMS.filter(f => f.to >= 0 && (!opt.only || opt.only.includes(f.id))).map(f => ({ ...f, man: null, imgs: [], tier: 0, props: null, mattes: {} }));
  let drawn = null;   // 마지막으로 그린 막과 장 번호(소품 자리를 같은 장에서 읽는다)
  let cur = null, queue = [], busy = 0;

  // 화면 끝에서 튕길 때(음수 스크롤 등)도 가장 가까운 막을 쓴다
  const filmAt = vh => { const v = Math.max(0, vh); return films.find(f => v >= f.from && v < f.to) || (v > 0 && films.length ? films[films.length - 1] : null); };
  // pear처럼 처음 8장, 그다음 16 · 8 · 4 · 2 · 1장 간격으로 메워 간다
  const order = n => { const seen = new Set(), out = []; const push = i => { if (i < n && !seen.has(i)) { seen.add(i); out.push(i); } };
    for (let i = 0; i < Math.min(8, n); i++) push(i); for (const s of [16, 8, 4, 2, 1]) for (let i = 0; i < n; i += s) push(i); return out; };
  function enqueue(f, front) { const jobs = order(f.man.count).map(i => [f, i]); queue = front ? jobs.concat(queue) : queue.concat(jobs); pump(); }
  function pump() {
    while (busy < 6 && queue.length) {
      const [f, i] = queue.shift(); if (f.imgs[i]) continue;
      const img = new Image(); img.idx = i; f.imgs[i] = img; busy++;
      img.decoding = 'async';
      img.onload = () => { img.ok = true; busy--; if (f === cur) dispatchEvent(new Event('film-frame')); pump(); };   // 지금 막의 장이 도착하면 한 번 다시 그린다
      img.onerror = () => { busy--; pump(); };
      img.src = `assets/films/${f.id}${sfx}/${f.tier}/f_${String(i + 1).padStart(3, '0')}.webp?v=${REV}`;
    }
  }
  films.forEach((f, k) => fetch(`assets/films/${f.id}${sfx}/manifest.json?v=${REV}`).then(r => r.ok ? r.json() : null).then(man => {
    if (!man) return;
    const want = Math.max(innerWidth, innerHeight) * Math.min(2, devicePixelRatio || 1) * .8;
    f.tier = man.tiers.find(t => t >= want) ?? man.tiers[man.tiers.length - 1];
    f.man = man; f.imgs = new Array(man.count);
    if (!opt.lazy) enqueue(f, k === 0);
    if (opt.props === false || !f.id.startsWith('act')) return;   // 소품 추적은 예전 막에만 있다
    // 영상 속 종이 · 쪽지의 네 모서리와, 그 위를 다시 덮는 손가락 · 펜 · 그늘(matte)
    fetch(`assets/films/${f.id}/props/props.json`).then(r => r.ok ? r.json() : null).then(p => { f.props = p; }).catch(() => {});
  }).catch(() => {}));
  function matteImg(f, name, i) {
    const key = name + i;
    if (!f.mattes[key]) { const im = new Image(); im.decoding = 'async'; im.onload = () => { im.ok = true; if (f === cur) dispatchEvent(new Event('film-frame')); }; im.src = `assets/films/${f.id}/props/${name}/${f.tier}/m_${String(i + 1).padStart(3, '0')}.webp`; f.mattes[key] = im; }
    return f.mattes[key];
  }

  const progress = (f, vh) => Math.max(0, Math.min(1, piece(f.map, vh)));
  function nearest(f, idx) {
    for (let d = 0; d < f.man.count; d++) {
      const a = f.imgs[idx - d], b = f.imgs[idx + d];
      if (a?.ok) return a; if (b?.ok) return b;
    }
    return null;
  }
  // 장 비율 좌표 → 세계 좌표
  // 무대 앞에 선 거인의 아래쪽: 잘린 장 끝을 몇 줄 늘여 옷자락을 잇고, 일직선이 아닌 들쭉날쭉한 안개 결로 사라지게 한다
  const pc = document.createElement('canvas'), pcx = pc.getContext('2d');
  const mk = document.createElement('canvas'), mkx = mk.getContext('2d');
  const strips = new Map();
  const hash = (x, y) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const fbm = (x, y) => vnoise(x, y) * .55 + vnoise(x * 2.1, y * 2.3) * .28 + vnoise(x * 4.3, y * 4.1) * .17;
  function strip(yTop, total) {   // 세로로 yTop..yTop+total(세계 단위) 구간의 남는 정도(알파)
    const key = `${yTop}|${total}`; if (strips.has(key)) return strips.get(key);
    const W = 384, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
    // 무대 모서리(y=0) 위는 그대로(앉은 배우의 발 · 의자는 건드리지 않는다), 아래로 갈수록 결이 크게 벌어지며 사라진다
    const g = c.getContext('2d'), im = g.createImageData(W, H), F0 = 0, F1 = 260;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const y = yTop + (j + .5) / H * total, base = (y - F0) / (F1 - F0), n = fbm(i / W * 14, j / H * 5);
      const t = base <= 0 ? 0 : Math.min(1, Math.max(0, base + (n - .5) * 1.2 * Math.min(1, base * 3))), a = 1 - t * t * (3 - 2 * t);
      const o = (j * W + i) * 4; im.data[o] = im.data[o + 1] = im.data[o + 2] = 255; im.data[o + 3] = Math.round(a * 255);
    }
    g.putImageData(im, 0, 0); strips.set(key, c); return c;
  }
  function dissolve(img, x, yTop, w, yCut, len, m, dpr, rTop, rCut) {
    const sx = Math.hypot(m[0], m[1]) * dpr, iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const total = yCut + len - yTop, W = Math.max(1, Math.round(w * sx)), H = Math.max(1, Math.round(total * sx));
    if (W > 8192 || H > 8192) return;
    for (const [cv, cx] of [[pc, pcx], [mk, mkx]]) { if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } else cx.clearRect(0, 0, W, H); }
    const hc = (yCut - yTop) * sx, sh = Math.max(2, Math.round(ih * .012));
    pcx.globalCompositeOperation = 'source-over';
    pcx.drawImage(img, 0, rTop, iw, rCut - rTop, 0, 0, W, hc);
    pcx.drawImage(img, 0, rCut - sh, iw, sh, 0, hc - .5, W, H - hc + .5);
    mkx.drawImage(strip(Math.round(yTop), Math.round(total)), 0, 0, W, H);
    pcx.globalCompositeOperation = 'destination-in'; pcx.drawImage(mk, 0, 0);
    pcx.globalCompositeOperation = 'source-over';
    ctx.drawImage(pc, x, yTop, w, total);
  }
  const toWorld = (f, fx, fy) => { const hW = f.pin.height, wW = hW * f.man.size[0] / f.man.size[1]; return { x: (fx - f.pin.at[0]) * wW, y: (fy - f.pin.at[1]) * hW + FOOT_Y }; };

  return {
    // 그렸으면 true(코드 대역을 숨긴다)
    draw(vh, m, dpr) {
      const f = filmAt(vh);
      if (f !== cur) { cur = f; if (f?.man) { queue = queue.filter(([g]) => g !== f); enqueue(f, true); } }
      if (!f?.man) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); drawn = null; return false; }
      const t = progress(f, vh), img = nearest(f, Math.round(t * (f.man.count - 1)));
      if (!img) return !!drawn;   // 장이 아직 오지 않았으면 직전 그림을 그대로 둔다
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawn = { f, i: img.idx };
      const hW = f.pin.height, wW = hW * f.man.size[0] / f.man.size[1];
      ctx.setTransform(dpr * m[0], dpr * m[1], dpr * m[2], dpr * m[3], dpr * m[4], dpr * m[5]);
      ctx.imageSmoothingQuality = 'high';
      // 무대 앞 모서리 아래는 무대 앞면에 가려진다(카메라 쪽에 선 인물의 잘린 다리 등)
      const x0 = -f.pin.at[0] * wW, y0 = -f.pin.at[1] * hW + FOOT_Y;
      if (f.pour) {
        // 무대 앞에 선 거인: 무대 앞면 위로 그리고, 장 아래로 잘린 옷자락은 길게 흘러내리며 사라진다
        // 장 가장자리(잘린 자리)에 생긴 윤곽선은 쓰지 않는다
        const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, c = .014, e = wW * .005;
        const yCut = y0 + hW * (1 - c), yTop = Math.min(-60, yCut - 10), rTop = (yTop - y0) / hW * ih;
        ctx.save(); ctx.beginPath(); ctx.rect(x0 + e, -1e5, wW - 2 * e, 2e5); ctx.clip();
        ctx.drawImage(img, 0, 0, iw, rTop, x0, y0, wW, yTop - y0);
        dissolve(img, x0, yTop, wW, yCut, f.pour, m, dpr, rTop, ih * (1 - c));
        ctx.restore();
      } else {
        ctx.save(); ctx.beginPath(); ctx.rect(-1e5, -1e5, 2e5, 1e5 + 2); ctx.clip();
        ctx.drawImage(img, x0, y0, wW, hW);
        ctx.restore();
      }
      return true;
    },
    // 영상에서 잰 손 · 머리 위치(없으면 null → 코드 대역의 관절을 쓴다)
    track(vh, name) {
      const f = filmAt(vh); const tr = f?.man && f.track[name];
      if (!tr) return null;
      const t = progress(f, vh);
      return toWorld(f, piece(tr.map(([p, x]) => [p, x]), t), piece(tr.map(([p, , y]) => [p, y]), t));
    },
    ready: () => films.some(f => f.man),
    idAt: vh => filmAt(vh)?.id ?? null,
    // 트랙의 첫 값만(장 좌표가 아닌 값: 예 paperOn)
    value(vh, name) { const f = filmAt(vh); const tr = f?.man && f.track[name]; return tr ? piece(tr.map(([p, v]) => [p, v]), progress(f, vh)) : null; },
    // 곧 들어설 막을 미리 받기 시작한다
    warm(vh) { const f = filmAt(vh); if (f?.man && !f.warmed) { f.warmed = true; enqueue(f, false); } },
    // 지금 장에서 인물의 위 · 아래 끝(세계 y), manifest.ext가 있을 때
    extent(vh) {
      const f = filmAt(vh); if (!f?.man?.ext) return null;
      const img = nearest(f, Math.round(progress(f, vh) * (f.man.count - 1))); if (!img) return null;
      const [a, b] = f.man.ext[img.idx]; return { top: toWorld(f, 0, a).y, bottom: toWorld(f, 0, b).y };
    },
    // 지금 그린 장에서 소품의 네 모서리(세계 좌표). since: 소품이 보이기 시작한 뒤 몇 장째인지
    prop(vh, name) {
      const f = filmAt(vh), P = f?.man && f.props?.[name];
      if (!P) return null;
      const img = nearest(f, Math.round(progress(f, vh) * (f.man.count - 1)));   // draw()가 고를 장과 같은 장
      const i = img ? img.idx : Math.round(progress(f, vh) * (f.man.count - 1)), e = P[i];
      if (!e) return null;
      let since = 0; while (P[i - since - 1]) since++;
      const q = e.q.map(([x, y]) => toWorld(f, x, y));
      return { q, c: { x: (q[0].x + q[1].x + q[2].x + q[3].x) / 4, y: (q[0].y + q[1].y + q[2].y + q[3].y) / 4 }, since, i, b: !!e.b };
    },
    // 소품 위에 영상의 손가락 · 펜 · 종이 그늘을 다시 얹는다(소품이 손에 쥐어져 보이게)
    drawMatte(ctx2, name, m, dpr, alpha) {
      ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height);
      const P = drawn?.f.props?.[name]; const e = P?.[drawn.i];
      if (!e || alpha <= .01) return;
      const f = drawn.f, im = matteImg(f, name, drawn.i);
      if (!im.ok) return;
      const hW = f.pin.height, wW = hW * f.man.size[0] / f.man.size[1];
      ctx2.setTransform(dpr * m[0], dpr * m[1], dpr * m[2], dpr * m[3], dpr * m[4], dpr * m[5]);
      ctx2.globalAlpha = alpha; ctx2.imageSmoothingQuality = 'high';
      ctx2.drawImage(im, (e.m[0] - f.pin.at[0]) * wW, (e.m[1] - f.pin.at[1]) * hW + FOOT_Y, e.m[2] * wW, e.m[3] * hW);
      ctx2.globalAlpha = 1;
    },
  };
}
