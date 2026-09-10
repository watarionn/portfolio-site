'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const cards = Array.from(document.querySelectorAll('.fish-card'));
  const searchInput = document.getElementById('fish-search');
  const scopeButtons = Array.from(document.querySelectorAll('.scope-btn'));
  const visibleCount = document.getElementById('visible-count');
  const totalCount = document.getElementById('total-count');
  const status = document.getElementById('search-status');
  const emptyState = document.getElementById('empty-state');
  const randomButton = document.getElementById('random-fish');
  const revealButton = document.getElementById('reveal-visible');
  const resetButton = document.getElementById('reset-search');
  const bubbleContainer = document.getElementById('bubble-container');

  let currentScope = 'all';

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFKC')
      .replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
      .toLowerCase()
      .replace(/\s+/g, '');
  }

  function setCardFlipped(card, flipped) {
    const trigger = card.querySelector('.fish-card-trigger');
    const front = card.querySelector('.fish-front');
    const back = card.querySelector('.fish-back');
    const name = card.dataset.name || '魚名';
    card.classList.toggle('is-flipped', flipped);
    trigger.setAttribute('aria-expanded', String(flipped));
    trigger.setAttribute('aria-label', flipped ? `${name}。漢字に戻す` : `${name}。読みを表示`);
    front.setAttribute('aria-hidden', String(flipped));
    back.setAttribute('aria-hidden', String(!flipped));
  }

  function getVisibleCards() {
    return cards.filter(card => !card.hidden);
  }

  function syncRevealButton() {
    const visibleCards = getVisibleCards();
    const allRevealed = visibleCards.length > 0 && visibleCards.every(card => card.classList.contains('is-flipped'));
    revealButton.textContent = allRevealed ? 'NAME ALL' : 'READ ALL';
    revealButton.setAttribute('aria-pressed', String(allRevealed));
  }

  function syncUrl() {
    const url = new URL(window.location.href);
    const query = searchInput.value.trim();
    query ? url.searchParams.set('q', query) : url.searchParams.delete('q');
    currentScope === 'all' ? url.searchParams.delete('scope') : url.searchParams.set('scope', currentScope);
    history.replaceState(null, '', url);
  }
  function applyFilter({ updateUrl = true } = {}) {
    const query = normalizeText(searchInput.value);
    let matches = 0;

    cards.forEach(card => {
      const name = normalizeText(card.dataset.name);
      const reading = normalizeText(card.dataset.reading);
      const haystack = currentScope === 'name' ? name : currentScope === 'reading' ? reading : name + reading;
      const match = query === '' || haystack.includes(query);
      card.hidden = !match;
      if (match) matches += 1;
    });

    visibleCount.textContent = String(matches);
    totalCount.textContent = String(cards.length);
    emptyState.hidden = matches !== 0;
    status.textContent = query
      ? `「${searchInput.value.trim()}」で${matches}件見つかりました。`
      : `全${matches}件を表示しています。`;

    if (updateUrl) syncUrl();
    syncRevealButton();
  }

  function setScope(scope, { focus = false, update = true } = {}) {
    currentScope = ['all', 'name', 'reading'].includes(scope) ? scope : 'all';
    scopeButtons.forEach(button => {
      const active = button.dataset.scope === currentScope;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      if (active && focus) button.focus();
    });
    if (update) applyFilter();
  }
  cards.forEach(card => {
    const trigger = card.querySelector('.fish-card-trigger');
    trigger.addEventListener('click', () => {
      setCardFlipped(card, !card.classList.contains('is-flipped'));
      syncRevealButton();
    });
  });

  searchInput.addEventListener('input', () => applyFilter());

  scopeButtons.forEach((button, index) => {
    button.addEventListener('click', () => setScope(button.dataset.scope));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowLeft') next = (index - 1 + scopeButtons.length) % scopeButtons.length;
      if (event.key === 'ArrowRight') next = (index + 1) % scopeButtons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = scopeButtons.length - 1;
      setScope(scopeButtons[next].dataset.scope, { focus: true });
    });
  });

  revealButton.addEventListener('click', () => {
    const visibleCards = getVisibleCards();
    if (!visibleCards.length) return;
    const reveal = visibleCards.some(card => !card.classList.contains('is-flipped'));
    visibleCards.forEach(card => setCardFlipped(card, reveal));
    syncRevealButton();
  });
  randomButton.addEventListener('click', () => {
    const visibleCards = getVisibleCards();
    if (!visibleCards.length) {
      status.textContent = 'ランダム表示できる魚がありません。検索条件を変更してください。';
      return;
    }
    const card = visibleCards[Math.floor(Math.random() * visibleCards.length)];
    setCardFlipped(card, true);
    syncRevealButton();
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => card.querySelector('.fish-card-trigger').focus({ preventScroll: true }), 260);
  });

  resetButton.addEventListener('click', () => {
    searchInput.value = '';
    setScope('all', { update: false });
    cards.forEach(card => setCardFlipped(card, false));
    applyFilter();
    searchInput.focus();
  });

  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const tag = document.activeElement?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        event.preventDefault();
        searchInput.focus();
      }
    }
    if (event.key === 'Escape' && document.activeElement === searchInput && searchInput.value) {
      searchInput.value = '';
      applyFilter();
    }
  });
  if (bubbleContainer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (let i = 0; i < 12; i += 1) {
      const bubble = document.createElement('span');
      const size = 5 + Math.random() * 18;
      bubble.className = 'bubble';
      bubble.style.left = `${Math.random() * 100}%`;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.setProperty('--duration', `${12 + Math.random() * 14}s`);
      bubble.style.setProperty('--delay', `${-Math.random() * 18}s`);
      bubble.style.setProperty('--drift', `${-18 + Math.random() * 36}px`);
      bubbleContainer.appendChild(bubble);
    }
  }

  document.addEventListener('visibilitychange', () => {
    const state = document.hidden ? 'paused' : 'running';
    document.querySelectorAll('.bubble').forEach(bubble => {
      bubble.style.animationPlayState = state;
    });
  });

  const params = new URLSearchParams(window.location.search);
  searchInput.value = params.get('q') || '';
  setScope(params.get('scope') || 'all', { update: false });
  cards.forEach(card => setCardFlipped(card, false));
  applyFilter({ updateUrl: false });
});
