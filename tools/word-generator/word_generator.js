'use strict';

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function animateCard(card) {
  card.classList.remove('pop');
  void card.offsetWidth;
  card.classList.add('pop');
}

const tabs = [...document.querySelectorAll('.mode-tab')];
const panels = [...document.querySelectorAll('.game-panel')];
const historyList = document.getElementById('draw-history');
let activeMode = 'kata';
let history = [];

function setMode(mode, focus = false) {
  activeMode = mode;
  tabs.forEach((tab) => {
    const active = tab.dataset.tab === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  });
  panels.forEach((panel) => {
    const active = panel.id === `panel-${mode}`;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => setMode(tab.dataset.tab));
  tab.addEventListener('keydown', (event) => {
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setMode(tabs[next].dataset.tab, true);
  });
});

function addHistory(mode, word, detail) {
  history.unshift({ mode, word, detail });
  history = history.slice(0, 5);
  historyList.replaceChildren();
  history.forEach((entry) => {
    const li = document.createElement('li');
    const strong = document.createElement('b');
    const small = document.createElement('small');
    strong.textContent = entry.word;
    small.textContent = `${entry.mode} / ${entry.detail}`;
    li.append(strong, small);
    historyList.appendChild(li);
  });
}

function updateDatasetMetrics() {
  const genres = new Set(KATA_WORDS.map((item) => item.genre));
  const ngCount = EIGO_WORDS.reduce((sum, item) => sum + (item.ng?.length || 0), 0);
  document.getElementById('metric-kata').textContent = String(KATA_WORDS.length);
  document.getElementById('metric-eigo').textContent = String(EIGO_WORDS.length);
  document.getElementById('metric-genres').textContent = String(genres.size);
  document.getElementById('metric-ng').textContent = String(ngCount);
}
const kataGenreGrid = document.getElementById('kata-genre-grid');
const kataWord = document.getElementById('kata-word');
const kataGenreLabel = document.getElementById('kata-genre-label');
const kataCard = document.getElementById('kata-card');
const kataRemain = document.getElementById('kata-remain-num');
const kataTotal = document.getElementById('kata-total-num');
const kataProgress = document.getElementById('kata-progress');
const kataDrawIndex = document.getElementById('kata-draw-index');
let kataSelectedGenres = new Set();
let kataDeck = [];
let kataDeckTotal = 0;
let kataDrawCount = 0;

const kataGenres = [...new Set(KATA_WORDS.map((item) => item.genre))].sort((a, b) => a.localeCompare(b, 'ja'));
const kataGenreCounts = new Map(kataGenres.map((genre) => [genre, KATA_WORDS.filter((item) => item.genre === genre).length]));

function createGenreButton(label, count, selected = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `genre-btn${selected ? ' selected' : ''}`;
  button.dataset.genre = label;
  button.setAttribute('aria-pressed', String(selected));
  button.textContent = `${label} · ${count}`;
  return button;
}

function renderGenreButtons() {
  kataGenreGrid.replaceChildren();
  const all = createGenreButton('すべて', KATA_WORDS.length, kataSelectedGenres.size === 0);
  all.classList.add('all-btn');
  kataGenreGrid.appendChild(all);
  kataGenres.forEach((genre) => {
    kataGenreGrid.appendChild(createGenreButton(genre, kataGenreCounts.get(genre), kataSelectedGenres.has(genre)));
  });
}
function updateKataDeckStatus() {
  kataRemain.textContent = String(kataDeck.length);
  kataTotal.textContent = String(kataDeckTotal);
  kataProgress.max = Math.max(kataDeckTotal, 1);
  kataProgress.value = kataDeck.length;
}

function buildKataDeck(resetCard = true) {
  const pool = kataSelectedGenres.size === 0
    ? KATA_WORDS
    : KATA_WORDS.filter((item) => kataSelectedGenres.has(item.genre));
  kataDeck = shuffle(pool);
  kataDeckTotal = kataDeck.length;
  kataDrawCount = 0;
  kataDrawIndex.textContent = '000';
  updateKataDeckStatus();
  if (resetCard) {
    kataWord.textContent = '単語を引く';
    kataGenreLabel.textContent = 'READY';
  }
}

function drawKata() {
  if (kataDeck.length === 0) buildKataDeck(false);
  const item = kataDeck.pop();
  if (!item) return;
  kataDrawCount += 1;
  kataDrawIndex.textContent = String(kataDrawCount).padStart(3, '0');
  kataWord.textContent = item.word;
  kataGenreLabel.textContent = item.genre;
  updateKataDeckStatus();
  animateCard(kataCard);
  addHistory('KATA', item.word, item.genre);
}

kataGenreGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.genre-btn');
  if (!button) return;
  const genre = button.dataset.genre;
  if (genre === 'すべて') kataSelectedGenres.clear();
  else if (kataSelectedGenres.has(genre)) kataSelectedGenres.delete(genre);
  else kataSelectedGenres.add(genre);
  renderGenreButtons();
  buildKataDeck();
});
document.getElementById('kata-draw-btn').addEventListener('click', drawKata);
document.getElementById('kata-reset-deck').addEventListener('click', () => buildKataDeck());

const eigoWord = document.getElementById('eigo-word');
const eigoCard = document.getElementById('eigo-card');
const eigoRemain = document.getElementById('eigo-remain-num');
const eigoTotal = document.getElementById('eigo-total-num');
const eigoProgress = document.getElementById('eigo-progress');
const eigoDrawIndex = document.getElementById('eigo-draw-index');
const ngArea = document.getElementById('ng-area');
const ngList = document.getElementById('ng-list');
let eigoDeck = [];
let eigoDeckTotal = 0;
let eigoDrawCount = 0;

function updateEigoDeckStatus() {
  eigoRemain.textContent = String(eigoDeck.length);
  eigoTotal.textContent = String(eigoDeckTotal);
  eigoProgress.max = Math.max(eigoDeckTotal, 1);
  eigoProgress.value = eigoDeck.length;
}

function buildEigoDeck(resetCard = true) {
  eigoDeck = shuffle(EIGO_WORDS);
  eigoDeckTotal = eigoDeck.length;
  eigoDrawCount = 0;
  eigoDrawIndex.textContent = '000';
  updateEigoDeckStatus();
  if (resetCard) {
    eigoWord.textContent = 'DRAW A WORD';
    ngList.replaceChildren();
    ngArea.hidden = true;
  }
}
function drawEigo() {
  if (eigoDeck.length === 0) buildEigoDeck(false);
  const item = eigoDeck.pop();
  if (!item) return;
  eigoDrawCount += 1;
  eigoDrawIndex.textContent = String(eigoDrawCount).padStart(3, '0');
  eigoWord.textContent = item.word;
  ngList.replaceChildren();
  (item.ng || []).forEach((word) => {
    const li = document.createElement('li');
    li.textContent = word;
    ngList.appendChild(li);
  });
  ngArea.hidden = !(item.ng && item.ng.length);
  updateEigoDeckStatus();
  animateCard(eigoCard);
  addHistory('EIGO', item.word, (item.ng || []).join(' / ') || 'NO NG');
}

document.getElementById('eigo-draw-btn').addEventListener('click', drawEigo);
document.getElementById('eigo-reset-deck').addEventListener('click', () => buildEigoDeck());

const timerDisplay = document.getElementById('timer-display');
const timerToggle = document.getElementById('timer-toggle');
const timerReset = document.getElementById('timer-reset');
const timerPresetButtons = [...document.querySelectorAll('.timer-presets button')];
let timerPreset = 60;
let timerRemaining = 60;
let timerInterval = null;
let timerDeadline = null;

function renderTimer() {
  timerDisplay.textContent = String(Math.max(0, Math.ceil(timerRemaining)));
  timerToggle.textContent = timerInterval ? 'PAUSE' : 'START';
}
function stopTimer() {
  if (timerInterval) window.clearInterval(timerInterval);
  timerInterval = null;
  timerDeadline = null;
  renderTimer();
}

function tickTimer() {
  if (!timerDeadline) return;
  timerRemaining = Math.max(0, (timerDeadline - Date.now()) / 1000);
  renderTimer();
  if (timerRemaining <= 0) stopTimer();
}

function toggleTimer() {
  if (timerInterval) {
    timerRemaining = Math.max(0, (timerDeadline - Date.now()) / 1000);
    stopTimer();
    return;
  }
  if (timerRemaining <= 0) timerRemaining = timerPreset;
  timerDeadline = Date.now() + timerRemaining * 1000;
  timerInterval = window.setInterval(tickTimer, 200);
  renderTimer();
}

function resetTimer() {
  stopTimer();
  timerRemaining = timerPreset;
  renderTimer();
}

timerToggle.addEventListener('click', toggleTimer);
timerReset.addEventListener('click', resetTimer);
timerPresetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    timerPreset = Number(button.dataset.seconds);
    timerPresetButtons.forEach((item) => item.classList.toggle('selected', item === button));
    resetTimer();
  });
});
document.addEventListener('keydown', (event) => {
  const target = event.target;
  const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  if (typing || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key.toLowerCase() === 'd') {
    event.preventDefault();
    if (activeMode === 'kata') drawKata();
    else drawEigo();
  }
  if (event.key.toLowerCase() === 't') {
    event.preventDefault();
    toggleTimer();
  }
});

updateDatasetMetrics();
renderGenreButtons();
buildKataDeck();
buildEigoDeck();
setMode('kata');
renderTimer();
