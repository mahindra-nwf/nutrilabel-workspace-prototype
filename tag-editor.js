/* tag-editor.js — tag chips (shared look) and the "Edit tags" dialog for one recipe or several at once. */
(function () {
  const { el } = NL;

  // one chip; Status gets a dot, free tags a #
  function chip(t, extra = '') {
    return el('span.tag' + extra + (t.groupId ? '' : '.free') + (t.groupId === 'g_status' ? '.status' : ''),
      { style: t.color ? { '--tc': t.color } : null, title: (t.groupName ? t.groupName + ': ' : 'Tag: ') + t.name },
      t.groupId === 'g_status' ? el('span.tag-dot') : null, t.groupId ? '' : '#', t.name);
  }
  // first n chips, then "+k"
  function chips(list, n = 3) {
    const shown = (list || []).slice(0, n), more = (list || []).length - shown.length;
    return [...shown.map((t) => chip(t)), more > 0 ? el('span.tag.more', { title: list.slice(n).map((t) => t.name).join(', ') }, '+' + more) : null];
  }

  // ---- editor: works on one or many recipes. Each chip is on (all have it), partial (some) or off (none)
  function open(ids) {
    const items = () => ids.map((id) => store.getItem(id)).filter((i) => i && i.type === 'recipe' && (i.myRole === 'owner' || i.myRole === 'edit'));
    if (!items().length) return NL.toast('You can only view these, so you can’t change their tags.');
    const many = items().length > 1;
    let tracked = false, dlg;
    const body = el('div.tag-ed');

    function apply(fn) {
      items().forEach((it) => { try { store.setTags(it.id, fn(it.tags || [])); } catch (err) { NL.toast(err.message); } });
      if (many && !tracked) { tracked = true; NL.app.track({ type: 'bulktag', count: items().length }); }
      draw(); NL.app.refresh();
    }
    const stateOf = (tid) => { const its = items(), n = its.filter((i) => (i.tags || []).includes(tid)).length; return n === 0 ? 'off' : n === its.length ? 'on' : 'part'; };

    function draw() {
      const { groups, free } = store.listTagGroups();
      const its = items();
      const freeHere = free.filter((t) => its.some((i) => (i.tags || []).includes(t.id)));
      const input = el('input.ws-sel.tag-input', { placeholder: 'Add a tag, e.g. spring-26', list: 'tagSuggest', maxlength: 40 });
      const addFree = () => {
        const name = input.value.trim(); if (!name) return;
        try { const t = store.createTag({ name }); apply((tags) => tags.concat(t.id)); } catch (err) { NL.toast(err.message); }
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addFree(); } });

      NL.fill(body,
        many ? el('p.faint.tag-ed-note', {}, 'Click a tag to give it to all ' + its.length + ' recipes. Click again to take it off all of them. Dashed = only some have it.') : null,
        groups.map((g) => el('div.tag-ed-group', {},
          el('h4', {}, g.name, el('small', {}, g.choice === 'one' ? ' · pick one' : ' · pick any')),
          el('div.tag-ed-chips', {}, g.options.length ? g.options.map((t) => {
            const s = stateOf(t.id);
            return el('button.tag-btn.' + s, {
              style: { '--tc': t.color || 'var(--muted)' }, 'aria-pressed': String(s === 'on'),
              onclick: () => apply((tags) => {
                if (s === 'on') return tags.filter((x) => x !== t.id);
                const rest = g.choice === 'one' ? tags.filter((x) => !g.options.some((o) => o.id === x)) : tags.filter((x) => x !== t.id);
                return rest.concat(t.id);
              }),
            }, g.id === 'g_status' ? el('span.tag-dot') : null, t.name, s === 'on' ? ' ✓' : '');
          }) : el('span.faint', {}, 'No options yet' + (store.isAdmin() ? '. Add some in Manage tags.' : '.'))))),
        el('div.tag-ed-group', {},
          el('h4', {}, 'Tags', el('small', {}, ' · your own words, anyone can add')),
          el('div.tag-ed-chips', {}, freeHere.length ? freeHere.map((t) => {
            const s = stateOf(t.id);
            return el('span.tag-free-row.' + s, {},
              el('button.tag-btn.free.' + s, { title: s === 'on' ? 'All have it' : 'Some have it. Click to give it to all', onclick: () => s !== 'on' && apply((tags) => tags.concat(t.id)) }, '#' + t.name),
              el('button.tag-x', { title: 'Remove “' + t.name + '”' + (many ? ' from all' : ''), onclick: () => apply((tags) => tags.filter((x) => x !== t.id)) }, '×'));
          }) : el('span.faint', {}, 'None yet.')),
          el('div.tag-add', {}, input, el('button.btn.sm', { onclick: addFree }, 'Add'),
            el('datalist', { id: 'tagSuggest' }, free.filter((t) => !freeHere.includes(t)).map((t) => el('option', { value: t.name }))))));
    }
    draw();
    const title = many ? 'Tags for ' + items().length + ' recipes' : 'Tags for “' + items()[0].name + '”';
    dlg = NL.modal(title, body, [
      store.isAdmin() ? el('button.linkish', { onclick: () => { dlg.close(); NL.tagAdmin.open(); } }, '⚙ Manage tag groups…') : null,
      el('span.spacer'),
      el('button.btn.primary', { onclick: () => dlg.close() }, 'Done')].filter(Boolean));
  }

  NL.tags = { chip, chips, open };
})();
