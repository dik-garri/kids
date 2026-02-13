// Совёнок — Hash-based SPA Router

const routes = {};
let appEl = null;

export const router = {
  add(path, handler) {
    routes[path] = handler;
  },

  init() {
    appEl = document.getElementById('app');
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  resolve() {
    const hash = location.hash.slice(1) || '/';
    const handler = routes[hash] || this.matchPattern(hash) || routes['/'];
    if (handler) {
      appEl.innerHTML = '';
      handler(appEl, this.getParams(hash));
    }
  },

  matchPattern(hash) {
    for (const [pattern, handler] of Object.entries(routes)) {
      if (!pattern.includes(':')) continue;
      const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$');
      if (regex.test(hash)) return handler;
    }
    return null;
  },

  getParams(hash) {
    for (const pattern of Object.keys(routes)) {
      if (!pattern.includes(':')) continue;
      const keys = [...pattern.matchAll(/:(\w+)/g)].map(m => m[1]);
      const regex = new RegExp('^' + pattern.replace(/:(\w+)/g, '([^/]+)') + '$');
      const match = hash.match(regex);
      if (match) {
        const params = {};
        keys.forEach((key, i) => params[key] = match[i + 1]);
        return params;
      }
    }
    return {};
  },

  navigate(path) {
    location.hash = path;
  }
};
