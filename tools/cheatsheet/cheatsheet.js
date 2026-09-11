(() => {
  const fragmentPaths = ['sections/01.html','sections/02.html','sections/03.html','sections/04.html','sections/05.html','sections/06.html'];
  const scopeDefinitions = {
    all: { label: 'すべて', sections: null },
    python: { label: 'Python基礎', sections: new Set([1,2,3,4,5,6,7,8,18,22,24,28]) },
    web: { label: 'Web・JS', sections: new Set([9,15]) },
    automation: { label: 'GUI・自動化', sections: new Set([11,12,14,19,20,21]) },
    vision: { label: '画像・AI', sections: new Set([10,13,16,23,27]) },
    text: { label: 'テキスト・文書', sections: new Set([17,25,26]) }
  };

  const input = document.getElementById('search');
  const container = document.getElementById('sheetContainer');
  const result = document.getElementById('result');
  const empty = document.getElementById('empty');
  const clearButton = document.getElementById('clearSearch');
  const scopeButtons = [...document.querySelectorAll('[data-scope]')];
  const indexLinks = [...document.querySelectorAll('.index-nav a[href^="#"]')];
  let activeScope = 'all';

  function normalize(value) {
    return value.toLowerCase().normalize('NFKC');
  }

  async function loadSections() {
    const responses = await Promise.all(fragmentPaths.map((path) => fetch(path)));
    const failed = responses.find((response) => !response.ok);
    if (failed) throw new Error(`Failed to load cheat sheet fragment: ${failed.status}`);
    const fragments = await Promise.all(responses.map((response) => response.text()));
    container.innerHTML = fragments.join('');
  }

  function sectionScope(number) {
    return Object.entries(scopeDefinitions).find(([key, definition]) => key !== 'all' && definition.sections.has(number))?.[0] || 'all';
  }

  function syncUrl() {
    const url = new URL(window.location.href);
    const query = input.value.trim();
    if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
    if (activeScope !== 'all') url.searchParams.set('scope', activeScope); else url.searchParams.delete('scope');
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function setScope(scope, updateUrl = true) {
    activeScope = scopeDefinitions[scope] ? scope : 'all';
    scopeButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.scope === activeScope)));
    updateSearch(updateUrl);
  }

  function updateSearch(updateUrl = true) {
    const sheets = [...container.querySelectorAll('.sheet')];
    const query = normalize(input.value.trim());
    let matched = 0;
    let visibleSheets = 0;

    sheets.forEach((sheet) => {
      const rows = [...sheet.querySelectorAll('tbody tr')];
      const inScope = activeScope === 'all' || sheet.dataset.scope === activeScope;
      const titleMatches = query && normalize(sheet.dataset.title || '').includes(query);
      let sectionMatched = 0;

      rows.forEach((row) => {
        const rowMatches = inScope && (!query || titleMatches || normalize(row.textContent).includes(query));
        row.hidden = !rowMatches;
        if (rowMatches) { sectionMatched += 1; matched += 1; }
      });

      const show = inScope && (!query || sectionMatched > 0);
      sheet.classList.toggle('hidden', !show);
      const indexLink = indexLinks.find((link) => link.getAttribute('href') === `#${sheet.id}`);
      if (indexLink) indexLink.hidden = !show;
      if (show) visibleSheets += 1;
    });

    const scopeLabel = scopeDefinitions[activeScope].label;
    result.textContent = `${scopeLabel} · ${matched} 項目 / ${visibleSheets} セクション`;
    empty.style.display = visibleSheets ? 'none' : 'block';
    clearButton.disabled = !input.value.trim() && activeScope === 'all';
    if (updateUrl) syncUrl();
  }

  function clearConditions() {
    input.value = '';
    setScope('all');
  }

  function initCheatSheet() {
    const sheets = [...container.querySelectorAll('.sheet')];
    sheets.forEach((sheet) => {
      sheet.dataset.scope = sectionScope(Number(sheet.dataset.sectionNumber));
    });

    const params = new URLSearchParams(window.location.search);
    input.value = params.get('q') || '';
    const initialScope = params.get('scope') || 'all';

    input.addEventListener('input', () => updateSearch());
    scopeButtons.forEach((button) => button.addEventListener('click', () => setScope(button.dataset.scope || 'all')));
    clearButton.addEventListener('click', () => { clearConditions(); input.focus(); });
    input.disabled = false;
    setScope(initialScope, false);

    document.addEventListener('keydown', (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isTyping) {
        event.preventDefault();
        input.focus();
        input.select();
      }
      if (event.key === 'Escape' && (input.value.trim() || activeScope !== 'all')) {
        event.preventDefault();
        clearConditions();
        input.focus();
      }
    });

    if ('IntersectionObserver' in window) {
      const linkById = new Map(indexLinks.map((link) => [link.getAttribute('href').slice(1), link]));
      const observer = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting && !entry.target.classList.contains('hidden'))
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        indexLinks.forEach((link) => link.removeAttribute('aria-current'));
        const active = linkById.get(visible.target.id);
        if (active) active.setAttribute('aria-current', 'true');
      }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
      sheets.forEach((sheet) => observer.observe(sheet));
    }

    updateSearch(false);
    syncUrl();
  }

  loadSections()
    .then(initCheatSheet)
    .catch((error) => {
      console.error(error);
      result.textContent = '読込エラー';
      empty.textContent = '技術早見表の読み込みに失敗しました。ページを再読み込みしてください。';
      empty.style.display = 'block';
    });
})();
