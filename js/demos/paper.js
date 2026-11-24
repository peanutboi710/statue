// 2막 데모: 사건 목록 신문. 면을 고르면 원본 turnPage(utils/pageTurn.js)가 지금 지면을 본떠 한 장 넘긴다.
// 기사 문구는 내Law남불 목(mock) 데이터에서 가져왔다.
import { turnPage } from '../nlnb/utils/pageTurn.js';

const FACES = [
  { tab: '1면', kicker: '머리기사', h: '빌린 돈 갚으라며 찾아온 지인, 자택서 숨져', t: '오래 이어진 변제 갈등이 말다툼으로 번졌다. 독자는 사건 개요만 읽고 먼저 판단한 뒤, 증거를 보며 판결을 고친다.', img: 'case-1', side: [['사기 면', '입금 확인 뒤 연락 끊겨…중고거래 대금만 챙겼다'], ['상해 면', '층간소음 갈등, 아파트 복도서 주먹다짐으로']] },
  { tab: '사기', kicker: '사기 면', h: '입금 확인 뒤 연락 끊겨…중고거래 대금만 챙겼다', t: '수십만 원대 전자기기 판매글을 올리고 물건은 보내지 않았다. 같은 면에 동업 출자금, 투자 모임 회비 사건이 이어진다.', img: 'case-2', side: [['함께 실린 기사', '"함께 차리자"던 음식점, 출자금은 개인 계좌로'], ['', '투자 모임 회비 수천만 원, 운영자가 개인 용도로']] },
  { tab: '상해', kicker: '상해 면', h: '층간소음 갈등, 아파트 복도서 주먹다짐으로', t: '수개월 이어진 이웃 간 마찰이 몸싸움으로 끝났다. 면마다 실을 사건 수 · 빈칸 채움 · 본문 모양이 면 정의 파일 한 곳에 있다.', img: 'case-3', side: [['함께 실린 기사', '주점 옆자리 시비가 폭행으로…상대 중상'], ['', '업무 분담 놓고 언쟁…사무실서 동료 폭행']] },
  { tab: '색인', kicker: '색인', h: '오늘 실린 사건 전체', t: '', list: ['빌린 돈 갚으라며 찾아온 지인, 자택서 숨져', '입금 확인 뒤 연락 끊겨…중고거래 대금만 챙겼다', '"함께 차리자"던 음식점, 출자금은 개인 계좌로', '층간소음 갈등, 아파트 복도서 주먹다짐으로', '주점 옆자리 시비가 폭행으로…상대 중상', '밤길 귀가하던 행인 위협…현금 · 휴대전화 빼앗겨'] },
];
const TURN_MS = 620; // 원본 사건 목록의 면 넘기기와 비슷한 빠르기

export function mount(box) {
  const sheet = box.querySelector('.np');
  const tabs = box.querySelector('.np-tabs');
  let at = 0;
  let busy = false;

  FACES.forEach((f, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.role = 'tab';
    b.textContent = f.tab;
    b.addEventListener('click', () => go(i));
    tabs.append(b);
  });
  tabs.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(Math.min(FACES.length - 1, at + 1));
    if (e.key === 'ArrowLeft') go(Math.max(0, at - 1));
  });
  draw(0);

  function draw(i) {
    at = i;
    const f = FACES[i];
    [...tabs.children].forEach((b, k) => { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    const head = `<header class="np-head"><span class="np-title">판결 체험 신문</span><span class="np-date">${f.kicker}<br>제${i + 1}면</span></header>`;
    if (f.list) {
      sheet.innerHTML = `${head}<h3 class="np-h">${f.h}</h3><ol class="np-t">${f.list.map((x) => `<li>${x}</li>`).join('')}</ol>`;
      return;
    }
    sheet.innerHTML = `${head}<div class="np-body"><figure style="margin:0"><img src="assets/cases/${f.img}-origin.webp" alt=""><figcaption class="np-cap">재연 사진</figcaption></figure>
      <div><h3 class="np-h">${f.h}</h3><p class="np-t">${f.t}</p></div></div>
      <div class="np-side">${f.side.map(([k, h]) => `<div><small>${k || '&nbsp;'}</small><b>${h}</b></div>`).join('')}</div>`;
  }

  function go(i) {
    if (busy || i === at) return;
    busy = true;
    const back = i < at;
    // 넘기는 종이가 신문 높이 밖으로 나가지 않게 덮개의 위아래를 자른다(이 페이지에서만 쓰는 변수)
    const r = sheet.getBoundingClientRect();
    document.documentElement.style.setProperty('--pt-top', `${Math.max(0, r.top)}px`);
    document.documentElement.style.setProperty('--pt-bottom', `${Math.max(0, innerHeight - r.bottom)}px`);
    turnPage(sheet, { scopeClass: 'np-scope', duration: TURN_MS, back, draw: () => draw(i) })
      .finally(() => { busy = false; tabs.children[i].focus({ preventScroll: true }); });
  }
}
