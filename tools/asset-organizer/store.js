(() => {
  'use strict';

  const E = window.AssetOrganizerEngine;
  const STORAGE_KEY = 'asset-organizer-working-db';

  const DEFAULT_DB = {
    format:'asset-db',
    schema_version:1,
    app_version:E.APP_VERSION,
    updated_at:E.now(),
    entries:[]
  };

  function list(value) {
    if (Array.isArray(value)) return [...new Set(value.map(E.clean).filter(Boolean))];
    return [...new Set(String(value || '').split(/[\n,|]+/).map(E.clean).filter(Boolean))];
  }

  function normalizeEntry(raw = {}) {
    const stem = E.clean(raw.stem || raw.source_stem);
    const status = ['PAIR','IMAGE_ONLY','JSON_ONLY','BROKEN_JSON'].includes(raw.status) ? raw.status : 'IMAGE_ONLY';
    const id = E.clean(raw.id) || `asset.${stem.toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'') || Date.now()}`;
    return {
      id,
      stem,
      base_stem:E.clean(raw.base_stem) || E.basenameStem(stem),
      directory:E.clean(raw.directory),
      status,
      name_collision:Boolean(raw.name_collision),
      collision_group_size:Number(raw.collision_group_size) || 1,
      collect_stem:E.clean(raw.collect_stem),
      image:raw.image ? E.clone(raw.image) : null,
      json:raw.json ? E.clone(raw.json) : null,
      extra_images:Array.isArray(raw.extra_images) ? E.clone(raw.extra_images) : [],
      extra_jsons:Array.isArray(raw.extra_jsons) ? E.clone(raw.extra_jsons) : [],
      tags:list(raw.tags),
      notes:E.clean(raw.notes),
      created_at:raw.created_at || E.now(),
      updated_at:raw.updated_at || raw.created_at || E.now()
    };
  }

  function normalizeDb(input = {}) {
    let entries = [];
    if (Array.isArray(input.entries)) entries = input.entries;
    else if (Array.isArray(input.records)) entries = input.records;
    return {
      format:'asset-db',
      schema_version:1,
      app_version:E.APP_VERSION,
      updated_at:input.updated_at || E.now(),
      entries:entries.map(normalizeEntry)
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeDb(JSON.parse(raw)) : normalizeDb(DEFAULT_DB);
    } catch {
      return normalizeDb(DEFAULT_DB);
    }
  }

  let db = load();

  function persist() {
    db.updated_at = E.now();
    db.app_version = E.APP_VERSION;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
    window.dispatchEvent(new CustomEvent('assetorganizer:dbchange'));
  }

  function upsert(raw) {
    const incoming = normalizeEntry(raw);
    const index = db.entries.findIndex((entry) => entry.id === incoming.id || entry.stem === incoming.stem);
    if (index >= 0) {
      const current = db.entries[index];
      db.entries[index] = normalizeEntry({
        ...incoming,
        id:current.id,
        tags:current.tags,
        notes:current.notes,
        created_at:current.created_at,
        updated_at:E.now()
      });
      persist();
      return E.clone(db.entries[index]);
    }
    incoming.updated_at = E.now();
    db.entries.unshift(incoming);
    persist();
    return E.clone(incoming);
  }

  function upsertMany(records) {
    records.forEach((record) => {
      const incoming = normalizeEntry(record);
      const index = db.entries.findIndex((entry) => entry.id === incoming.id || entry.stem === incoming.stem);
      if (index >= 0) {
        const current = db.entries[index];
        db.entries[index] = normalizeEntry({
          ...incoming,
          id:current.id,
          tags:current.tags,
          notes:current.notes,
          created_at:current.created_at,
          updated_at:E.now()
        });
      } else {
        incoming.updated_at = E.now();
        db.entries.push(incoming);
      }
    });
    db.entries.sort((a,b) => String(b.updated_at).localeCompare(String(a.updated_at)));
    persist();
  }

  function updateEntry(id,patch) {
    const index = db.entries.findIndex((entry) => entry.id === id);
    if (index < 0) throw new Error('アセットが見つかりません');
    const current = db.entries[index];
    db.entries[index] = normalizeEntry({
      ...current,
      ...E.clone(patch),
      id,
      created_at:current.created_at,
      updated_at:E.now()
    });
    persist();
    return E.clone(db.entries[index]);
  }

  function deleteEntry(id) {
    db.entries = db.entries.filter((entry) => entry.id !== id);
    persist();
  }

  function merge(input) {
    const incoming = normalizeDb(input);
    const map = new Map(db.entries.map((entry) => [entry.id,entry]));
    incoming.entries.forEach((entry) => {
      const existing = [...map.values()].find((current) => current.stem === entry.stem);
      if (existing) {
        map.set(existing.id,normalizeEntry({
          ...existing,
          ...entry,
          id:existing.id,
          tags:entry.tags.length ? entry.tags : existing.tags,
          notes:entry.notes || existing.notes,
          created_at:existing.created_at
        }));
      } else {
        map.set(entry.id,entry);
      }
    });
    db.entries = [...map.values()].sort((a,b) => String(b.updated_at).localeCompare(String(a.updated_at)));
    persist();
  }

  function legacyRecord(raw = {}) {
    const stem = E.clean(raw.stem);
    const png = E.clean(raw.png);
    const jsonName = E.clean(raw.json);
    const hasImage = Boolean(png);
    const hasJson = Boolean(jsonName);
    return {
      stem,
      base_stem:E.basenameStem(stem),
      status:hasImage && hasJson ? 'PAIR' : hasImage ? 'IMAGE_ONLY' : 'JSON_ONLY',
      image:hasImage ? {
        name:png,
        path:png,
        bytes:Number(raw.png_bytes) || 0,
        type:'image/png',
        width:0,
        height:0,
        extension:'png'
      } : null,
      json:hasJson ? {
        name:jsonName,
        path:jsonName,
        bytes:Number(raw.json_bytes) || 0,
        type:'application/json',
        extension:'json',
        valid:true,
        error:'',
        keys:[]
      } : null,
      collect_stem:E.basenameStem(stem)
    };
  }

  async function importDb(file) {
    const data = JSON.parse(await file.text());
    if (data?.format === 'ai-creation-workbench-assets') {
      merge({format:'asset-db',entries:(data.records || []).map(legacyRecord)});
      return;
    }
    if (data?.format !== 'asset-db' && data?.format !== 'asset-organizer-manifest') {
      throw new Error('Asset DBまたはAsset Organizer manifestではありません');
    }
    merge(data);
  }

  function exportObject() {
    return {
      ...E.clone(db),
      format:'asset-db',
      schema_version:1,
      app_version:E.APP_VERSION,
      updated_at:E.now()
    };
  }

  window.AssetOrganizerStore = Object.freeze({
    getDb:() => E.clone(db),
    upsert,
    upsertMany,
    updateEntry,
    deleteEntry,
    merge,
    importDb,
    exportObject
  });
})();
