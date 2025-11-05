(function () {
  // Persisted theme
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme');
  if (saved) root.setAttribute('data-theme', saved);

  function setIcon() {
    const isDark = root.getAttribute('data-theme') === 'dark';
    if (btn) btn.textContent = isDark ? '🌙' : '☀️';
  }

  if (btn) {
    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      setIcon();
    });
    setIcon();
  }

  // Footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // (Optional) Read ?project param to auto-fill case-study title (simple example)
  const params = new URLSearchParams(location.search);
  const project = params.get('project');
  if (project && document.title.startsWith('Case Study')) {
    document.title = `Case Study – ${project.replace(/-/g,' ')} | Hugo`;
  }
})();
