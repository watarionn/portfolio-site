(() => {
  'use strict';

  const APP_VERSION = '1.0.0';

  const PROFILE_LABELS = {
    'flux-natural': 'FLUX · 自然文',
    'gpt-image-instruction': 'GPT Image · 指示文',
    'sdxl-natural': 'SDXL · 自然文',
    'sdxl-tags': 'SDXL · タグ形式',
    'generic-tags': '共通 · 短いタグ形式'
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const now = () => new Date().toISOString();

  function list(value) {
    if (Array.isArray(value)) return [...new Set(value.map(clean).filter(Boolean))];
    return [...new Set(String(value || '').split(/[\n,|]+/).map(clean).filter(Boolean))];
  }

  function formatBytes(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return '';
    const units = ['B','KB','MB','GB','TB'];
    let value = n, index = 0;
    while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
    const digits = index >= 3 ? 2 : index === 2 ? 1 : 0;
    return `${value.toFixed(digits)} ${units[index]}`;
  }

  function bytesFromFile(file) {
    if (Number.isFinite(file?.sizeKB)) return Math.round(file.sizeKB * 1024);
    if (Number.isFinite(file?.size)) return Number(file.size);
    return 0;
  }

  function parseCivitaiUrl(raw) {
    try {
      const u = new URL(String(raw || '').trim());
      let modelId = null, versionId = null;
      let match = u.pathname.match(/\/models\/(\d+)/i);
      if (match) modelId = Number(match[1]);
      match = u.pathname.match(/\/api\/download\/models\/(\d+)/i) || u.pathname.match(/\/api\/v1\/model-versions\/(\d+)/i);
      if (match) versionId = Number(match[1]);
      match = u.pathname.match(/\/api\/v1\/models\/(\d+)/i);
      if (match) modelId = Number(match[1]);
      for (const key of ['modelVersionId','versionId']) {
        const value = u.searchParams.get(key);
        if (value && /^\d+$/.test(value)) versionId = Number(value);
      }
      return { modelId, versionId };
    } catch {
      return { modelId:null, versionId:null };
    }
  }

  function stripHtml(value) {
    const doc = new DOMParser().parseFromString(String(value || ''), 'text/html');
    return clean(doc.body.textContent || '');
  }

  function choosePrimary(version) {
    const files = Array.isArray(version?.files) ? [...version.files] : [];
    files.sort((a,b) => {
      const score = (file) => [
        (file.primary || file.metadata?.primary) ? 1 : 0,
        ['model','checkpoint','lora'].includes(String(file.type || '').toLowerCase()) ? 1 : 0,
        bytesFromFile(file)
      ];
      const A = score(a), B = score(b);
      return B[0]-A[0] || B[1]-A[1] || B[2]-A[2];
    });
    return files[0] || {};
  }

  function extractSettings(...texts) {
    const rx = /(recommend|recommended|setting|parameter|steps?|sampler|scheduler|cfg|guidance|clip\s*skip|denois|strength|weight|resolution|width|height|vae|prompt|trigger|推奨|設定|ステップ|サンプラー|トリガー|強度|解像度|プロンプト)/i;
    const found = [];
    texts.filter(Boolean).forEach((text) => {
      String(text).split(/[\n\r]+/)
        .map((line) => clean(line))
        .filter((line) => line && rx.test(line))
        .forEach((line) => {
          const short = line.slice(0, 400);
          if (!found.includes(short)) found.push(short);
        });
    });
    return found.slice(0, 20).join(' / ');
  }

  function inferFamily(baseModel, modelName = '') {
    const text = `${baseModel} ${modelName}`.toLowerCase();
    if (/flux/.test(text)) return 'FLUX';
    if (/gpt.?image|dall.?e/.test(text)) return 'GPT Image';
    if (/qwen/.test(text)) return 'Qwen Image';
    if (/\bwan\b|wan2|wan 2/.test(text)) return 'WAN';
    if (/sdxl|pony|illustrious|animagine/.test(text)) return 'SDXL';
    if (/sd\s*1[. ]?5|stable diffusion 1[. ]?5|sd15/.test(text)) return 'SD 1.5';
    return 'Other';
  }

  function inferPromptProfile(family, modelName = '', baseModel = '') {
    const text = `${modelName} ${baseModel}`.toLowerCase();
    if (family === 'FLUX') return 'flux-natural';
    if (family === 'GPT Image') return 'gpt-image-instruction';
    if (family === 'SDXL') {
      if (/anime|pony|illustrious|animagine|booru|tag/.test(text)) return 'sdxl-tags';
      return 'sdxl-natural';
    }
    return 'generic-tags';
  }

  function normalizeModelType(value) {
    const text = clean(value).toLowerCase();
    if (text.includes('lora')) return 'LoRA';
    if (text.includes('vae')) return 'VAE';
    if (text.includes('control')) return 'ControlNet';
    if (text.includes('checkpoint') || text.includes('model')) return 'Checkpoint';
    return clean(value) || 'Other';
  }

  function firstHash(file) {
    const hashes = file?.hashes || {};
    return clean(hashes.SHA256 || hashes.sha256 || hashes.AutoV2 || hashes.AutoV1 || '');
  }

  function recordFromModel(raw, model, version, source) {
    const primary = choosePrimary(version);
    const modelText = stripHtml(model?.description);
    const versionText = stripHtml(version?.description);
    const modelName = clean(model?.name || version?.model?.name);
    const baseModel = clean(version?.baseModel);
    const family = inferFamily(baseModel, modelName);
    return {
      input_url: clean(raw),
      status: 'OK',
      error: '',
      source: clean(source),
      model_type: normalizeModelType(model?.type),
      model_name: modelName,
      version_name: clean(version?.name),
      family,
      base_model: baseModel,
      creator: clean(model?.creator?.username),
      file_name: clean(primary.name),
      file_size_bytes: bytesFromFile(primary),
      sha256: firstHash(primary),
      trigger_words: Array.isArray(version?.trainedWords) ? list(version.trainedWords) : [],
      download_url: clean(primary.downloadUrl || version?.downloadUrl),
      recommended_settings: extractSettings(modelText, versionText),
      resolution: '',
      controlnet: false,
      ip_adapter: false,
      vram_gb: '',
      prompt_profile: inferPromptProfile(family, modelName, baseModel),
      model_id: model?.id || version?.modelId || version?.model?.id || '',
      version_id: version?.id || '',
      model_description: modelText,
      version_description: versionText
    };
  }

  function normalizeRecord(raw = {}) {
    const modelName = clean(raw.model_name || raw.name);
    const baseModel = clean(raw.base_model || raw.baseModel);
    const family = clean(raw.family) || inferFamily(baseModel, modelName);
    const sizeBytes = Number(raw.file_size_bytes || raw.fileSizeBytes || 0);
    return {
      input_url: clean(raw.input_url || raw.source_url || raw.url),
      status: raw.status === 'ERROR' ? 'ERROR' : 'OK',
      error: clean(raw.error),
      source: clean(raw.source),
      model_type: normalizeModelType(raw.model_type || raw.type),
      model_name: modelName,
      version_name: clean(raw.version_name || raw.version),
      family,
      base_model: baseModel,
      creator: clean(raw.creator),
      file_name: clean(raw.file_name || raw.filename),
      file_size_bytes: Number.isFinite(sizeBytes) ? sizeBytes : 0,
      sha256: clean(raw.sha256 || raw.hash),
      trigger_words: list(raw.trigger_words || raw.trainedWords),
      download_url: clean(raw.download_url),
      recommended_settings: clean(raw.recommended_settings),
      resolution: clean(raw.resolution),
      controlnet: Boolean(raw.controlnet),
      ip_adapter: Boolean(raw.ip_adapter),
      vram_gb: clean(raw.vram_gb || raw.vram),
      prompt_profile: PROFILE_LABELS[raw.prompt_profile] ? raw.prompt_profile : inferPromptProfile(family, modelName, baseModel),
      model_id: raw.model_id ?? '',
      version_id: raw.version_id ?? '',
      model_description: clean(raw.model_description),
      version_description: clean(raw.version_description)
    };
  }

  function makeOfflineDb() {
    return { models:new Map(), versions:new Map(), records:new Map() };
  }

  function importOfflineObject(offlineDb, data) {
    let records = 0;
    if (Array.isArray(data?.records)) {
      for (const raw of data.records) {
        const r = normalizeRecord(raw);
        const key = `${r.model_id || ''}:${r.version_id || ''}`;
        offlineDb.records.set(key, r);
        records += 1;
      }
      return {records,models:0,versions:0};
    }

    const items = Array.isArray(data?.items) ? data.items : [data];
    let models = 0, versions = 0;
    for (const obj of items) {
      if (!obj || typeof obj !== 'object') continue;
      if (Array.isArray(obj.modelVersions)) {
        if (obj.id != null) { offlineDb.models.set(Number(obj.id), obj); models += 1; }
        for (const v of obj.modelVersions) {
          if (v?.id != null) {
            offlineDb.versions.set(Number(v.id), {...v,modelId:v.modelId ?? obj.id,model:v.model ?? {id:obj.id,name:obj.name}});
            versions += 1;
          }
        }
      } else if (obj.id != null && (obj.modelId != null || obj.model?.id != null || obj.files || obj.trainedWords)) {
        offlineDb.versions.set(Number(obj.id), obj);
        versions += 1;
        if (obj.model?.id != null) { offlineDb.models.set(Number(obj.model.id), obj.model); models += 1; }
      }
    }
    return {records,models,versions};
  }

  function resolveOffline(offlineDb, raw, parsed) {
    const direct = offlineDb.records.get(`${parsed.modelId || ''}:${parsed.versionId || ''}`) ||
      [...offlineDb.records.values()].find((r) =>
        (parsed.versionId && Number(r.version_id) === parsed.versionId) ||
        (parsed.modelId && !parsed.versionId && Number(r.model_id) === parsed.modelId)
      );
    if (direct) return {...normalizeRecord(direct),input_url:clean(raw),source:'保存JSON'};

    let version = parsed.versionId ? offlineDb.versions.get(parsed.versionId) : null;
    let model = parsed.modelId ? offlineDb.models.get(parsed.modelId) : null;
    if (!model && version) {
      const mid = Number(version.modelId || version.model?.id || 0);
      if (mid) model = offlineDb.models.get(mid) || version.model || null;
    }
    if (model && !version) version = Array.isArray(model.modelVersions) ? model.modelVersions[0] || null : null;
    if (!model && parsed.modelId) model = [...offlineDb.models.values()].find((m) => Number(m.id) === parsed.modelId) || null;
    if (model && version) return recordFromModel(raw, model, version, '保存JSON');
    return null;
  }

  async function apiJson(url, key) {
    const headers = {Accept:'application/json'};
    if (key) headers.Authorization = `Bearer ${key}`;
    const response = await fetch(url, {headers});
    if (!response.ok) throw new Error(`API ${response.status}`);
    return response.json();
  }

  async function inspectOne(raw, key, mode, offlineDb) {
    const parsed = parseCivitaiUrl(raw);
    const base = {
      input_url:clean(raw),
      model_id:parsed.modelId || '',
      version_id:parsed.versionId || ''
    };

    if (!parsed.modelId && !parsed.versionId) {
      return normalizeRecord({...base,status:'ERROR',source:'URL解析',error:'CivitaiのモデルURLを認識できません'});
    }

    if (mode !== 'api') {
      const offline = resolveOffline(offlineDb, raw, parsed);
      if (offline) return offline;
      if (mode === 'offline') {
        return normalizeRecord({...base,status:'ERROR',source:'保存JSON',error:'読み込んだJSONに該当データがありません'});
      }
    }

    try {
      let versionApi = null;
      let modelId = parsed.modelId;
      if (!modelId && parsed.versionId) {
        versionApi = await apiJson(`https://civitai.com/api/v1/model-versions/${parsed.versionId}`, key);
        modelId = Number(versionApi.modelId || versionApi.model?.id || 0) || null;
      }
      if (!modelId) throw new Error('modelIdを取得できません');

      const model = await apiJson(`https://civitai.com/api/v1/models/${modelId}`, key);
      const versions = Array.isArray(model.modelVersions) ? model.modelVersions : [];
      let version = parsed.versionId ? versions.find((v) => Number(v.id) === parsed.versionId) : versions[0];
      if (!version && versionApi) version = versionApi;
      if (!version) throw new Error('バージョン情報がありません');
      if (versionApi && Number(versionApi.id) === Number(version.id)) version = {...version,...versionApi};
      return recordFromModel(raw, model, version, 'Civitai API');
    } catch (error) {
      return normalizeRecord({...base,status:'ERROR',source:'Civitai API',error:error?.message || String(error)});
    }
  }

  window.ModelInspectorEngine = Object.freeze({
    APP_VERSION,
    PROFILE_LABELS,
    clean,
    list,
    clone,
    now,
    formatBytes,
    parseCivitaiUrl,
    inferFamily,
    inferPromptProfile,
    normalizeModelType,
    normalizeRecord,
    recordFromModel,
    makeOfflineDb,
    importOfflineObject,
    resolveOffline,
    inspectOne
  });
})();
