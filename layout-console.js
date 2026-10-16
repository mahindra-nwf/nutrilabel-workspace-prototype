/* layout-console.js — "R&D console": the skill's Data-Dense Dashboard. KPI row, filter rail, compact sortable table. */
(function () {
  const { el, money, timeAgo } = NL;
  const L = NL.lab;
  let sort = { key: 'name', dir: 1 };
  let picked = new Set();

  function render(stage) {
    const { groups } = store.listTagGroups();
    const all = L.recipes();
    // filters: within a group any, across groups all (same rule as the Workspace filter chips)
    const byGroup = {};
    [...picked].forEach((id) => { const t = store.getTag(id); if (t) (byGroup[t.groupId] = byGroup[t.groupId] || []).push(id); });
    const rows = all.filter((r) => Object.values(byGroup).every((ids) => ids.some((id) => (r.tags || []).includes(id))));

    const avg = (f) => (rows.length ? rows.reduce((s, r) => s + (f(r) || 0), 0) / rows.length : 0);
    const nStatus = (id) => rows.filter((r) => (L.statusOf(r) || {}).id === id).length;
    const kpis = [
      ['Recipes', String(rows.length), rows.length === all.length ? 'all you can see' : 'of ' + all.length],
      ['Approved', rows.length ? Math.round(nStatus('t_approved') / rows.length * 100) + '%' : '—', nStatus('t_approved') + ' recipes'],
      ['In trial', String(nStatus('t_trial')), 'waiting for approval'],
      ['Avg kcal / portion', String(Math.round(avg((r) => r.kcalPerPortion))), 'across these recipes'],
      ['Avg cost / portion', money(avg((r) => r.costPerPortion)), 'ingredients only'],
    ];

    const cols = [
      ['name', 'Recipe', (r) => r.name.toLowerCase()],
      ['folder', 'Folder', (r) => L.folderOf(r)],
      ['status', 'Status', (r) => (L.statusOf(r) || {}).name || 'zz'],
      ['kcal', 'kcal', (r) => r.kcalPerPortion || 0, true],
      ['cost', 'Cost', (r) => r.costPerPortion || 0, true],
      ['kcal$', 'kcal per $', (r) => (r.costPerPortion ? r.kcalPerPortion / r.costPerPortion : 0), true],
      ['ver', 'Ver.', (r) => r.versions || 0, true],
      ['changed', 'Changed', (r) => r.updatedAt, true],
    ];
    const c = cols.find((x) => x[0] === sort.key) || cols[0];
    rows.sort((a, b) => (c[2](a) > c[2](b) ? 1 : c[2](a) < c[2](b) ? -1 : 0) * sort.dir);

    stage.append(
      el('div.con-kpis', {}, kpis.map(([k, v, s]) => el('div.con-kpi', {}, el('span', {}, k), el('b', {}, v), el('small', {}, s)))),
      el('div.con-body', {},
        el('aside.con-rail', { 'aria-label': 'Filters' },
          el('div.con-rail-head', {}, el('b', {}, 'Filters'), picked.size ? el('button.linkish', { onclick: () => { picked.clear(); L.rerender(); } }, 'Clear') : null),
          groups.filter((g) => g.options.length).map((g) => el('fieldset.con-group', {},
            el('legend', {}, g.name),
            g.options.map((t) => el('label.con-opt', {},
              el('input', { type: 'checkbox', checked: picked.has(t.id), onchange: (e) => { e.target.checked ? picked.add(t.id) : picked.delete(t.id); L.rerender(); } }),
              el('span.tag-dot', { style: { background: t.color || 'var(--muted)' } }), el('span.grow', {}, t.name), el('span.faint', {}, String(t.count))))))),
        el('div.con-table-wrap', {}, el('table.con-table', {},
          el('thead', {}, el('tr', {}, cols.map(([key, label, , num]) => el('th' + (num ? '.num' : ''), {
            'aria-sort': sort.key === key ? (sort.dir > 0 ? 'ascending' : 'descending') : null,
          }, el('button.con-sort', { onclick: () => { sort = { key, dir: sort.key === key ? -sort.dir : (key === 'changed' ? -1 : 1) }; L.rerender(); } },
            label, sort.key === key ? (sort.dir > 0 ? ' ↑' : ' ↓') : ''))), el('th'))),
          el('tbody', {}, rows.length ? rows.map((r) => {
            const s = L.statusOf(r);
            return el('tr', { ondblclick: () => L.open(r.id) },
              el('td', {}, el('span.con-name', {}, el('span.con-sw', { style: { background: r.thumbnailColor } }), r.name)),
              el('td.muted', {}, L.folderOf(r)),
              el('td', {}, s ? NL.tags.chip(s) : el('span.faint', {}, '—')),
              el('td.num', {}, String(r.kcalPerPortion || '—')),
              el('td.num', {}, r.costPerPortion ? money(r.costPerPortion) : '—'),
              el('td.num', {}, r.costPerPortion ? String(Math.round(r.kcalPerPortion / r.costPerPortion)) : '—'),
              el('td.num', {}, String(r.versions || 0)),
              el('td.num.muted', {}, timeAgo(r.updatedAt)),
              el('td', {}, el('button.btn.sm.ghost', { onclick: () => L.open(r.id), 'aria-label': 'Open ' + r.name }, L.icon('open', 14))));
          }) : el('tr', {}, el('td.con-none', { colspan: 9 }, 'No recipes match these filters.')))))));
  }

  L.register({
    id: 'console', name: 'R&D console', render,
    pitch: 'Numbers first: a row of totals, filters always visible on the left, and a compact table you can sort by any column, including kcal per dollar. Double-click a row to open it.',
    source: 'Style “Data-Dense Dashboard” (search: data dense table): KPI cards row, filter sidebar, 8–12 px padding, 36 px rows, sticky headers. Design dials: density 9, variance 3, which gave Minimalism & Swiss Style.',
    bestFor: 'Costing reviews, comparing a range, and preparing for a client meeting.',
    tradeoff: 'Dense and analytical; less friendly for a chef who just wants to find yesterday’s recipe.',
  });
})();
