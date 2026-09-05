'use strict';

// ============================================================
//  単語ジェネレーター — script.js
// ============================================================

// ── ユーティリティ ────────────────────────────────────────
/**
 * 配列をフィッシャー＝イェーツ法でシャッフルして返す（元配列を変更しない）
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── カタカナーシ ─────────────────────────────────────────
(function initKata() {

  // ── ジャンル一覧を動的生成
  const genres = [...new Set(KATA_WORDS.map(w => w.genre))].sort();
  const genreGrid = document.getElementById('kata-genre-grid');

  // 「すべて」ボタン
  const allBtn = createGenreBtn('すべて', true);
  allBtn.classList.add('all-btn');
  genreGrid.appendChild(allBtn);

  genres.forEach(g => {
    genreGrid.appendChild(createGenreBtn(g, false));
  });

  function createGenreBtn(label, selected) {
    const btn = document.createElement('button');
    btn.className = 'genre-btn' + (selected ? ' selected' : '');
    btn.textContent = label;
    btn.dataset.genre = label;
    btn.setAttribute('aria-pressed', String(selected));
    return btn;
  }

  // ── 状態
  let selectedGenres = new Set(); // 空 = すべて
  let deck = [];

  function buildDeck() {
    const pool = selectedGenres.size === 0
      ? KATA_WORDS
      : KATA_WORDS.filter(w => selectedGenres.has(w.genre));
    deck = shuffle(pool);
    updateRemain();
  }

  function updateRemain() {
    document.getElementById('kata-remain-num').textContent = deck.length;
  }

  buildDeck();

  // ── ジャンルボタン クリック
  genreGrid.addEventListener('click', e => {
    const btn = e.target.closest('.genre-btn');
    if (!btn) return;

    const genre = btn.dataset.genre;

    if (genre === 'すべて') {
      selectedGenres.clear();
      document.querySelectorAll('#kata-genre-grid .genre-btn').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      // 「すべて」の選択を外す
      const allBtnEl = genreGrid.querySelector('.all-btn');
      allBtnEl.classList.remove('selected');
      allBtnEl.setAttribute('aria-pressed', 'false');

      if (selectedGenres.has(genre)) {
        selectedGenres.delete(genre);
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
      } else {
        selectedGenres.add(genre);
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
      }

      // 何も選ばれていなければ「すべて」に戻す
      if (selectedGenres.size === 0) {
        allBtnEl.classList.add('selected');
        allBtnEl.setAttribute('aria-pressed', 'true');
      }
    }

    buildDeck();
    // カードをリセット
    document.getElementById('kata-word').textContent  = 'ボタンを押して単語を引く';
    document.getElementById('kata-genre-label').textContent = '－';
  });

  // ── 単語を引く
  document.getElementById('kata-draw-btn').addEventListener('click', () => {
    if (deck.length === 0) buildDeck();           // 全部引いたらシャッフルして再スタート
    const item = deck.pop();
    updateRemain();

    const card = document.getElementById('kata-card');
    const wordEl  = document.getElementById('kata-word');
    const genreEl = document.getElementById('kata-genre-label');

    // アニメーション
    card.classList.remove('pop');
    void card.offsetWidth;                         // reflow で再トリガー
    card.classList.add('pop');

    wordEl.textContent  = item.word;
    genreEl.textContent = item.genre;
  });

})();


// ── エイゴダーケ ─────────────────────────────────────────
(function initEigo() {

  let deck = shuffle(EIGO_WORDS);

  function updateRemain() {
    document.getElementById('eigo-remain-num').textContent = deck.length;
  }
  updateRemain();

  document.getElementById('eigo-draw-btn').addEventListener('click', () => {
    if (deck.length === 0) deck = shuffle(EIGO_WORDS);   // 全部引いたら再スタート
    const item = deck.pop();
    updateRemain();

    const card   = document.getElementById('eigo-card');
    const wordEl = document.getElementById('eigo-word');
    const ngArea = document.getElementById('ng-area');
    const ngList = document.getElementById('ng-list');

    // アニメーション
    card.classList.remove('pop');
    void card.offsetWidth;
    card.classList.add('pop');

    wordEl.textContent = item.word;

    // NGワード表示
    ngList.innerHTML = '';
    if (item.ng && item.ng.length > 0) {
      item.ng.forEach(ngWord => {
        const li = document.createElement('li');
        li.textContent = ngWord;
        ngList.appendChild(li);
      });
      ngArea.classList.remove('hidden');
    } else {
      ngArea.classList.add('hidden');
    }
  });

})();


// ── タブ切り替え ─────────────────────────────────────────
(function initTabs() {
  const tabs   = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById('panel-' + target).classList.add('active');
    });
  });
})();
