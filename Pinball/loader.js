(function () {
  fetch('level.json', { cache: 'no-cache' })
    .then(r => r.json())
    .then(level => {
      window.LEVELS = [level];
    })
    .catch(err => {
      console.error('Failed to load level.json, starting with an empty level.', err);
      window.LEVELS = [{ description: 'Empty', walls: [], elements: [] }];
    })
    .finally(() => {
      const s = document.createElement('script');
      s.src = 'game.js';
      document.body.appendChild(s);
    });
})();
