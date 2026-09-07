'use strict';
const PAGE_SIZE = 20;
let currentPage = 0, totalCount = 0;
let currentUser = null;

const container      = document.getElementById('cardsContainer');
const paginEl        = document.getElementById('pagination');
const searchArea     = document.getElementById('searchArea');
const authRequired   = document.getElementById('authRequired');
const searchInput    = document.getElementById('searchInput');
const searchBtn      = document.getElementById('searchBtn');
const visFilter      = document.getElementById('visibilityFilter');
const cardModal      = document.getElementById('cardModal');
const cardModalClose = document.getElementById('cardModalClose');

(async function init() {
  currentUser = await getUser();
  if (!currentUser) {
    authRequired.hidden = false;
    container.innerHTML = '';
    return;
  }
  searchArea.hidden = false;
  await loadCards(0);
  bindCardClick(container, openCardModal);
})();

async function loadCards(page) {
  container.innerHTML = '<div class="loading">読み込み中</div>';
  currentPage = page;
  const keyword = searchInput ? searchInput.value.trim() : '';
  const vis     = visFilter ? visFilter.value : '';

  let q = sb.from('cards')
    .select('*', { count: 'exact' })
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (keyword) {
    q = q.or([
      ilikeContainsLogic('headword', keyword),
      ilikeContainsLogic('example', keyword),
    ].join(','));
  }
  if (vis === 'public')  q = q.eq('is_public', true);
  if (vis === 'private') q = q.eq('is_public', false);

  const { data, error, count } = await q;
  totalCount = count || 0;

  if (error || !data || data.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div>
      <p class="empty-text">用例カードがまだありません<br><a href="yorei.html" style="color:var(--clr-cobalt)">採取してみましょう</a></p></div>`;
    paginEl.innerHTML = '';
    return;
  }

  container.innerHTML = `<div class="cards-grid">${data.map(function(c){ return renderCardHTML(c); }).join('')}</div>`;
  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(totalCount / PAGE_SIZE);
  if (total <= 1) { paginEl.innerHTML = ''; return; }
  paginEl.innerHTML = Array.from({length:total},function(_,i){
    return `<button class="btn btn--sm ${i===currentPage?'btn--primary':'btn--ghost'}" data-page="${i}">${i+1}</button>`;
  }).join('');
  paginEl.querySelectorAll('[data-page]').forEach(function(btn){
    btn.addEventListener('click', function(){ loadCards(parseInt(this.dataset.page)); });
  });
}

if (searchBtn) searchBtn.addEventListener('click', function(){ loadCards(0); });
if (searchInput) searchInput.addEventListener('keydown', function(e){ if(e.key==='Enter') loadCards(0); });
if (visFilter) visFilter.addEventListener('change', function(){ loadCards(0); });

async function openCardModal(cardId) {
  const { data: card } = await sb.from('cards').select('*').eq('id', cardId).single();
  if (!card) return;
  document.getElementById('cardModalContent').innerHTML = renderCardDetail(card, true);
  const actEl = document.getElementById('cardModalActions');
  actEl.innerHTML = `
    <a href="edit.html?id=${encodeURIComponent(cardId)}" class="btn btn--primary btn--sm">編集</a>
    <button class="btn btn--ghost btn--sm" id="deleteCardBtn">削除</button>
    <button class="btn btn--gold btn--sm" id="addToDictBtn">辞書に追加</button>
  `;
  document.getElementById('deleteCardBtn').addEventListener('click', async function(){
    if (!confirm('この用例カードを削除しますか？')) return;
    await sb.from('cards').delete().eq('id', cardId);
    cardModal.hidden = true;
    loadCards(currentPage);
  });
  document.getElementById('addToDictBtn').addEventListener('click', function(){ addToDict(cardId); });
  cardModal.hidden = false;
}

async function addToDict(cardId) {
  const { data: dicts } = await sb.from('dictionaries').select('id,name').eq('user_id', currentUser.id);
  if (!dicts || dicts.length === 0) { alert('辞書がありません。My辞書から作成してください。'); return; }
  const idx = dicts.length === 1 ? 0 : parseInt(prompt(dicts.map(function(d,i){ return `${i}: ${d.name}`; }).join('\n')+'\n\n番号を入力:') || '0');
  if (isNaN(idx) || !dicts[idx]) return;
  const { error } = await sb.from('dictionary_cards').upsert({ dictionary_id: dicts[idx].id, card_id: cardId });
  alert(error ? '追加に失敗しました。' : `「${dicts[idx].name}」に追加しました！`);
}

cardModalClose.addEventListener('click', function(){ cardModal.hidden = true; });
cardModal.addEventListener('click', function(e){ if(e.target===cardModal) cardModal.hidden = true; });
