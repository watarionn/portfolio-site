/* Prompt Studio 2: pure template model. Does not mutate legacy PromptDB. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PromptStudioTemplate = Object.freeze(api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const copy = (v) => JSON.parse(JSON.stringify(v));
  const text = (v) => String(v == null ? '' : v);
  const validId = (id) => /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id);
  function normalize(input) {
    const source = input || {};
    const variables = {};
    for (const [id, value] of Object.entries(source.variables || {})) {
      if (!validId(id)) throw new Error('Invalid variable ID: ' + id);
      const options = Array.isArray(value.options) ? value.options.map(text) : [];
      variables[id] = { label: text(value.label || id), options, selected: Math.max(0, Math.min(options.length - 1, Number.isInteger(value.selected) ? value.selected : 0)) };
    }
    const segments = (source.segments || []).map((segment) => {
      if (segment.type === 'text') return { type:'text', value:text(segment.value) };
      if (segment.type === 'variable' && variables[segment.ref]) return { type:'variable', ref:segment.ref };
      throw new Error('Invalid segment or missing variable reference');
    });
    return { schema_version:2, segments, variables };
  }
  function fromText(value) { return normalize({ segments:[{ type:'text', value:text(value) }], variables:{} }); }
  function render(input) {
    const model = normalize(input);
    return model.segments.map((s) => s.type === 'text' ? s.value : (model.variables[s.ref].options[model.variables[s.ref].selected] || '')).join('');
  }
  function addVariable(input, id, label, options) {
    const model = normalize(input);
    if (!validId(id) || model.variables[id]) throw new Error('Variable ID must be unique');
    model.variables[id] = { label:text(label || id), options:(options || []).map(text), selected:0 };
    return model;
  }
  function replaceRange(input, start, end, id) {
    const model = normalize(input);
    if (!model.variables[id]) throw new Error('Unknown variable');
    const rendered = render(model);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > rendered.length) throw new Error('Invalid range');
    // Preserve all existing variable references. Do not silently flatten them.
    let offset = 0, first = -1, last = -1;
    model.segments.forEach((s,i) => {
      const size = s.type === 'text' ? s.value.length : (model.variables[s.ref].options[model.variables[s.ref].selected] || '').length;
      if (offset <= start && start < offset + size) first = i;
      if (offset < end && end <= offset + size) last = i;
      offset += size;
    });
    if (first < 0 || last < 0 || first !== last || model.segments[first].type !== 'text') throw new Error('Selection must be within one plain-text segment');
    const segment = model.segments[first], before = model.segments.slice(0,first), after = model.segments.slice(first+1);
    const priorLength = model.segments.slice(0,first).reduce((n,s)=>n+(s.type==='text'?s.value.length:(model.variables[s.ref].options[model.variables[s.ref].selected]||'').length),0);
    const a = start-priorLength, b = end-priorLength;
    model.segments = [...before, ...(a?[{type:'text',value:segment.value.slice(0,a)}]:[]), {type:'variable',ref:id}, ...(b<segment.value.length?[{type:'text',value:segment.value.slice(b)}]:[]), ...after];
    return model;
  }
  function select(input,id,index) {
    const model = normalize(input), v = model.variables[id];
    if (!v || !Number.isInteger(index) || index < 0 || index >= v.options.length) throw new Error('Invalid selection');
    v.selected=index; return model;
  }
  function legacySnapshot(entry) {
    const semantic = entry && entry.semantic || {};
    const parts = ['subject','appearance','expression','outfit','action','pose','environment','lighting','camera','composition','style','visibleText','constraints'].map(k=>text(semantic[k]).trim()).filter(Boolean);
    return fromText(parts.join('. ') + (parts.length ? '.' : ''));
  }
  return { normalize, fromText, render, addVariable, replaceRange, select, legacySnapshot, copy };
});
