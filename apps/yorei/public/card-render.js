'use strict';
// =============================================
// カード描画ユーティリティ — card-render.js
// =============================================

/* 用例カードのHTMLを生成 */
function renderCardHTML(card, options) {
  options = options || {};
  const clickable = options.clickable !== false;

  const exHtml = escHtml(card.example).replace(/《(.+?)》/g, '<em>$1</em>');

  const src = card.source || {};
  const srcParts = [src.title, src.author, src.year, src.page, src.medium]
    .filter(Boolean).map(escHtml).join('　');

  const metaItems = [
    card.collected_at ? `採取日：${card.collected_at}` : '',
    card.collector_name ? `採取者：${escHtml(card.collector_name)}` : '',
    srcParts ? `出典：${srcParts}` : '',
  ].filter(Boolean);

  return `
    <article class="card${clickable ? ' card--clickable' : ''}"
      data-id="${card.id}"
      role="${clickable ? 'button' : 'article'}"
      ${clickable ? 'tabindex="0"' : ''}
      aria-label="${escHtml(card.headword)}の用例カード">
      ${!card.is_public ? '<span class="card-private-badge">非公開</span>' : ''}
      <div class="card-headword">${escHtml(card.headword)}</div>
      ${card.role ? `<span class="card-role">${escHtml(card.role)}</span>` : ''}
      ${card.meaning ? `<p class="card-meaning">${escHtml(card.meaning)}</p>` : ''}
      <p class="card-example">${exHtml}</p>
      ${metaItems.length ? `
        <div class="card-meta">
          ${metaItems.map(function(m) { return `<span class="card-meta-item">${m}</span>`; }).join('')}
        </div>` : ''}
    </article>
  `;
}

/* カード詳細モーダルの中身を生成 */
function renderCardDetail(card, isOwner) {
  const src = card.source || {};
  const exHtml = escHtml(card.example).replace(/《(.+?)》/g, '<em>$1</em>');

  const sourceRows = [
    ['書籍名・媒体名', src.title],
    ['著者名',         src.author],
    ['発行年・号数',   src.year],
    ['ページ数',       src.page],
    ['ジャンル',       src.genre],
    ['発行媒体',       src.medium],
    ['ISBN',           src.isbn],
  ].filter(function(r) { return r[1]; });

  return `
    <h2 class="modal-title" id="cardModalHeadword">${escHtml(card.headword)}</h2>
    ${card.role    ? `<p class="detail-role">${escHtml(card.role)}</p>` : ''}
    ${card.meaning ? `<div class="detail-section"><p class="detail-label">意味</p><p class="detail-meaning">${escHtml(card.meaning)}</p></div>` : ''}
    <div class="detail-section">
      <p class="detail-label">用例</p>
      <p class="detail-example">${exHtml}</p>
    </div>
    ${sourceRows.length ? `
      <div class="detail-section">
        <p class="detail-label">出典</p>
        <dl class="detail-source">
          ${sourceRows.map(function(r) {
            return `<dt>${escHtml(r[0])}</dt><dd>${escHtml(r[1])}</dd>`;
          }).join('')}
        </dl>
      </div>` : ''}
    <div class="detail-section">
      <p class="detail-label">採取情報</p>
      <p class="detail-meta">
        ${card.collected_at ? `採取日：${card.collected_at}　` : ''}
        ${card.collector_name ? `採取者：${escHtml(card.collector_name)}` : ''}
      </p>
    </div>
    ${isOwner ? `<p class="detail-visibility">${card.is_public ? '公開' : '非公開'}</p>` : ''}
  `;
}

/* カードのクリック・キーボードイベントを設定 */
function bindCardClick(container, onCardClick) {
  container.addEventListener('click', function(e) {
    const card = e.target.closest('.card--clickable');
    if (card) onCardClick(card.dataset.id);
  });
  container.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.card--clickable');
      if (card) { e.preventDefault(); onCardClick(card.dataset.id); }
    }
  });
}
