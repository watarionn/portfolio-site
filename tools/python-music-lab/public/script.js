(() => {
  const audio = document.getElementById('compositionAudio');
  if (!audio) return;
  document.querySelectorAll('[data-seek]').forEach((button) => {
    button.addEventListener('click', () => {
      audio.currentTime = Number(button.dataset.seek || 0);
      audio.play().catch(() => {});
    });
  });
})();