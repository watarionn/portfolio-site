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
    const input = $('conceptCategoryInput');
    const categories = conceptCategories();
    if (!input.value && categories.length) input.value = categories[0];
    return E.clean(input.value);
  }

  function resetConceptForm() {
    editingConceptId = null;
    $('conceptValue').value = '';
    $('conceptLabelJa').value = '';
    $('conceptTags').value = '';
    $('conceptWeight').value = '1';
    $('conceptSaveButton').textContent = 'Conceptを追加';
    $('conceptCancelButton').hidden = true;
  }

  function fillConceptForm(entry) {
    editingConceptId = entry.id;
    $('conceptValue').value = entry.value || '';
    $('conceptLabelJa').value = entry.label_ja || '';
    $('conceptTags').value = (entry.tags || []).join(', ');
    $('conceptWeight').value = String(entry.weight == null ? 1 : entry.weight);
    $('conceptSaveButton').textContent = 'Conceptを更新';
    $('conceptCancelButton').hidden = false;
    $('conceptValue').focus();
  }

  function saveConcept() {
    const category = currentCategory();
    const value = E.clean($('conceptValue').value);
    if (!category || !value) {
      notify('CategoryとValueを入力してください');
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
      notify(editingConceptId ? 'Conceptを更新しました' : 'Conceptを追加しました');
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
      empty.textContent = category ? 'このCategoryにはまだConceptがありません。' : 'Category名を入力して最初のConceptを追加できます。';
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
      meta.textContent = bits.join(' / ') || 'no metadata';
      info.append(value, meta);

      const weight = document.createElement('div');
      weight.className = 'concept-weight';
      const weightLabel = document.createElement('span');
      weightLabel.textContent = 'weight';
      const weightValue = document.createElement('b');
      weightValue.textContent = Number(entry.weight || 1).toFixed(2).replace(/\.00$/,'');
      weight.append(weightLabel, weightValue);

      const actions = document.createElement('div');
      actions.className = 'concept-actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.textContent = 'Edit';
      edit.addEventListener('click', () => fillConceptForm(entry));
      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = 'Delete';
      del.className = 'danger-button';
      del.addEventListener('click', () => {
        Store.deleteConcept(category, entry.id);
        notify('Conceptを削除しました');
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
      empty.textContent = 'まだRecipeがありません。ComposeのSlot Composerから保存できます。';
      box.append(empty);
      return;
    }

    db.recipes.forEach((recipe) => {
      const article = document.createElement('article');
      article.className = 'recipe-row';

      const info = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = recipe.title || recipe.id || 'Untitled recipe';
      const meta = document.createElement('p');
      meta.textContent = recipe.type === 'slot-recipe'
        ? String((recipe.slots || []).length) + ' slots · ' + (recipe.updated_at ? new Date(recipe.updated_at).toLocaleString('ja-JP') : 'saved')
        : ('legacy template · ' + (recipe.group || '') + ' ' + (recipe.sentence_file || '')).trim();
      const preview = document.createElement('code');
      preview.textContent = recipe.type === 'slot-recipe'
        ? (recipe.slots || []).map((slot) => slot.target + '←' + slot.category + ':' + slot.mode).join(' / ')
        : (recipe.template || '');
      info.append(title, meta, preview);

      const actions = document.createElement('div');
      actions.className = 'recipe-actions';
      if (recipe.type === 'slot-recipe') {
        const load = document.createElement('button');
        load.type = 'button';
        load.textContent = 'Load';
        load.addEventListener('click', () => {
          if (window.PromptStudioSlots && window.PromptStudioSlots.loadRecipe(recipe)) notify('RecipeをSlot Composerへ読み込みました');
        });
        actions.append(load);
      } else if (recipe.template) {
        const copy = document.createElement('button');
        copy.type = 'button';
        copy.textContent = 'Copy template';
        copy.addEventListener('click', async () => {
          await navigator.clipboard.writeText(recipe.template);
          notify('Legacy templateをコピーしました');
        });
        actions.append(copy);
      }

      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = 'Delete';
      del.className = 'danger-button';
      del.addEventListener('click', () => {
        Store.deleteRecipe(recipe.id);
        notify('Recipeを削除しました');
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
  resetConceptForm();
  renderConcepts();
  renderRecipes();

  window.PromptStudioDbEditor = Object.freeze({
    setDbSection, renderConcepts, renderRecipes
  });
})();