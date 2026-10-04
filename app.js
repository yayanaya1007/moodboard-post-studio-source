'use strict';
(() => {
  const key = 'moodboard-post-studio-v1';
  const $ = id => document.getElementById(id);
  function updateToday() {
    const now = new Date();
    const dateParts = new Intl.DateTimeFormat('en', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    const part = name => dateParts.find(item => item.type === name).value;
    $('today').dateTime = part('year') + '-' + part('month') + '-' + part('day');
    $('today').textContent = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    }).format(now);
  }
  updateToday();
  setInterval(updateToday, 60000);
  const palettes = [['#51433d', '#c7a18e', '#827663'], ['#343f38', '#a2b49a', '#66765e'], ['#35394d', '#a5a8cd', '#6b7294']];
  let state = { topic: '', category: '뷰티', tone: '친근한 정보형', slides: [], caption: '', hashtags: '' };
  function message(text) { $('status').textContent = text; }
  function valid(value) {
    return value && typeof value.topic === 'string' && value.topic.length <= 300 &&
      ['뷰티', '패션'].includes(value.category) && ['친근한 정보형', '차분한 매거진형', '솔직한 리뷰형'].includes(value.tone) &&
      typeof value.caption === 'string' && value.caption.length <= 2000 && typeof value.hashtags === 'string' && value.hashtags.length <= 500 &&
      Array.isArray(value.slides) && (value.slides.length === 0 || value.slides.length === 5) && value.slides.every(slide =>
        slide && typeof slide.title === 'string' && slide.title.length <= 70 && typeof slide.body === 'string' && slide.body.length <= 160 &&
        ['뷰티', '패션'].includes(slide.category) && Number.isInteger(slide.palette) && slide.palette >= 0 && slide.palette < palettes.length);
  }
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!valid(parsed)) throw new Error('invalid saved draft');
      state = parsed;
      message('이 브라우저에 저장된 내용을 불러왔어요.');
    }
  } catch { message('저장된 내용을 불러오지 못했어요. 새 초안을 만들 수 있지만 자동 저장이 제한될 수 있어요.'); }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { message('자동 저장을 하지 못했어요. 현재 화면은 사용할 수 있지만, 창을 닫기 전에 이미지와 문구를 저장해 주세요.'); }
  }
  function wrap(ctx, text, x, y, width, height) {
    let line = '';
    for (const character of Array.from(text)) {
      if (character === '\n' || (line && ctx.measureText(line + character).width > width)) {
        ctx.fillText(line, x, y); y += height; line = '';
      }
      if (character !== '\n') line += character;
    }
    if (line) { ctx.fillText(line, x, y); y += height; }
    return y;
  }
  function draw(canvas, slide, index) {
    const ctx = canvas.getContext('2d');
    if (!ctx) { message('이 브라우저에서 이미지 미리보기를 만들 수 없어요.'); return; }
    const colors = palettes[slide.palette];
    ctx.clearRect(0, 0, 1080, 1350);
    ctx.fillStyle = colors[0]; ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = colors[1]; ctx.beginPath(); ctx.arc(760, 340, 390, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colors[2]; ctx.beginPath(); ctx.arc(170, 530, 270, 0, Math.PI * 2); ctx.fill();
    const shade = ctx.createLinearGradient(0, 500, 0, 1350);
    shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,.65)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'top'; ctx.font = '600 34px sans-serif';
    ctx.fillText(slide.category + ' · MOODBOARD', 72, 72);
    // Shrink long Korean/emoji text until it fits above the footer.
    let size = 74;
    function lines(text, fontSize) {
      ctx.font = '700 ' + fontSize + 'px sans-serif';
      let count = 1, line = '';
      for (const ch of Array.from(text)) {
        if (ch === '\n' || (line && ctx.measureText(line + ch).width > 936)) { count++; line = ''; }
        if (ch !== '\n') line += ch;
      }
      return count;
    }
    while (size > 24 && (lines(slide.title, size) * size * 1.35 + lines(slide.body, size * .57) * size * .85 + 32) > 580) size -= 2;
    ctx.font = '700 ' + size + 'px sans-serif';
    const end = wrap(ctx, slide.title, 72, 620, 936, size * 1.35);
    ctx.font = '500 ' + Math.floor(size * .57) + 'px sans-serif';
    wrap(ctx, slide.body, 72, end + 32, 936, size * .85);
    ctx.font = '600 29px sans-serif'; ctx.fillText('moodboard. · ' + String(index + 1).padStart(2, '0') + ' / 05', 72, 1270);
    canvas.setAttribute('aria-label', slide.title + ': ' + slide.body);
  }
  function render() {
    $('topic').value = state.topic; $('count').textContent = state.topic.length + '/300';
    $('category').value = state.category; $('tone').value = state.tone;
    $('caption').value = state.caption; $('hashtags').value = state.hashtags;
    $('results').hidden = !state.slides.length; $('empty').hidden = !!state.slides.length;
    $('slides').replaceChildren();
    state.slides.forEach((slide, index) => {
      const article = document.createElement('article'); article.className = 'slide-wrap';
      const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1350; canvas.className = 'slide'; canvas.setAttribute('role', 'img');
      article.append(canvas); draw(canvas, slide, index);
      for (const [field, label, max] of [['title', '제목', 70], ['body', '본문', 160]]) {
        const caption = document.createElement('label'); caption.textContent = (index + 1) + '장 ' + label;
        const input = document.createElement('textarea'); input.value = slide[field]; input.maxLength = max;
        input.addEventListener('input', () => { slide[field] = input.value; draw(canvas, slide, index); save(); });
        caption.append(input); article.append(caption);
      }
      const actions = document.createElement('div'); actions.className = 'slide-actions';
      const change = document.createElement('button'); change.type = 'button'; change.textContent = '다른 배경색';
      change.addEventListener('click', () => { slide.palette = (slide.palette + 1) % palettes.length; draw(canvas, slide, index); save(); });
      const download = document.createElement('button'); download.type = 'button'; download.textContent = '이미지 저장';
      download.addEventListener('click', () => canvas.toBlob(blob => {
        if (!blob) { message('이미지를 저장하지 못했어요.'); return; }
        const link = document.createElement('a'); const url = URL.createObjectURL(blob);
        link.href = url; link.download = 'moodboard-slide-' + (index + 1) + '.png'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); message((index + 1) + '장 이미지 다운로드를 시작했어요.');
      }, 'image/png'));
      actions.append(change, download); article.append(actions); $('slides').append(article);
    });
  }
  $('topic').addEventListener('input', () => { state.topic = $('topic').value; $('count').textContent = state.topic.length + '/300'; save(); });
  for (const name of ['category', 'tone']) $(name).addEventListener('change', () => { state[name] = $(name).value; save(); });
  for (const name of ['caption', 'hashtags']) $(name).addEventListener('input', () => { state[name] = $(name).value; save(); });
  document.querySelectorAll('.examples button').forEach(button => button.addEventListener('click', () => {
    state.topic = button.textContent; $('topic').value = state.topic; $('count').textContent = state.topic.length + '/300'; save();
  }));
  $('create').addEventListener('click', () => {
    const topic = state.topic.trim();
    if (!topic) { message('만들고 싶은 주제를 먼저 적어 주세요.'); $('topic').focus(); return; }
    if (state.slides.length && !window.confirm('현재 초안을 새 기본 문구로 바꿀까요? 수정한 문구는 사라집니다.')) return;
    const ending = state.tone === '차분한 매거진형' ? '자신에게 맞는 기준을 정리합니다.' : state.tone === '솔직한 리뷰형' ? '직접 확인한 점과 아쉬운 점을 적어 보세요.' : '나에게 잘 맞는 기준을 찾아봐요.';
    const bodies = state.category === '뷰티'
      ? ['색감·사용감·사용 목적 중 무엇을 소개할지 적어 주세요.', '사용 환경과 평소 선호하는 색감·질감을 정리해 주세요.', '비교할 항목 두세 가지와 확인한 차이를 적어 주세요.', '직접 사용해 본 느낌을 적어 주세요. 효능을 단정하지 말고 제품 안내를 확인해 주세요.', '확인한 내용을 정리하고 나중에 참고할 기준을 적어 주세요.']
      : ['색감·핏·코디 중 무엇을 소개할지 적어 주세요.', '입을 장소와 평소 즐겨 입는 옷을 정리해 주세요.', '길이·소재·색 조합에서 비교할 기준을 적어 주세요.', '직접 입어 본 느낌과 움직일 때의 편안함을 적어 주세요.', '다시 활용할 조합과 선택 기준을 정리해 주세요.'];
    state.slides = [topic.slice(0, 70), '나의 기준 정하기', '비교할 포인트', '직접 확인하기', '저장하고 활용하기'].map((title, i) => ({ title, body: bodies[i], category: state.category, palette: i % palettes.length }));
    state.caption = topic + '\n\n' + ending + '\n이곳에 직접 확인한 내용과 소개 문구를 적어 주세요.';
    state.hashtags = '#' + state.category + ' #무드보드 #스타일기록 #선택팁 #일상';
    message('기본 초안을 만들었어요. 게시 전 제목·본문·캡션을 직접 수정해 주세요.'); save(); render();
  });
  async function copy(value, input) {
    try { await navigator.clipboard.writeText(value); message('복사했어요.'); }
    catch { input.focus(); input.select(); message('자동 복사가 제한되어 있어요. 선택된 문구를 Ctrl+C로 복사해 주세요.'); }
  }
  $('copy-caption').addEventListener('click', () => copy(state.caption, $('caption')));
  $('copy-tags').addEventListener('click', () => copy(state.hashtags, $('hashtags')));
  $('clear').addEventListener('click', () => {
    if (!window.confirm('이 브라우저에 저장된 주제와 초안을 모두 지울까요?')) return;
    try { localStorage.removeItem(key); }
    catch { message('저장된 내용을 지우지 못했어요. 브라우저의 사이트 데이터 설정에서 지워 주세요.'); return; }
    state = { topic: '', category: '뷰티', tone: '친근한 정보형', slides: [], caption: '', hashtags: '' }; render(); message('저장된 내용을 지웠어요.');
  });
  render();
})();
