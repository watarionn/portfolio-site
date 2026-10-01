(() => {
  'use strict';

  const E = window.ModelInspectorEngine;
  const STORAGE_KEY = 'model-inspector-working-db';

  const DEFAULT_DB = {
    format:'model-db',
    schema_version:1,
    app_version:E.APP_VERSION,
    updated_at:E.now(),
    entries:[]
  };

  function hashString(value) {
    let hash = 2166136261;
    for (const ch of String(value)) {
      hash ^= ch.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function slug(value) {
    return E.clean(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) || 'model';
  }

  function normalizeEntry(raw = {}) {
    const source = E.normalizeRecord(raw);
    const rating = Number(raw.rating);
    const id = E.clean(raw.id) ||
      (source.version_id ? `model.civitai.${source.model_id || 'x'}.${source.version_id}` :
        `model.${slug(source.model_name || source.file_name)}.${hashString(source.model_name + '|' + source.file_name + '|' + source.version_name)}`);
    return {
      id,
      model_name:source.model_name || '名称未設定モデル',
      version_name:source.version_name,
      family:source.family,
      model_type:source.model_type,
      base_model:source.base_model,
      creator:source.creator,
      source_url:source.input_url,
      model_id:source.model_id,
      version_id:source.version_id,
      file_name:source.file_name,
      file_size_bytes:source.file_size_bytes,
      file_size_label:E.clean(raw.file_size_label) || E.formatBytes(source.file_size_bytes),
      sha256:source.sha256,
      trigger_words:E.list(source.trigger_words),
      prompt_profile:source.prompt_profile,
      resolution:source.resolution,
      controlnet:Boolean(source.controlnet),
      ip_adapter:Boolean(source.ip_adapter),
      vram_gb:E.clean(source.vram_gb),
      rating:Number.isFinite(rating) ? Math.max(0,Math.min(5,Math.round(rating))) : 0,
      tags:E.list(raw.tags),
      notes:E.clean(raw.notes),
      recommended_settings:source.recommended_settings,
      model_description:source.model_description,
      version_description:source.version_description,
      source:E.clean(source.source || raw.source),
      created_at:raw.created_at || E.now(),
      updated_at:raw.updated_at || raw.created_at || E.now()
    };
  }

  function normalizeDb(input = {}) {
    let entries = [];
    if (Array.isArray(input.entries)) entries = input.entries;
    else if (Array.isArray(input.records)) entries = input.records;
    return {
      format:'model-db',
      schema_version:1,
      app_version:E.APP_VERSION,
      updated_at:input.updated_at || E.now(),
      entries:entries.map(normalizeEntry)
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return normalizeDb(DEFAULT_DB);
      return normalizeDb(JSON.parse(raw));
    } catch {
      return normalizeDb(DEFAULT_DB);
    }
  }

  let db = load();

  function persist() {
    db.updated_at = E.now();
    db.app_version = E.APP_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    window.dispatchEvent(new CustomEvent('modelinspector:dbchange'));
  }

  function addEntry(raw) {
    const entry = normalizeEntry({...raw,id:undefined,created_at:E.now(),updated_at:E.now()});
    const existing = db.entries.findIndex((item) =>
      (entry.version_id && String(item.version_id) === String(entry.version_id)) ||
      (entry.sha256 && item.sha256 && item.sha256.toLowerCase() === entry.sha256.toLowerCase())
    );
    if (existing >= 0) {
      entry.id = db.entries[existing].id;
      entry.created_at = db.entries[existing].created_at;
      db.entries[existing] = entry;
    } else {
      db.entries.unshift(entry);
    }
    persist();
    return E.clone(entry);
  }

  function updateEntry(id, patch) {
    const index = db.entries.findIndex((entry) => entry.id === id);
    if (index < 0) throw new Error('モデルが見つかりません');
    const current = db.entries[index];
    const next = normalizeEntry({
      ...current,
      ...E.clone(patch),
      id,
      created_at:current.created_at,
      updated_at:E.now()
    });
    db.entries[index] = next;
    persist();
    return E.clone(next);
  }

  function deleteEntry(id) {
    db.entries = db.entries.filter((entry) => entry.id !== id);
    persist();
  }

  function merge(input) {
    const incoming = normalizeDb(input);
    const map = new Map(db.entries.map((entry) => [entry.id,entry]));
    incoming.entries.forEach((entry) => {
      const duplicate = [...map.values()].find((current) =>
        (entry.version_id && String(current.version_id) === String(entry.version_id)) ||
        (entry.sha256 && current.sha256 && current.sha256.toLowerCase() === entry.sha256.toLowerCase())
      );
      if (duplicate) {
        map.set(duplicate.id,{...duplicate,...entry,id:duplicate.id,created_at:duplicate.created_at});
      } else {
        map.set(entry.id,entry);
      }
    });
    db.entries = [...map.values()].sort((a,b) =>
      String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at))
    );
    persist();
  }

  async function importDb(file) {
    const parsed = JSON.parse(await file.text());
    if (parsed?.format !== 'model-db' && parsed?.format !== 'ai-creation-workbench-models') {
      throw new Error('モデルDBのJSON形式ではありません');
    }
    merge(parsed);
  }

  function exportObject() {
    return {
      ...E.clone(db),
      format:'model-db',
      schema_version:1,
      app_version:E.APP_VERSION,
      updated_at:E.now()
    };
  }

  window.ModelInspectorStore = Object.freeze({
    getDb:() => E.clone(db),
    addEntry,
    updateEntry,
    deleteEntry,
    merge,
    importDb,
    exportObject
  });
})();
