(() => {
  const fragmentPaths = [
    'sections/01.html',
    'sections/02.html',
    'sections/03.html',
    'sections/04.html',
    'sections/05.html',
    'sections/06.html'
  ];

  const input = document.getElementById('search');
  const container = document.getElementById('sheetContainer');
  const result = document.getElementById('result');
  const empty = document.getElementById('empty');
  const indexLinks = [...document.querySelectorAll('.index-nav a[href^="#"]')];

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

  function initCheatSheet() {
    const sheets = [...container.querySelectorAll('.sheet')];
    const total = sheets.reduce((sum, sheet) => sum + sheet.querySelectorAll('tbody tr').length, 0);

    function updateSearch() {
      const query = normalize(input.value.trim());
      let matched = 0;
      let visibleSheets = 0;

      sheets.forEach((sheet) => {
        const rows = [...sheet.querySelectorAll('tbody tr')];
        const titleMatches = query && normalize(sheet.dataset.title || '').includes(query);
        let sectionMatched = 0;

        rows.forEach((row) => {
          const rowMatches = !query || titleMatches || normalize(row.textContent).includes(query);
          row.hidden = !rowMatches;
          if (rowMatches) {
            sectionMatched += 1;
            matched += 1;
          }
        });

        const show = !query || sectionMatched > 0;
        sheet.classList.toggle('hidden', !show);
        if (show) visibleSheets += 1;
      });

      result.textContent = query ? `${matched} 項目ヒット` : `全 ${total} 項目`;
      empty.style.display = visibleSheets ? 'none' : 'block';
    }

    input.addEventListener('input', updateSearch);
    input.disabled = false;

    if ('IntersectionObserver' in window) {
      const linkById = new Map(indexLinks.map((link) => [link.getAttribute('href').slice(1), link]));
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        indexLinks.forEach((link) => link.removeAttribute('aria-current'));
        const active = linkById.get(visible.target.id);
        if (active) active.setAttribute('aria-current', 'true');
      }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

      sheets.forEach((sheet) => observer.observe(sheet));
    }

    updateSearch();
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
