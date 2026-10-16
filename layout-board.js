/* layout-board.js — "Kitchen board": recipes as cards in Status columns (Draft → In trial → Approved → Discontinued).
   Drag a card to another column, or use its Status menu (the skill's WCAG rule: dragging must never be the only way). */
(function () {
  const { el, money } = NL;
  const L = NL.lab;

  function setStatus(r, statusId) {
    const keep = (r.tags || []).filter((id) => !(store.getTag(id) || {}).groupId || store.getTag(id).groupId !== 'g_status');
    try { store.setTags(r.id, statusId ? keep.concat(statusId) : keep); NL.toast('“' + r.name + '” → ' + (statusId ? store.getTag(statusId).name : 'No status')); }
    catch (err) { NL.toast(err.message); }
    L.rerender();
  }

  function render(stage) {
    const status = store.listTagGroups().groups.find((g) => g.id === 'g_status');
    const all = L.recipes();
    const cols = [...status.options, { id: null, name: 'No status', color: null }];
    stage.append(el('div.board', {}, cols.map((col) => {
      const list = all.filter((r) => (L.statusOf(r) || {}).id === (col.id || undefined) || (!col.id && !L.statusOf(r)));
      if (!col.id && !list.length) return null;
      const column = el('section.board-col', {
        'aria-label': col.name + ', ' + list.length + ' recipes',
        ondragover: (e) => { e.preventDefault(); e.currentTarget.classList.add('drop'); },
        ondragleave: (e) => e.currentTarget.classList.remove('drop'),
        ondrop: (e) => { e.preventDefault(); const r = all.find((x) => x.id === e.dataTransfer.getData('text/nl-id')); if (r) setStatus(r, col.id); },
      },
        el('header.board-head', { style: col.color ? { '--tc': col.color } : null }, el('span.tag-dot'), el('b', {}, col.name), el('span.board-n', {}, String(list.length))),
        el('div.board-list', {}, list.length ? list.map((r) => card(r, status)) : el('p.board-empty', {}, 'Nothing here yet.')));
      return column;
    })));
  }

  function card(r, status) {
    const editable = L.canEdit(r);
    const others = (r.tagList || []).filter((t) => t.groupId !== 'g_status');
    return el('article.board-card', {
      draggable: editable, style: { '--rc': r.thumbnailColor },
      ondragstart: (e) => { e.dataTransfer.setData('text/nl-id', r.id); e.currentTarget.classList.add('dragging'); },
      ondragend: (e) => e.currentTarget.classList.remove('dragging'),
    },
      el('div.board-card-top', {}, editable ? L.icon('grip', 14) : null, el('b.grow', {}, r.name), r.starred ? L.icon('star', 14) : null),
      el('div.board-meta', {}, L.folderOf(r) + ' · ' + (r.kcalPerPortion || '—') + ' kcal · ' + (r.costPerPortion ? money(r.costPerPortion) : '—')),
      others.length ? el('div.board-tags', {}, NL.tags.chips(others, 3)) : null,
      el('div.board-actions', {},
        editable
          ? el('label.board-move', {}, 'Status ', el('select.ws-sel', { 'aria-label': 'Status of ' + r.name, onchange: (e) => setStatus(r, e.target.value || null) },
              status.options.map((o) => el('option', { value: o.id, selected: (L.statusOf(r) || {}).id === o.id }, o.name)),
              el('option', { value: '', selected: !L.statusOf(r) }, 'No status')))
          : el('span.faint', {}, 'View only'),
        el('button.btn.sm', { onclick: () => L.open(r.id), title: 'Open in the Recipe Builder' }, L.icon('open', 14), 'Open')));
  }

  L.register({
    id: 'board', name: 'Kitchen board', render,
    pitch: 'Every recipe sits in a column for its Status, so the team sees at a glance what is a draft, what is being trialled and what is approved. Move a recipe along by dragging it or with its Status menu.',
    source: 'No “kanban” style in the database (searched, 0 results), so the columns are a general pattern. The drag rule is from the ux domain: “Dragging Movements, WCAG 2.2: add a single-pointer alternative”, hence the Status menu on every card.',
    bestFor: 'Weekly R&D stand-ups, and a head chef approving trials.',
    tradeoff: 'Folders disappear from view; it works best once everyone keeps Status up to date.',
  });
})();
