'use strict';

(function setCurrentYear() {
  const node = document.getElementById('currentYear');
  if (node) node.textContent = String(new Date().getFullYear());
})();

(function initSectionNavigation() {
  const links = Array.from(document.querySelectorAll('.profile-nav a[href^="#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;

  const byId = new Map(
    links.map(function(link) {
      return [link.getAttribute('href').slice(1), link];
    })
  );

  const sections = Array.from(byId.keys())
    .map(function(id) { return document.getElementById(id); })
    .filter(Boolean);

  if (!sections.length) return;

  function setCurrent(id) {
    links.forEach(function(link) {
      if (link === byId.get(id)) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  const observer = new IntersectionObserver(function(entries) {
    const visible = entries
      .filter(function(entry) { return entry.isIntersecting; })
      .sort(function(a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });

    if (visible.length) setCurrent(visible[0].target.id);
  }, {
    rootMargin: '-18% 0px -68% 0px',
    threshold: 0
  });

  sections.forEach(function(section) {
    observer.observe(section);
  });
})();
