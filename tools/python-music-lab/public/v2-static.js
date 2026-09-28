(() => {
  'use strict';

  const root = document.getElementById('v2Runtime');
  if (!root) return;

  const audio = document.getElementById('v2Audio');
  const status = document.getElementById('v2Status');
  const candidateList = document.getElementById('v2Candidates');
  const session = document.getElementById('v2Session');
  const adoption = document.getElementById('v2Adoption');
  const schema = document.getElementById('v2Schema');
  const jizura = document.getElementById('v2Jizura');

  root.querySelectorAll('[data-v2-seek]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!audio) return;
      audio.currentTime = Number(button.dataset.v2Seek || 0);
      audio.play().catch(() => {});
    });
  });

  Promise.all([
    fetch('assets/v2/candidate_summary.json').then((r) => r.json()),
    fetch('assets/v2/integration4.json').then((r) => r.json()),
  ]).then(([lab, integration]) => {
    if (status) status.textContent = 'v' + integration.runtime_version + ' / static runtime';
    if (session) session.textContent = lab.session_id;
    if (schema) schema.textContent = integration.project_schema;
    if (adoption) {
      adoption.textContent = lab.auto_selected_candidate === null
        ? '自動採用なし / 人間が最終選択'
        : String(lab.auto_selected_candidate);
    }
    if (jizura) {
      const rt = integration.jizura_roundtrip;
      jizura.textContent = rt.music_timing_authoritative && !rt.timing_changes_auto_applied
        ? 'Music timing authoritative / text cueのみ往復'
        : 'Round-trip audit';
    }

    if (candidateList) {
      const order = new Map(lab.score_order.map((id, index) => [id, index]));
      const rows = [...lab.candidates].sort(
        (a, b) => (order.get(a.candidate_id) ?? 999) - (order.get(b.candidate_id) ?? 999)
      );
      candidateList.replaceChildren(...rows.map((item) => {
        const row = document.createElement('article');
        row.className = 'v2-candidate';
        const score = document.createElement('strong');
        score.textContent = Number(item.total_score).toFixed(3);
        const copy = document.createElement('span');
        copy.textContent = item.scope || 'baseline';
        const notes = document.createElement('small');
        notes.textContent = 'Melody ' + item.note_counts.Melody + ' / total '
          + Object.values(item.note_counts).reduce((sum, value) => sum + Number(value), 0);
        row.append(score, copy, notes);
        return row;
      }));
    }
  }).catch((error) => {
    if (status) status.textContent = 'v2 data unavailable';
    console.warn('Python Music Lab v2 static data:', error);
  });
})();
