/* breadcrumbs.js — "My recipes › Soups › Winter Specials" plus the page title for other views. */
(function () {
  const { el } = NL;
  const TITLES = { mine: 'My recipes', shared: 'Shared with me', recent: 'Recent', starred: 'Starred', archived: 'Archived' };

  function render(state) {
    const root = document.getElementById('crumbs');
    if (state.query) {
      root.replaceChildren(el('span.crumb.last', {}, 'Search results for “' + state.query + '”'));
      return;
    }
    if (state.view === 'tag') {
      const t = store.getTag(state.tagId);
      root.replaceChildren(el('span.crumb.last', {}, (t && t.groupName ? t.groupName : 'Tag') + ': '), t ? NL.tags.chip(t, '.big') : '');
      return;
    }
    const me = store.me();
    const trail = state.folderId ? store.path(state.folderId) : [];
    // a folder someone else owns starts from "Shared with me"
    const rootView = trail.length && trail[0].ownerId !== me.id ? 'shared' : state.view;
    const parts = [{ label: TITLES[rootView], go: { view: rootView, folderId: null } },
      ...trail.map((f) => ({ label: f.name, go: { view: rootView, folderId: f.id }, id: f.id }))];
    root.replaceChildren(...parts.flatMap((p, i) => {
      const last = i === parts.length - 1;
      const node = el('button.crumb' + (last ? '.last' : ''), {
        onclick: () => !last && NL.app.go(Object.assign({ query: '' }, p.go)),
        ondragover: !last ? (e) => { e.preventDefault(); e.currentTarget.classList.add('drop'); } : null,
        ondragleave: (e) => e.currentTarget.classList.remove('drop'),
        ondrop: !last ? (e) => { e.preventDefault(); e.currentTarget.classList.remove('drop'); NL.app.dropOn(p.id || null, e); } : null,
      }, p.label);
      return i ? [el('span.sep', {}, '›'), node] : [node];
    }));
  }

  NL.breadcrumbs = { render };
})();
