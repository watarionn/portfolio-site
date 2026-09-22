(() => {
  const areaEl = document.querySelector('#forest-area');
  const bookEl = document.querySelector('#forest-book');
  const solved = new Set(JSON.parse(localStorage.getItem('geo.forest.solved') || '[]'));
  const visited = new Set(JSON.parse(localStorage.getItem('geo.forest.visited') || '["A"]'));
  let current = localStorage.getItem('geo.forest.area') || 'A';
  let model;

  const save = () => {
    localStorage.setItem('geo.forest.solved', JSON.stringify([...solved]));
    localStorage.setItem('geo.forest.visited', JSON.stringify([...visited]));
    localStorage.setItem('geo.forest.area', current);
  };

  function updateBook() {
    bookEl.textContent = '発見 ' + solved.size + ' / 歩いた区画 ' + visited.size;
  }

  function move(target) {
    current = target;
    visited.add(target);
    save();
    render();
  }

  function render() {
    const area = model.areas[current] || model.areas[model.startArea];
    areaEl.replaceChildren();
    areaEl.dataset.area = current;

    area.items.forEach(item => {
      const wrap = document.createElement('div');
      wrap.className = 'forest-object';
      wrap.dataset.type = item.type;
      wrap.style.left = item.position.x + '%';
      wrap.style.top = item.position.y + '%';
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.textContent = solved.has(item.id) ? item.name + '　' + item.reading + ' ✓' : item.name;
      trigger.addEventListener('click', () => showQuiz(wrap, item, trigger));
      wrap.append(trigger);
      areaEl.append(wrap);
    });

    Object.entries(area.exits).forEach(([direction,target]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'geo-button forest-exit';
      button.dataset.direction = direction;
      button.textContent = direction === 'left' ? '←' : direction === 'right' ? '→' : '↓';
      button.addEventListener('click', () => move(target));
      areaEl.append(button);
    });
    updateBook();
  }

  function showQuiz(wrap, item, trigger) {
    wrap.querySelector('.forest-quiz')?.remove();
    const box = document.createElement('div');
    box.className = 'forest-quiz';
    item.choices.forEach(choice => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = choice;
      button.addEventListener('click', () => {
        if (choice === item.reading) {
          solved.add(item.id);
          trigger.textContent = item.name + '　' + item.reading + ' ✓';
          save();
          updateBook();
          box.remove();
        } else {
          button.disabled = true;
        }
      });
      box.append(button);
    });
    wrap.append(box);
  }

  fetch('../data/forest.json').then(r => r.json()).then(data => {
    model = data;
    if (!model.areas[current]) current = model.startArea;
    render();
  }).catch(() => {
    areaEl.textContent = '森のデータを読み込めませんでした。';
  });
})();