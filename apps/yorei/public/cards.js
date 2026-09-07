'use strict';
// =============================================
// 用例広場 — cards.js
// =============================================

const PAGE_SIZE = 20;
let currentPage = 0;
let totalCount  = 0;
let currentUser = null;

const container   = document.getElementById('cardsContainer');
const paginEl     = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const searchBtn   = document.getElementById('searchBtn');
const mediumFilter= document.getElementById('mediumFilter');
const sortSelect  = document.getElementById('sortSelect');
const cardModal   = document.getElementById('cardModal');
const cardModalClose = document.getElementById('cardModalClose');

(async function init() {
  currentUser = await getUser();
  await loadCards(0);
  bindCardClick(container, openCardModal);
})();

async function buildQuery(page) {
  const keyword = searchInput.value.trim();
  const medium  = mediumFilter.value;
  const sort    = sortSelect.value;

  let q = sb.from('cards')
    .select('*', { count: 'exact' })
    .eq('is_public', true)
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    .order('created_at', { ascending: sort === 'old' });

  if (keyword) {
    q = q.or([
      ilikeContainsLogic('headword', keyword),
      ilikeContainsLogic('example', keyword),
    ].join(','));
  }
  if (medium) {
    q = q.contains('source', { medium });
  }

  return q;
}

async function loadCards(page) {
  container.innerHTML = '<div class="loading" aria-live="polite">読み込み中</div>';
  currentPage = page;

  const { data, error, count } = await (await buildQuery(page));

  if (error) {
    container.innerHTML = '<div class="msg msg--err">読み込みに失敗しました。</div>';
    return;
  }
  totalCount = count || 0;

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📖</div>
        <p class="empty-text">用例カードがまだありません</p>
      </div>`;
    paginEl.innerHTML = '';
    return;
  }

  container.innerHTML = `<div class="cards-grid">${data.map(function(c) { return renderCardHTML(c); }).join('')}</div>`;
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  if (totalPages <= 1) { paginEl.innerHTML = ''; return; }

  let html = '';
  for (let i = 0; i < totalPages; i++) {
    html += `<button class="btn btn--sm ${i === currentPage ? 'btn--primary' : 'btn--ghost'}"
      data-page="${i}" aria-label="${i+1}ページ" ${i === currentPage ? 'aria-current="page"' : ''}>${i + 1}</button>`;
  }
  paginEl.innerHTML = html;
  paginEl.querySelectorAll('button[data-page]').forEach(function(btn) {
    btn.addEventListener('click', function() { loadCards(parseInt(this.dataset.page)); });
  });
}

/* ─── 検索 ─── */
searchBtn.addEventListener('click', function() { loadCards(0); });
searchInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') loadCards(0); });
mediumFilter.addEventListener('change', function() { loadCards(0); });
sortSelect.addEventListener('change', function() { loadCards(0); });

/* ─── カード詳細モーダル ─── */
async function openCardModal(cardId) {
  const { data: card, error } = await sb.from('cards').select('*').eq('id', cardId).single();
  if (error || !card) return;

  const isOwner = currentUser && currentUser.id === card.user_id;
  document.getElementById('cardModalContent').innerHTML = renderCardDetail(card, isOwner);

  // アクションボタン
  const actionsEl = document.getElementById('cardModalActions');
  actionsEl.innerHTML = '';

  if (currentUser) {
    // 辞書に追加
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn--gold btn--sm';
    addBtn.textContent = '辞書に追加';
    addBtn.addEventListener('click', function() { openAddToDictModal(cardId); });
    actionsEl.appendChild(addBtn);

    // 自分のカードなら編集リンク
    if (isOwner) {
      const editLink = document.createElement('a');
      editLink.href = `edit.html?id=${encodeURIComponent(cardId)}`;
      editLink.className = 'btn btn--ghost btn--sm';
      editLink.textContent = '編集';
      actionsEl.appendChild(editLink);
    }
  }

  cardModal.hidden = false;
}

cardModalClose.addEventListener('click', function() { cardModal.hidden = true; });
cardModal.addEventListener('click', function(e) { if (e.target === cardModal) cardModal.hidden = true; });

/* ─── 辞書に追加 ─── */
async function openAddToDictModal(cardId) {
  if (!currentUser) return;
  const { data: dicts } = await sb.from('dictionaries').select('id,name').eq('user_id', currentUser.id);
  if (!dicts || dicts.length === 0) {
    alert('辞書がありません。My辞書ページから辞書を作成してください。');
    return;
  }
  const dict = dicts.length === 1
    ? dicts[0]
    : dicts[parseInt(prompt(
        dicts.map(function(d, i) { return `${i}: ${d.name}`; }).join('\n') + '\n\n追加する辞書の番号を入力:'
      ) || '0')];
  if (!dict) return;
  const { error } = await sb.from('dictionary_cards').upsert({ dictionary_id: dict.id, card_id: cardId });
  alert(error ? '追加に失敗しました。' : `「${dict.name}」に追加しました！`);
}
