// v1.0.0
// Pre-paint theme script. Injected into <head> by app/layout.tsx via
// dangerouslySetInnerHTML so it runs synchronously before React
// hydrates. Prevents flash of unthemed content on first paint.
//
// Resolution order:
//   1. localStorage['opsf:theme'] if present and valid ('light' | 'dark')
//   2. System preference via prefers-color-scheme
//   3. Light (default)

export const THEME_STORAGE_KEY = "opsf:theme";

export const themeScript = `(function() {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var stored = localStorage.getItem(key);
    var theme;
    if (stored === 'dark' || stored === 'light') {
      theme = stored;
    } else {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = theme;
  } catch (e) {}
})();`;
