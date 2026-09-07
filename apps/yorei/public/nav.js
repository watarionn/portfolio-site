'use strict';
// =============================================
// 共通ナビゲーション — nav.js
// =============================================

function renderNav(activePage) {
  const pages = [
    { id: 'index',        href: 'yorei.html',         label: '用例を採取する' },
    { id: 'cards',        href: 'cards.html',         label: '用例広場' },
    { id: 'dictionaries', href: 'dictionaries.html',  label: '辞書広場' },
    { id: 'my-cards',     href: 'my-cards.html',      label: 'My用例' },
    { id: 'my-dicts',     href: 'my-dicts.html',      label: 'My辞書' },
  ];

  const linksHtml = pages.map(p => `
    <a href="${p.href}" class="nav-link${activePage === p.id ? ' active' : ''}">${p.label}</a>
  `).join('');

  return `
    <nav class="site-nav" role="navigation" aria-label="メインナビゲーション">
      <a href="yorei.html" class="nav-brand" aria-label="用例収集アプリ トップへ">
        <span class="nav-brand-text">
          用例収集
          <span class="nav-brand-sub">Corpus Collector</span>
        </span>
      </a>
      <div class="nav-links">${linksHtml}</div>
      <div class="nav-auth" id="nav-auth"></div>
    </nav>
  `;
}

// ナビをbodyの先頭に挿入
document.addEventListener('DOMContentLoaded', function() {
  const activePage = document.body.dataset.page || 'index';
  const navEl = document.createElement('div');
  navEl.innerHTML = renderNav(activePage);
  document.body.insertBefore(navEl.firstElementChild, document.body.firstChild);
});
