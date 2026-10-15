/* tag-filters.js — filter chips above the recipes: Status ▾  Diet ▾  Channel ▾  Tags ▾. Within a group any match, across groups all. */
(function () {
  const { el } = NL;

  function render(state) {
    const root = document.getElementById('filters');
    if (state.view === 'archived' && !state.tagFilter.length) { root.hidden = true; return; }
    root.hidden = false;
    const { groups, free } = store.listTagGroups();
    const all = [...groups.map((g) => ({ id: g.id, name: g.name, options: g.options })), { id: 'free', name: 'Tags', options: free }];
    const on = new Set(state.tagFilter);
    NL.fill(root,
      el('span.flt-label', {}, 'Filter'),
      all.filter((g) => g.options.length).map((g) => {
        const picked = g.options.filter((t) => on.has(t.id));
        return el('button.flt-btn' + (picked.length ? '.on' : ''), {
          'aria-haspopup': 'true',
          onclick: (e) => { e.stopPropagation(); menu(e.currentTarget, g, state); },
        }, g.name + (picked.length ? ': ' + (picked.length === 1 ? picked[0].name : picked.length + ' chosen') : ''), ' ▾');
      }),
      on.size ? el('button.linkish.flt-clear', { onclick: () => NL.app.setTagFilter([]) }, 'Clear filters') : null);
  }

  // a checkbox list that stays open while you tick
  function menu(anchor, g, state) {
    NL.closeMenu();
    const r = anchor.getBoundingClientRect();
    const m = el('div.ws-menu.flt-menu', { role: 'dialog', 'aria-label': g.name });
    const draw = () => {
      const on = new Set(NL.app.state.tagFilter);
      NL.fill(m, g.options.map((t) => el('label.flt-opt', {},
        el('input', { type: 'checkbox', checked: on.has(t.id), onchange: (e) => {
          const next = new Set(NL.app.state.tagFilter); e.target.checked ? next.add(t.id) : next.delete(t.id);
          NL.app.setTagFilter([...next]); draw();
        } }),
        g.id === 'free' ? el('span.grow', {}, '#' + t.name) : el('span.grow', {}, el('span.tag-dot', { style: { background: t.color || 'var(--muted)' } }), t.name),
        el('span.faint', {}, String(t.count)))));
    };
    draw();
    document.body.append(m);
    m.style.left = Math.min(r.left, innerWidth - m.offsetWidth - 8) + 'px';
    m.style.top = r.bottom + 6 + 'px';
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    function onDoc(e) { if (!m.contains(e.target)) NL.closeMenu(); }
    m._off = () => document.removeEventListener('mousedown', onDoc);
  }

  NL.tagFilters = { render };
})();
