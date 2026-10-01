(() => {
  'use strict';

  const APP_VERSION = '1.0.0';
  const FIELD_IDS = [
    'subject','appearance','expression','outfit','action','pose','environment',
    'lighting','camera','composition','style','visibleText','constraints','negative'
  ];

  const PROFILE_DEFS = {
    'flux-natural': {
      label: 'FLUX · 自然文', family: 'FLUX', dialect: 'natural-language', supportsNegative: false,
      note: '自然言語で被写体・行動・環境・光・カメラを明示。Negative欄は使わず、欲しい状態を肯定形で書く。'
    },
    'gpt-image-instruction': {
      label: 'GPT Image · 指示文', family: 'GPT Image', dialect: 'instruction', supportsNegative: false,
      note: '作ってほしい画像を明示する指示文。制約は「何を保持するか」「何を避けたいか」を肯定的に書く。'
    },
    'sdxl-natural': {
      label: 'SDXL · 自然文', family: 'SDXL', dialect: 'natural-language', supportsNegative: true,
      note: '自然言語寄りのSDXL向け。Checkpointの学習傾向によってはtag dialectへ切り替える。'
    },
    'sdxl-tags': {
      label: 'SDXL · タグ形式', family: 'SDXL', dialect: 'tags', supportsNegative: true,
      note: 'カンマ区切りのタグ表現。アニメ系・タグ学習系Checkpoint向けの出力形式。'
    },
    'generic-tags': {
      label: '共通 · 短いタグ形式', family: 'Generic', dialect: 'tags', supportsNegative: true,
      note: 'モデルを限定しないコンパクトなタグ列。未知のCheckpointを試すための中立プロファイル。'
    }
  };

  const DEFAULT_DB = {
    format: 'prompt-db', schema_version: 1, app_version: APP_VERSION,
    updated_at: new Date().toISOString(), source: 'Built-in working DB',
    concepts: {
      subject: ['a young woman','a lone traveler','a small reading room','a vintage camera'],
      appearance: ['gentle, intelligent appearance','soft natural features','refined editorial look'],
      expression: ['calm expression','subtle smile','focused expression','curious expression'],
      outfit: ['white shirt and dark skirt','layered casual outfit','minimal monochrome outfit','classic coat'],
      action: ['reading a book','turning a page','adjusting glasses','holding a notebook','reaching for a shelf'],
      pose: ['standing naturally','sitting at a desk','walking forward','looking over one shoulder','leaning against a wall'],
      environment: ['quiet library','sunlit cafe','small design studio','night city street','bookstore aisle'],
      lighting: ['soft window light','warm tungsten light','overcast daylight','neon rim light','late afternoon backlight'],
      camera: ['35mm medium shot','50mm eye-level portrait','wide environmental shot','close-up portrait','three-quarter view'],
      composition: ['centered composition','rule-of-thirds composition','foreground framing','strong leading lines'],
      style: ['quiet editorial photography','cinematic and restrained','cozy and intimate','clean illustration'],
      visibleText: [],
      constraints: ['natural hands and fingers','consistent character identity','clean readable silhouette']
    },
    recipes: [], library: []
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const list = (value) => clean(value).split(',').map(clean).filter(Boolean);
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const now = () => new Date().toISOString();

  function hashString(value) {
    let hash = 2166136261;
    for (const char of String(value)) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function slug(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36) || 'item';
  }

  function normalizeConceptEntry(item, category = 'concept') {
    const raw = typeof item === 'string' ? { value: item } : (item || {});
    const value = clean(raw.value || raw.label_en || raw.label_ja);
    if (!value) return null;
    const weightNumber = Number(raw.weight);
    return {
      id: clean(raw.id) || `${category}.${slug(value)}.${hashString(value)}`,
      value,
      label_ja: clean(raw.label_ja),
      tags: unique(Array.isArray(raw.tags) ? raw.tags.map(clean) : list(raw.tags)),
      weight: Number.isFinite(weightNumber) && weightNumber > 0 ? weightNumber : 1
    };
  }

  function normalizeConceptEntries(values, category = 'concept') {
    if (!Array.isArray(values)) return [];
    const map = new Map();
    values.forEach((item) => {
      const entry = normalizeConceptEntry(item, category);
      if (!entry) return;
      const key = entry.value.toLowerCase();
      map.set(key, { ...(map.get(key) || {}), ...entry });
    });
    return [...map.values()];
  }

  function normalizeConceptValues(values) {
    return normalizeConceptEntries(values).map((entry) => entry.value);
  }

  function mergeConceptEntries(current, incoming, category = 'concept') {
    const map = new Map(normalizeConceptEntries(current, category).map((entry) => [entry.value.toLowerCase(), entry]));
    normalizeConceptEntries(incoming, category).forEach((entry) => map.set(entry.value.toLowerCase(), entry));
    return [...map.values()];
  }

  function weightedChoice(values, random = Math.random) {
    const entries = normalizeConceptEntries(values);
    if (!entries.length) return null;
    const total = entries.reduce((sum, entry) => sum + Math.max(0.0001, Number(entry.weight) || 1), 0);
    let point = random() * total;
    for (const entry of entries) {
      point -= Math.max(0.0001, Number(entry.weight) || 1);
      if (point <= 0) return entry;
    }
    return entries[entries.length - 1];
  }

  function normalizeDb(input = {}) {
    const normalized = {
      ...clone(DEFAULT_DB), ...input,
      format: 'prompt-db',
      schema_version: 1,
      concepts: { ...clone(DEFAULT_DB.concepts), ...(input.concepts || {}) },
      recipes: Array.isArray(input.recipes) ? input.recipes.filter((recipe) => recipe?.type === 'slot-recipe') : [],
      library: Array.isArray(input.library) ? input.library : []
    };
    Object.keys(normalized.concepts).forEach((key) => {
      normalized.concepts[key] = normalizeConceptEntries(normalized.concepts[key], key);
    });
    return normalized;
  }

  function positiveConstraints(text) {
    if (!text) return '';
    return text.replace(/\b(no|without|avoid)\s+/gi, '').replace(/\bdo not\s+/gi, '').trim();
  }

  function renderNatural(semantic, instruction = false) {
    const subjectParts = unique([semantic.subject, semantic.appearance, semantic.expression, semantic.outfit]);
    const actionParts = unique([semantic.action, semantic.pose]);
    const sceneParts = unique([semantic.environment, semantic.lighting]);
    const framingParts = unique([semantic.camera, semantic.composition]);
    const styleParts = unique([semantic.style]);
    const constraintParts = unique([positiveConstraints(semantic.constraints)]);
    const sentences = [];
    if (instruction) {
      if (subjectParts.length) sentences.push(`Create an image featuring ${subjectParts.join(', ')}.`);
      if (actionParts.length) sentences.push(`Show the subject ${actionParts.join(', ')}.`);
      if (sceneParts.length) sentences.push(`Set the scene in ${sceneParts.join(', ')}.`);
      if (framingParts.length) sentences.push(`Use ${framingParts.join(', ')}.`);
      if (styleParts.length) sentences.push(`Use ${styleParts.join(', ')}.`);
      if (semantic.visibleText) sentences.push(`Include the visible text exactly as: "${semantic.visibleText}".`);
      if (constraintParts.length) sentences.push(`Keep ${constraintParts.join(', ')}.`);
    } else {
      [subjectParts, actionParts, sceneParts, framingParts, styleParts].forEach((parts) => {
        if (parts.length) sentences.push(`${parts.join(', ')}.`);
      });
      if (semantic.visibleText) sentences.push(`Visible text: "${semantic.visibleText}".`);
      if (constraintParts.length) sentences.push(`${constraintParts.join(', ')}.`);
    }
    return sentences.join(' ').replace(/\s+([.,])/g, '$1').trim();
  }

  function renderTags(semantic) {
    const ordered = [
      semantic.subject, semantic.appearance, semantic.expression, semantic.outfit,
      semantic.action, semantic.pose, semantic.environment, semantic.lighting,
      semantic.camera, semantic.composition, semantic.style,
      semantic.visibleText ? `text: ${semantic.visibleText}` : '', semantic.constraints
    ];
    const tags = [];
    ordered.forEach((segment) => list(segment).forEach((tag) => tags.push(tag)));
    return unique(tags).join(', ');
  }

  function renderForProfile(profileId, semantic) {
    const profile = PROFILE_DEFS[profileId] || PROFILE_DEFS['flux-natural'];
    const positive = profileId === 'gpt-image-instruction'
      ? renderNatural(semantic, true)
      : profile.dialect === 'tags' ? renderTags(semantic) : renderNatural(semantic, false);
    return {
      profile_id: profileId, family: profile.family, dialect: profile.dialect,
      positive, negative: profile.supportsNegative ? clean(semantic.negative) : ''
    };
  }

  window.PromptStudioEngine = Object.freeze({
    APP_VERSION, FIELD_IDS, PROFILE_DEFS, DEFAULT_DB,
    clone, clean, list, unique, now, hashString, slug,
    normalizeConceptEntry, normalizeConceptEntries, normalizeConceptValues, mergeConceptEntries, weightedChoice,
    normalizeDb, renderForProfile
  });
})();