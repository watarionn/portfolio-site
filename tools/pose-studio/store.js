(() => {
  'use strict';

  const STORAGE_KEY = 'pose-studio-working-db';
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const now = () => new Date().toISOString();

  const DEFAULT_DB = {
    format: 'pose-db',
    schema_version: 1,
    app_version: '1.2.0',
    updated_at: now(),
    entries: []
  };

  function normalizeTags(value) {
    const list = Array.isArray(value) ? value : clean(value).split(',');
    return [...new Set(list.map(clean).filter(Boolean))];
  }

  function normalizeEntry(entry = {}) {
    if (!entry || typeof entry !== 'object') return null;
    const id = clean(entry.id) || `pose.${Date.now().toString(36)}.${Math.random().toString(36).slice(2,8)}`;
    const title = clean(entry.title) || '名称未設定のポーズ';
    const sourceMode = entry.source_mode === '2d' ? '2d' : '3d';
    return {
      id,
      title,
      tags: normalizeTags(entry.tags),
      source_mode: sourceMode,
      pose3d: entry.pose3d && typeof entry.pose3d === 'object' ? clone(entry.pose3d) : null,
      pose2d: entry.pose2d && typeof entry.pose2d === 'object' ? clone(entry.pose2d) : null,
      created_at: entry.created_at || now(),
      updated_at: entry.updated_at || entry.created_at || now()
    };
  }

  function normalizeDb(input = {}) {
    const entries = Array.isArray(input.entries)
      ? input.entries.map(normalizeEntry).filter(Boolean)
      : [];
    return {
      format: 'pose-db',
      schema_version: 1,
      app_version: '1.2.0',
      updated_at: input.updated_at || now(),
      entries
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return normalizeDb(DEFAULT_DB);
      const parsed = JSON.parse(raw);
      if (parsed?.format !== 'pose-db') return normalizeDb(DEFAULT_DB);
      return normalizeDb(parsed);
    } catch {
      return normalizeDb(DEFAULT_DB);
    }
  }

  let db = load();

  function persist() {
    db.updated_at = now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    window.dispatchEvent(new CustomEvent('posestudio:dbchange'));
  }

  function addEntry(input) {
    const entry = normalizeEntry({
      ...input,
      id: undefined,
      created_at: now(),
      updated_at: now()
    });
    db.entries.unshift(entry);
    persist();
    return clone(entry);
  }

  function updateEntry(id, patch) {
    const index = db.entries.findIndex((entry) => entry.id === id);
    if (index < 0) throw new Error('ポーズが見つかりません');
    const next = normalizeEntry({
      ...db.entries[index],
      ...clone(patch),
      id,
      created_at: db.entries[index].created_at,
      updated_at: now()
    });
    db.entries[index] = next;
    persist();
    return clone(next);
  }

  function deleteEntry(id) {
    db.entries = db.entries.filter((entry) => entry.id !== id);
    persist();
  }

  function merge(input) {
    const incoming = normalizeDb(input);
    const map = new Map(db.entries.map((entry) => [entry.id, entry]));
    incoming.entries.forEach((entry) => map.set(entry.id, entry));
    db.entries = [...map.values()].sort((a,b) =>
      String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at))
    );
    persist();
  }

  async function importDb(file) {
    const parsed = JSON.parse(await file.text());
    if (parsed?.format !== 'pose-db') throw new Error('ポーズDBのJSON形式ではありません');
    merge(parsed);
  }

  function exportObject() {
    return {
      ...clone(db),
      format: 'pose-db',
      schema_version: 1,
      app_version: '1.2.0',
      updated_at: now()
    };
  }

  window.PoseStudioStore = Object.freeze({
    getDb: () => clone(db),
    addEntry,
    updateEntry,
    deleteEntry,
    importDb,
    exportObject
  });
})();
