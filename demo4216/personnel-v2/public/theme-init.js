(function () {
  var mode = null;
  try {
    mode = localStorage.getItem('medtech-theme');
  } catch (e) {}
  if (mode !== 'dark' && mode !== 'light') {
    mode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', mode);
})();
