(function () {
  fetch('level.json', { cache: 'no-cache' })
    .then(r => r.text())
    .then(text => {
      try {
        const parsed = JSON.parse(text);
        window.LEVELS = [parsed];
      } catch (err) {
        // Fail silently and use an empty level to avoid spamming parse errors
        console.warn('level.json is invalid — starting with an empty level.');
        window.LEVELS = [{ description: 'Empty', walls: [], elements: [] }];
      }
    })
    .catch(() => {
      // Fetch failed (404 or network). Use an empty level.
      window.LEVELS = [{ description: 'Empty', walls: [], elements: [] }];
    })
    .finally(() => {
      const s = document.createElement('script');
      // Use editor.js game logic so index.html uses the same engine as the editor
      s.src = 'editor.js';
      document.body.appendChild(s);
    });
})();
