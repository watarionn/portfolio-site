'use strict';

(function setCurrentYear() {
  const year = document.getElementById('currentYear');
  if (year) year.textContent = new Date().getFullYear();
})();

(function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -6% 0px'
  });

  items.forEach((item) => observer.observe(item));
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
