(() => {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.global-nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open);
    });

    nav.addEventListener('click', (event) => {
      if (event.target.matches('a')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      }
    });
  }

  document.querySelectorAll('[data-tabs]').forEach((tabs) => {
    const buttons = Array.from(tabs.querySelectorAll('[role="tab"]'));
    const panels = Array.from(tabs.querySelectorAll('[role="tabpanel"]'));

    const activate = (button) => {
      buttons.forEach((item) => item.setAttribute('aria-selected', String(item === button)));
      panels.forEach((panel) => {
        panel.hidden = panel.id !== button.getAttribute('aria-controls');
      });
    };

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(button));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const next = buttons[(index + direction + buttons.length) % buttons.length];
        next.focus();
        activate(next);
      });
    });
  });

  const input = document.querySelector('#glossary-search');
  const items = Array.from(document.querySelectorAll('#glossary-list article'));
  const empty = document.querySelector('#glossary-empty');

  if (input && items.length) {
    input.addEventListener('input', () => {
      const query = input.value.trim().toLocaleLowerCase('ja');
      let visible = 0;

      items.forEach((item) => {
        const haystack = `${item.dataset.term || ''} ${item.textContent}`.toLocaleLowerCase('ja');
        const match = !query || haystack.includes(query);
        item.hidden = !match;
        if (match) visible += 1;
      });

      if (empty) empty.hidden = visible !== 0;
    });
  }
})();
