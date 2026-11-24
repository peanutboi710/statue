// 1막 데모: 판결 체험 무대(stage.js)를 줄여 다시 짠 대사 장면.
// 한 줄마다 누가 말하는지 · 어떤 자세인지 · 어느 쪽에 서는지가 대본 한 칸에 들어 있고, 무대는 그 칸만 읽어 바꾼다.
import { reducedMotion } from '../nlnb/utils/motion.js';

const CH = (file) => `assets/char/${file}.webp`;
const CAST = {
  naero: { name: '내로', side: 'left', pose: { neutral: 'naero_idle-neutral', happy: 'naero_idle-happy', think: 'naero_idle-thinking', surprised: 'naero_idle-surprised' } },
  nambul: { name: '남불', side: 'right', pose: { neutral: 'nambul_idle-neutral', happy: 'nambul_idle-happy', think: 'nambul_idle-thinking', surprised: 'nambul_idle-surprised' } },
  roul: { name: 'AI 판사 로울', side: 'right', pose: { neutral: 'law-scale_idle', deliver: 'law-scale_deliver' } },
};
// 대본: [누가, 자세, 대사]
const SCRIPT = [
  ['naero', 'happy', '어서 오세요. 여기는 판결 체험 무대예요. 저는 내로, 옆은 남불이에요.'],
  ['nambul', 'neutral', '화면이 막을 고르면, 우리는 대본을 한 칸씩 읽으면서 자세와 자리를 바꿔요.'],
  ['naero', 'think', '말하지 않는 쪽은 살짝 어두워져요. 지금 누가 말하는지 바로 보이게요.'],
  ['roul', 'deliver', '판결 화면에서는 이름 대신 "AI 판사"로 불립니다. 직책은 이름표 옆에 붙지요.'],
  ['nambul', 'surprised', '입력칸에 글을 쓰는 동안에는 무대가 키를 가로채지 않아요. 다 쓰면 Enter로 넘겨요.'],
];
const TYPE_MS = 26; // 한 글자

export function mount(box) {
  const stage = box.querySelector('.dlg');
  const slots = { left: stage.querySelector('[data-slot="left"]'), right: stage.querySelector('[data-slot="right"]') };
  const nameEl = stage.querySelector('.dlg-name');
  const lineEl = stage.querySelector('.dlg-line');
  const onStage = { left: null, right: null };
  let at = -1;
  let typing = null;

  // 처음 서는 사람: 왼쪽 내로, 오른쪽 남불
  put('naero', 'neutral');
  put('nambul', 'neutral');

  function put(who, pose) {
    const c = CAST[who];
    const img = slots[c.side];
    const src = CH(c.pose[pose] ?? Object.values(c.pose)[0]);
    if (onStage[c.side] !== who) img.alt = '';
    onStage[c.side] = who;
    if (!img.src.endsWith(src)) img.src = src;
    img.hidden = false;
  }

  function show(i) {
    const [who, pose, text] = SCRIPT[i];
    put(who, pose);
    const side = CAST[who].side;
    slots.left.classList.toggle('off', side !== 'left');
    slots.right.classList.toggle('off', side !== 'right');
    nameEl.textContent = CAST[who].name;
    type(text);
  }

  function type(text) {
    clearInterval(typing);
    if (reducedMotion()) { lineEl.textContent = text; typing = null; return; }
    let n = 0;
    lineEl.textContent = '';
    typing = setInterval(() => {
      n += 1;
      lineEl.textContent = text.slice(0, n);
      if (n >= text.length) { clearInterval(typing); typing = null; }
    }, TYPE_MS);
  }

  function next() {
    if (typing) { // 쓰는 중이면 먼저 한 줄을 다 보여 준다(건너뛰기)
      clearInterval(typing);
      typing = null;
      lineEl.textContent = SCRIPT[at][2];
      return;
    }
    at = (at + 1) % SCRIPT.length;
    show(at);
  }

  stage.addEventListener('click', next);
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
  });
  next();
}
