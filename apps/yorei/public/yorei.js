'use strict';
// =============================================
// 用例採取ページ — yorei.js
// =============================================

/* ─── DOM参照 ─── */
const form          = document.getElementById('cardForm');
const msgEl         = document.getElementById('form-msg');
const submitBtn     = document.getElementById('submitBtn');
const previewBtn    = document.getElementById('previewBtn');
const previewCard   = document.getElementById('previewCard');
const isPublicCheck = document.getElementById('is-public');
const publicLabel   = document.getElementById('public-label');
const collectedAt   = document.getElementById('collected-at');
const collectorName = document.getElementById('collector-name');
const dictModal     = document.getElementById('dictModal');
const dictModalClose= document.getElementById('dictModalClose');
const dictModalSkip = document.getElementById('dictModalSkip');
const dictList      = document.getElementById('dictList');

/* ─── 初期値セット ─── */
collectedAt.value = new Date().toISOString().slice(0, 10);

/* ログインユーザーなら採取者名を自動セット */
(async function setDefaultCollector() {
  const user = await getUser();
  if (user) {
    const profile = await getProfile(user.id);
    if (profile) collectorName.value = profile.username;
  }
})();

/* ─── 公開トグルラベル ─── */
isPublicCheck.addEventListener('change', function() {
  publicLabel.textContent = this.checked
    ? '公開（用例広場に表示されます）'
    : '非公開（自分のみ閲覧できます）';
});

/* ─── リアルタイムプレビュー ─── */
function buildPreviewHTML() {
  const hw   = document.getElementById('headword').value.trim();
  const role = document.getElementById('role').value.trim();
  const mean = document.getElementById('meaning').value.trim();
  const ex   = document.getElementById('example').value.trim();
  const col  = collectorName.value.trim();
  const dat  = collectedAt.value;

  if (!hw && !ex) {
    return `<div class="preview-placeholder">
      <div class="empty-icon">📋</div>
      <p class="empty-text">入力するとここにプレビューが表示されます</p>
    </div>`;
  }

  /* 《》を強調 */
  const exHtml = escHtml(ex).replace(/《(.+?)》/g, '<em>$1</em>');

  return `
    ${!isPublicCheck.checked ? '<span class="card-private-badge">非公開</span>' : ''}
    <div class="card-headword">${escHtml(hw) || '（見出し語）'}</div>
    ${role ? `<span class="card-role">${escHtml(role)}</span>` : ''}
    ${mean ? `<p class="card-meaning">${escHtml(mean)}</p>` : ''}
    <p class="card-example">${exHtml || '（用例）'}</p>
    <div class="card-meta">
      ${dat  ? `<span class="card-meta-item">採取日：${dat}</span>` : ''}
      ${col  ? `<span class="card-meta-item">採取者：${escHtml(col)}</span>` : ''}
    </div>
  `;
}

function updatePreview() {
  previewCard.innerHTML = buildPreviewHTML();
}

/* 各入力フィールドの変更でプレビューを更新 */
['headword','role','meaning','example','collector-name','collected-at','is-public']
  .forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updatePreview);
    if (el) el.addEventListener('change', updatePreview);
  });

previewBtn.addEventListener('click', updatePreview);

/* ─── 保存後の辞書追加モーダル ─── */
let savedCardId = null;

async function openDictModal(cardId) {
  savedCardId = cardId;
  const user = await getUser();
  if (!user) { closeModal(); return; }

  const { data: dicts } = await sb
    .from('dictionaries')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  dictList.innerHTML = '';

  if (!dicts || dicts.length === 0) {
    dictList.innerHTML = `<p style="font-size:0.78rem;color:var(--clr-muted);text-align:center;padding:0.75rem 0;">
      辞書がまだありません。<a href="my-dicts.html" style="color:var(--clr-cobalt);">My辞書</a>から作成できます。
    </p>`;
  } else {
    dicts.forEach(function(dict) {
      const item = document.createElement('div');
      item.className = 'dict-item';
      item.innerHTML = `
        <span class="dict-item-name">${escHtml(dict.name)}</span>
        <button class="btn btn--primary btn--sm" data-dict-id="${dict.id}">追加</button>
      `;
      item.querySelector('button').addEventListener('click', async function() {
        const { error } = await sb.from('dictionary_cards').insert({ dictionary_id: dict.id, card_id: cardId });
        if (error) {
          this.textContent = '追加失敗';
          return;
        }
        this.textContent = '追加済';
        this.disabled = true;
      });
      dictList.appendChild(item);
    });
  }

  dictModal.hidden = false;
}

function closeModal() { dictModal.hidden = true; }
dictModalClose.addEventListener('click', closeModal);
dictModalSkip.addEventListener('click', closeModal);
dictModal.addEventListener('click', function(e) { if (e.target === dictModal) closeModal(); });

/* ─── フォーム送信 ─── */
form.addEventListener('submit', async function(e) {
  e.preventDefault();

  const hw = document.getElementById('headword').value.trim();
  const ex = document.getElementById('example').value.trim();

  if (!hw || !ex) {
    showMsg('見出し語と用例は必須項目です。', 'err');
    return;
  }

  const user = await getUser();
  if (!user) {
    showMsg('用例カードを保存するにはログインが必要です。', 'err');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '保存中…';
  clearMsg();

  const source = {
    title:  document.getElementById('src-title').value.trim(),
    author: document.getElementById('src-author').value.trim(),
    year:   document.getElementById('src-year').value.trim(),
    page:   document.getElementById('src-page').value.trim(),
    genre:  document.getElementById('src-genre').value.trim(),
    medium: document.getElementById('src-medium').value,
    isbn:   document.getElementById('src-isbn').value.trim(),
  };

  const payload = {
    user_id:        user.id,
    headword:       hw,
    role:           document.getElementById('role').value.trim() || null,
    meaning:        document.getElementById('meaning').value.trim() || null,
    example:        ex,
    source:         source,
    collected_at:   collectedAt.value || new Date().toISOString().slice(0, 10),
    collector_name: collectorName.value.trim() || '匿名',
    is_public:      isPublicCheck.checked,
  };

  const { data, error } = await sb.from('cards').insert(payload).select().single();

  if (error) {
    showMsg('保存に失敗しました。もう一度お試しください。', 'err');
    console.error(error);
  } else {
    showMsg('用例カードを保存しました！', 'ok');
    form.reset();
    collectedAt.value = new Date().toISOString().slice(0, 10);
    const profile = await getProfile(user.id);
    if (profile) collectorName.value = profile.username;
    updatePreview();
    openDictModal(data.id);
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = '<span>用例カードを作成する</span>';
});

/* ─── ユーティリティ ─── */
function showMsg(text, type) {
  msgEl.innerHTML = `<div class="msg msg--${type}">${escHtml(text)}</div>`;
}
function clearMsg() { msgEl.innerHTML = ''; }
