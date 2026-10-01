(() => {
  'use strict';

  const APP_VERSION = '0.1.0';
  const FIELD_IDS = [
    'subject','appearance','expression','outfit','action','pose','environment',
    'lighting','camera','composition','style','visibleText','constraints','negative'
  ];

  const PROFILE_DEFS = {
    'flux-natural': {
      label: 'FLUX · natural language', family: 'FLUX', dialect: 'natural-language', supportsNegative: false,
      note: '自然言語で被写体・行動・環境・光・カメラを明示。Negative欄は使わず、欲しい状態を肯定形で書く。'
    },
    'gpt-image-instruction': {
      label: 'GPT Image · instruction', family: 'GPT Image', dialect: 'instruction', supportsNegative: false,
      note: '作ってほしい画像を明示する指示文。制約は「何を保持するか」「何を避けたいか」を肯定的に書く。'
    },
    'sdxl-natural': {
      label: 'SDXL · natural language', family: 'SDXL', dialect: 'natural-language', supportsNegative: true,
      note: '自然言語寄りのSDXL向け。Checkpointの学習傾向によってはtag dialectへ切り替える。'
    },
    'sdxl-tags': {
      label: 'SDXL · tag / booru style', family: 'SDXL', dialect: 'tags', supportsNegative: true,
      note: 'カンマ区切りのタグ表現。アニメ系・タグ学習系Checkpoint向けの出力形式。'
    },
    'generic-tags': {
      label: 'Generic · compact tags', family: 'Generic', dialect: 'tags', supportsNegative: true,
      note: 'モデルを限定しないコンパクトなタグ列。未知のCheckpointを試すための中立プロファイル。'
    }
  };

  const DEFAULT_DB = {
    format: 'prompt-db-v2', version: '2.0.0', app_version: APP_VERSION,
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

  function normalizeConceptValues(values) {
    if (!Array.isArray(values)) return [];
    return unique(values.map((item) => typeof item === 'string' ? clean(item) : clean(item?.value || item?.label_en || item?.label_ja)));
  }

  function normalizeDb(input = {}) {
    const normalized = {
      ...clone(DEFAULT_DB), ...input,
      concepts: { ...clone(DEFAULT_DB.concepts), ...(input.concepts || {}) },
      recipes: Array.isArray(input.recipes) ? input.recipes : [],
      library: Array.isArray(input.library) ? input.library : []
    };
    Object.keys(normalized.concepts).forEach((key) => {
      normalized.concepts[key] = normalizeConceptValues(normalized.concepts[key]);
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
      const segments = [subjectParts, actionParts, sceneParts, framingParts, styleParts];
      segments.forEach((parts) => { if (parts.length) sentences.push(`${parts.join(', ')}.`); });
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
    clone, clean, list, unique, now, normalizeConceptValues, normalizeDb, renderForProfile
  });
})();
