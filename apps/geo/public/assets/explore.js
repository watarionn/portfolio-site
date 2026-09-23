(() => {
  const areaEl = document.querySelector('#forest-area');
  const bookEl = document.querySelector('#forest-book');
  const solved = new Set(JSON.parse(localStorage.getItem('geo.forest.solved') || '[]'));
  const visited = new Set(JSON.parse(localStorage.getItem('geo.forest.visited') || '["A"]'));
  const bindingCache = new Map();
  let current = localStorage.getItem('geo.forest.area') || 'A';
  let model;
  let experiences = new Map();
  let renderToken = 0;

  const save = () => {
    localStorage.setItem('geo.forest.solved', JSON.stringify([...solved]));
    localStorage.setItem('geo.forest.visited', JSON.stringify([...visited]));
    localStorage.setItem('geo.forest.area', current);
  };

  function updateBook() {
    bookEl.textContent = '発見 ' + solved.size + ' / 歩いた区画 ' + visited.size;
  }

  async function loadBindings(areaId) {
    if (bindingCache.has(areaId)) return bindingCache.get(areaId);
    const response = await fetch('../api/forest-area.php?area=' + encodeURIComponent(areaId));
    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || '森のデータを確認できませんでした。');
    }
    bindingCache.set(areaId, data.items || {});
    return data.items || {};
  }

  async function move(target) {
    current = target;
    visited.add(target);
    save();
    await render();
  }

  function specialLabel(experience) {
    if (experience.cta) return experience.cta;
    if (experience.type === 'line-traveler') return experience.label + 'に乗る';
    if (experience.type === 'same-name-station') return experience.label + 'を重ねて見る';
    return experience.label + 'を見る';
  }

  function renderSpecial(area) {
    if (!area.specialExperienceId) return;
    const experience = experiences.get(area.specialExperienceId);
    if (!experience) return;

    const link = document.createElement('a');
    link.className = 'geo-button forest-special';
    link.href = experience.route;
    link.textContent = specialLabel(experience);
    areaEl.append(link);
  }

  async function render() {
    const token = ++renderToken;
    const area = model.areas[current] || model.areas[model.startArea];
    areaEl.replaceChildren();
    areaEl.dataset.area = current;

    const loading = document.createElement('p');
    loading.className = 'forest-loading';
    loading.textContent = 'この区画のデータを確認しています…';
    areaEl.append(loading);
    updateBook();

    try {
      const bindings = await loadBindings(current);
      if (token !== renderToken) return;
      areaEl.replaceChildren();

      area.items.forEach(item => {
        const resolved = bindings[item.id];
        if (!resolved || !resolved.reading) {
          throw new Error(item.name + ' のDB bindingを確認できませんでした。');
        }

        const wrap = document.createElement('div');
        wrap.className = 'forest-object';
        wrap.dataset.type = item.type;
        wrap.dataset.itemId = item.id;
        wrap.dataset.edge = item.position.x <= 10 ? 'left' : item.position.x >= 90 ? 'right' : 'center';
        const mobileAreaAPositions = {
          oyumi: { x: 36, y: 15 },
          juso: { x: 18, y: 28 },
          kisaichi: { x: 73, y: 29 },
          oshor: { x: 80, y: 43 },
          zeze: { x: 16, y: 51 },
          gumyo: { x: 73, y: 64 },
          yuriage: { x: 35, y: 70 },
        };
        const mobilePosition = current === 'A' ? mobileAreaAPositions[item.id] : null;
        wrap.style.setProperty('--forest-x', item.position.x + '%');
        wrap.style.setProperty('--forest-y', item.position.y + '%');
        wrap.style.setProperty('--forest-mobile-x', (mobilePosition?.x ?? item.position.x) + '%');
        wrap.style.setProperty('--forest-mobile-y', (mobilePosition?.y ?? item.position.y) + '%');

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.textContent = solved.has(item.id)
          ? item.name + '　' + resolved.reading + ' ✓'
          : item.name;
        if (item.context) trigger.title = item.context;
        trigger.addEventListener('click', () => showQuiz(wrap, item, trigger, resolved.reading));
        wrap.append(trigger);
        areaEl.append(wrap);
      });

      Object.entries(area.exits).forEach(([direction, target]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'geo-button forest-exit';
        button.dataset.direction = direction;
        button.textContent = direction === 'left' ? '←' : direction === 'right' ? '→' : '↓';
        button.addEventListener('click', () => move(target));
        areaEl.append(button);
      });

      renderSpecial(area);
      updateBook();
    } catch (error) {
      if (token !== renderToken) return;
      areaEl.replaceChildren();
      const message = document.createElement('p');
      message.className = 'forest-loading';
      message.textContent = error instanceof Error ? error.message : '森のデータを確認できませんでした。';
      areaEl.append(message);
    }
  }

  function showQuiz(wrap, item, trigger, reading) {
    areaEl.querySelectorAll('.forest-quiz').forEach(quiz => quiz.remove());
    const box = document.createElement('div');
    box.className = 'forest-quiz';

    const title = document.createElement('strong');
    title.textContent = (item.context ? item.context + ' の ' : '') + item.name + ' はどう読む？';
    box.append(title);

    const message = document.createElement('span');
    message.className = 'forest-quiz-message';

    item.choices.forEach(choice => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = choice;
      button.addEventListener('click', () => {
        if (choice === reading) {
          solved.add(item.id);
          trigger.textContent = item.name + '　' + reading + ' ✓';
          save();
          updateBook();
          box.remove();
        } else {
          button.disabled = true;
          message.textContent = '違うみたい。そのまま進んでもOK。';
        }
      });
      box.append(button);
    });

    box.append(message);
    wrap.append(box);
  }

  Promise.all([
    fetch('../data/forest.json').then(r => r.json()),
    fetch('../data/special-experiences.json').then(r => r.json()),
  ]).then(([forest, special]) => {
    model = forest;
    experiences = new Map((special.experiences || []).map(item => [item.id, item]));
    if (!model.areas[current]) current = model.startArea;
    render();
  }).catch(() => {
    areaEl.textContent = '森のデータを読み込めませんでした。';
  });
})();
