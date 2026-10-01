(() => {
  'use strict';

  const APP_VERSION = '1.0.0';
  const IMAGE_EXTS = new Set(['png','jpg','jpeg','webp']);
  const JSON_EXTS = new Set(['json']);

  const clean = (value) => String(value ?? '').replace(/\s+/g,' ').trim();
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();

  function normalizePath(value) {
    return String(value || '').replaceAll('\\','/').replace(/^\.\//,'').replace(/\/+/g,'/');
  }

  function relativePath(file) {
    const raw = normalizePath(file.webkitRelativePath || file.name);
    const parts = raw.split('/').filter(Boolean);
    if (parts.length > 1) parts.shift();
    return parts.join('/');
  }

  function extOf(name) {
    const match = String(name || '').toLowerCase().match(/\.([^.]+)$/);
    return match ? match[1] : '';
  }

  function stemOf(path) {
    return normalizePath(path).replace(/\.[^.\/]+$/,'');
  }

  function basenameStem(stem) {
    const parts = normalizePath(stem).split('/');
    return parts[parts.length - 1] || '';
  }

  function dirname(stem) {
    const parts = normalizePath(stem).split('/');
    parts.pop();
    return parts.join('/');
  }

  function hashString(value) {
    let hash = 2166136261;
    for (const ch of String(value)) {
      hash ^= ch.charCodeAt(0);
      hash = Math.imul(hash,16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function formatBytes(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return '0 B';
    const units = ['B','KB','MB','GB','TB'];
    let value = n, index = 0;
    while (value >= 1024 && index < units.length - 1) {
      value /= 1024; index += 1;
    }
    const digits = index >= 3 ? 2 : index === 2 ? 1 : 0;
    return `${value.toFixed(digits)} ${units[index]}`;
  }

  async function imageMeta(file) {
    let width = 0, height = 0;
    try {
      if (typeof createImageBitmap === 'function') {
        const bitmap = await createImageBitmap(file);
        width = bitmap.width;
        height = bitmap.height;
        bitmap.close?.();
      } else {
        const url = URL.createObjectURL(file);
        try {
          const image = await new Promise((resolve,reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
          });
          width = image.naturalWidth || image.width || 0;
          height = image.naturalHeight || image.height || 0;
        } finally {
          URL.revokeObjectURL(url);
        }
      }
    } catch {}
    return {
      name:file.name,
      path:relativePath(file),
      bytes:Number(file.size) || 0,
      type:file.type || '',
      width,
      height,
      extension:extOf(file.name)
    };
  }

  async function jsonMeta(file) {
    let valid = true, error = '', keys = [];
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) keys = Object.keys(parsed).slice(0,24);
    } catch (err) {
      valid = false;
      error = clean(err?.message || String(err));
    }
    return {
      name:file.name,
      path:relativePath(file),
      bytes:Number(file.size) || 0,
      type:file.type || 'application/json',
      extension:'json',
      valid,
      error,
      keys
    };
  }

  function baseRecord(stem) {
    return {
      id:`asset.${hashString(stem)}`,
      stem,
      base_stem:basenameStem(stem),
      directory:dirname(stem),
      status:'EMPTY',
      image:null,
      json:null,
      extra_images:[],
      extra_jsons:[],
      json_valid:true,
      json_error:'',
      name_collision:false,
      collision_group_size:1,
      collect_stem:'',
      tags:[],
      notes:''
    };
  }

  async function auditFiles(files) {
    const useful = [...files].filter((file) => {
      const ext = extOf(file.name);
      const path = normalizePath(file.webkitRelativePath || file.name);
      return (IMAGE_EXTS.has(ext) || JSON_EXTS.has(ext)) && !/(^|\/)collect(\/|$)/i.test(path);
    });

    const groups = new Map();
    for (const file of useful) {
      const path = relativePath(file);
      const stem = stemOf(path);
      if (!groups.has(stem)) groups.set(stem,{stem,images:[],jsons:[]});
      const ext = extOf(file.name);
      if (IMAGE_EXTS.has(ext)) groups.get(stem).images.push(file);
      else if (JSON_EXTS.has(ext)) groups.get(stem).jsons.push(file);
    }

    const records = [];
    for (const group of [...groups.values()].sort((a,b) => a.stem.localeCompare(b.stem,'ja'))) {
      const record = baseRecord(group.stem);
      const imageMetas = [];
      for (const file of group.images) imageMetas.push(await imageMeta(file));
      const jsonMetas = [];
      for (const file of group.jsons) jsonMetas.push(await jsonMeta(file));
      record.image = imageMetas[0] || null;
      record.json = jsonMetas[0] || null;
      record.extra_images = imageMetas.slice(1);
      record.extra_jsons = jsonMetas.slice(1);
      record.json_valid = !record.json || record.json.valid;
      record.json_error = record.json?.error || '';

      if (record.json && !record.json.valid) record.status = 'BROKEN_JSON';
      else if (record.image && record.json) record.status = 'PAIR';
      else if (record.image) record.status = 'IMAGE_ONLY';
      else if (record.json) record.status = 'JSON_ONLY';

      records.push(record);
    }

    const byBase = new Map();
    records.forEach((record) => {
      if (!byBase.has(record.base_stem)) byBase.set(record.base_stem,[]);
      byBase.get(record.base_stem).push(record);
    });
    byBase.forEach((items) => {
      const collision = items.length > 1;
      items.forEach((record) => {
        record.name_collision = collision;
        record.collision_group_size = items.length;
      });
    });

    const plan = buildCollectPlan(records);
    const collectMap = new Map(plan.map((item) => [item.record_id,item.collect_stem]));
    records.forEach((record) => { record.collect_stem = collectMap.get(record.id) || record.base_stem; });
    return records;
  }

  function recordFiles(record) {
    const files = [];
    if (record.image) files.push(record.image);
    if (record.json) files.push(record.json);
    (record.extra_images || []).forEach((item) => files.push(item));
    (record.extra_jsons || []).forEach((item) => files.push(item));
    return files;
  }

  function buildCollectPlan(records) {
    const used = new Set();
    const plan = [];
    for (const record of [...records].sort((a,b) => a.stem.localeCompare(b.stem,'ja'))) {
      const base = clean(record.base_stem) || 'asset';
      let index = 0;
      let candidate = base;
      while (used.has(candidate.toLowerCase())) {
        index += 1;
        candidate = `${base}_${index}`;
      }
      used.add(candidate.toLowerCase());
      const files = recordFiles(record).map((file) => ({
        source_path:file.path,
        source_name:file.name,
        extension:file.extension || extOf(file.name),
        destination_name:`${candidate}.${file.extension || extOf(file.name)}`,
        bytes:file.bytes || 0
      }));
      plan.push({
        record_id:record.id,
        source_stem:record.stem,
        collect_stem:candidate,
        collision_index:index,
        files
      });
    }
    return plan;
  }

  function manifest(records) {
    return {
      format:'asset-organizer-manifest',
      schema_version:1,
      app_version:APP_VERSION,
      created_at:now(),
      records:records.map((record) => ({
        id:record.id,
        stem:record.stem,
        base_stem:record.base_stem,
        directory:record.directory,
        status:record.status,
        name_collision:Boolean(record.name_collision),
        collision_group_size:Number(record.collision_group_size) || 1,
        collect_stem:record.collect_stem || record.base_stem,
        image:record.image ? clone(record.image) : null,
        json:record.json ? clone(record.json) : null,
        extra_images:clone(record.extra_images || []),
        extra_jsons:clone(record.extra_jsons || [])
      }))
    };
  }

  async function walkDirectory(handle,prefix='',out=[]) {
    for await (const [name,child] of handle.entries()) {
      const rel = prefix ? `${prefix}/${name}` : name;
      if (child.kind === 'directory') {
        if (!prefix && name.toLowerCase() === 'collect') continue;
        await walkDirectory(child,rel,out);
      } else {
        const ext = extOf(name);
        if (!IMAGE_EXTS.has(ext) && !JSON_EXTS.has(ext)) continue;
        const file = await child.getFile();
        try { Object.defineProperty(file,'webkitRelativePath',{value:`source/${rel}`}); } catch {}
        out.push({handle:child,file,path:rel});
      }
    }
    return out;
  }

  async function existingNames(dir) {
    const set = new Set();
    for await (const [name,child] of dir.entries()) {
      if (child.kind === 'file') set.add(name.toLowerCase());
    }
    return set;
  }

  async function copyToCollect(sourceHandle,onProgress=()=>{}) {
    const entries = await walkDirectory(sourceHandle);
    const records = await auditFiles(entries.map((item) => item.file));
    const entryByPath = new Map(entries.map((item) => [normalizePath(item.path),item]));
    const collectDir = await sourceHandle.getDirectoryHandle('collect',{create:true});
    const occupied = await existingNames(collectDir);
    const reservedStems = new Set();
    const operations = [];

    for (const record of [...records].sort((a,b) => a.stem.localeCompare(b.stem,'ja'))) {
      const sourceFiles = recordFiles(record);
      const base = clean(record.base_stem) || 'asset';
      let suffix = 0;
      let targetStem = base;
      while (true) {
        const candidateNames = sourceFiles.map((file) => `${targetStem}.${file.extension || extOf(file.name)}`.toLowerCase());
        const blocked = reservedStems.has(targetStem.toLowerCase()) || candidateNames.some((name) => occupied.has(name));
        if (!blocked) break;
        suffix += 1;
        targetStem = `${base}_${suffix}`;
      }
      reservedStems.add(targetStem.toLowerCase());

      for (const fileMeta of sourceFiles) {
        const source = entryByPath.get(normalizePath(fileMeta.path));
        if (!source) continue;
        const destinationName = `${targetStem}.${fileMeta.extension || extOf(fileMeta.name)}`;
        const target = await collectDir.getFileHandle(destinationName,{create:true});
        const writable = await target.createWritable();
        const sourceFile = await source.handle.getFile();
        await writable.write(await sourceFile.arrayBuffer());
        await writable.close();
        occupied.add(destinationName.toLowerCase());
        operations.push({
          source_path:source.path,
          destination_name:destinationName,
          bytes:sourceFile.size,
          collect_stem:targetStem
        });
        onProgress(operations.length);
      }
    }

    return {
      format:'asset-organizer-collect-result',
      schema_version:1,
      app_version:APP_VERSION,
      created_at:now(),
      copied_files:operations.length,
      operations
    };
  }

  window.AssetOrganizerEngine = Object.freeze({
    APP_VERSION,
    IMAGE_EXTS:[...IMAGE_EXTS],
    clean,
    clone,
    now,
    normalizePath,
    relativePath,
    extOf,
    stemOf,
    basenameStem,
    formatBytes,
    auditFiles,
    buildCollectPlan,
    manifest,
    copyToCollect
  });
})();
