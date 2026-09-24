'use strict';

(function setCurrentYear() {
  const year = document.getElementById('currentYear');
  if (year) year.textContent = new Date().getFullYear();
})();

(function initProjectFilters() {
  const buttons = Array.from(document.querySelectorAll('[data-filter]'));
  const rows = Array.from(document.querySelectorAll('.project-row[data-categories]'));
  const count = document.getElementById('projectCount');

  if (!buttons.length || !rows.length) return;

  const applyFilter = (filter) => {
    let visibleCount = 0;

    rows.forEach((row) => {
      const categories = (row.dataset.categories || '').split(/\s+/).filter(Boolean);
      const visible = filter === 'all' || categories.includes(filter);
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
    });

    if (count) count.textContent = String(visibleCount);
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.dataset.filter || 'all'));
  });
})();

(function initSectionNavigation() {
  const links = Array.from(document.querySelectorAll('.section-nav a[href^="#"]'));
  const pageNumber = document.getElementById('pageNum');
  if (!links.length) return;

  const pairs = links
    .map((link, index) => ({
      link,
      index,
      section: document.querySelector(link.getAttribute('href'))
    }))
    .filter((pair) => pair.section);

  if (!pairs.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const active = pairs.find((pair) => pair.section === visible.target);
    if (!active) return;

    links.forEach((link) => link.removeAttribute('aria-current'));
    active.link.setAttribute('aria-current', 'true');
    if (pageNumber) pageNumber.textContent = String(active.index + 1);
  }, {
    threshold: [0.12, 0.3, 0.55],
    rootMargin: '-15% 0px -55% 0px'
  });

  pairs.forEach((pair) => observer.observe(pair.section));
})();
