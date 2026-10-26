/* sidebar.js — "＋ New" button, the five views, and Tags. */
(function () {
  const { el } = NL;
  const VIEWS = [
    { id: 'mine', label: store.rootName, icon: '▤' },
    store.isLive ? null : { id: 'shared', label: 'Shared with me', icon: '⇄' }, // Live: everyone sees everything
    { id: 'recent', label: 'Recent', icon: '◷' },
    { id: 'starred', label: 'Starred', icon: '★' },
    { id: 'archived', label: 'Archived', icon: '⌫' },
  ].filter(Boolean);

  let showAllFree = false;
  function render(state) {
    const root = document.getElementById('sidebar');
    const newBtn = el('button.ws-new' + (store.canCreate() ? '' : '.muted-btn'), {
      id: 'newBtn', title: store.canCreate() ? 'New recipe or folder' : 'Viewers can’t create recipes',
      onclick: (e) => { const r = e.currentTarget.getBoundingClientRect(); NL.newMenu.open(r.left, r.bottom + 6, state); },
    }, el('span.plus', {}, '＋'), 'New');

    const nav = el('nav.ws-nav', {}, VIEWS.map((v) =>
      el('button' + (state.view === v.id && !state.query ? '.on' : ''), {
        onclick: () => NL.app.go({ view: v.id, folderId: null, query: '' }),
        // drop a recipe on "My recipes" to move it back to the top level
        ondragover: v.id === 'mine' ? (e) => { e.preventDefault(); e.currentTarget.classList.add('drop'); } : null,
        ondragleave: (e) => e.currentTarget.classList.remove('drop'),
        ondrop: v.id === 'mine' ? (e) => { e.preventDefault(); e.currentTarget.classList.remove('drop'); NL.app.dropOn(null, e); } : null,
      }, el('span.ic', {}, v.icon), v.label)));

    // Tags: click one to see every recipe with it, across folders (like labels in an inbox)
    const { groups, free } = store.listTagGroups();
    const tagBtn = (t, isFree) => el('button.ws-tagnav' + (state.view === 'tag' && state.tagId === t.id ? '.on' : ''), {
      title: (isFree ? 'Tag' : t.groupName || '') + ': ' + t.name,
      onclick: () => NL.app.go({ view: 'tag', tagId: t.id, folderId: null, query: '' }),
    }, isFree ? el('span.ws-tag-hash', {}, '#') : el('span.tag-dot', { style: { background: t.color || 'var(--muted)' } }), el('span.grow', {}, t.name), el('span.ws-tag-n', {}, t.count || ''));
    const shownFree = showAllFree ? free : free.slice(0, 6);
    const tagsNav = el('div.ws-tags-side', {},
      el('div.ws-tags-head', {}, el('span', {}, 'Tags'),
        store.isAdmin() ? el('button.ws-more', { title: 'Manage tags (admin)', onclick: () => NL.tagAdmin.open() }, '⚙') : null),
      groups.filter((g) => g.options.length).map((g) => el('div.ws-tags-group', {},
        el('div.ws-tags-gname', {}, g.name),
        g.options.map((t) => tagBtn(Object.assign({}, t, { groupName: g.name }), false)))),
      free.length ? el('div.ws-tags-group', {}, el('div.ws-tags-gname', {}, 'Your tags'), shownFree.map((t) => tagBtn(t, true)),
        free.length > 6 ? el('button.linkish.ws-tags-more', { onclick: () => { showAllFree = !showAllFree; render(state); } }, showAllFree ? 'Show fewer' : 'Show all ' + free.length) : null) : null);

    const foot = store.isLive
      ? el('div.ws-side-foot', {}, el('div.faint', {}, 'Live · saved for your team'))
      : el('div.ws-side-foot', {},
        el('button.btn.ghost.sm', {
          onclick: () => { if (confirm('Put all demo recipes, folders and sharing back the way they started?')) NL.app.resetDemo(); },
        }, '↺ Reset demo data'),
        el('div.faint', {}, 'Playground · made-up data'));

    root.replaceChildren(newBtn, nav, tagsNav, foot);
  }

  NL.sidebar = { render };
})();
