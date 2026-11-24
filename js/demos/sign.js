// 3막 데모: 원본 서명 생성기(utils/signature.js)와 서명 그림(components/signatureInk.js)을 그대로 쓴다.
// 이름을 적는 동안에는 흐린 미리보기, 확정하면 앞에서부터 이어 쓰는 연출. 같은 이름은 늘 같은 서명이다.
import { signatureSvg, writeSignature } from '../nlnb/components/signatureInk.js';

const FALLBACK = 'HelloWorld';

export function mount(box) {
  const form = box.querySelector('form');
  const input = form.querySelector('input');
  const slot = form.querySelector('.sig-slot');
  const [go, again] = form.querySelectorAll('button');
  const msg = form.querySelector('.sig-msg');
  let done = false;

  const preview = () => {
    if (done) return;
    const name = input.value.trim() || FALLBACK;
    const svg = signatureSvg(name);
    svg.classList.add('pre');
    slot.replaceChildren(svg);
  };
  input.addEventListener('input', preview);
  preview();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (done) return;
    const name = input.value.trim();
    if (!name) {
      msg.textContent = '이름을 적지 않아 기본 이름으로 서명합니다.';
    }
    done = true;
    input.disabled = true;
    go.disabled = true;
    const svg = signatureSvg(name || FALLBACK, { label: `${name || FALLBACK}의 서명`, blank: true });
    slot.replaceChildren(svg);
    await writeSignature(svg);
    msg.textContent = '확정했습니다. 이 판결은 이제 고칠 수 없습니다.';
    again.hidden = false;
    again.focus();
  });

  again.addEventListener('click', () => {
    done = false;
    input.disabled = false;
    go.disabled = false;
    again.hidden = true;
    msg.textContent = '';
    preview();
    input.focus();
  });
}
