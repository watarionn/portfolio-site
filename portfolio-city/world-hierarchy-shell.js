'use strict';

(() => {
  const FEATURE_FLAG = false;
  const shell = document.getElementById('worldHierarchyShell');

  const state = {
    enabled: FEATURE_FLAG,
    level: 'world',
    activeDistrictId: null,
    activeProjectId: null,
    worldCamera: { x: 0, y: 0, zoom: 1 },
    savedWorldCamera: null,
    returnFocusId: null
  };

  function setLevel(level) {
    if (!state.enabled || !['world', 'district', 'preview'].includes(level)) return false;
    state.level = level;
    for (const panel of shell?.querySelectorAll('[data-world-level]') ?? []) {
      panel.hidden = panel.dataset.worldLevel !== level;
    }
    return true;
  }

  function mount() {
    if (!shell || !state.enabled) return false;
    shell.hidden = false;
    shell.setAttribute('aria-hidden', 'false');
    return setLevel(state.level);
  }

  window.PortfolioCityWorldHierarchy = Object.freeze({
    isEnabled: () => state.enabled,
    getState: () => ({ ...state, worldCamera: { ...state.worldCamera } }),
    setLevel,
    mount
  });

  mount();
})();
