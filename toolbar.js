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
      bar.replaceChildren(
        el('a.brand', { href: '#/mine' }, 'NutriLabel ', el('small', {}, 'Workspace')),
        el('label.ws-search', {}, el('span.ic', {}, '⌕'), search, el('span.kbd', {}, '/')),
        el('span.spacer'),
        el('div.ws-seg', { id: 'layoutSeg', role: 'group', 'aria-label': 'Layout' },
          el('button', { dataset: { l: 'grid' }, title: 'Grid', onclick: () => NL.app.setLayout('grid') }, '▦ Grid'),
          el('button', { dataset: { l: 'list' }, title: 'List', onclick: () => NL.app.setLayout('list') }, '☰ List')),
        el('button.btn.ws-guide-btn', { id: 'guideBtn', title: 'Step-by-step use cases with several people', onclick: () => NL.demo.toggle() }, '▶ Use cases'),
        el('button.btn.theme-btn', { id: 'themeBtn', title: 'Light / dark', onclick: () => NL.app.toggleTheme() }),
        el('span', { id: 'bellSlot' }),
        el('span.ws-me', { id: 'meSlot' }));
    }
    const search = document.getElementById('search');
    if (document.activeElement !== search) search.value = state.query;
    document.querySelectorAll('#layoutSeg button').forEach((b) => {
      b.classList.toggle('on', b.dataset.l === state.layout);
      b.setAttribute('aria-pressed', String(b.dataset.l === state.layout));
    });
    document.getElementById('themeBtn').textContent = state.theme === 'dark' ? '☀' : '☾';
    document.getElementById('guideBtn').classList.toggle('on', NL.demo.isOpen());
    document.getElementById('bellSlot').replaceChildren(NL.notifications.button());
    document.getElementById('meSlot').replaceChildren(NL.peopleMenu.button());
  }

  NL.toolbar = { render };
})();
