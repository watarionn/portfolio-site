(() => {
  const modes = {
    station: { endpoint: '../api/stations.php', placeholder: '駅名を検索', label: '駅' },
    line: { endpoint: '../api/lines.php', placeholder: '路線名を検索', label: '路線' },
    address: { endpoint: '../api/addresses.php', placeholder: '住所を検索', label: '住所' },
  };

  const q = document.querySelector('#q');
  const form = document.querySelector('#search-form');
  const results = document.querySelector('#results');
  const status = document.querySelector('#status');
  const stats = document.querySelector('#stats');
  let mode = 'station';

  function setMode(next, focus = false) {
    if (!modes[next]) return;
    mode = next;
    document.querySelectorAll('[data-mode]').forEach((button) => {
      button.setAttribute('aria-selected', String(button.dataset.mode === mode));
    });
    q.placeholder = modes[mode].placeholder;
    if (focus) q.focus();
  }

  function addText(parent, tag, text, className = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = text;
    parent.append(el);
    return el;
  }

  function renderStation(row) {
    const article = document.createElement('article');
    article.className = 'geo-result';
    addText(article, 'b', row.station_name);
    if (row.station_reading) addText(article, 'span', row.station_reading, 'geo-result-reading');
    addText(article, 'small', [row.line_names, '駅コード ' + row.station_code].filter(Boolean).join(' / '));
    return article;
  }

  function renderLine(row) {
    const article = document.createElement('article');
    article.className = 'geo-result';
    addText(article, 'b', row.line_name);
    if (row.line_reading) addText(article, 'span', row.line_reading, 'geo-result-reading');
    addText(article, 'small', '路線コード ' + row.line_code);
    return article;
  }

  function renderAddress(row) {
    const article = document.createElement('article');
    article.className = 'geo-result';
    const name = [row.prefecture_name, row.municipality_name, row.town_name, row.block_name].filter(Boolean).join(' ');
    const reading = [row.prefecture_kana, row.municipality_kana, row.town_kana, row.block_kana].filter(Boolean).join(' ');
    addText(article, 'b', name);
    if (reading) addText(article, 'span', reading, 'geo-result-reading');
    const postal = row.postal_code ? '〒' + String(row.postal_code).padStart(7, '0') : '';
    addText(article, 'small', [postal, '住所コード ' + row.address_code].filter(Boolean).join(' / '));
    return article;
  }

  function updateUrl(value) {
    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('mode', mode);
    url.searchParams.set('q', value);
    history.replaceState(null, '', url);
  }

  async function search(value = q.value.trim(), updateHistory = true) {
    value = value.trim();
    if (!value) {
      status.textContent = '検索語を入力してください。';
      results.replaceChildren();
      return;
    }

    status.textContent = '検索中…';
    results.replaceChildren();

    try {
      const response = await fetch(modes[mode].endpoint + '?q=' + encodeURIComponent(value) + '&limit=50');
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '検索に失敗しました。');

      if (updateHistory) updateUrl(value);
      const suffix = mode === 'address' && data.mode === 'contains-fallback' ? '（部分一致）' : '';
      status.textContent = modes[mode].label + ': ' + data.count + '件を表示' + suffix;

      const render = mode === 'station' ? renderStation : mode === 'line' ? renderLine : renderAddress;
      data.results.forEach((row) => results.append(render(row)));
      if (!data.results.length) addText(results, 'article', '見つかりませんでした。', 'geo-result');
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : '検索に失敗しました。';
    }
  }

  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      setMode(button.dataset.mode, true);
      results.replaceChildren();
      status.textContent = '検索語を入力してください。';
    });
  });

  document.querySelector('[data-special="reading"]')?.addEventListener('click', () => {
    setMode('address');
    q.value = '七日町';
    search('七日町');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    search();
  });

  fetch('../api/stats.php')
    .then((response) => response.json())
    .then((data) => {
      if (!data.ok) return;
      const s = data.stats;
      [
        [s.stations, '駅'],
        [s.station_lines, '駅⇔路線'],
        [s.lines, '路線'],
        [s.address_records, '住所レコード'],
      ].forEach(([number, label]) => {
        const card = document.createElement('div');
        card.className = 'geo-stat';
        addText(card, 'b', Number(number).toLocaleString('ja-JP'));
        addText(card, 'small', label);
        stats.append(card);
      });
    })
    .catch(() => {});

  const params = new URLSearchParams(location.search);
  const initialMode = params.get('mode');
  const initialQuery = params.get('q');
  const view = params.get('view');

  if (view === 'reading-contrast') {
    setMode('address');
    q.value = '七日町';
    search('七日町', false);
  } else {
    if (initialMode && modes[initialMode]) setMode(initialMode);
    if (initialQuery) {
      q.value = initialQuery;
      search(initialQuery, false);
    }
  }
})();
