// 카메라 연출 시안: 조각상 배우 한 명을 스크롤로 촬영한다.
// 키프레임마다 카메라(어디를 · 얼마나 · 몇 도), 자세, 효과를 적고, 그 사이를 이징으로 잇는다.
import { POSES, lerpPose, solve, marble, armature, el } from './figure.js';
import { createFilm, REV } from './film.js?v=20261122e';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s);

// ── 샷 리스트 (at: vh) ──────────────────────────────
// t: 카메라가 보는 곳(관절 이름 또는 세계 좌표), dx·dy: 그곳에서 비켜 보기, z: 배율(1 = 전신과 받침대), r: 롤(°)
// e: 이전 키프레임에서 여기까지의 이징, cut: 컷(보간 없음)
// 무대 앞면 그림의 판 한 칸 너비(세계 단위): 612 높이 × 1960/1152
const PANEL = 612 * 1960 / 1152;
const K = [
  { at: 0, t: 'full', dx: -260, dy: 0, z: 1, r: 0, pose: 'stand', bg: '#2a64a8', dlg: 0, paper: 0, slab: 0, split: -1, wipe: 0, dith: 1, iris: 6000, cloud: 1, cb: 1, cs: 0, stars: 0, flare: 0, sel: 1, pdot: 0, sflat: 0, cons: 0 },
  { at: 55, z: 1.06, e: 'lin' },
  // 서막 → 1막: 받침대에서 얼굴까지 크레인 업, 그사이 고개를 들어 옆모습이 된다
  { at: 150, t: 'speak', dx: 35, dy: 10, z: 3.2, pose: 'speak', bg: '#357a90', cloud: .85, sel: 0, e: 'io' },
  { at: 175, z: 3.3, dlg: 1, e: 'lin' },
  { at: 255, dx: 45, z: 3.4, r: -1.2, e: 'lin' },
  // 1막 → 2막: 뻗은 팔을 따라 손까지 트래킹, 팔이 내려와 종이를 든다
  { at: 360, t: 'lHand', dx: -90, dy: 40, z: 2.35, r: 5, pose: 'hold', dlg: 0, paper: 1, bg: '#5b4a36', cloud: .3, cb: .75, cs: .3, e: 'io' },
  { at: 430, dx: -82, dy: 34, z: 2.5, r: 4, e: 'lin' },
  // 펼친 신문 옆에 신문 데모가 선으로 이어져 뜬다(신문 모양을 덧씌우지 않는다)
  { at: 480, t: 'paperCard', dx: 0, dy: 0, z: 1.95, r: 0, e: 'io' },
  { at: 585, z: 1.9, e: 'lin' },
  // 2막 → 3막: 암전으로 넘어간다
  { at: 585.05, cut: true, t: 'slabCard', dx: 0, dy: 0, z: 1.7, r: 0, pose: 'write', paper: 0, slab: 1, bg: '#141f45', cloud: .35, cb: .38, cs: 0, stars: 1 },
  { at: 690, z: 1.76, e: 'lin' },
  { at: 805, z: 1.82, e: 'lin' },
  // 3막 → 4막: 카메라는 서판에 붙어 있고, 프레임 밖에서 몸이 앉는다. 빠지면서 드러난다
  { at: 840, pose: 'sit', e: 'io' },
  { at: 940, t: [200, -120], dx: 0, dy: 0, z: .95, bg: '#9a5a2e', cloud: .95, cb: 1, cs: .55, stars: 0, e: 'out' },
  { at: 1035, t: [190, -120], z: .97, e: 'lin' },
  // 4막 → 5막: 옆으로 트럭, 앞을 지나는 기둥 뒤에서 조각상이 뼈대가 된다
  { at: 1160, t: [-330, -180], z: .98, wipe: 1, e: 'io' },
  { at: 1240, t: [250, -300], z: 1.0, pose: 'stand', slab: 0, e: 'io' },
  { at: 1310, z: 1.04, e: 'lin' },
  // 5막 → 6막: 받침대로 틸트 다운, 망점처럼 대리석으로 돌아온다
  // 무대 앞면 판 두 칸: 가운데 판(그 밖의 작업) → 오른쪽 옆 판(쓰는 기술 · 배운 곳)으로 옆걸음
  // 세로 화면은 판 하나도 다 들어오지 않으니 한 단씩 읽어 간다(pdx)
  { at: 1420, t: 'roll', dx: -120, pdx: -232, dy: 120, z: { fit: 'roll', k: .6, pfit: 'rollCol' }, dith: 0, bg: '#3b4a5e', cloud: .55, cb: .62, cs: .15, stars: .35, e: 'io' },
  { at: 1468, dx: -120, pdx: 232, e: 'io' },
  { at: 1522, dx: PANEL - 120, pdx: PANEL - 232, e: 'io' },
  { at: 1576, dx: PANEL - 120, pdx: PANEL + 232, e: 'io' },
  // 6막 → 커튼콜: 크게 빠지며 인사, 조명이 원으로 좁혀진다
  { at: 1640, t: [0, -40], dx: 0, pdx: null, dy: 0, z: .52, pose: 'bow', iris: 1250, bg: '#0b0a09', cloud: 0, stars: .6, e: 'io' },
  { at: 1720, iris: 900, cons: 1, e: 'out' },
  { at: 1800, e: 'lin' },
];
const END = 1800;
const ACT_AT = [0, 100, 300, 590, 850, 1100, 1360, 1600];
const HOLD = [24, 215, 400, 720, 990, 1280, 1470, 1760];

// 이전 값 이어받기
for (let i = 1; i < K.length; i++) {
  for (const k in K[i - 1]) if (!(k in K[i]) && k !== 'cut' && k !== 'e') K[i][k] = K[i - 1][k];
}

const EASE = {
  lin: t => t,
  io: t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  out: t => 1 - (1 - t) ** 3,
};

// ── 무대 만들기 ──────────────────────────────
const svA = $('#svA'), svB = $('#svB');
const camA = el('g', {}, svA), camB = el('g', {}, svB);
const svTop = $('#svTop'), camTop = el('g', {}, svTop);
// 무대 양옆 막(다리 커튼): 영상 장 끝에서 잘린 사람이 이 뒤에서 걸어 나온다
const svC = $('#svC'), camC = el('g', {}, svC), curtL = el('g', {}, camC), curtR = el('g', {}, camC);   // 커튼콜에 양옆에서 밀려 들어온다
{
  const d = el('defs', {}, svC);
  d.innerHTML = `<linearGradient id="foldG" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="74" y2="0" spreadMethod="repeat"><stop offset="0" stop-color="#2c0709"/><stop offset=".28" stop-color="#6c141a"/><stop offset=".52" stop-color="#9c262c"/><stop offset=".78" stop-color="#5b1116"/><stop offset="1" stop-color="#2c0709"/></linearGradient>
  <linearGradient id="curtShade" gradientUnits="userSpaceOnUse" x1="0" y1="-2600" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".45" stop-color="#000" stop-opacity=".05"/><stop offset=".85" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
  <linearGradient id="curtEdgeL" gradientUnits="userSpaceOnUse" x1="-1000" y1="0" x2="-790" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#ffd9b0" stop-opacity=".07"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
  <linearGradient id="curtEdgeR" gradientUnits="userSpaceOnUse" x1="1040" y1="0" x2="850" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#ffd9b0" stop-opacity=".07"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>`;
  const L = 'M-4200 -3200H-792C-764 -2100 -800 -1000 -772 -8H-4200Z', R = 'M4200 -3200H842C814 -2100 852 -1000 828 -8H4200Z';
  for (const [p, edge, g] of [[L, 'url(#curtEdgeL)', curtL], [R, 'url(#curtEdgeR)', curtR]]) {
    el('path', { d: p, fill: 'url(#foldG)' }, g); el('path', { d: p, fill: 'url(#curtShade)' }, g); el('path', { d: p, fill: edge }, g);
  }
  // 위 가림막은 두지 않는다(무대 위가 트이게)
}
{ // 양옆 막: 그린 벨벳 에셋(원본 그대로, 자르지 않는다). 받으면 코드 막을 덮는다
  // curtain.webp(494×1890): 천이 불투명한 폭은 대략 64~455px, 오른쪽 끝이 금줄, 아래로 갈수록 자락이 퍼진다
  const d = svC.querySelector('defs'), H = 3200, S = H / 1890, DW = 494 * S, EDGE = 455 * S, STEP = 380 * S;   // 원본 비율 그대로(가로로 늘이면 아래 자락이 더 안으로 퍼진다)
  const LI = -812, RI = 864;   // 금줄 쪽 천 끝(가장 바깥으로 물러난 줄 기준): 영상 장의 가장자리(왼 -816.7 · 오른 869.0)를 겨우 가리는 한계
  const gL = el('g', { class: 'curtain-art' }), gR = el('g', { class: 'curtain-art' });
  const drape = (x, flip, g) => el('image', { href: `assets/art/curtain.webp?v=${REV}`, x: flip ? -x - DW : x, y: -H, width: DW, height: H, preserveAspectRatio: 'none', ...(flip ? { transform: 'scale(-1 1)' } : {}) }, g);
  // 바깥 폭부터 겹쳐 걸고(빈 가장자리 · 금줄은 안쪽 폭 뒤로 숨는다) 맨 안쪽 한 폭을 맨 위에
  for (let k = 2; k >= 0; k--) {   // 커튼콜 조리개 밖까지만(폭이 많을수록 장마다 그릴 게 늘어난다)
    drape(LI - EDGE - k * STEP, false, gL);
    drape(RI + EDGE - DW + k * STEP, true, gR);
  }
  // 위만 살짝 어둡게(아래는 그대로)
  const t = el('linearGradient', { id: 'curtTop', gradientUnits: 'userSpaceOnUse', x1: 0, y1: -2600, x2: 0, y2: 0 }, d);
  [[0, .45], [.5, 0], [1, 0]].forEach(([o, a]) => el('stop', { offset: o, 'stop-color': '#000', 'stop-opacity': a }, t));
  // 그늘은 막이 덮은 구간에만 바로 얹는다(mask를 쓰면 카메라가 움직일 때마다 다시 그려 무겁다)
  const span = EDGE - 64 * S + 2 * STEP;   // 맨 바깥 폭의 불투명한 왼끝 ~ 안쪽 금줄
  el('rect', { x: LI - span, y: -H, width: span, height: H, fill: 'url(#curtTop)' }, gL);
  el('rect', { x: RI, y: -H, width: span, height: H, fill: 'url(#curtTop)' }, gR);
  const probe = new Image(); probe.onload = () => { curtL.replaceChildren(gL); curtR.replaceChildren(gR); }; probe.src = `assets/art/curtain.webp?v=${REV}`;
}
const filmCanvas = $('#film'), film = createFilm(filmCanvas);
// 설계도 판: 같은 영상 장을 선화로 뽑은 묶음(assets/films/<id>-bp)
const bpCanvas = $('#bpFilm'), bpFilm = createFilm(bpCanvas, { suffix: '-bp', only: ['p4-seat', 'p5-sculpt'], lazy: true, props: false });
const defs = el('defs', {}, svA);
defs.innerHTML = `
  <linearGradient id="skinG" gradientUnits="userSpaceOnUse" x1="-420" y1="-1150" x2="460" y2="380"><stop offset="0" stop-color="#f4d8b6"/><stop offset=".5" stop-color="#dfab80"/><stop offset="1" stop-color="#a86d48"/></linearGradient>
  <linearGradient id="chitonG" gradientUnits="userSpaceOnUse" x1="-380" y1="-950" x2="420" y2="120"><stop offset="0" stop-color="#fdfaf2"/><stop offset=".55" stop-color="#e6e3dc"/><stop offset="1" stop-color="#a9b2bf"/></linearGradient>
  <linearGradient id="himationG" gradientUnits="userSpaceOnUse" x1="-380" y1="-900" x2="420" y2="120"><stop offset="0" stop-color="#d9503f"/><stop offset=".55" stop-color="#ad2f25"/><stop offset="1" stop-color="#6c1914"/></linearGradient>
  <linearGradient id="plinthG" gradientUnits="userSpaceOnUse" x1="-260" y1="40" x2="260" y2="600"><stop offset="0" stop-color="#9c8b72"/><stop offset=".6" stop-color="#76654f"/><stop offset="1" stop-color="#4f4335"/></linearGradient>
  <pattern id="brushP" patternUnits="userSpaceOnUse" width="300" height="300"><image id="brushImg" width="300" height="300"/></pattern>
  <radialGradient id="spotG" gradientUnits="userSpaceOnUse" cx="0" cy="-460" r="1500"><stop offset="0" stop-color="#fff3df" stop-opacity=".2"/><stop offset=".55" stop-color="#fff3df" stop-opacity=".06"/><stop offset="1" stop-color="#fff3df" stop-opacity="0"/></radialGradient>
  <linearGradient id="topG" gradientUnits="userSpaceOnUse" x1="0" y1="-210" x2="0" y2="0"><stop offset="0" stop-color="#9d8259"/><stop offset=".45" stop-color="#c9ae7f"/><stop offset=".85" stop-color="#e3cfa2"/><stop offset="1" stop-color="#efe0bb"/></linearGradient>
  <radialGradient id="footG"><stop offset="0" stop-color="#1a120a" stop-opacity=".5"/><stop offset=".55" stop-color="#1a120a" stop-opacity=".22"/><stop offset="1" stop-color="#1a120a" stop-opacity="0"/></radialGradient>
  <radialGradient id="poolG" gradientUnits="userSpaceOnUse" cx="0" cy="612" r="760" gradientTransform="translate(0 612) scale(1 .14) translate(0 -612)"><stop offset="0" stop-color="#fff3df" stop-opacity=".22"/><stop offset="1" stop-color="#fff3df" stop-opacity="0"/></radialGradient>`;
const defsB = el('defs', {}, svB);
defsB.innerHTML = `<pattern id="gridP" patternUnits="userSpaceOnUse" width="100" height="100"><path d="M100 0H0V100" fill="none" stroke="#9fc0e6" stroke-opacity=".22" stroke-width="1" vector-effect="non-scaling-stroke"/></pattern>`;

const floor = el('rect', { x: -9000, y: 612, width: 18000, height: 6000 }, camA);
el('rect', { x: -9000, y: 612, width: 18000, height: 6000, class: 'st-tex floor-tex' }, camA);
el('rect', { x: -9000, y: -6000, width: 18000, height: 6612, fill: 'url(#spotG)' }, camA);
el('rect', { x: -9000, y: 600, width: 18000, height: 400, fill: 'url(#poolG)' }, camA);
const plinth = el('g', { class: 'plinth' }, camA);
// 무대 단: 파트너가 옆에 서도 디딜 곳이 있게 넓은 단(반폭 STAGE). 받침대 그림의 가운데를 늘려 쓴다
// 단상이 곧 무대: 화면 끝까지 이어지는 무대 앞면(받침대 하나를 따로 올려 두지 않는다)
const STAGE = 9000, SI = STAGE - 38;
el('path', { d: `M-${SI} 44H${SI}V560H-${SI}Z`, class: 'pl-shaft', 'vector-effect': 'non-scaling-stroke' }, plinth);
el('path', { d: `M-${STAGE} 0H${STAGE}V44H-${STAGE}Z M-${STAGE} 560H${STAGE}V612H-${STAGE}Z`, class: 'pl-mould', 'vector-effect': 'non-scaling-stroke' }, plinth);
el('path', { d: `M-${STAGE} 0H${STAGE}V44H${SI}V560H${STAGE}V612H-${STAGE}V560H-${SI}V44H-${STAGE}Z`, class: 'st-tex' }, plinth);
el('path', { d: `M-${STAGE - 12} 30H${STAGE - 12}M-${SI - 12} 66H${SI - 12}M-${SI - 12} 540H${SI - 12}M-${STAGE - 12} 574H${STAGE - 12}`, class: 'st-line', fill: 'none', 'vector-effect': 'non-scaling-stroke' }, plinth);
// 단상 · 앉는 돌: 칠한 그림 에셋(받으면 코드 그림을 덮는다). 돌 의자는 앉아 있는 동안만 받침대 위에 놓인다
// 영상의 앉은 자세에서 옷자락이 놓이는 높이 = 장 y .72 → 세계 y ≈ -251
const SEAT = { x: -282, y: -251, w: 564, h: 251 };
const seat = el('g', { class: 'seat' }, camA);
el('path', { d: `M${SEAT.x} ${SEAT.y}H${SEAT.x + SEAT.w}V0H${SEAT.x}Z`, class: 'pl-shaft', 'vector-effect': 'non-scaling-stroke' }, seat);
el('path', { d: `M${SEAT.x} ${SEAT.y}H${SEAT.x + SEAT.w}V0H${SEAT.x}Z`, class: 'st-tex' }, seat);
const artImage = (g, href, x, y, w, h) => {
  const im = el('image', { href, x, y, width: w, height: h, preserveAspectRatio: 'none' });
  const probe = new Image(); probe.onload = () => { g.replaceChildren(im); }; probe.src = href;
};
{ // 무대 앞면: 벽기둥 사이로 매끈한 판이 이어지는 돌 띠(판 하나가 x=0 가운데에 온다 → 크레딧이 그 판 안에 새겨진다)
  const TW = 612 * 1960 / 1152;
  el('pattern', { id: 'stageP', patternUnits: 'userSpaceOnUse', x: -TW / 2, y: 0, width: TW, height: 612 }, defs).appendChild(el('image', { href: `assets/art/stage-panel.webp?v=${REV}`, width: TW, height: 612, preserveAspectRatio: 'none' }));
  const r = el('rect', { x: -STAGE, y: 0, width: STAGE * 2, height: 612, fill: 'url(#stageP)' });
  const probe = new Image(); probe.onload = () => plinth.replaceChildren(r); probe.src = `assets/art/stage-panel.webp?v=${REV}`;
}
// 단의 윗면: 정면만 있으면 발끝이 모서리에 걸려 까치발처럼 보인다. 안쪽으로 물러나는 윗면을 깔고 인물은 그 위(FOOT_Y)에 세운다
const TOPD = 210;   // 배우 · 돌 의자가 디딘 자리까지 바닥이 깔리게 깊게
const stageTop = el('g', { class: 'stage-top' }, camA);
el('path', { d: `M-${STAGE} 0V-${TOPD}H${STAGE}V0Z`, fill: 'url(#topG)', stroke: 'rgba(80,60,30,.35)', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, stageTop);
el('path', { d: `M-${STAGE} 0V-${TOPD}H${STAGE}V0Z`, class: 'st-tex' }, stageTop);
{ // 원근: 무대 가운데(x=0)로 모이는 마루 줄 + 안으로 갈수록 좁아지는 가로 이음 + 막 아래 그늘 + 앞 모서리 빛
  const gr = (id, stops, y1, y2) => { const g = el('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: 0, y1, x2: 0, y2 }, defs);
    stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g)); };
  gr('wallFoot', [[0, 'rgba(20,14,8,0)'], [1, 'rgba(20,14,8,.42)']], -TOPD - 260, -TOPD);
  gr('floorBack', [[0, 'rgba(36,22,8,.5)'], [1, 'rgba(36,22,8,0)']], -TOPD, -TOPD + 90);
  gr('floorFront', [[0, 'rgba(255,248,226,0)'], [1, 'rgba(255,248,226,.35)']], -60, 0);
  // 배경 막이 바닥에 닿는 곳의 그늘(배경이 바닥 뒤에 '서 있게')
  stageTop.prepend(el('rect', { x: -STAGE, y: -TOPD - 260, width: STAGE * 2, height: 260, fill: 'url(#wallFoot)' }));
  let d = '';
  const VK = .62;   // 뒤쪽 끝의 폭 비율(작을수록 깊어 보인다)
  for (let x = -STAGE; x <= STAGE; x += 150) d += `M${x} 0L${(x * VK).toFixed(1)} -${TOPD}`;
  [10, 28, 56, 100, 160].forEach(t => { d += `M-${STAGE} -${t}H${STAGE}`; });
  el('path', { d, stroke: 'rgba(92,64,30,.2)', 'stroke-width': 1, fill: 'none', 'vector-effect': 'non-scaling-stroke' }, stageTop);
  el('rect', { x: -STAGE, y: -TOPD, width: STAGE * 2, height: 90, fill: 'url(#floorBack)' }, stageTop);
  el('rect', { x: -STAGE, y: -60, width: STAGE * 2, height: 60, fill: 'url(#floorFront)' }, stageTop);
  el('path', { d: `M-${STAGE} -1H${STAGE}`, stroke: 'rgba(255,250,232,.75)', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' }, stageTop);
}

artImage(seat, 'assets/art/seat.webp', SEAT.x, SEAT.y, SEAT.w, SEAT.h);
const actor = el('g', { class: 'actor' }, camA);
const drawMarble = marble(actor);

// ── 고전 장면 안의 사물 하나를 디지털 짝으로 ─────────────
// 서막: 객석의 눈에서 뻗은 시선(절두체)과, 배우를 둘러싼 디자인 도구의 선택 상자
const sel = el('g', { class: 'sel' }, camTop);
const EYE = { x: 0, y: 2900 }, BOX = { x: -250, y: -1012, w: 500, h: 1012 };
const corners = [[BOX.x, BOX.y], [BOX.x + BOX.w, BOX.y], [BOX.x + BOX.w, BOX.y + BOX.h], [BOX.x, BOX.y + BOX.h]];
el('path', { class: 'sel-ray', d: corners.map(([x, y]) => `M${EYE.x},${EYE.y}L${x},${y}`).join(''), 'vector-effect': 'non-scaling-stroke' }, sel);
el('rect', { class: 'sel-box', x: BOX.x, y: BOX.y, width: BOX.w, height: BOX.h, pathLength: 1, 'vector-effect': 'non-scaling-stroke' }, sel);
const selHandles = corners.concat([[BOX.x + BOX.w / 2, BOX.y], [BOX.x + BOX.w / 2, BOX.y + BOX.h], [BOX.x, BOX.y + BOX.h / 2], [BOX.x + BOX.w, BOX.y + BOX.h / 2]])
  .map(([x, y]) => el('rect', { class: 'sel-handle', x, y, width: 1, height: 1, 'vector-effect': 'non-scaling-stroke' }, sel));
const selLabel = el('text', { class: 'sel-label', x: BOX.x, y: BOX.y - 14 }, sel);
selLabel.textContent = '관객이 보는 쪽 · 500 × 1012';
// 1막: 뻗은 손에서 대사판으로 이어지는 지시선(pear의 질문 카드 지시선처럼)
const lead = el('g', { class: 'lead-line' }, camTop);
const leadPath = el('path', { 'vector-effect': 'non-scaling-stroke' }, lead);
const leadDot = el('path', { class: 'lead-star' }, lead);
// 소품(신문 · 쪽지)에서 옆 카드로 가는 지시선: 출처엔 작은 고리, 도착엔 별
const mkLead = () => { const g = el('g', { class: 'lead-line' }, camTop); el('path', { 'vector-effect': 'non-scaling-stroke' }, g); el('circle', { class: 'lead-ring', 'vector-effect': 'non-scaling-stroke' }, g); el('path', { class: 'lead-star' }, g); return g; };
const leadP = mkLead(), leadS = mkLead();
function leadTo(g, a, b, o, px) {
  g.style.opacity = o; g.style.display = o > .01 ? '' : 'none';
  if (o <= .01) return;
  const [ln, ring, star] = g.children;
  ln.setAttribute('d', `M${a.x + (b.x - a.x) * .04},${a.y + (b.y - a.y) * .04}L${b.x},${b.y}`);
  ring.setAttribute('cx', a.x); ring.setAttribute('cy', a.y); ring.setAttribute('r', 7 * px);
  star.setAttribute('transform', `translate(${b.x - 6 * px} ${b.y - 6 * px}) scale(${(12 * px / 24).toFixed(4)})`); star.setAttribute('d', STARP);
}
// 커튼콜: 밤하늘의 별을 이어 받침대 위 배우 표지를 별자리로
const cons = el('g', { class: 'cons' }, camTop);
const MARK_PTS = [[15, 6], [10, 17.5], [20, 17.5], [8.5, 28.5], [21.5, 28.5], [5, 28.5], [25, 28.5], [7, 39.5], [23, 39.5], [3.5, 39.5], [26.5, 39.5]];
const MARK_EDGES = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [5, 6], [3, 7], [4, 8], [9, 10]];
const CONS = { x: 0, y: -1190, k: 8 };   // 나란히 선 다섯 머리 위
const cp = ([x, y]) => [CONS.x + (x - 15) * CONS.k, CONS.y + (y - 22) * CONS.k];
const consLines = MARK_EDGES.map(([a, b]) => { const [x1, y1] = cp(MARK_PTS[a]), [x2, y2] = cp(MARK_PTS[b]); return el('path', { class: 'cons-line', d: `M${x1},${y1}L${x2},${y2}`, pathLength: 1, 'vector-effect': 'non-scaling-stroke' }, cons); });
const STARP = 'M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z';
const consStars = MARK_PTS.map(pt => { const [x, y] = cp(pt); return el('path', { class: 'cons-star', d: STARP, 'data-x': x, 'data-y': y }, cons); });

el('rect', { x: -9000, y: -6000, width: 18000, height: 12000, fill: 'url(#gridP)' }, camB);
{ // 설계도의 무대 앞면: 띠 두 줄과 벽기둥 사이 판(그린 무대 앞면과 같은 칸)
  const TW = 612 * 1960 / 1152; let d = `M-${STAGE} -${TOPD}H${STAGE}M-${STAGE} 0H${STAGE}M-${STAGE} 82H${STAGE}M-${STAGE} 534H${STAGE}M-${STAGE} 612H${STAGE}`;
  for (let k = -9; k <= 9; k++) { const c = k * TW; d += `M${c - 478} 98H${c + 478}V520H${c - 478}Z`; }
  el('path', { d, class: 'bp-plinth', fill: 'none', 'vector-effect': 'non-scaling-stroke' }, camB);
}
el('path', { d: 'M-9000 612H9000', class: 'bp-dim', 'vector-effect': 'non-scaling-stroke' }, camB);
const bpSeat = el('path', { d: `M${SEAT.x} ${SEAT.y}H${SEAT.x + SEAT.w}V0H${SEAT.x}ZM${SEAT.x} ${SEAT.y + 22}H${SEAT.x + SEAT.w}`, class: 'bp-plinth', fill: 'none', 'vector-effect': 'non-scaling-stroke' }, camB);
const bones = el('g', {}, camB);
const drawBones = armature(bones);
const dimLabel = el('text', { class: 'bp-text' }, camB);
dimLabel.textContent = '배우 실측 · 1 : 1';

const wl = $('#wl');
const CUT_AT = [1416, 1430, 1450, 1500, 1540];   // 제목 · MatchEAT · StockSim · 쓰는 기술 · 배운 곳
const rollLines = [...document.querySelectorAll('#itRoll .roll-cap, #itRoll li, #itRoll2 li')];
rollLines.forEach(l => l.classList.add('chisel'));
const items = { flare: $('#itFlare'), dlg: $('#itDlg'), paper: $('#itPaper'), slab: $('#itSlab'), roll: $('#itRoll'), roll2: $('#itRoll2') };
const SIZE = { paperCard: [480, 325], paper: [420, 250], slab: [300, 195], roll: [900, 400], rollCol: [460, 400], dlg: [240, 170] };
// ── 칠한 하늘: 구름 몇 덩이(둘은 pear처럼 픽셀), 밤하늘 별, 붓결 ─────────────
const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(7);
function paintCloud(pixel) {
  const w = 512, h = 256, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const puffs = [];
  for (let i = 0; i < 46; i++) {
    const u = rnd(), cx = w * (.14 + .72 * u), spread = 1 - Math.abs(u - .5) * 1.5;
    const r = h * (.1 + .2 * rnd()) * (.55 + spread * .7);
    puffs.push([cx, h * .66 - r * (.35 + rnd() * .7) * spread, r]);
  }
  for (const [x, y, r] of puffs) { const gr = g.createRadialGradient(x, y + r * .3, 0, x, y + r * .3, r); gr.addColorStop(0, 'rgba(146,160,190,.55)'); gr.addColorStop(1, 'rgba(146,160,190,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y + r * .3, r, 0, 7); g.fill(); }
  for (const [x, y, r] of puffs) { const gr = g.createRadialGradient(x - r * .2, y - r * .25, 0, x - r * .2, y - r * .25, r * .95); gr.addColorStop(0, 'rgba(255,253,246,.96)'); gr.addColorStop(.6, 'rgba(246,242,236,.7)'); gr.addColorStop(1, 'rgba(240,236,232,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x - r * .2, y - r * .25, r * .95, 0, 7); g.fill(); }
  g.globalCompositeOperation = 'destination-out';
  const fade = g.createLinearGradient(0, h * .62, 0, h * .8); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = fade; g.fillRect(0, 0, w, h);
  if (!pixel) return c.toDataURL();
  const s = document.createElement('canvas'), q = 9; s.width = w / q; s.height = h / q;
  s.getContext('2d').drawImage(c, 0, 0, s.width, s.height);
  const o = document.createElement('canvas'); o.width = w; o.height = h;
  const og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(s, 0, 0, w, h);
  return o.toDataURL();
}
function brushTexture() {
  // 프레스코 회반죽: 짧고 엇갈린 붓자국과 번진 얼룩
  const n = 300, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'); g.lineCap = 'round';
  const wrap = (fn) => { for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) fn(dx, dy); };
  for (let i = 0; i < 70; i++) {
    const x = rnd() * n, y = rnd() * n, r = 14 + rnd() * 46, dark = rnd() < .5;
    wrap((dx, dy) => { const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); gr.addColorStop(0, dark ? 'rgba(80,46,22,.07)' : 'rgba(255,248,232,.09)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2); });
  }
  for (let i = 0; i < 1500; i++) {
    const x = rnd() * n, y = rnd() * n, len = 3 + rnd() * 9, a = rnd() * Math.PI;
    g.lineWidth = .5 + rnd() * 1.4;
    g.strokeStyle = rnd() < .5 ? `rgba(70,38,18,${.03 + rnd() * .07})` : `rgba(255,248,232,${.04 + rnd() * .09})`;
    wrap((dx, dy) => { g.beginPath(); g.moveTo(x + dx, y + dy); g.quadraticCurveTo(x + dx + Math.cos(a + .5) * len * .6, y + dy + Math.sin(a + .5) * len * .6, x + dx + Math.cos(a) * len, y + dy + Math.sin(a) * len); g.stroke(); });
  }
  return c.toDataURL();
}
const sky = $('#sky');
const BRUSH = brushTexture();
$('#brushImg').setAttribute('href', BRUSH);
$('#skyTex').style.backgroundImage = `url(${BRUSH})`;
const CLOUD_SPOTS = [
  { x: -900, y: -1500, w: 900, d: .35 }, { x: 760, y: -1250, w: 720, d: .45 }, { x: 1900, y: -1750, w: 1100, d: .3 },
  { x: -2300, y: -1050, w: 760, d: .5, pixel: true }, { x: 280, y: -2300, w: 1200, d: .25 }, { x: -120, y: -640, w: 480, d: .62, pixel: true },
  { x: 2650, y: -760, w: 720, d: .55 }, { x: -3200, y: -1900, w: 1000, d: .28 },
];
const clouds = CLOUD_SPOTS.map(c => {
  const e = document.createElement('i'); e.className = 'cloud';
  e.style.backgroundImage = `url(${paintCloud(c.pixel)})`;
  sky.append(e);
  return { ...c, el: e };
});
const starLayer = document.createElement('div'); starLayer.className = 'stars'; sky.after(starLayer);
for (let i = 0; i < 46; i++) {
  const st = document.createElement('i'); const z = 4 + rnd() * 10;
  st.style.cssText = `left:${rnd() * 120 - 10}%;top:${rnd() * 70}%;width:${z}px;height:${z}px;animation-delay:${(rnd() * 7).toFixed(2)}s`;
  st.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z"/></svg>';
  starLayer.append(st);
}

// ── 상태 계산 ──────────────────────────────
let W = innerWidth, H = innerHeight, fit = 1, DPR = 1, curVh = 0;
function measure() {
  W = innerWidth; H = innerHeight;
  fit = Math.min(H / 1700, W / 1000);
  for (const s of [svA, svB, svTop, svC]) s.setAttribute('viewBox', `0 0 ${W} ${H}`);
  DPR = Math.min(2, devicePixelRatio || 1);
  for (const c of [filmCanvas, $('#filmTop'), $('#bpFilm')]) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); }
  document.body.style.height = `${(END + 100) * H / 100}px`;
}

function anchor(t, J) {
  if (Array.isArray(t)) return { x: t[0], y: t[1] };
  // 영상 인물이 있으면 영상에서 잰 손 · 머리 위치를 먼저 쓴다
  const base = { head: 'head', speak: 'head', lHand: 'lHand', rHand: 'rHand', paper: 'lHand', slab: 'lHand' }[t];
  // 영상 속 종이 · 쪽지가 잡혀 있으면 그 가운데를 본다
  if (t === 'paper') { const pp = film.prop(curVh, 'paper'); if (pp) return pp.c; }
  if (t === 'paperCard' || t === 'slabCard') { const a = cardSpots(curVh); return a[t === 'paperCard' ? 'paperMid' : 'slabMid']; }
  if (t === 'slab') { const cp = film.prop(curVh, 'card') || film.track(curVh, 'card'); if (cp) return cp.c || cp; if (lastCard && film.idAt(curVh)) return lastCard; }
  const tr = base && film.track(curVh, base);
  if (tr) { if (t === 'paper') return { x: tr.x - 150, y: tr.y - 70 }; if (t === 'slab') return { x: tr.x - 70, y: tr.y - 22 }; if (t === 'speak') { const h = film.track(curVh, 'lHand'); return h ? { x: (tr.x + h.x - 22) / 2, y: tr.y - 80 } : tr; } return tr; }
  switch (t) {
    case 'full': return { x: 0, y: -300 };
    case 'head': return { ...J.head };
    case 'speak': return { x: (J.head.x + J.l.hd.x - 22) / 2, y: J.head.y };
    case 'rHand': return { ...J.r.hd };
    case 'lHand': return { ...J.l.hd };
    case 'paper': return { x: J.l.hd.x - 150, y: J.l.hd.y - 70 };
    case 'slab': return { x: J.l.hd.x + (J.p.lS < 0 ? -70 : 62), y: J.l.hd.y - 22 };
    case 'roll': return { x: 0, y: 308 };
  }
}
function zoomOf(z) {
  // 세로 화면에서는 가까운 샷을 조금 물려 손에 든 소품까지 들어오게
  if (typeof z === 'number') return W < H && z > 2 ? z * .5 : z;
  const [w, h] = SIZE[(W < H && z.pfit) || z.fill || z.fit];
  const zw = W / (w * fit), zh = H / (h * fit);
  // 세로 화면에서는 종이가 잘리지 않게 채우기 대신 맞추기
  if (W < H) return Math.min(zw, zh) * Math.min(.86, z.k * 1.8);
  return (z.fill ? Math.max(zw, zh) : Math.min(zw, zh)) * z.k;
}
const lerp = (a, b, t) => a + (b - a) * t;
function lerpColor(a, b, t) {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], t))).join(',')})`;
}

function stateAt(vh) {
  curVh = vh;
  let i = 0;
  while (i < K.length - 1 && K[i + 1].at <= vh) i++;
  const A = K[i], B = K[Math.min(i + 1, K.length - 1)];
  let t = B === A ? 0 : (vh - A.at) / (B.at - A.at);
  t = Math.max(0, Math.min(1, t));
  const e = B.cut ? 0 : (EASE[B.e] || EASE.io)(t);
  const pose = lerpPose(POSES[A.pose], POSES[B.pose], e);
  const J = solve(pose);
  const pa = anchor(A.t, J), pb = anchor(B.t, J);
  const za = zoomOf(A.z), zb = zoomOf(B.z);
  const fx = {};
  for (const k of ['dlg', 'paper', 'slab', 'sflat', 'split', 'wipe', 'dith', 'iris', 'cloud', 'cb', 'cs', 'stars', 'flare', 'sel', 'pdot', 'cons']) fx[k] = lerp(A[k], B[k], e);
  // 좁은 화면: 옆으로 비켜 보던 구도를 가운데로 모으고, 글이 아래에 깔리니 피사체를 조금 올린다
  const ax = Math.min(1, (W / H) / 1.6);
  const z = Math.exp(lerp(Math.log(za), Math.log(zb), e));
  const lift = W < H ? H * .13 / (z * fit) : 0;
  return {
    J, pose,
    cx: lerp(pa.x + (W < H && A.pdx != null ? A.pdx : A.dx * ax), pb.x + (W < H && B.pdx != null ? B.pdx : B.dx * ax), e), cy: lerp(pa.y + A.dy, pb.y + B.dy, e) + lift,
    z, r: lerp(A.r, B.r, e),
    bg: lerpColor(A.bg, B.bg, e), fx,
  };
}

function matrix(S) {
  const s = S.z * fit, a = s * Math.cos(S.r * Math.PI / 180), b = s * Math.sin(S.r * Math.PI / 180);
  return [a, b, -b, a, W / 2 - (a * S.cx - b * S.cy), H / 2 - (b * S.cx + a * S.cy)];
}
const toScreen = (m, p) => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });

// ── 효과 ──────────────────────────────
const plateA = $('#plateA'), plateB = $('#plateB'), col = $('#col'), split = $('#split'), stage = $('#stage'), iris = $('#iris');
// 망점 디졸브: pear처럼 점 격자 마스크의 점 크기로 판을 녹인다
let lastDither = -1;
function dither(v) {
  const q = Math.round(v * 100);
  if (q === lastDither) return;
  lastDither = q;
  if (q >= 100) { plateB.style.maskImage = plateB.style.webkitMaskImage = 'none'; return; }
  const go = v * 74;
  const m = `radial-gradient(circle, #000 ${go.toFixed(1)}%, transparent ${(go + 7).toFixed(1)}%)`;
  plateB.style.maskImage = plateB.style.webkitMaskImage = m;
  plateB.style.maskSize = plateB.style.webkitMaskSize = '6px 6px';
}

const dockPaper = $('#dockPaper'), veil = $('#veil');
const topCanvas = $('#filmTop'), topCtx = topCanvas.getContext('2d');
// 소품 옆 카드 자리: 영상 속 신문 · 쪽지(출처)와, 그 옆 허공의 데모 카드(도착)
function cardSpots(vh) {
  const pc = film.track(vh, 'paper') || { x: -75, y: -770 }, sc = film.track(vh, 'card') || { x: 160, y: -690 };
  if (W < H) {
    // 세로 화면: 카드를 소품 위쪽에 쌓는다(옆으로는 자리가 없다)
    const paperAt = { x: pc.x + 60, y: pc.y + 345 }, slabAt = { x: 120, y: -1290 };   // 신문은 얼굴 바로 아래라, 신문 카드는 그 아래(다리 앞)에
    return { pc, sc, paperAt, slabAt, paperMid: { x: pc.x + 40, y: pc.y + 170 }, slabMid: { x: 110, y: -1010 } };
  }
  const paperAt = { x: pc.x + 500, y: pc.y - 20 }, slabAt = { x: 560, y: -1080 };
  return { pc, sc, paperAt, slabAt, paperMid: { x: (pc.x - 240 + paperAt.x + SIZE.paperCard[0] / 2) / 2, y: pc.y - 10 }, slabMid: { x: 150, y: -860 } };
}
let lastCard = null;
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// 요소의 네 모서리(0,0)(w,0)(w,h)(0,h)를 세계의 네 점에 맞추는 투영 행렬(손에 든 종이의 기울기와 원근)
function quadMatrix(w, h, P) {
  const [p0, p1, p2, p3] = P;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den, k = (dx1 * dy3 - dx3 * dy1) / den;
  const a = p1.x - p0.x + g * p1.x, b = p3.x - p0.x + k * p3.x, d = p1.y - p0.y + g * p1.y, e = p3.y - p0.y + k * p3.y;
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${p0.x},${p0.y},0,1)`;
}
const grow = (q, c, s) => q.map(p => ({ x: c.x + (p.x - c.x) * s, y: c.y + (p.y - c.y) * s }));
const rectAt = (c, w, h) => [{ x: c.x - w / 2, y: c.y - h / 2 }, { x: c.x + w / 2, y: c.y - h / 2 }, { x: c.x + w / 2, y: c.y + h / 2 }, { x: c.x - w / 2, y: c.y + h / 2 }];
const mixQ = (A, B, t) => A.map((p, i) => ({ x: lerp(p.x, B[i].x, t), y: lerp(p.y, B[i].y, t) }));

// ── 그리기 ──────────────────────────────
let prev = null;
function render(vh) {
  const S = stateAt(vh);
  const m = matrix(S);
  const mStr = `matrix(${m.join(',')})`;
  camA.setAttribute('transform', mStr);
  camTop.setAttribute('transform', mStr);
  camC.setAttribute('transform', mStr);
  { // 막은 커튼콜에만: 영상이 바뀌기 전(6막 끝) 양옆에서 밀려 들어와 자리를 잡고, 넓게 빠질 때 잘리는 장 가장자리를 가린다
    const k = ss(1540, 1586, vh), off = (1 - k) * 1900;
    svC.style.visibility = k > 0 ? 'visible' : 'hidden';
    curtL.setAttribute('transform', `translate(${-off} 0)`); curtR.setAttribute('transform', `translate(${off} 0)`);
  }
  // 막 사이 암전: 2막→3막, 3막→4막(영상이 바뀌는 자리)
  const tri = (a, b, c) => ss(a, b, vh) * (1 - ss(b + .1, c, vh));
  veil.style.opacity = Math.max(tri(566, 584.9, 606), tri(820, 839.9, 860)).toFixed(3);
  camB.setAttribute('transform', mStr);
  wl.style.transform = mStr;
  // 프레스코 영상 프레임이 있으면 그것을, 없으면 코드로 그린 대역을
  const filmed = film.draw(vh, m, DPR);
  // 돌 의자: 카메라가 서명판에 붙어 있는 사이 놓이고, 크레딧(받침대 정면) 동안 치워진다
  const seatO = filmed && !film.idAt(vh)?.startsWith('p') ? ss(840, 860, vh) * (1 - ss(1488, 1502, vh)) : 0;   // 파트너 영상(p…)은 영상 속에 진짜 의자가 있다
  seat.style.opacity = seatO; seat.style.display = seatO > .001 ? '' : 'none';
  bpSeat.style.display = film.idAt(vh)?.startsWith('p') ? 'none' : '';
  // 영상 묶음이 있으면 코드 인물은 쓰지 않는다(장이 아직 안 왔거나 화면 끝에서 튕겨 올라가도 그림이 바뀌지 않게)
  actor.style.display = filmed || film.ready() || performance.now() < 6000 ? 'none' : '';
  if (!filmed) drawMarble(S.J);
  // 설계도 판이 보이면 영상 장의 선화를, 없으면 코드 뼈대를
  if (vh > 900 && vh < 1500) { bpFilm.warm(vh); bpFilm.warm(Math.min(1499, vh + 300)); }
  const bpOn = S.fx.wipe > 0 && S.fx.dith > .01 && bpFilm.draw(vh, m, DPR);
  bones.style.display = bpOn ? 'none' : '';
  const dim = drawBones(S.J), ext = bpOn && bpFilm.extent(vh);
  dimLabel.setAttribute('x', ext ? 150 : dim.x + 22); dimLabel.setAttribute('y', (ext ? ext.top : dim.top) - 24);
  plateA.style.background = `linear-gradient(180deg, color-mix(in srgb, ${S.bg} 78%, #000) 0%, ${S.bg} 52%, color-mix(in srgb, ${S.bg} 82%, #fff) 100%)`;
  floor.style.fill = `color-mix(in srgb, color-mix(in srgb, ${S.bg} 45%, #6b5640) 70%, #000)`;
  // 하늘: 칠한 구름은 깊이만큼 덜 움직이고, 밤에는 어두워지고 해 질 녘엔 누렇게
  sky.style.opacity = S.fx.cloud; sky.style.filter = `brightness(${S.fx.cb.toFixed(3)}) sepia(${S.fx.cs.toFixed(3)})`;
  for (const c of clouds) {
    const k = fit * Math.pow(S.z, c.d) * c.d * 1.6;
    const x = W / 2 + (c.x - S.cx * c.d) * k, y = H / 2 + (c.y - S.cy * c.d) * k;
    c.el.style.transform = `translate(${x - c.w * k / 2}px, ${y - c.w * k / 4}px) scale(${(c.w * k / 512).toFixed(4)})`;
  }
  starLayer.style.opacity = S.fx.stars;
  starLayer.style.transform = `translate(${-S.cx * fit * .05}px, ${-S.cy * fit * .05}px)`;

  // 무대 소품(세계 안의 HTML)
  const place = (it, p, w, h, o) => {
    it.style.opacity = o; it.style.visibility = o > .01 ? 'visible' : 'hidden';
    it.inert = o < .5;
    it.style.transform = `translate(${p.x - w / 2}px, ${p.y - h / 2}px)`;
  };
  const head = anchor('head', S.J), lhd = anchor('lHand', S.J);
  // 대사판: 손에 얹지 않고, 입에서 나온 말이 머리 위 허공에 걸리도록(팔이 뻗은 쪽, 팔보다 위)
  const dlgAt = { x: head.x - 175, y: head.y - 165 };
  place(items.dlg, dlgAt, ...SIZE.dlg, S.fx.dlg);
  // 신문 · 서명판: 영상 속 진짜 종이 · 쪽지에 원근째 인쇄하고, 손가락 · 펜 · 그늘을 그 위에 다시 얹는다.
  // 카메라가 다가가면(flat) 종이에서 떠올라 화면을 향해 반듯해진다.
  let matte = null;
  const cardMode = filmed && film.idAt(vh)?.startsWith('p');
  if (cardMode) {
    // 신문 · 서명은 영상 속 소품을 그대로 두고, 옆 허공에 진짜 데모 카드를 선으로 이어 띄운다(대사판과 같은 문법)
    const cs = cardSpots(vh);
    const oP = Math.min(1, S.fx.paper * 3) * ss(.8, .95, film.value(vh, 'paperOn') ?? 0) * (1 - ss(568, 583, vh));
    place(items.paper, cs.paperAt, ...SIZE.paperCard, oP);
    const oS = S.fx.slab * ss(640, 700, vh) * (1 - ss(824, 838, vh));
    place(items.slab, cs.slabAt, ...SIZE.slab, oS);
    items.slab.style.setProperty('--lift', 1); items.slab.style.setProperty('--ink', 1);
    leadTo(leadP, W < H ? { x: cs.pc.x + 90, y: cs.pc.y + 100 } : { x: cs.pc.x + 160, y: cs.pc.y - 40 }, W < H ? { x: cs.paperAt.x + 60, y: cs.paperAt.y - SIZE.paperCard[1] / 2 - 6 } : { x: cs.paperAt.x - SIZE.paperCard[0] / 2 - 6, y: cs.paperAt.y + 40 }, oP, 1 / (S.z * fit));
    leadTo(leadS, { x: cs.sc.x + 10, y: cs.sc.y - 16 }, { x: cs.slabAt.x - SIZE.slab[0] / 2 + 30, y: cs.slabAt.y + SIZE.slab[1] / 2 + 6 }, oS, 1 / (S.z * fit));
  } else { leadP.style.display = leadS.style.display = 'none'; }
  let pp = !cardMode && filmed && film.prop(vh, 'paper');
  // 파트너 영상의 펼친 신문: 정면을 보고 있어 사각형으로 충분하다. 손이 가리지 않게 안쪽 90%에만 찍는다
  filmCanvas.style.opacity = '';
  if (pp) {
    // 지면이 다 펼쳐지면 신문 데모(dock)가 같은 자리에서 겹쳐 들어오며 넘겨받는다
    const f = ss(0, 1, S.fx.pdot), ink = ss(1, 7, pp.since) * Math.min(1, S.fx.paper * 3) * (1 - ss(506, 521, vh));   // 먼저 지면이 종이빛으로 물러나고
    const P = mixQ(grow(pp.q, pp.c, 1.03), rectAt(pp.c, ...SIZE.paper), f);
    items.paper.style.transform = quadMatrix(...SIZE.paper, P);
    items.paper.style.opacity = ink; items.paper.style.visibility = ink > .01 ? 'visible' : 'hidden';
    items.paper.style.setProperty('--lift', f.toFixed(3));
    matte = ['paper', ink * (1 - ss(0, .22, f))];
    // 지면이 화면을 채워 가면 무대(인물 · 하늘)는 종이 빛으로 물러난다
    filmCanvas.style.opacity = (1 - ss(.35, 1, f)).toFixed(3);
  } else if (!cardMode) place(items.paper, anchor('paper', S.J), ...SIZE.paper, filmed ? 0 : S.fx.paper);
  // 쪽지 자리: 추적한 네 모서리(예전 3막) 또는 파트너 영상에서 잰 가운데(작을 땐 어차피 숨김)
  let cp = !cardMode && filmed && S.fx.slab > .01 && film.prop(vh, 'card');
  if (cp) {
    // 손에 든 작은 쪽지일 땐 영상의 빈 쪽지 그대로 두고, 카메라가 거의 다 다가가면 쪽지에서 서명판이 떠오른다
    const f = ss(0, 1, S.fx.sflat), o = S.fx.slab * ss(.12, .85, f);   // 판 위에서 천천히 떠오르며 짙어진다(팝업 없이)
    const P = mixQ(grow(cp.q, cp.c, 1.06), rectAt(cp.c, ...SIZE.slab), f);
    items.slab.style.transform = quadMatrix(...SIZE.slab, P);
    items.slab.style.opacity = o; items.slab.style.visibility = o > .01 ? 'visible' : 'hidden';
    items.slab.inert = !(f > .9 && o > .5);
    items.slab.style.setProperty('--lift', f.toFixed(3));
    items.slab.style.setProperty('--ink', 1);
    matte = ['card', o * (1 - ss(0, .3, f))];
    lastCard = cp.c;
  } else if (cardMode) {
  } else if (filmed && lastCard) {
    // 쪽지가 없는 막(파트너 영상)으로 넘어가면 서명판은 떠오른 자리에서 접혀 사라진다
    const f = ss(0, 1, S.fx.sflat), o = S.fx.slab * ss(.12, .85, f);
    items.slab.style.transform = quadMatrix(...SIZE.slab, rectAt(lastCard, ...SIZE.slab));
    items.slab.style.opacity = o; items.slab.style.visibility = o > .01 ? 'visible' : 'hidden';
    items.slab.inert = !(f > .9 && o > .5);
  } else { place(items.slab, anchor('slab', S.J), ...SIZE.slab, filmed ? 0 : S.fx.slab); items.slab.style.setProperty('--lift', 1); items.slab.style.setProperty('--ink', 1); }
  if (matte) film.drawMatte(topCtx, matte[0], m, DPR, matte[1]); else if (topCanvas._d) { topCtx.setTransform(1, 0, 0, 1, 0, 0); topCtx.clearRect(0, 0, topCanvas.width, topCanvas.height); }
  topCanvas._d = !!matte;
  place(items.roll, { x: 0, y: 308 }, ...SIZE.roll, vh > 1300 && vh < 1660 ? 1 : 0);
  place(items.roll2, { x: PANEL, y: 308 }, ...SIZE.roll, vh > 1300 && vh < 1660 ? 1 : 0);
  // 끌로 한 줄씩 새겨 들어간다(크레딧 동안 스크롤만큼)
  rollLines.forEach((l, i) => { const a = CUT_AT[i]; l.style.setProperty('--cut', ss(a, a + 30, vh).toFixed(3)); });   // 카메라가 그 단에 닿을 때 새긴다
  place(items.flare, { x: 190, y: -760 }, 0, 0, S.fx.flare);
  // 망점으로 인쇄된 신문이 다가갈수록 화면처럼 메워진다
  if (!cardMode && !pp && S.fx.pdot < .995) {
    const g = 40 + S.fx.pdot * 40;
    items.paper.style.maskImage = items.paper.style.webkitMaskImage = `radial-gradient(circle, #000 ${g.toFixed(1)}%, transparent ${(g + 9).toFixed(1)}%)`;
    items.paper.style.maskSize = items.paper.style.webkitMaskSize = '3.2px 3.2px';
  } else items.paper.style.maskImage = items.paper.style.webkitMaskImage = 'none';
  // 화면 크기와 상관없이 같은 크기로 보이는 손잡이 · 별 (세계 단위 → 화면 px 환산)
  const px = 1 / (S.z * fit);
  sel.style.opacity = S.fx.sel; sel.style.display = S.fx.sel > .01 ? '' : 'none';
  if (S.fx.sel > .01) {
    selHandles.forEach(h => { const x = +h.dataset.x || (h.dataset.x = h.getAttribute('x')), y = +h.dataset.y || (h.dataset.y = h.getAttribute('y')); h.setAttribute('x', +h.dataset.x - 3.5 * px); h.setAttribute('y', +h.dataset.y - 3.5 * px); h.setAttribute('width', 7 * px); h.setAttribute('height', 7 * px); });
    selLabel.setAttribute('font-size', 10.5 * px); selLabel.setAttribute('y', BOX.y - 10 * px);
  }
  lead.style.opacity = S.fx.dlg; lead.style.display = S.fx.dlg > .01 ? '' : 'none';
  if (S.fx.dlg > .01) {
    // 입에서 대사판 아래 모서리로: 말이 어디서 나왔는지만 가리키는 가는 선
    const mouth = { x: head.x - 22, y: head.y + 24 }, c = { x: dlgAt.x + SIZE.dlg[0] / 2 - 26, y: dlgAt.y + SIZE.dlg[1] / 2 + 6 };
    const from = { x: mouth.x + (c.x - mouth.x) * .16, y: mouth.y + (c.y - mouth.y) * .16 };
    leadPath.setAttribute('d', `M${from.x},${from.y}L${c.x},${c.y}`);
    leadDot.setAttribute('transform', `translate(${c.x - 6 * px} ${c.y - 6 * px}) scale(${(12 * px / 24).toFixed(4)})`);
    leadDot.setAttribute('d', STARP);
  }
  cons.style.display = S.fx.cons > .001 ? '' : 'none';
  if (S.fx.cons > .001) {
    consLines.forEach((l, i) => { const t = Math.max(0, Math.min(1, S.fx.cons * MARK_EDGES.length - i)); l.style.strokeDashoffset = 1 - t; });
    consStars.forEach((st, i) => { const x = +st.dataset.x, y = +st.dataset.y, z = (i ? 11 : 16) * px; st.setAttribute('transform', `translate(${x - z / 2} ${y - z / 2}) scale(${(z / 24).toFixed(4)})`); st.style.opacity = Math.min(1, S.fx.cons * 3); });
  }

  // 갈라지는 지면
  if (S.fx.split >= 0 && S.fx.split < 1) {
    if (split.hidden) {
      // 컷 순간의 지면을 그대로 본떠 두 쪽으로 나눈다
      for (const h of split.children) {
        const c = dockPaper.cloneNode(true);
        c.removeAttribute('id'); c.classList.add('show'); c.style.opacity = 1; c.style.visibility = 'visible';
        c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
        h.replaceChildren(c);
      }
      split.hidden = false;
    }
    const k = S.fx.split;
    split.children[0].style.transform = `translate(${-k * 58}vw, ${k * 6}vh) rotate(${-k * 7}deg)`;
    split.children[1].style.transform = `translate(${k * 58}vw, ${k * 6}vh) rotate(${k * 7}deg)`;
  } else if (!split.hidden) { split.hidden = true; for (const h of split.children) h.replaceChildren(); }

  // 기둥 와이프 → 뼈대
  const wipe = S.fx.wipe;
  if (wipe <= 0) { plateB.hidden = true; col.hidden = true; }
  else if (wipe < 1) {
    plateB.hidden = false; col.hidden = false;
    const x = lerp(-.25 * W, 1.25 * W, wipe);
    col.style.transform = `translateX(${x}px)`;
    plateB.style.clipPath = `inset(0 ${Math.max(0, W - x)}px 0 0)`;
    dither(1);
  } else {
    col.hidden = true; plateB.style.clipPath = 'none';
    plateB.hidden = S.fx.dith <= .01;
    if (!plateB.hidden) dither(S.fx.dith);
  }

  // 조리개(커튼콜)
  const R = S.fx.iris * S.z * fit;
  if (R < Math.hypot(W, H)) {
    const c = toScreen(m, { x: 0, y: -480 });
    iris.hidden = false;
    iris.style.background = `radial-gradient(circle ${R.toFixed(1)}px at ${c.x.toFixed(1)}px ${c.y.toFixed(1)}px, transparent ${(R - 1).toFixed(1)}px, var(--press) ${R.toFixed(1)}px)`;
  } else iris.hidden = true;

  // 빠른 카메라 이동에 약한 모션 블러, 안내선은 잠시 물러난다
  if (prev && !REDUCED) {
    // 커튼콜로 크게 빠지는 구간은 화면 전체에 blur를 걸면 장이 끊긴다 → 그 구간은 블러 없이
    const v = vh > 1560 ? 0 : Math.hypot(S.cx - prev.cx, S.cy - prev.cy) * S.z * fit + Math.abs(Math.log(S.z / prev.z)) * W * .35 + Math.abs(S.r - prev.r) * 14;
    const b = Math.min(2.4, Math.max(0, v - 6) * .045);
    plateA.style.filter = plateB.style.filter = b > .15 ? `blur(${b.toFixed(2)}px)` : 'none';
    ov.classList.toggle('moving', v > 9);
  }
  prev = S;

  // 글: 들어올 땐 줄마다 아래에서, 나갈 땐 위로
  for (const c of copies) {
    if (c.classList.contains('dock')) {
      // 데모 판은 스크롤에 맞춰 서서히(팝업처럼 시간으로 튀지 않게)
      const a = +c.dataset.from, b = +c.dataset.to, o = ss(a - 12, a + 9, vh) * (1 - ss(b - 6, b + 14, vh));   // 그다음 데모 판이 스며 나온다(겹쳐 비치지 않게 차례로)
      c.style.transition = 'none'; c.style.opacity = o.toFixed(3); c.style.visibility = o > .01 ? 'visible' : 'hidden';
      c.classList.toggle('show', o > .5); c.inert = o < .6;
      continue;
    }
    const on = vh >= +c.dataset.from && vh <= +c.dataset.to;
    if (c.classList.contains('show') === on) continue;
    c.classList.toggle('show', on);
    if (c.classList.contains('dock')) { c.inert = !on; continue; }
    clearTimeout(c._t);
    if (!on && !REDUCED) { c.classList.add('out'); c._t = setTimeout(() => c.classList.remove('out'), 650); }
    else c.classList.remove('out');
  }
  let act = 0;
  while (act < ACT_AT.length - 1 && vh >= ACT_AT[act + 1]) act++;
  if (act !== lastAct) {
    lastAct = act;
    railLinks.forEach((a, i) => { a.classList.toggle('on', i === act); a.toggleAttribute('aria-current', i === act); });
  }
  // 아래 안내선을 따라 차오르는 진행선
  const a0 = ACT_AT[act], a1 = ACT_AT[act + 1] ?? END;
  const prog = Math.max(0, Math.min(1, (vh - a0) / (a1 - a0)));
  fillLine.style.width = `${prog * (V2 - COLB) * W}px`;
  // 밝은 판(지면)에서는 틀과 글을 먹색으로
  const light = dockPaper.classList.contains('show') || (vh > 505 && vh < 586);
  ov.classList.toggle('on-light', light);
  document.body.classList.toggle('on-light-text', light);
  // 커튼콜: 조리개 둘레에 세로 틀과 네 별
  const fin = vh > 1690;
  ov.classList.toggle('final', fin);
  ftFrame.classList.toggle('on', fin);
  if (fin) {
    const c = toScreen(m, { x: 0, y: -480 }), w = Math.min(R * 2.02, W * .92), h = Math.min(R * 2.08, H * .72);   // 다섯 명이 다 들어오는 너비
    const x = c.x - w / 2, y = c.y - h * .46;
    ftRect.setAttribute('x', 0); ftRect.setAttribute('y', 0); ftRect.setAttribute('width', w); ftRect.setAttribute('height', h);
    ftBox.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([px, py], i) => { ftStars[i].style.left = `${px}px`; ftStars[i].style.top = `${py}px`; });
  }
}

const copies = [...document.querySelectorAll('.copy, .dock')];
copies.forEach(c => { if (c.classList.contains('dock')) c.inert = true; });
const ov = $('#ov'), fillLine = $('#fill'), railLinks = [...document.querySelectorAll('.rail a')];
const ftFrame = $('#ftFrame'), ftBox = ftFrame.querySelector('.ft-box'), ftRect = ftBox.querySelector('rect'), ftStars = [...ftFrame.querySelectorAll('.ft-st')];
const V2 = .856, COLB = .237;
let lastAct = -1;

// ── 스크롤 ──────────────────────────────
let sy = scrollY, raf = 0;
function vhOf(y) {
  const v = y / H * 100;
  if (!REDUCED) return v;
  // 동작 줄이기: 막 사이 이동 없이 그 막의 정지 장면으로 바로
  let a = 0;
  while (a < ACT_AT.length - 1 && v >= ACT_AT[a + 1]) a++;
  return HOLD[a];
}
function tick(now) {
  raf = 0;
  const target = scrollY;
  const k = REDUCED ? 1 : 1 - Math.exp(-(now - (tick.last || now)) / 1000 * 6.5);
  tick.last = now;
  sy += (target - sy) * Math.min(1, k || 1);
  if (Math.abs(target - sy) < .3) sy = target;
  render(vhOf(sy));
  if (sy !== target) raf = requestAnimationFrame(tick);
}
const kick = () => { if (!raf) { tick.last = performance.now(); raf = requestAnimationFrame(tick); } };
addEventListener('scroll', kick, { passive: true });
addEventListener('film-frame', kick);   // 영상 장이 늦게 도착해도 멈춘 화면에 반영
addEventListener('resize', () => { measure(); lastDither = -1; render(vhOf(sy)); });

const menuBtn = document.querySelector('.ov .menu');
function setNav(open) {
  document.body.classList.toggle('nav-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? '막 목록 닫기' : '막 목록 열기');
  if (open) document.querySelector('.nvm a')?.focus({ preventScroll: true });
}
menuBtn.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('nav-open')) { setNav(false); menuBtn.focus(); } });
document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  setNav(false);
  scrollTo({ top: HOLD[+a.dataset.go] * H / 100, behavior: REDUCED ? 'auto' : 'smooth' });
}));

// 글을 줄 · 낱자로 나눠 둔다(줄은 가려진 채 올라오고, 본문은 한 자씩 켜진다)
document.querySelectorAll('.ln').forEach((ln, i, all) => {
  const sib = [...ln.parentElement.querySelectorAll('.ln')];
  ln.firstElementChild.style.setProperty('--i', sib.indexOf(ln));
});
document.querySelectorAll('.stand').forEach(p => {
  const text = p.textContent; let n = 0;
  p.setAttribute('aria-label', text);
  p.innerHTML = text.split(' ').map(w => `<span class="wd" aria-hidden="true">${[...w].map(ch => `<span class="ch" style="--c:${n++}">${ch}</span>`).join('')}</span>`).join(' ');
});

// 데모 판에 pear 카드의 안쪽 테와 두 별
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0Q13.1 10.9 24 12Q13.1 13.1 12 24Q10.9 13.1 0 12Q10.9 10.9 12 0Z"/></svg>';
document.querySelectorAll('.dlg, .np-wrap, .sig, .scn, .plan-demo').forEach(card => {
  card.insertAdjacentHTML('beforeend', `<i class="card-frame" aria-hidden="true"></i><i class="card-star a" aria-hidden="true" style="left:0;top:0">${STAR}</i><i class="card-star b" aria-hidden="true" style="left:100%;top:100%">${STAR}</i>`);
  if (card.closest('.dock-paper')) card.classList.add('on-paper');
});

// 필름 결 한 장
{
  const c = document.createElement('canvas'); c.width = c.height = 220;
  const g = c.getContext('2d'), img = g.createImageData(220, 220);
  for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  document.querySelector('.grain').style.backgroundImage = `url(${c.toDataURL()})`;
}
requestAnimationFrame(() => ov.classList.add('go'));
(document.fonts?.ready ?? Promise.resolve()).then(() => setTimeout(() => $('#bootNote').classList.add('off'), 1400));

measure();
sy = scrollY;
render(vhOf(sy));
// 데모는 첫 화면을 그린 뒤 불러온다
const LOAD = { dialogue: () => import('./demos/dialogue.js'), paper: () => import('./demos/paper.js'), sign: () => import('./demos/sign.js'), scene: () => import('./demos/scene.js') };
const mountAll = () => document.querySelectorAll('[data-demo]').forEach(box => LOAD[box.dataset.demo]?.().then(m => m.mount(box)).catch(e => console.error(e)));
(window.requestIdleCallback || (f => setTimeout(f, 300)))(mountAll);
window.__stage = { render, stateAt, K, HOLD };
