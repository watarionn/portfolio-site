import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Source-only regression guard, in addition to independent real-browser QA.
function rule(css, selector, predicate = () => true) {
  const escaped = selector.replace(/\./g, '\\.');
  const pattern = new RegExp('(?:^|\\n)\\s*' + escaped + '\\s*\\{([^}]*)\\}', 'g');
  const matches = [...css.matchAll(pattern)].filter(m => predicate(m[1]));
  assert.equal(matches.length, 1, selector + ': expected exactly one rule');
  return matches[0][1];
}

function validate(css) {
  const row = rule(css, '.work-row', text => text.includes('transition: background'));
  const hover = rule(css, '.work-row:hover');
  assert.match(row, /transition:\s*background\s+\.15s\s+ease\s*;/);
  assert.doesNotMatch(row, /transition\s*:[^;]*(?:padding|margin|width|height|left|top)/,
    'row must not animate layout');
  assert.doesNotMatch(hover, /(?:padding|margin|width|height|left|top)\s*:/,
    'hover must not change row layout');
  assert.match(hover, /background\s*:\s*rgba\(/, 'hover feedback retained');
  const guard = '@media (hover: hover) and (prefers-reduced-motion: no-preference) {';
  assert.equal(css.split(guard).length, 2, 'expected exactly one hover/reduced-motion guard');
  const scoped = css.slice(css.indexOf(guard) + guard.length);
  assert.match(scoped, /\.work-row\s*>\s*\*\s*\{\s*transition:\s*transform\s+\.15s/);
  assert.match(scoped, /\.work-row:hover\s*>\s*\*\s*\{\s*transform:\s*translateX\(\.3rem\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
}

const css = readFileSync('portfolio-city/city.css', 'utf8');
validate(css);
// Prove the check rejects the old layout animation and a layout-on-hover regression.
assert.throws(() => validate(css.replace('transition: background .15s ease;',
  'transition: background .15s ease, padding-left .15s ease;')));
assert.throws(() => validate(css.replace('.work-row:hover { background:',
  '.work-row:hover { padding-left: 1.5rem; background:')));
console.log('Portfolio City compositor-only hover regression: PASS (1 positive + 2 negative)');
