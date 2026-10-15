/* item-grid.js — folders first, then recipe cards. */
(function () {
  const { el, timeAgo, money, firstName } = NL;
  const FOLDER_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/></svg>';

  function render(state, items) {
    const root = document.getElementById('items');
    const folders = items.filter((i) => i.type === 'folder');
    const recipes = items.filter((i) => i.type === 'recipe');
    const out = [];
    if (folders.length) out.push(el('h3.ws-sec', {}, 'Folders'), el('div.ws-folders', {}, folders.map((f) => folderCard(state, f))));
    if (recipes.length) out.push(el('h3.ws-sec', {}, 'Recipes'), el('div.ws-grid', {}, recipes.map((r) => recipeCard(state, r))));
    root.replaceChildren(...out);
  }

  // shared behaviour for every card/row: select, open, menu, drag
  function wire(node, state, item) {
    node.tabIndex = -1;
    node.dataset.id = item.id;
    if (state.selected.has(item.id)) node.classList.add('sel');
    node.addEventListener('click', (e) => {
      if (e.target.closest('button, input')) return;
      NL.app.select(item.id, e);
      // one click opens a folder (Drive opens on double-click; chefs expect one click)
      if (item.type === 'folder' && !e.ctrlKey && !e.metaKey && !e.shiftKey) NL.app.open(item.id);
    });
    node.addEventListener('dblclick', (e) => { if (!e.target.closest('button, input')) NL.app.open(item.id); });
    node.addEventListener('contextmenu', (e) => { e.preventDefault(); NL.app.select(item.id, e, true); NL.itemMenu.open(e.clientX, e.clientY, item); });
    if (item.status === 'active' && (item.myRole === 'owner' || item.myRole === 'edit')) {
      node.draggable = true;
      node.addEventListener('dragstart', (e) => {
        const ids = state.selected.has(item.id) ? [...state.selected] : [item.id];
        e.dataTransfer.setData('text/nl-ids', JSON.stringify(ids));
        e.dataTransfer.effectAllowed = 'move';
        node.classList.add('dragging');
      });
      node.addEventListener('dragend', () => node.classList.remove('dragging'));
    }
    if (item.type === 'folder' && item.status === 'active') {
      node.addEventListener('dragover', (e) => { if (e.dataTransfer.types.includes('text/nl-ids')) { e.preventDefault(); node.classList.add('drop'); } });
      node.addEventListener('dragleave', () => node.classList.remove('drop'));
      node.addEventListener('drop', (e) => { e.preventDefault(); node.classList.remove('drop'); NL.app.dropOn(item.id, e); });
    }
    return node;
  }

  function check(state, item) {
    return el('input.ws-check', {
      type: 'checkbox', checked: state.selected.has(item.id), title: 'Select',
      onclick: (e) => { e.stopPropagation(); NL.app.toggleSelect(item.id); },
    });
  }
  function star(item) {
    return el('button.ws-star' + (item.starred ? '.on' : ''), {
      title: item.starred ? 'Remove star' : 'Star', 'aria-pressed': String(item.starred),
      onclick: (e) => { e.stopPropagation(); NL.app.star(item.id, !item.starred); },
    }, item.starred ? '★' : '☆');
  }
  function more(item) {
    return el('button.ws-more', {
      title: 'More actions', 'aria-label': 'More actions for ' + item.name,
      onclick: (e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); NL.itemMenu.open(r.left, r.bottom + 4, item); },
    }, '⋯');
  }
  function sharedBadge(item) {
    if (item.shares.length || item.orgView) return el('span.ws-badge', { title: 'Shared' }, '⇄');
    return null;
  }

  function folderCard(state, f) {
    return wire(el('div.ws-folder', {},
      check(state, f),
      el('span.ws-folder-ic', { innerHTML: FOLDER_SVG }),
      el('div.ws-folder-txt', {},
        el('div.ws-name', {}, f.name),
        el('div.faint', {}, f.childCount + (f.childCount === 1 ? ' item' : ' items') + (f.owner && f.myRole !== 'owner' ? ' · ' + f.owner.name : ''))),
      sharedBadge(f),
      more(f)), state, f);
  }

  function recipeCard(state, r) {
    const who = r.updatedByPerson && r.updatedByPerson.id === store.me().id ? 'you' : firstName(r.updatedByPerson);
    return wire(el('div.ws-card' + (r.status === 'archived' ? '.archived' : ''), {},
      el('div.ws-thumb', { style: { background: r.thumbnailColor } },
        check(state, r),
        el('span.ws-thumb-tags', {}, NL.tags.chips(r.tagList, 2)),
        star(r)),
      el('div.ws-card-body', {},
        el('div.ws-card-head', {}, el('div.ws-name', { title: r.name }, r.name), sharedBadge(r), more(r)),
        el('div.ws-stats', {},
          el('span', {}, el('b', {}, r.kcalPerPortion || '—'), ' kcal / portion'),
          el('span', {}, el('b', {}, r.costPerPortion ? money(r.costPerPortion) : '—'), ' / portion')),
        el('div.ws-meta', {}, 'edited ' + timeAgo(r.updatedAt) + ' by ' + who))), state, r);
  }

  NL.itemGrid = { render, wire, check, star, more, sharedBadge, FOLDER_SVG };
})();
