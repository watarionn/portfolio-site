'use strict';
// =============================================
// 用例カード編集ページ — edit.js
// =============================================

const pageMsgEl   = document.getElementById('page-msg');
const form        = document.getElementById('cardForm');
const msgEl       = document.getElementById('form-msg');
const submitBtn   = document.getElementById('submitBtn');
const previewCard = document.getElementById('previewCard');
const isPublicChk = document.getElementById('is-public');
const publicLabel = document.getElementById('public-label');

let originalCard  = null;
let currentUser   = null;

/* ─── URLからカードIDを取得 ─── */
const cardId = new URLSearchParams(location.search).get('id');

(async function init() {
  currentUser = await getUser();
  if (!currentUser) {
    const redirect = location.pathname + location.search + location.hash;
    location.href = 'auth.html?redirect=' + encodeURIComponent(redirect);
    return;
  }
  if (!cardId) { pageMsgEl.innerHTML = '<div class="msg msg--err">カードIDが指定されていません。</div>'; return; }

  const { data: card, error } = await sb.from('cards').select('*').eq('id', cardId).single();
  if (error || !card) { pageMsgEl.innerHTML = '<div class="msg msg--err">カードが見つかりません。</div>'; return; }
  if (card.user_id !== currentUser.id) { pageMsgEl.innerHTML = '<div class="msg msg--err">このカードを編集する権限がありません。</div>'; return; }

  originalCard = card;
  fillForm(card);
  updatePreview();
})();

function fillForm(card) {
  const src = card.source || {};
  document.getElementById('headword').value       = card.headword || '';
  document.getElementById('role').value           = card.role || '';
  document.getElementById('meaning').value        = card.meaning || '';
  document.getElementById('example').value        = card.example || '';
  document.getElementById('src-title').value      = src.title || '';
  document.getElementById('src-author').value     = src.author || '';
  document.getElementById('src-year').value       = src.year || '';
  document.getElementById('src-page').value       = src.page || '';
  document.getElementById('src-genre').value      = src.genre || '';
  document.getElementById('src-isbn').value       = src.isbn || '';
  document.getElementById('collected-at').value   = card.collected_at || '';
  document.getElementById('collector-name').value = card.collector_name || '';
  isPublicChk.checked = card.is_public;
  publicLabel.textContent = card.is_public ? '公開' : '非公開';

  const medSel = document.getElementById('src-medium');
  for (let i = 0; i < medSel.options.length; i++) {
    if (medSel.options[i].value === src.medium) { medSel.selectedIndex = i; break; }
  }
}

/* ─── プレビュー ─── */
function updatePreview() {
  const hw  = document.getElementById('headword').value.trim();
  const ex  = document.getElementById('example').value.trim();
  const exHtml = escHtml(ex).replace(/《(.+?)》/g, '<em>$1</em>');
  const role = document.getElementById('role').value.trim();
  const mean = document.getElementById('meaning').value.trim();
  const col  = document.getElementById('collector-name').value.trim();
  const dat  = document.getElementById('collected-at').value;

  previewCard.innerHTML = `
    ${!isPublicChk.checked ? '<span class="card-private-badge">非公開</span>' : ''}
    <div class="card-headword">${escHtml(hw) || '（見出し語）'}</div>
    ${role ? `<span class="card-role">${escHtml(role)}</span>` : ''}
    ${mean ? `<p class="card-meaning">${escHtml(mean)}</p>` : ''}
    <p class="card-example">${exHtml || '（用例）'}</p>
    <div class="card-meta">
      ${dat ? `<span class="card-meta-item">採取日：${dat}</span>` : ''}
      ${col ? `<span class="card-meta-item">採取者：${escHtml(col)}</span>` : ''}
    </div>
  `;
}

['headword','role','meaning','example','collector-name','collected-at','is-public'].forEach(function(id) {
  const el = document.getElementById(id);
  if (el) { el.addEventListener('input', updatePreview); el.addEventListener('change', updatePreview); }
});

isPublicChk.addEventListener('change', function() {
  publicLabel.textContent = this.checked ? '公開' : '非公開';
});

/* ─── 送信（編集履歴も保存） ─── */
form.addEventListener('submit', async function(e) {
  e.preventDefault();
  const hw = document.getElementById('headword').value.trim();
  const ex = document.getElementById('example').value.trim();
  if (!hw || !ex) { msgEl.innerHTML = '<div class="msg msg--err">見出し語と用例は必須です。</div>'; return; }

  submitBtn.disabled = true; submitBtn.textContent = '更新中…';

  const source = {
    title:  document.getElementById('src-title').value.trim()  || null,
    author: document.getElementById('src-author').value.trim() || null,
    year:   document.getElementById('src-year').value.trim()   || null,
    page:   document.getElementById('src-page').value.trim()   || null,
    genre:  document.getElementById('src-genre').value.trim()  || null,
    medium: document.getElementById('src-medium').value        || null,
    isbn:   document.getElementById('src-isbn').value.trim()   || null,
  };

  const after = {
    headword:       hw,
    role:           document.getElementById('role').value.trim()           || null,
    meaning:        document.getElementById('meaning').value.trim()        || null,
    example:        ex,
    source,
    collected_at:   document.getElementById('collected-at').value || originalCard.collected_at,
    collector_name: document.getElementById('collector-name').value.trim() || '匿名',
    is_public:      isPublicChk.checked,
  };

  /* カード更新 */
  const { error } = await sb.from('cards').update(after).eq('id', cardId);
  if (error) {
    msgEl.innerHTML = '<div class="msg msg--err">更新に失敗しました。</div>';
    submitBtn.disabled = false; submitBtn.textContent = '更新する';
    return;
  }

  /* 編集履歴を保存 */
  const before = {
    headword:       originalCard.headword,
    role:           originalCard.role,
    meaning:        originalCard.meaning,
    example:        originalCard.example,
    source:         originalCard.source,
    collected_at:   originalCard.collected_at,
    collector_name: originalCard.collector_name,
    is_public:      originalCard.is_public,
  };
  const { error: historyError } = await sb.from('card_edits').insert({
    card_id: cardId,
    user_id: currentUser.id,
    before,
    after,
  });

  originalCard = { ...originalCard, ...after };
  if (historyError) {
    console.error(historyError);
    msgEl.innerHTML = '<div class="msg msg--err">カードは更新しましたが、編集履歴の保存に失敗しました。</div>';
  } else {
    msgEl.innerHTML = '<div class="msg msg--ok">更新しました！</div>';
  }
  submitBtn.disabled = false; submitBtn.textContent = '更新する';
});
