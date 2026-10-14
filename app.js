/* app.js — screen state, routing (#/view/folderId), actions and keyboard shortcuts.
   Every data change goes through store.*; then we re-render. */
(function () {
  const { el } = NL;
  const VIEWS = ['mine', 'shared', 'recent', 'starred', 'archived'];
  // tell the use-case guide what just happened (it ticks steps and the feature checklist)
  const track = (e) => NL.demo && NL.demo.track(e);
  store.subscribe(track);

  const state = {
    view: 'mine', folderId: null, query: '',
    layout: store.pref('layout') || 'grid',
    theme: store.pref('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    detailsOpen: !!store.pref('details'),
    sort: { key: 'name', dir: 'asc', touched: false },
    selected: new Set(), anchor: null,
    items: [],
  };

  /* ---------- routing ---------- */
  function readHash() {
    const [, view, folderId] = location.hash.split('/');
    state.view = VIEWS.includes(view) ? view : 'mine';
    state.folderId = folderId && store.getItem(folderId) ? folderId : null;
  }
  function go(patch, opts = {}) {
    const prevKey = state.view + state.folderId + state.query;
    const prev = { view: state.view, folderId: state.folderId, query: state.query };
    Object.assign(state, patch);
    if (state.view + state.folderId + state.query !== prevKey) state.selected.clear();
    if (state.view !== prev.view || state.folderId !== prev.folderId) track({ type: 'view', view: state.view, folderId: state.folderId });
    if (state.query && state.query !== prev.query) track({ type: 'search', query: state.query });
    const hash = '#/' + state.view + (state.folderId ? '/' + state.folderId : '');
    if (location.hash !== hash) {
      if (opts.replace) history.replaceState(null, '', hash); else history.pushState(null, '', hash);
    }
    refresh();
  }
  const onNav = () => { readHash(); state.query = ''; state.selected.clear(); refresh(); track({ type: 'view', view: state.view, folderId: state.folderId }); };
  addEventListener('popstate', onNav);
  addEventListener('hashchange', onNav);

  /* ---------- render ---------- */
  function refresh(opts = {}) {
    if (opts.select) { state.selected = new Set([opts.select]); state.anchor = opts.select; }
    document.documentElement.dataset.theme = state.theme;
    state.items = store.listItems({ folderId: state.folderId, view: state.view, query: state.query });
    // drop selections that are no longer on screen
    const ids = new Set(state.items.map((i) => i.id));
    [...state.selected].forEach((id) => { if (!ids.has(id)) state.selected.delete(id); });

    NL.toolbar.render(state);
    NL.sidebar.render(state);
    NL.breadcrumbs.render(state);
    renderSelectionBar();
    renderHeadTools();
    if (!state.items.length) renderEmpty();
    else (state.layout === 'list' ? NL.itemList : NL.itemGrid).render(state, state.items);
    NL.detailsPanel.render(state);
    NL.demo.render();
    if (opts.select) { const n = document.querySelector('[data-id="' + opts.select + '"]'); n && n.scrollIntoView({ block: 'nearest' }); }
  }

  function renderEmpty() {
    const root = document.getElementById('items');
    const folder = state.folderId && store.getItem(state.folderId);
    const canAdd = !state.query && (state.view === 'mine' && !folder || (folder && ['owner', 'edit'].includes(folder.myRole)));
    const msg = state.query ? 'Nothing matches “' + state.query + '”.'
      : { mine: 'No recipes here yet.', shared: 'Nobody has shared anything with you yet.', recent: 'Recipes you open or change show up here.',
          starred: 'Star the recipes you use most and they’ll wait for you here.', archived: 'Nothing archived. Archived recipes can be restored any time.' }[folder ? 'mine' : state.view];
    root.replaceChildren(el('div.ws-empty', {},
      el('div.ws-empty-ic', {}, state.query ? '⌕' : state.view === 'starred' ? '★' : '▤'),
      el('p', {}, msg),
      canAdd ? el('button.btn.primary', { onclick: () => NL.newMenu.newRecipe(state) }, '＋ New recipe') : null));
  }

  function renderSelectionBar() {
    const bar = document.getElementById('selbar');
    const n = state.selected.size;
    bar.hidden = !n;
    if (!n) return;
    const sel = state.items.filter((i) => state.selected.has(i.id));
    const editable = sel.filter((i) => i.myRole === 'owner' || i.myRole === 'edit');
    const archivedView = state.view === 'archived' && !state.query;
    NL.fill(bar,
      el('button.btn.ghost.sm', { title: 'Clear selection (Esc)', onclick: () => { state.selected.clear(); refresh(); } }, '✕'),
      el('b', {}, n + ' selected'),
      el('span.spacer'),
      !archivedView ? el('button.btn.sm', { disabled: !editable.length, onclick: () => moveTo(editable.map((i) => i.id)) }, '⇢ Move') : null,
      editable.length === 1 && n === 1 ? el('button.btn.sm', { onclick: () => share(editable[0].id) }, '⇄ Share') : null,
      archivedView
        ? el('button.btn.sm', { disabled: !editable.length, onclick: () => restore(editable.map((i) => i.id)) }, '↺ Restore')
        : el('button.btn.sm', { disabled: !editable.length, onclick: () => archive(editable.map((i) => i.id)) }, '⌫ Archive'));
  }

  function renderHeadTools() {
    document.getElementById('headTools').replaceChildren(
      el('button.btn.ghost.ws-icon-btn' + (state.detailsOpen ? '.on' : ''), {
        title: (state.detailsOpen ? 'Hide' : 'Show') + ' details', 'aria-pressed': String(state.detailsOpen),
        onclick: () => toggleDetails(),
      }, 'ⓘ'));
  }

  /* ---------- selection ---------- */
  function select(id, e, keepIfSelected) {
    if (keepIfSelected && state.selected.has(id)) return;
    if (e && e.shiftKey && state.anchor) {
      const ids = state.items.map((i) => i.id);
      const [a, b] = [ids.indexOf(state.anchor), ids.indexOf(id)].sort((x, y) => x - y);
      state.selected = new Set(ids.slice(a, b + 1));
    } else if (e && (e.ctrlKey || e.metaKey)) {
      state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
      state.anchor = id;
    } else { state.selected = new Set([id]); state.anchor = id; }
    refresh();
  }
  function selectAll(on) { state.selected = on ? new Set(state.items.map((i) => i.id)) : new Set(); refresh(); }
  function toggleSelect(id) {
    state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
    state.anchor = id; refresh();
  }

  /* ---------- actions ---------- */
  function guard(fn) { try { return fn(); } catch (err) { NL.toast(err.message); track({ type: 'blocked', msg: err.message }); } }

  function open(id) {
    const it = store.getItem(id);
    if (!it) return;
    if (it.type === 'folder') go({ folderId: id, query: '', view: it.ownerId === store.me().id ? 'mine' : 'shared' });
    else {
      // the real v3 Recipe Builder when it's reachable (GitHub Pages), otherwise the placeholder page
      NL.toast('Opening “' + it.name + '” in the Recipe Builder…');
      store.openInBuilder(id).then((url) => { location.href = url || 'builder.html?id=' + encodeURIComponent(id); });
    }
  }
  async function rename(id) {
    const it = store.getItem(id);
    if (!it || !['owner', 'edit'].includes(it.myRole)) { track({ type: 'blocked', action: 'rename', itemId: id }); return NL.toast('You can only view “' + (it ? it.name : 'this') + '”, so you can’t rename it.'); }
    const name = await NL.ask('Rename ' + (it.type === 'folder' ? 'folder' : 'recipe'), it.name, 'Rename');
    if (!name || name === it.name) return;
    guard(() => store.rename(id, name)); refresh();
  }
  function duplicate(id) {
    const d = guard(() => store.duplicate(id));
    if (d) { refresh({ select: d.id }); NL.toast('Made “' + d.name + '”'); }
  }
  function star(id, on) { store.star(id, on); refresh(); NL.toast(on ? 'Starred' : 'Star removed'); }

  function archive(ids) {
    const done = ids.filter((id) => guard(() => store.archive(id)));
    if (!done.length) return;
    state.selected.clear(); refresh();
    NL.toast((done.length === 1 ? '“' + store.getItem(done[0]).name + '”' : done.length + ' items') + ' archived',
      { label: 'Undo', run: () => { done.forEach((id) => store.restore(id)); refresh(); track({ type: 'undo', of: 'archive' }); } });
  }
  function restore(ids) {
    const done = ids.filter((id) => guard(() => store.restore(id)));
    if (!done.length) return;
    state.selected.clear(); refresh();
    NL.toast(done.length === 1 ? 'Restored' : done.length + ' items restored');
  }
  function moveIds(ids, folderId, via = 'dialog') {
    const from = {};
    ids.forEach((id) => { const it = store.getItem(id); if (it) from[id] = (it.type === 'folder' ? it.parentId : it.folderId) || null; });
    const done = ids.filter((id) => id !== folderId && from[id] !== folderId && guard(() => store.move(id, folderId)));
    if (!done.length) return;
    const where = folderId ? store.getItem(folderId).name : 'My recipes';
    state.selected.clear(); refresh();
    track({ type: 'move', via, count: done.length, folderId });
    NL.toast((done.length === 1 ? '“' + store.getItem(done[0]).name + '”' : done.length + ' items') + ' moved to ' + where,
      { label: 'Undo', run: () => { done.forEach((id) => guard(() => store.move(id, from[id]))); refresh(); track({ type: 'undo', of: 'move' }); } });
  }
  function dropOn(folderId, e) {
    let ids; try { ids = JSON.parse(e.dataTransfer.getData('text/nl-ids')); } catch (x) { return; }
    if (ids && ids.length) moveIds(ids, folderId, 'drag');
  }
  function moveTo(ids) { NL.moveDialog.open(ids); }
  function share(id) { NL.shareDialog.open(id); }
  function details(id) { state.selected = new Set([id]); state.anchor = id; toggleDetails(true); }
  function toggleDetails(on) { state.detailsOpen = on === undefined ? !state.detailsOpen : on; store.pref('details', state.detailsOpen); refresh(); }
  function setLayout(l) { state.layout = l; store.pref('layout', l); refresh(); track({ type: 'layout', layout: l }); }
  function setSort(key) {
    const s = state.sort;
    // same column flips the order; a new column starts A→Z / low→high, except dates which start newest first
    const dir = s.key === key ? (s.dir === 'asc' ? 'desc' : 'asc') : key === 'updatedAt' ? 'desc' : 'asc';
    state.sort = { key, dir, touched: true };
    refresh();
    track({ type: 'sort', key, dir });
  }
  function resetDemo() { store.reset(); state.selected.clear(); go({ view: 'mine', folderId: null, query: '' }); NL.toast('Demo data reset'); }
  function toggleTheme() { state.theme = state.theme === 'dark' ? 'light' : 'dark'; store.pref('theme', state.theme); refresh(); track({ type: 'theme', theme: state.theme }); }

  // demo: become someone else (stands in for signing in as them)
  function switchUser(personId) {
    if (personId === store.me().id) return;
    store.switchUser(personId);
    state.selected.clear(); state.query = '';
    go({ view: 'mine', folderId: null, query: '' }, { replace: true });
    const me = store.me();
    NL.toast('You’re now ' + me.name + ' (' + me.title + ')');
  }
  // jump to an item: open its folder (or view) and select it — used by notifications
  function reveal(id) {
    const it = store.getItem(id);
    if (!it) return NL.toast('You can’t see that any more.');
    if (it.type === 'folder' && it.status === 'active') return open(id);
    const me = store.me().id;
    const parent = it.folderId && store.getItem(it.folderId);
    if (it.status === 'archived') go({ view: 'archived', folderId: null, query: '' });
    else if (parent) go({ view: parent.ownerId === me ? 'mine' : 'shared', folderId: parent.id, query: '' });
    else go({ view: it.ownerId === me ? 'mine' : 'shared', folderId: null, query: '' });
    refresh({ select: id });
  }

  /* ---------- keyboard ---------- */
  addEventListener('keydown', (e) => {
    const typing = e.target.closest('input, textarea, select, [contenteditable]');
    if (e.key === '/' && !typing) { e.preventDefault(); document.getElementById('search').focus(); track({ type: 'key', key: '/' }); return; }
    if (typing || document.querySelector('.nl-prompt-ov')) return;
    const sel = state.items.filter((i) => state.selected.has(i.id));
    if (['Enter', 'F2', 'Delete', 'Backspace'].includes(e.key) && sel.length) track({ type: 'key', key: e.key });
    if (e.key === 'Escape') { NL.closeMenu(); if (state.selected.size) { state.selected.clear(); refresh(); } }
    else if (e.key === 'Enter' && sel.length === 1) { e.preventDefault(); open(sel[0].id); }
    else if (e.key === 'F2' && sel.length === 1) { e.preventDefault(); rename(sel[0].id); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && sel.length) {
      e.preventDefault();
      state.view === 'archived' ? NL.toast('Already archived — use Restore to bring it back') : archive(sel.filter((i) => ['owner', 'edit'].includes(i.myRole)).map((i) => i.id));
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { e.preventDefault(); state.selected = new Set(state.items.map((i) => i.id)); refresh(); }
  });

  // click on empty space clears the selection
  document.getElementById('items').addEventListener('click', (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('ws-grid') || e.target.classList.contains('ws-folders') || e.target.classList.contains('ws-sec')) { state.selected.clear(); refresh(); }
  });

  NL.app = { state, track, switchUser, reveal, go, refresh, select, selectAll, toggleSelect, moveTo, share, details, toggleDetails, setLayout, setSort, open, rename, duplicate, star, archive, restore, moveIds, dropOn, resetDemo, toggleTheme };
  readHash();
  refresh();
})();
