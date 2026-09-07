'use strict';
// =============================================
// My辞書 — my-dicts.js
// =============================================

let currentUser = null;
const container     = document.getElementById('dictsContainer');
const authRequired  = document.getElementById('authRequired');
const createDictBtn = document.getElementById('createDictBtn');
const dictFormModal = document.getElementById('dictFormModal');
const dictFormClose = document.getElementById('dictFormClose');
const dictFormCancel= document.getElementById('dictFormCancel');
const dictForm      = document.getElementById('dictForm');
const dictFormMsg   = document.getElementById('dictFormMsg');
const dictFormTitle = document.getElementById('dictFormTitle');
const dictFormSubmit= document.getElementById('dictFormSubmit');
const dictPublicChk = document.getElementById('dictPublic');
const dictPublicLbl = document.getElementById('dictPublicLabel');
const detailModal   = document.getElementById('dictDetailModal');
const detailClose   = document.getElementById('dictDetailClose');

(async function init() {
  currentUser = await getUser();
  if (!currentUser) {
    authRequired.hidden = false;
    container.innerHTML = '';
    createDictBtn.style.display = 'none';
    return;
  }
  await loadDicts();
})();

async function loadDicts() {
  container.innerHTML = '<div class="loading">読み込み中</div>';
  const { data, error } = await sb.from('dictionaries')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div>
      <p class="empty-text">まだ辞書がありません<br>右上の「新しい辞書を作る」から始めましょう</p></div>`;
    return;
  }

  container.innerHTML = `<div class="cards-grid">${data.map(renderDictCard).join('')}</div>`;
  container.querySelectorAll('.dict-card').forEach(function(el) {
    el.addEventListener('click', function() { openDictDetail(el.dataset.id); });
  });
}

function renderDictCard(dict) {
  return `
    <div class="dict-card" data-id="${dict.id}" role="button" tabindex="0">
      ${!dict.is_public ? '<span class="card-private-badge">非公開</span>' : ''}
      <div class="dict-card-name">${escHtml(dict.name)}</div>
      ${dict.description ? `<p class="dict-card-desc">${escHtml(dict.description)}</p>` : ''}
      <p class="dict-card-meta">${dict.is_public ? '公開' : '非公開'}　作成：${(dict.created_at||'').slice(0,10)}</p>
    </div>
  `;
}

/* ─── 辞書作成・編集フォーム ─── */
createDictBtn.addEventListener('click', function() {
  openDictForm(null);
});

dictPublicChk.addEventListener('change', function() {
  dictPublicLbl.textContent = this.checked
    ? '公開（辞書広場に表示されます）'
    : '非公開（自分のみ閲覧できます）';
});

function openDictForm(dict) {
  document.getElementById('editingDictId').value = dict ? dict.id : '';
  document.getElementById('dictName').value = dict ? dict.name : '';
  document.getElementById('dictDesc').value = dict ? (dict.description || '') : '';
  dictPublicChk.checked = dict ? dict.is_public : true;
  dictPublicLbl.textContent = dictPublicChk.checked ? '公開（辞書広場に表示されます）' : '非公開（自分のみ閲覧できます）';
  dictFormTitle.textContent = dict ? '辞書を編集する' : '辞書を作る';
  dictFormSubmit.textContent = dict ? '更新する' : '作成する';
  dictFormMsg.innerHTML = '';
  dictFormModal.hidden = false;
}

function closeDictForm() { dictFormModal.hidden = true; }
dictFormClose.addEventListener('click', closeDictForm);
dictFormCancel.addEventListener('click', closeDictForm);

dictForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const editId = document.getElementById('editingDictId').value;
  const name   = document.getElementById('dictName').value.trim();
  const desc   = document.getElementById('dictDesc').value.trim();
  const pub    = dictPublicChk.checked;

  if (!name) { dictFormMsg.innerHTML = '<div class="msg msg--err">辞書名は必須です。</div>'; return; }

  dictFormSubmit.disabled = true; dictFormSubmit.textContent = '…';

  let error;
  if (editId) {
    ({ error } = await sb.from('dictionaries').update({ name, description: desc || null, is_public: pub }).eq('id', editId));
  } else {
    ({ error } = await sb.from('dictionaries').insert({ user_id: currentUser.id, name, description: desc || null, is_public: pub }));
  }

  if (error) {
    dictFormMsg.innerHTML = '<div class="msg msg--err">保存に失敗しました。</div>';
  } else {
    closeDictForm();
    await loadDicts();
  }
  dictFormSubmit.disabled = false;
  dictFormSubmit.textContent = editId ? '更新する' : '作成する';
});

/* ─── 辞書詳細 ─── */
async function openDictDetail(dictId) {
  const { data: dict } = await sb.from('dictionaries').select('*').eq('id', dictId).single();
  if (!dict) return;

  document.getElementById('dictDetailHeader').innerHTML = `
    <div class="dict-header">
      <h2 class="dict-name">${escHtml(dict.name)}</h2>
      ${dict.description ? `<p class="dict-desc">${escHtml(dict.description)}</p>` : ''}
      <p class="dict-meta">${dict.is_public ? '公開' : '非公開'}　作成：${(dict.created_at||'').slice(0,10)}</p>
    </div>
  `;

  document.getElementById('dictDetailActions').innerHTML = `
    <button class="btn btn--ghost btn--sm" id="editDictBtn">辞書名・設定を編集</button>
    <button class="btn btn--ghost btn--sm" id="deleteDictBtn" style="color:var(--clr-vermilion);border-color:var(--clr-vermilion)">辞書を削除</button>
  `;

  document.getElementById('editDictBtn').addEventListener('click', function() {
    detailModal.hidden = true;
    openDictForm(dict);
  });
  document.getElementById('deleteDictBtn').addEventListener('click', async function() {
    if (!confirm(`「${dict.name}」を削除しますか？\n（用例カード自体は削除されません）`)) return;
    await sb.from('dictionaries').delete().eq('id', dictId);
    detailModal.hidden = true;
    loadDicts();
  });

  const { data: dcards } = await sb.from('dictionary_cards')
    .select('cards(*)')
    .eq('dictionary_id', dictId)
    .order('added_at', { ascending: false });

  const cardsEl = document.getElementById('dictDetailCards');
  if (dcards && dcards.length) {
    cardsEl.innerHTML = dcards.map(function(dc) {
      const c = dc.cards;
      if (!c) return '';
      return `<div style="position:relative">${renderCardHTML(c, {clickable:false})}
        <button class="remove-from-dict btn btn--sm" style="position:absolute;top:0.5rem;right:0.5rem;background:none;border:none;color:var(--clr-muted);cursor:pointer;font-size:0.75rem"
          data-dict="${dictId}" data-card="${c.id}" title="この辞書から削除">✕</button>
      </div>`;
    }).join('');

    cardsEl.querySelectorAll('.remove-from-dict').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (!confirm('この辞書からカードを削除しますか？')) return;
        await sb.from('dictionary_cards').delete()
          .eq('dictionary_id', this.dataset.dict)
          .eq('card_id', this.dataset.card);
        openDictDetail(dictId);
      });
    });
  } else {
    cardsEl.innerHTML = '<p class="empty-text" style="padding:1rem">この辞書にはまだ用例カードがありません</p>';
  }

  detailModal.hidden = false;
}

detailClose.addEventListener('click', function() { detailModal.hidden = true; });
detailModal.addEventListener('click', function(e) { if (e.target===detailModal) detailModal.hidden = true; });
