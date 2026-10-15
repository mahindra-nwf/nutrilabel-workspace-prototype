/* item-list.js — table view: name, owner, last changed, versions, kcal, cost. Click a header to sort. */
(function () {
  const { el, timeAgo, money, firstName } = NL;
  const COLS = [
    { key: 'name', label: 'Name', get: (i) => i.name.toLowerCase() },
    { key: 'tags', label: 'Tags', get: (i) => statusRank(i) },
    { key: 'owner', label: 'Owner', get: (i) => (i.owner ? i.owner.name : '') },
    { key: 'updatedAt', label: 'Last changed', get: (i) => i.updatedAt },
    { key: 'versions', label: 'Versions', get: (i) => i.versions || 0, num: true },
    { key: 'kcalPerPortion', label: 'kcal / portion', get: (i) => i.kcalPerPortion || 0, num: true },
    { key: 'costPerPortion', label: 'Cost / portion', get: (i) => i.costPerPortion || 0, num: true },
  ];

  // sorting the Tags column orders by Status: Draft, In trial, Approved, Discontinued, then no status
  const STATUS_ORDER = ['t_draft', 't_trial', 't_approved', 't_disc'];
  const statusRank = (i) => { const s = (i.tagList || []).find((t) => t.groupId === 'g_status'); const k = s ? STATUS_ORDER.indexOf(s.id) : -1; return k < 0 ? 9 : k; };

  function render(state, items) {
    const root = document.getElementById('items');
    const sort = state.sort;
    const col = COLS.find((c) => c.key === sort.key) || COLS[0];
    const dir = sort.dir === 'desc' ? -1 : 1;
    // folders stay on top, like Drive
    const rows = [...items].sort((a, b) => (a.type !== b.type ? (a.type === 'folder' ? -1 : 1)
      : (col.get(a) > col.get(b) ? 1 : col.get(a) < col.get(b) ? -1 : 0) * dir));
    // in Recent, the default order is "most recent first"; only sort when the user picked a column
    const ordered = state.view === 'recent' && !state.query && !sort.touched ? items : rows;

    const allOn = items.length && items.every((i) => state.selected.has(i.id));
    const head = el('tr', {},
      el('th.c-check', {}, el('input.ws-check', { type: 'checkbox', checked: !!allOn, title: 'Select all',
        onclick: (e) => { e.stopPropagation(); NL.app.selectAll(!allOn); } })),
      COLS.map((c) => el('th.c-' + c.key + (c.num ? '.num-col' : ''), {
        'aria-sort': c.key === col.key && (sort.touched || state.view !== 'recent') ? (dir > 0 ? 'ascending' : 'descending') : null,
        onclick: () => NL.app.setSort(c.key),
      }, c.label, c.key === col.key && (sort.touched || state.view !== 'recent') ? el('span.sort', {}, dir > 0 ? ' ↑' : ' ↓') : null)),
      el('th.c-more'));

    const body = ordered.map((i) => row(state, i));
    root.replaceChildren(el('table.ws-table', {}, el('thead', {}, head), el('tbody', {}, body)));
  }

  function row(state, i) {
    const G = NL.itemGrid;
    const me = store.me();
    const isFolder = i.type === 'folder';
    const who = i.updatedByPerson ? (i.updatedByPerson.id === me.id ? 'you' : firstName(i.updatedByPerson)) : '';
    const tr = el('tr.ws-row' + (i.status === 'archived' ? '.archived' : '') + (isFolder ? '.folder' : ''), {},
      el('td.c-check', {}, G.check(state, i)),
      el('td.c-name', {}, el('div.ws-row-name', {},
        isFolder ? el('span.ws-row-ic.folder', { innerHTML: G.FOLDER_SVG })
          : el('span.ws-row-ic', { style: { background: i.thumbnailColor } }),
        el('span.ws-name', { title: i.name }, i.name),
        G.sharedBadge(i),
        el('span.ws-row-star', {}, G.star(i)))),
      el('td.c-tags', {}, isFolder ? '' : el('span.ws-row-tags', {}, NL.tags.chips(i.tagList, 2))),
      el('td.c-owner', {}, i.owner ? el('span.ws-owner', {}, NL.avatar(i.owner, 22), i.owner.id === me.id ? 'me' : i.owner.name) : ''),
      el('td.muted.c-updatedAt', {}, timeAgo(i.updatedAt) + (who ? ' · ' + who : '')),
      el('td.num-col.c-versions', {}, isFolder ? '—' : i.versions),
      el('td.num-col.c-kcalPerPortion', {}, isFolder ? '—' : (i.kcalPerPortion || '—')),
      el('td.num-col.c-costPerPortion', {}, isFolder ? '—' : (i.costPerPortion ? money(i.costPerPortion) : '—')),
      el('td.c-more', {}, G.more(i)));
    return G.wire(tr, state, i);
  }

  NL.itemList = { render };
})();
