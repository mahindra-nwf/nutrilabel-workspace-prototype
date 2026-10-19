/* toolbar.js — top bar: brand, search, layout toggle, use-case guide, theme, notifications, person switcher. */
(function () {
  const { el } = NL;
  let built = false;

  function render(state) {
    const bar = document.getElementById('topbar');
    if (!built) {
      built = true;
      const search = el('input.ws-search-input', {
        id: 'search', type: 'search', placeholder: 'Search recipes and folders', autocomplete: 'off',
        value: state.query,
        oninput: (e) => NL.app.go({ query: e.target.value }, { replace: true }),
        onkeydown: (e) => { if (e.key === 'Escape') { e.target.value = ''; NL.app.go({ query: '' }); e.target.blur(); } },
      });
      bar.replaceChildren(...[
        el('a.btn', { href: location.pathname.startsWith('/workspace/') ? '/' : '../nutrilabel-home-prototype/', title: 'All apps' }, '← Home'),
        el('a.brand', { href: '#/mine' }, 'Northwest Frozen ', el('small', {}, 'Recipe Library')),
        el('label.ws-search', {}, el('span.ic', {}, '⌕'), search),
        el('span.spacer'),
        el('div.ws-seg', { id: 'layoutSeg', role: 'group', 'aria-label': 'Layout' },
          el('button', { dataset: { l: 'grid' }, title: 'Grid', onclick: () => NL.app.setLayout('grid') }, '▦ Grid'),
          el('button', { dataset: { l: 'list' }, title: 'List', onclick: () => NL.app.setLayout('list') }, '☰ List')),
        // demo-only controls (use-case guide, notifications from made-up people, person switcher): Playground only
        store.isLive ? null : el('button.btn.ws-guide-btn', { id: 'guideBtn', title: 'Step-by-step use cases with several people', onclick: () => NL.demo.toggle() }, '▶ Use cases'),
        el('button.btn.theme-btn', { id: 'themeBtn', title: 'Light / dark', onclick: () => NL.app.toggleTheme() }),
        store.isLive ? null : el('span', { id: 'bellSlot' }),
        store.isLive ? null : el('span.ws-me', { id: 'meSlot' })].filter(Boolean));
    }
    const search = document.getElementById('search');
    if (document.activeElement !== search) search.value = state.query;
    document.querySelectorAll('#layoutSeg button').forEach((b) => {
      b.classList.toggle('on', b.dataset.l === state.layout);
      b.setAttribute('aria-pressed', String(b.dataset.l === state.layout));
    });
    document.getElementById('themeBtn').textContent = state.theme === 'dark' ? '☀' : '☾';
    if (store.isLive) return;
    document.getElementById('guideBtn').classList.toggle('on', NL.demo.isOpen());
    document.getElementById('bellSlot').replaceChildren(NL.notifications.button());
    document.getElementById('meSlot').replaceChildren(NL.peopleMenu.button());
  }

  NL.toolbar = { render };
})();
