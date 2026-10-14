/* sidebar.js — "＋ New" button and the five views. */
(function () {
  const { el } = NL;
  const VIEWS = [
    { id: 'mine', label: 'My recipes', icon: '▤' },
    { id: 'shared', label: 'Shared with me', icon: '⇄' },
    { id: 'recent', label: 'Recent', icon: '◷' },
    { id: 'starred', label: 'Starred', icon: '★' },
    { id: 'archived', label: 'Archived', icon: '⌫' },
  ];

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

    const foot = el('div.ws-side-foot', {},
      el('button.btn.ghost.sm', {
        onclick: () => { if (confirm('Put all demo recipes, folders and sharing back the way they started?')) NL.app.resetDemo(); },
      }, '↺ Reset demo data'),
      el('div.faint', {}, 'Prototype · made-up data'));

    root.replaceChildren(newBtn, nav, foot);
  }

  NL.sidebar = { render };
})();
