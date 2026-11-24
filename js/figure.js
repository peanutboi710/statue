// 조각상 배우: 관절 각도로 자세를 정하고, 그 자세를 대리석(가) 또는 뼈대(나)로 그린다.
// 세계 좌표: 받침대 윗면이 y=0, 위가 -y. 각도는 도(°), 0이 아래, 90이 화면 오른쪽, 180이 위.
const R = Math.PI / 180;
const D = a => ({ x: Math.sin(a * R), y: Math.cos(a * R) });
const add = (p, d, k) => ({ x: p.x + d.x * k, y: p.y + d.y * k });
const mix = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const f = n => Math.round(n * 10) / 10;

export const POSES = {
  // 서막: 무게를 한 다리에 싣고 선 자세
  stand: { px: 0, py: -520, spine: 3, neck: -4, turn: .3, lS: -12, lE: -10, lW: 0, rS: 8, rE: 18, rW: 0, lH: 5, lK: -3, lF: -80, rH: -9, rK: 12, rF: 85, lG: .4, rG: .4 },
  // 1막: 고개를 들고 팔을 뻗어 대사를 친다
  speak: { px: 0, py: -520, spine: 3, neck: 8, turn: -.95, lS: -100, lE: -28, lW: -8, rS: 12, rE: 16, rW: 0, lH: 5, lK: -3, lF: -80, rH: -9, rK: 12, rF: 85, lG: 0, rG: .4 },
  // 2막: 종이 한 장을 들어 본다
  hold: { px: 0, py: -520, spine: -2, neck: -8, turn: -.6, lS: -26, lE: -112, lW: 22, rS: 10, rE: 12, rW: 0, lH: 5, lK: -3, lF: -80, rH: -9, rK: 12, rF: 85, lG: .85, rG: .4 },
  // 3막: 왼손에 판, 오른손에 철필
  write: { px: 0, py: -520, spine: -6, neck: -20, turn: -.75, lS: -58, lE: -58, lW: 0, rS: -22, rE: -128, rW: -20, lH: 5, lK: -3, lF: -80, rH: -9, rK: 12, rF: 85, lG: .75, rG: .95 },
  // 4막: 받침대 끝에 걸터앉아 판을 읽는다
  sit: { px: 30, py: -72, spine: -6, neck: 18, turn: .85, lS: 22, lE: 72, lW: 0, rS: -4, rE: 38, rW: 0, lH: 88, lK: -80, lF: 12, rH: 80, rK: -72, rF: 18, lG: .75, rG: .4 },
  // 커튼콜: 인사
  bow: { px: 0, py: -520, spine: -38, neck: -16, turn: -1, lS: -14, lE: -48, lW: 0, rS: 34, rE: 18, rW: 0, lH: 4, lK: 0, lF: -92, rH: -4, rK: 2, rF: -84, lG: .5, rG: .3 },
};

export function lerpPose(a, b, t) {
  const o = {};
  for (const k in a) o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
}

export function solve(p) {
  const P = { x: p.px, y: p.py };
  const up = { x: Math.sin(p.spine * R), y: -Math.cos(p.spine * R) };
  const side = { x: -up.y, y: up.x };
  const at = (s, w) => ({ x: P.x + up.x * s + side.x * w, y: P.y + up.y * s + side.y * w });
  const neck = at(335, 0);
  const hu = { x: Math.sin((p.spine + p.neck) * R), y: -Math.cos((p.spine + p.neck) * R) };
  const head = add(neck, hu, 92);
  const arm = (sh, S, E, W) => { const el = add(sh, D(S), 190), wr = add(el, D(S + E), 165), hd = add(wr, D(S + E + W), 60); return { sh, el, wr, hd, dir: S + E + W }; };
  const leg = (hp, H, K, F) => { const kn = add(hp, D(H), 262), an = add(kn, D(H + K), 250), ft = add(an, D(F), 72); return { hp, kn, an, ft }; };
  return {
    p, P, up, side, at, neck, head, tilt: p.spine + p.neck,
    l: arm(at(318, -92), p.lS, p.lE, p.lW), r: arm(at(318, 92), p.rS, p.rE, p.rW),
    lL: leg(at(0, -52), p.lH, p.lK, p.lF), rL: leg(at(0, 52), p.rH, p.rK, p.rF),
  };
}

// 끝이 둥근 원뿔대(팔다리)
function cap(a, b, r1, r2) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return `M${f(a.x + nx * r1)},${f(a.y + ny * r1)}L${f(b.x + nx * r2)},${f(b.y + ny * r2)}A${r2},${r2} 0 0 0 ${f(b.x - nx * r2)},${f(b.y - ny * r2)}L${f(a.x - nx * r1)},${f(a.y - ny * r1)}A${r1},${r1} 0 0 0 ${f(a.x + nx * r1)},${f(a.y + ny * r1)}Z`;
}

function smooth(pts, closed = true) {
  const n = pts.length;
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f(p1.x + (p2.x - p0.x) / 6)},${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)},${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)},${f(p2.y)}`;
  }
  return d + (closed ? 'Z' : '');
}

function hand(a, grip, left) {
  let d = cap(a.wr, a.hd, 21, 18);
  for (let i = 0; i < 4; i++) {
    const ang = a.dir + (i - 1.5) * 10 * (1 - grip * .5);
    const len = 44 - Math.abs(i - 1.3) * 5;
    const k1 = add(a.hd, D(ang), len * .55);
    const k2 = add(k1, D(ang + (left ? -1 : 1) * grip * 95), len * .5 * (1 - grip * .25));
    d += cap(mix(a.wr, a.hd, .8), k1, 7, 6.5) + cap(k1, k2, 6.5, 6);
  }
  const th = add(mix(a.wr, a.hd, .25), D(a.dir + (left ? 55 : -55)), 36);
  return d + cap(mix(a.wr, a.hd, .2), th, 9, 7);
}

const SVGNS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.appendChild(e); return e; };

// 대리석 조각상
// 프레스코 인물: 살갗 · 흰 키톤 · 주홍 히마티온 · 짙은 머리. 같은 모양을 붓결 무늬로 한 번 더 덮는다
const ROLE = { skirt: 'chiton', lLeg: 'skin', rLeg: 'skin', lArm: 'skin', rArm: 'skin', neck: 'skin', head: 'skin', torso: 'chiton', drape: 'himation', hair: 'hair', stylus: 'tool' };
export function marble(g) {
  const parts = {}, twins = {};
  const order = ['lLeg', 'rLeg', 'skirt', 'torso', 'drape', 'folds', 'lArm', 'neck', 'head', 'hair', 'face', 'rArm', 'stylus'];
  for (const k of order) {
    const line = k === 'folds' || k === 'face';
    parts[k] = el('path', line
      ? { class: k === 'folds' ? 'st-line st-fold' : 'st-line', fill: 'none', 'vector-effect': 'non-scaling-stroke' }
      : { class: `st-${ROLE[k]}`, 'vector-effect': 'non-scaling-stroke' }, g);
    if (!line && k !== 'stylus') twins[k] = el('path', { class: 'st-tex' }, g);
  }
  const copyTex = () => { for (const k in twins) twins[k].setAttribute('d', parts[k].getAttribute('d') || ''); };
  return function draw(J, opts = {}) {
    const { at, l, r, lL, rL, head, neck, p } = J;
    const legD = L => cap(L.hp, L.kn, 44, 32) + cap(L.kn, L.an, 31, 19) + cap(L.an, L.ft, 17, 12);
    parts.lLeg.setAttribute('d', legD(lL));
    parts.rLeg.setAttribute('d', legD(rL));
    parts.torso.setAttribute('d', smooth([at(-55, 0), at(-38, -66), at(40, -80), at(150, -60), at(250, -82), at(302, -100), at(334, -60), at(342, -24), at(342, 24), at(334, 60), at(302, 100), at(250, 82), at(150, 60), at(40, 80), at(-38, 66)]));
    const armD = A => cap(A.sh, A.el, 34, 26) + cap(A.el, A.wr, 25, 19);
    parts.lArm.setAttribute('d', armD(l) + hand(l, p.lG, true));
    parts.rArm.setAttribute('d', armD(r) + hand(r, p.rG, false));
    parts.neck.setAttribute('d', cap(neck, mix(neck, head, .7), 30, 27));
    // 히마티온: 왼어깨에서 대각선으로 오른 허리, 무릎 아래까지
    // 흰 키톤: 허리에서 무릎 아래까지
    const down = { x: 0, y: 1 };
    const kR = add(mix(rL.hp, rL.kn, 1.08), J.side, 34), kL = add(mix(lL.hp, lL.kn, 1.08), J.side, -34);
    const kM = add(mix(lL.kn, rL.kn, .5), down, 58);
    parts.skirt.setAttribute('d', smooth([at(80, -78), at(80, 78), at(-20, 102), add(mix(rL.hp, rL.kn, .5), J.side, 48), kR, kM, kL, add(mix(lL.hp, lL.kn, .5), J.side, -48), at(-20, -102)]));
    // 주홍 히마티온: 왼어깨에서 오른 허리로 건너는 띠, 오른쪽으로 무릎까지 늘어진다
    const fallTop = add(at(40, 92), J.side, 6), fallEnd = add(mix(rL.hp, rL.kn, .82), J.side, 46), fallIn = add(mix(rL.hp, rL.kn, .7), J.side, -4);
    parts.drape.setAttribute('d', smooth([at(326, -84), at(318, -36), at(205, 48), fallTop, fallEnd, add(fallEnd, J.side, -30), fallIn, at(24, 30), at(150, 6), at(262, -70), at(300, -104)]));
    let fd = '';
    for (let i = 0; i < 4; i++) {
      const t = (i + .5) / 4;
      const a = mix(at(296, -76), at(250, -40), t), b = mix(at(60, 70), at(30, 30), t);
      const c = add(mix(a, b, .5), J.side, (i % 2 ? 10 : -8));
      fd += `M${f(a.x)},${f(a.y)}Q${f(c.x)},${f(c.y)} ${f(b.x)},${f(b.y)}`;
    }
    for (let i = 0; i < 4; i++) {
      const t = (i + .5) / 4;
      const a = mix(kL, kR, t), b = mix(at(60, -50), at(60, 50), t);
      fd += `M${f(b.x)},${f(b.y)}Q${f(mix(a, b, .5).x + (i % 2 ? 8 : -6))},${f(mix(a, b, .5).y)} ${f(a.x)},${f(a.y)}`;
    }
    parts.folds.setAttribute('d', fd);
    // 머리: 기울기와 돌린 정도(turn)
    const t = p.turn, a = J.tilt * R, cs = Math.cos(a), sn = Math.sin(a);
    const H = (x, y) => ({ x: head.x + x * cs - y * sn, y: head.y + x * sn + y * cs });
    const xc = t * 36;
    const skull = [];
    for (let i = 0; i < 28; i++) {
      const q = i / 28 * Math.PI * 2, c = Math.cos(q), sq = Math.sin(q);
      // 옆모습이면 앞쪽 아래(턱)가 조금 나온다
      skull.push(H(c * 48 - t * 4 + Math.max(0, c * Math.sign(t || 1)) * Math.max(0, sq) * Math.abs(t) * 10 * Math.sign(t || 1), sq * 62));
    }
    const nose = [H(xc + t * 4 - 3, -14), H(xc + t * 22 + 2 * Math.sign(t || 1) * Math.abs(t), 15), H(xc + t * 4 - 5 * (1 - Math.abs(t)), 21)];
    parts.head.setAttribute('d', smooth(skull) + `M${f(nose[0].x)},${f(nose[0].y)}L${f(nose[1].x)},${f(nose[1].y)}L${f(nose[2].x)},${f(nose[2].y)}Z`);
    let hd = '';
    // 머리카락은 정수리와 뒤통수 쪽으로(얼굴 반대편) 돌아간다
    const from = t >= 0 ? -172 - 62 * t : -172 + 34 * -t, to = t >= 0 ? -8 - 34 * t : -8 + 62 * -t;
    for (let i = 0; i <= 11; i++) {
      const q = (from + (to - from) * i / 11) * R, c = H(Math.cos(q) * 44 - t * 4, Math.sin(q) * 56 - 3);
      hd += `M${f(c.x + 15)},${f(c.y)}A15,15 0 1 0 ${f(c.x - 15)},${f(c.y)}A15,15 0 1 0 ${f(c.x + 15)},${f(c.y)}`;
    }
    parts.hair.setAttribute('d', hd);
    let fc = '';
    for (const s of [-1, 1]) {
      const w = s < 0 ? 1 - Math.max(0, t) * .85 : 1 + Math.min(0, t) * .85;
      if (w < .2) continue;
      const ex = xc - t * 10 + s * 18 * (1 - .45 * Math.abs(t)), e1 = H(ex - 9 * w, -4), e2 = H(ex + 9 * w, -4), ec = H(ex, -9), ed = H(ex, 1);
      fc += `M${f(e1.x)},${f(e1.y)}Q${f(ec.x)},${f(ec.y)} ${f(e2.x)},${f(e2.y)}Q${f(ed.x)},${f(ed.y)} ${f(e1.x)},${f(e1.y)}`;
      const b1 = H(ex - 12 * w, -15), b2 = H(ex + 12 * w, -16), bc = H(ex, -21);
      fc += `M${f(b1.x)},${f(b1.y)}Q${f(bc.x)},${f(bc.y)} ${f(b2.x)},${f(b2.y)}`;
    }
    const mx = xc + t * 6;
    const m1 = H(mx - 10 * (1 - .4 * Math.abs(t)), 35), m2 = H(mx + 10 * (1 - .4 * Math.abs(t)), 35), mc = H(mx, 39);
    fc += `M${f(m1.x)},${f(m1.y)}Q${f(mc.x)},${f(mc.y)} ${f(m2.x)},${f(m2.y)}`;
    if (Math.abs(t) > .3) { const e = H(-t * 30, -4), e2 = H(-t * 30, 18), ec = H(-t * 42, 7); fc += `M${f(e.x)},${f(e.y)}Q${f(ec.x)},${f(ec.y)} ${f(e2.x)},${f(e2.y)}`; }
    parts.face.setAttribute('d', fc);
    parts.stylus.setAttribute('d', opts.stylus ? cap(r.hd, add(r.hd, D(r.dir + 8), 110 * opts.stylus), 4, 1.5) : '');
    copyTex();
  };
}

// 뼈대(설계도): 같은 관절을 선과 점으로
export function armature(g) {
  const bones = el('path', { class: 'bp-bone', fill: 'none', 'vector-effect': 'non-scaling-stroke' }, g);
  const joints = el('path', { class: 'bp-joint', 'vector-effect': 'non-scaling-stroke' }, g);
  const skull = el('path', { class: 'bp-skull', fill: 'none', 'vector-effect': 'non-scaling-stroke' }, g);
  const dims = el('path', { class: 'bp-dim', fill: 'none', 'vector-effect': 'non-scaling-stroke' }, g);
  return function draw(J) {
    const { l, r, lL, rL, P, neck, head } = J;
    const seg = (...ps) => ps.map((q, i) => `${i ? 'L' : 'M'}${f(q.x)},${f(q.y)}`).join('');
    bones.setAttribute('d', seg(P, neck, head) + seg(l.sh, r.sh) + seg(l.sh, l.el, l.wr, l.hd) + seg(r.sh, r.el, r.wr, r.hd) + seg(lL.hp, rL.hp) + seg(lL.hp, lL.kn, lL.an, lL.ft) + seg(rL.hp, rL.kn, rL.an, rL.ft) + seg(J.at(0, 0), neck));
    let jd = '';
    for (const q of [P, neck, l.sh, r.sh, l.el, r.el, l.wr, r.wr, lL.hp, rL.hp, lL.kn, rL.kn, lL.an, rL.an]) jd += `M${f(q.x + 9)},${f(q.y)}A9,9 0 1 0 ${f(q.x - 9)},${f(q.y)}A9,9 0 1 0 ${f(q.x + 9)},${f(q.y)}`;
    joints.setAttribute('d', jd);
    skull.setAttribute('d', `M${f(head.x + 58)},${f(head.y)}A58,66 0 1 0 ${f(head.x - 58)},${f(head.y)}A58,66 0 1 0 ${f(head.x + 58)},${f(head.y)}`);
    const top = head.y - 66, x = Math.min(lL.ft.x, l.hd.x, rL.ft.x) - 140;
    dims.setAttribute('d', `M${f(x)},0V${f(top)}M${f(x - 14)},0h28M${f(x - 14)},${f(top)}h28` + [1, 2, 3, 4, 5, 6, 7].map(i => `M${f(x - 7)},${f(top + (0 - top) * i / 8)}h14`).join(''));
    return { x, top };
  };
}

export { SVGNS, el };
