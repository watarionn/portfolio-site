'use strict';
const PAGE_SIZE = 16;
let currentPage = 0;
let totalCount  = 0;

const container   = document.getElementById('dictsContainer');
const paginEl     = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const searchBtn   = document.getElementById('searchBtn');
const sortSelect  = document.getElementById('sortSelect');
const detailModal = document.getElementById('dictDetailModal');
const detailClose = document.getElementById('dictDetailClose');

(async function init() { await loadDicts(0); })();

async function loadDicts(page) {
  container.innerHTML = '<div class="loading">読み込み中</div>';
  currentPage = page;
  const keyword = searchInput.value.trim();
  const asc     = sortSelect.value === 'old';

  let q = sb.from('dictionaries')
    .select('*, profiles(username)', { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: asc })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (keyword) {
    q = q.or([
      ilikeContainsLogic('name', keyword),
      ilikeContainsLogic('description', keyword),
    ].join(','));
  }

  const { data, error, count } = await q;
  totalCount = count || 0;

  if (error || !data || data.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><p class="empty-text">辞書がまだありません</p></div>`;
    paginEl.innerHTML = '';
    return;
  }

  container.innerHTML = `<div class="cards-grid">${data.map(renderDictCard).join('')}</div>`;
  renderPagination();

  container.querySelectorAll('.dict-card').forEach(function(el) {
    el.addEventListener('click', function() { openDictDetail(el.dataset.id); });
  });
}

function renderDictCard(dict) {
  const owner = dict.profiles ? escHtml(dict.profiles.username) : '匿名';
  return `
    <div class="dict-card" data-id="${dict.id}" role="button" tabindex="0" aria-label="${escHtml(dict.name)}の辞書">
      ${!dict.is_public ? '<span class="card-private-badge">非公開</span>' : ''}
      <div class="dict-card-name">${escHtml(dict.name)}</div>
      ${dict.description ? `<p class="dict-card-desc">${escHtml(dict.description)}</p>` : ''}
      <p class="dict-card-meta">編纂者：${owner}　作成：${(dict.created_at||'').slice(0,10)}</p>
    </div>
  `;
}

function renderPagination() {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  if (totalPages <= 1) { paginEl.innerHTML = ''; return; }
  let html = '';
  for (let i = 0; i < totalPages; i++) {
    html += `<button class="btn btn--sm ${i===currentPage?'btn--primary':'btn--ghost'}" data-page="${i}">${i+1}</button>`;
  }
  paginEl.innerHTML = html;
  paginEl.querySelectorAll('[data-page]').forEach(function(btn) {
    btn.addEventListener('click', function() { loadDicts(parseInt(this.dataset.page)); });
  });
}

searchBtn.addEventListener('click', function() { loadDicts(0); });
searchInput.addEventListener('keydown', function(e) { if (e.key==='Enter') loadDicts(0); });
sortSelect.addEventListener('change', function() { loadDicts(0); });

async function openDictDetail(dictId) {
  const { data: dict } = await sb.from('dictionaries').select('*, profiles(username)').eq('id', dictId).single();
  if (!dict) return;

  const { data: dcards } = await sb.from('dictionary_cards')
    .select('cards(*)')
    .eq('dictionary_id', dictId)
    .order('added_at', { ascending: false })
    .limit(50);

  const owner = dict.profiles ? escHtml(dict.profiles.username) : '匿名';
  document.getElementById('dictDetailContent').innerHTML = `
    <div class="dict-header">
      <h2 class="dict-name">${escHtml(dict.name)}</h2>
      ${dict.description ? `<p class="dict-desc">${escHtml(dict.description)}</p>` : ''}
      <p class="dict-meta">編纂者：${owner}　作成：${(dict.created_at||'').slice(0,10)}</p>
    </div>
  `;

  const cardsEl = document.getElementById('dictDetailCards');
  if (dcards && dcards.length) {
    cardsEl.innerHTML = dcards.map(function(dc) { return renderCardHTML(dc.cards, { clickable: false }); }).join('');
  } else {
    cardsEl.innerHTML = '<p class="empty-text" style="padding:1rem">この辞書にはまだ用例カードがありません</p>';
  }

  detailModal.hidden = false;
}

detailClose.addEventListener('click', function() { detailModal.hidden = true; });
detailModal.addEventListener('click', function(e) { if (e.target===detailModal) detailModal.hidden = true; });
