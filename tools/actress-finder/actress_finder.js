'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const people = [];
  const maxPeople = 12;
  const focusButtons = Array.from(document.querySelectorAll('.focus-btn'));
  const tagEditor = document.getElementById('tag-editor');
  const tagList = document.getElementById('tag-list');
  const personInput = document.getElementById('person-input');
  const peopleCount = document.getElementById('people-count');
  const focusSummary = document.getElementById('focus-summary');
  const briefState = document.getElementById('brief-state');
  const buildButton = document.getElementById('build-brief');
  const copyButton = document.getElementById('copy-brief');
  const copyLinkButton = document.getElementById('copy-link');
  const resetButton = document.getElementById('reset-all');
  const briefStatus = document.getElementById('brief-status');
  const briefOutput = document.getElementById('brief-output');
  const resultJson = document.getElementById('result-json');
  const renderButton = document.getElementById('render-results');
  const clearButton = document.getElementById('clear-results');
  const importStatus = document.getElementById('import-status');
  const resultsPanel = document.getElementById('results-panel');
  const resultCount = document.getElementById('result-count');
  const analysisSummary = document.getElementById('analysis-summary');
  const resultList = document.getElementById('result-list');
  let currentFocus = 'face';
  let briefReady = false;

  function setStatus(element, message, kind = '') {
    element.textContent = message;
    element.classList.toggle('is-error', kind === 'error');
    element.classList.toggle('is-success', kind === 'success');
  }

  function normalizeName(value) {
    return String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ');
  }

  function focusLabel() {
    const active = focusButtons.find(button => button.dataset.focus === currentFocus);
    return active?.dataset.value || '見た目・顔立ち';
  }

  function focusCode() {
    return ({ face: 'FACE', vibe: 'VIBE', style: 'STYLE', balance: 'BALANCE' })[currentFocus] || 'FACE';
  }

  function syncMetrics() {
    peopleCount.textContent = String(people.length);
    focusSummary.textContent = focusCode();
    briefState.textContent = briefReady ? 'READY' : 'WAIT';
    copyButton.disabled = !briefReady;
  }

  function syncUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('person');
    people.forEach(name => url.searchParams.append('person', name));
    currentFocus === 'face' ? url.searchParams.delete('focus') : url.searchParams.set('focus', currentFocus);
    history.replaceState(null, '', url);
  }

  function markBriefStale() {
    briefReady = false;
    briefOutput.value = '';
    syncMetrics();
  }

  function createTag(name, index) {
    const tag = document.createElement('span');
    tag.className = 'person-tag';
    const text = document.createElement('span');
    text.textContent = name;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `${name}を削除`);
    remove.addEventListener('click', () => removePerson(index));
    tag.append(text, remove);
    return tag;
  }

  function renderPeople() {
    tagList.replaceChildren(...people.map(createTag));
    syncMetrics();
    syncUrl();
  }

  function addPerson(rawName) {
    const name = normalizeName(rawName);
    if (!name) return false;
    if (people.some(item => item.toLocaleLowerCase() === name.toLocaleLowerCase())) return false;
    if (people.length >= maxPeople) {
      setStatus(briefStatus, `登録できる人物は最大${maxPeople}人です。`, 'error');
      return false;
    }
    people.push(name.slice(0, 80));
    personInput.value = '';
    markBriefStale();
    renderPeople();
    setStatus(briefStatus, `${name}を追加しました。`);
    return true;
  }

  function addFromText(rawText) {
    const parts = String(rawText || '').split(/[、,，\n]+/).map(normalizeName).filter(Boolean);
    let added = 0;
    parts.forEach(name => { if (addPerson(name)) added += 1; });
    return added;
  }

  function removePerson(index) {
    if (index < 0 || index >= people.length) return;
    const [removed] = people.splice(index, 1);
    markBriefStale();
    renderPeople();
    setStatus(briefStatus, `${removed}を削除しました。`);
    personInput.focus();
  }

  function setFocus(focus, { moveFocus = false } = {}) {
    currentFocus = focusButtons.some(button => button.dataset.focus === focus) ? focus : 'face';
    focusButtons.forEach(button => {
      const active = button.dataset.focus === currentFocus;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && moveFocus) button.focus();
    });
    markBriefStale();
    syncMetrics();
    syncUrl();
  }

  function buildPrompt() {
    const names = people.join('、');
    return [
      'あなたは女優・出演者情報に詳しいリサーチアシスタントです。',
      `好きな人物: ${names}`,
      `重視ポイント: ${focusLabel()}`,
      '',
      '上記の好みを参考に、まだ挙がっていない類似候補を5〜7名提案してください。',
      '実在確認できない人物や、不確かな経歴・属性は作らないでください。',
      '候補同士を比較しやすいよう、同じ粒度の特徴と理由を使ってください。',
      '返答は次のJSON形式だけにしてください。Markdownのコードフェンスや前置きは不要です。',
      '{',
      '  "analysis": "好みの傾向を1〜2文で簡潔に",',
      '  "suggestions": [',
      '    {',
      '      "name": "候補名",',
      '      "similarity": 85,',
      '      "tags": ["特徴1", "特徴2", "特徴3"],',
      '      "reason": "候補にした理由を2〜3文で"',
      '    }',
      '  ]',
      '}',
      'similarityは0〜100の整数、tagsは3〜5個の短い語にしてください。'
    ].join('\n');
  }
  function generateBrief() {
    const pending = normalizeName(personInput.value);
    if (pending) addFromText(pending);
    if (!people.length) {
      setStatus(briefStatus, '人物を1人以上追加してください。', 'error');
      personInput.focus();
      return;
    }
    briefOutput.value = buildPrompt();
    briefReady = true;
    syncMetrics();
    setStatus(briefStatus, `${people.length}人・${focusLabel()}で推薦ブリーフを作成しました。`, 'success');
  }

  async function copyText(text) {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      const copied = document.execCommand('copy');
      helper.remove();
      return copied;
    }
  }

  function cleanJsonText(value) {
    return String(value || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  function parseSuggestions(value) {
    const parsed = JSON.parse(cleanJsonText(value));
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.suggestions)) {
      throw new Error('suggestions配列が見つかりません。');
    }
    const suggestions = parsed.suggestions.slice(0, 12).map((item, index) => {
      if (!item || typeof item !== 'object') throw new Error(`${index + 1}件目の候補形式が不正です。`);
      const name = normalizeName(item.name);
      if (!name) throw new Error(`${index + 1}件目にnameがありません。`);
      const rawSimilarity = Number(item.similarity);
      const similarity = Number.isFinite(rawSimilarity) ? Math.max(0, Math.min(100, Math.round(rawSimilarity))) : 0;
      const tags = Array.isArray(item.tags)
        ? item.tags.map(tag => normalizeName(tag)).filter(Boolean).slice(0, 8)
        : [];
      const reason = normalizeName(item.reason || '');
      return { name, similarity, tags, reason };
    });
    if (!suggestions.length) throw new Error('候補が0件です。');
    suggestions.sort((a, b) => b.similarity - a.similarity);
    return {
      analysis: normalizeName(parsed.analysis || ''),
      suggestions
    };
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  }
  function renderSuggestions(result) {
    const rows = result.suggestions.map((suggestion, index) => {
      const row = document.createElement('article');
      row.className = 'result-row';
      row.setAttribute('role', 'listitem');

      const rank = document.createElement('div');
      rank.className = 'rank-cell';
      rank.append(
        createTextElement('span', 'rank-number', `#${String(index + 1).padStart(2, '0')}`),
        createTextElement('strong', 'similarity-value', `${suggestion.similarity}%`)
      );
      const track = document.createElement('div');
      track.className = 'similarity-track';
      const fill = document.createElement('div');
      fill.className = 'similarity-fill';
      fill.style.width = `${suggestion.similarity}%`;
      track.appendChild(fill);
      rank.appendChild(track);

      const identity = document.createElement('div');
      identity.appendChild(createTextElement('h3', 'candidate-name', suggestion.name));
      const tags = document.createElement('div');
      tags.className = 'candidate-tags';
      suggestion.tags.forEach(tag => tags.appendChild(createTextElement('span', 'candidate-tag', tag)));
      identity.appendChild(tags);
      const reason = createTextElement('p', 'candidate-reason', suggestion.reason || '理由の記載はありません。');
      row.append(rank, identity, reason);
      return row;
    });

    resultList.replaceChildren(...rows);
    resultCount.textContent = String(result.suggestions.length);
    analysisSummary.textContent = result.analysis || '候補を類似度順に表示しています。';
    resultsPanel.hidden = false;
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearImportedResults() {
    resultJson.value = '';
    resultList.replaceChildren();
    resultCount.textContent = '0';
    analysisSummary.textContent = '';
    resultsPanel.hidden = true;
    setStatus(importStatus, 'JSONはこのページ内だけで解析します。');
  }

  tagEditor.addEventListener('click', event => {
    if (!event.target.closest('.person-tag button')) personInput.focus();
  });

  personInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ',' || event.key === '、') {
      event.preventDefault();
      addFromText(personInput.value);
      personInput.value = '';
    } else if (event.key === 'Backspace' && !personInput.value && people.length) {
      removePerson(people.length - 1);
    }
  });
  personInput.addEventListener('input', () => {
    const value = personInput.value;
    if (/[、,，\n]/.test(value)) {
      addFromText(value);
      personInput.value = '';
    }
  });

  focusButtons.forEach((button, index) => {
    button.addEventListener('click', () => setFocus(button.dataset.focus));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + focusButtons.length) % focusButtons.length;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % focusButtons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = focusButtons.length - 1;
      setFocus(focusButtons[next].dataset.focus, { moveFocus: true });
    });
  });

  buildButton.addEventListener('click', generateBrief);

  copyButton.addEventListener('click', async () => {
    const copied = await copyText(briefOutput.value);
    setStatus(briefStatus, copied ? '推薦ブリーフをコピーしました。' : 'コピーできませんでした。', copied ? 'success' : 'error');
  });
  copyLinkButton.addEventListener('click', async () => {
    syncUrl();
    const copied = await copyText(window.location.href);
    setStatus(briefStatus, copied ? '現在の人物と重視軸を含むURLをコピーしました。' : 'URLをコピーできませんでした。', copied ? 'success' : 'error');
  });

  resetButton.addEventListener('click', () => {
    people.splice(0, people.length);
    personInput.value = '';
    setFocus('face');
    briefOutput.value = '';
    briefReady = false;
    renderPeople();
    clearImportedResults();
    setStatus(briefStatus, '人物を1人以上追加すると推薦ブリーフを作成できます。');
    personInput.focus();
  });

  renderButton.addEventListener('click', () => {
    try {
      const result = parseSuggestions(resultJson.value);
      renderSuggestions(result);
      setStatus(importStatus, `${result.suggestions.length}件の候補を読み込みました。`, 'success');
    } catch (error) {
      resultsPanel.hidden = true;
      setStatus(importStatus, `JSONを読み込めません: ${error.message}`, 'error');
    }
  });

  clearButton.addEventListener('click', clearImportedResults);

  resultJson.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      renderButton.click();
    }
  });
  function restoreFromUrl() {
    const params = new URLSearchParams(window.location.search);
    params.getAll('person').slice(0, maxPeople).forEach(name => {
      const clean = normalizeName(name).slice(0, 80);
      if (clean && !people.includes(clean)) people.push(clean);
    });
    const focus = params.get('focus') || 'face';
    setFocus(focus);
    renderPeople();
    if (people.length) {
      setStatus(briefStatus, `${people.length}人の共有状態を復元しました。`);
    }
  }

  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const tag = document.activeElement?.tagName;
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        event.preventDefault();
        personInput.focus();
      }
    }
  });

  restoreFromUrl();
  syncMetrics();
});
