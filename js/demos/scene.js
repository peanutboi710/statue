// 4막 데모: 메인 책상의 장면 전환을 원본 그대로 부른다.
// 커피잔 → coffeeDive.flyCoffee, 노트북 → laptopBoot.bootLaptop, 포스트잇 → peelOff.
// 원본 메인 화면처럼, 연출이 꺼져 있으면 전환 연출 없이 바로 화면만 바꾼다.
import { flyCoffee } from '../nlnb/utils/coffeeDive.js';
import { bootLaptop } from '../nlnb/utils/laptopBoot.js';
import { peelOff } from '../nlnb/utils/peelOff.js';
import { reducedMotion, motionSwitchOn, setMotionSwitch } from '../nlnb/utils/motion.js';

const VIEWS = {
  desk: ['책상', '물건을 눌러 장면을 바꿔 보세요'],
  my: ['마이페이지', '커피잔이 날아와 서는 동안 화면이 바뀌었습니다'],
  community: ['커뮤니티', '눈을 감았다 뜨는 사이 글 목록을 불러왔습니다'],
};

export function mount(box) {
  const view = box.querySelector('.scn-view');
  const row = box.querySelector('.scn-row');
  const toggle = box.querySelector('.scn-switch input');
  toggle.checked = motionSwitchOn();
  toggle.addEventListener('change', () => setMotionSwitch(toggle.checked));

  const show = (name) => {
    view.dataset.view = name;
    const [title, sub] = VIEWS[name];
    view.innerHTML = `<p class="scn-title">${title}</p><p class="scn-sub">${sub}</p>${name === 'desk' ? '' : '<button type="button" class="scn-back">책상으로</button>'}`;
    view.querySelector('.scn-back')?.addEventListener('click', () => show('desk'));
  };

  row.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-go]');
    if (!b) return;
    const go = b.dataset.go;
    if (go === 'coffee') {
      if (reducedMotion()) show('my');
      else flyCoffee(() => show('my'), view);
    }
    if (go === 'laptop') {
      if (reducedMotion()) show('community');
      else bootLaptop(() => new Promise((done) => { show('community'); setTimeout(done, 300); }));
    }
    if (go === 'peel') {
      peelOff(b, { from: 'rotate(-3deg)', to: 'translate(60px, -140px) rotate(24deg)', focusTarget: () => row.querySelector('[data-go="coffee"]') })
        .then(() => setTimeout(() => row.append(postit()), 900)); // 데모라 다시 붙인다
    }
  });

  function postit() {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'postit';
    b.dataset.go = 'peel';
    b.textContent = '다시 붙었어요';
    return b;
  }
}
