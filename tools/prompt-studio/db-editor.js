(() => {
  'use strict';

  const E = window.PromptStudioEngine;
  const Store = window.PromptStudioStore;
  const $ = (id) => document.getElementById(id);
  let editingConceptId = null;

  function notify(message) {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.add('hidden'), 2200);
  }

  function setDbSection(name) {
    document.querySelectorAll('.db-section-tab').forEach((button) => {
      const active = button.dataset.dbSection === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    ['library','concepts','recipes'].forEach((section) => {
      const panel = $(section + 'Panel');
      if (!panel) return;
      const active = section === name;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
    if (name === 'concepts') renderConcepts();
    if (name === 'recipes') renderRecipes();
  }

  function conceptCategories() {
    return Object.keys(Store.getDb().concepts || {}).sort((a,b) => a.localeCompare(b));
  }

  function updateCategoryOptions() {
    const datalist = $('conceptCategoryOptions');
    if (!datalist) return;
    datalist.replaceChildren();
    conceptCategories().forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      datalist.append(option);
    });
  }

  function currentCategory() {
    return E.clean($('conceptCategoryInput').value);
  }

  function resetConceptForm() {
    editingConceptId = null;
    $('conceptValue').value = '';
    $('conceptLabelJa').value = '';
    $('conceptTags').value = '';
    $('conceptWeight').value = '1';
    $('conceptSaveButton').textContent = 'パーツを追加';
    $('conceptCancelButton').hidden = true;
  }

  function fillConceptForm(entry) {
    editingConceptId = entry.id;
    $('conceptValue').value = entry.value || '';
    $('conceptLabelJa').value = entry.label_ja || '';
    $('conceptTags').value = (entry.tags || []).join(', ');
    $('conceptWeight').value = String(entry.weight == null ? 1 : entry.weight);
    $('conceptSaveButton').textContent = 'パーツを更新';
    $('conceptCancelButton').hidden = false;
    $('conceptValue').focus();
  }

  function saveConcept() {
    const category = currentCategory();
    const value = E.clean($('conceptValue').value);
    if (!category || !value) {
      notify('カテゴリとプロンプト用の内容を入力してください');
      return;
    }
    const input = {
      value,
      label_ja: E.clean($('conceptLabelJa').value),
      tags: E.list($('conceptTags').value),
      weight: Number($('conceptWeight').value) || 1
    };
    try {
      if (editingConceptId) Store.updateConcept(category, editingConceptId, input);
      else Store.addConcept(category, input);
      notify(editingConceptId ? 'パーツを更新しました' : 'パーツを追加しました');
      resetConceptForm();
    } catch (error) {
      notify(error.message || String(error));
    }
  }

  function renderConcepts() {
    updateCategoryOptions();
    const category = currentCategory();
    const db = Store.getDb();
    const entries = E.normalizeConceptEntries(db.concepts && db.concepts[category], category);
    const box = $('conceptList');
    if (!box) return;
    box.replaceChildren();

    $('conceptCountForCategory').textContent = String(entries.length);
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'db-empty';
      empty.textContent = category ? 'このカテゴリにはまだパーツがありません。' : 'カテゴリ名を入力して最初のパーツを追加できます。';
      box.append(empty);
      return;
    }

    entries.forEach((entry) => {
      const row = document.createElement('article');
      row.className = 'concept-row';

      const info = document.createElement('div');
      const value = document.createElement('strong');
      value.textContent = entry.value;
      const meta = document.createElement('span');
      const bits = [];
      if (entry.label_ja) bits.push(entry.label_ja);
      if (entry.tags && entry.tags.length) bits.push(entry.tags.join(' · '));
      meta.textContent = bits.join(' / ') || '補足なし';
      info.append(value, meta);

      const weight = document.createElement('div');
      weight.className = 'concept-weight';
      const weightLabel = document.createElement('span');
      weightLabel.textContent = '重み';
      const weightValue = document.createElement('b');
      weightValue.textContent = Number(entry.weight || 1).toFixed(2).replace(/\.00$/,'');
      weight.append(weightLabel, weightValue);

      const actions = document.createElement('div');
      actions.className = 'concept-actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = '編集';
      edit.addEventListener('click', () => fillConceptForm(entry));
      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = '削除';
      del.className = 'danger-button';
      del.addEventListener('click', () => {
        Store.deleteConcept(category, entry.id);
        notify('パーツを削除しました');
      });
      actions.append(edit, del);

      row.append(info, weight, actions);
      box.append(row);
    });
  }

  function renderRecipes() {
    const db = Store.getDb();
    const box = $('recipeList');
    if (!box) return;
    box.replaceChildren();

    if (!db.recipes.length) {
      const empty = document.createElement('div');
      empty.className = 'db-empty';
      empty.textContent = 'まだ組み立てレシピがありません。「プロンプト作成」の組み立てルールから保存できます。';
      box.append(empty);
      return;
    }

    db.recipes.forEach((recipe) => {
      const article = document.createElement('article');
      article.className = 'recipe-row';

      const info = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = recipe.title || recipe.id || '名称未設定のレシピ';
      const meta = document.createElement('p');
      meta.textContent = recipe.type === 'slot-recipe'
        ? String((recipe.slots || []).length) + '項目 · ' + (recipe.updated_at ? new Date(recipe.updated_at).toLocaleString('ja-JP') : '保存済み')
        : '';
      const preview = document.createElement('code');
      const modeLabel = { manual:'手動', random:'重み付きランダム', sequential:'順番' };
      preview.textContent = (recipe.slots || []).map((slot) => slot.target + ' ← ' + slot.category + '（' + (modeLabel[slot.mode] || slot.mode) + '）').join(' / ');
      info.append(title, meta, preview);

      const actions = document.createElement('div');
      actions.className = 'recipe-actions';
      if (recipe.type === 'slot-recipe') {
        const load = document.createElement('button');
        load.type = 'button';
        load.textContent = '読み込む';
        load.addEventListener('click', () => {
          if (window.PromptStudioSlots && window.PromptStudioSlots.loadRecipe(recipe)) notify('レシピを組み立てルールへ読み込みました');
        });
        actions.append(load);
      }

      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = '削除';
      del.className = 'danger-button';
      del.addEventListener('click', () => {
        Store.deleteRecipe(recipe.id);
        notify('レシピを削除しました');
      });
      actions.append(del);

      article.append(info, actions);
      box.append(article);
    });
  }

  document.querySelectorAll('.db-section-tab').forEach((button) => {
    button.addEventListener('click', () => setDbSection(button.dataset.dbSection));
  });
  $('conceptCategoryInput')?.addEventListener('change', () => {
    resetConceptForm();
    renderConcepts();
  });
  $('conceptCategoryInput')?.addEventListener('input', () => {
    if (conceptCategories().includes(E.clean($('conceptCategoryInput').value))) renderConcepts();
  });
  $('conceptSaveButton')?.addEventListener('click', saveConcept);
  $('conceptCancelButton')?.addEventListener('click', resetConceptForm);
  window.addEventListener('promptstudio:dbchange', () => {
    updateCategoryOptions();
    renderConcepts();
    renderRecipes();
  });

  updateCategoryOptions();
  if (!$('conceptCategoryInput').value && conceptCategories().length) {
    $('conceptCategoryInput').value = conceptCategories()[0];
  }
  resetConceptForm();
  renderConcepts();
  renderRecipes();

  window.PromptStudioDbEditor = Object.freeze({
    setDbSection, renderConcepts, renderRecipes
  });
})();