/* tag-admin.js — "Manage tags" (admin only): tag groups and their options, plus tidying free tags. */
(function () {
  const { el } = NL;
  const PAL = ['#868e96', '#b08800', '#2b8a3e', '#c92a2a', '#5c940d', '#2f9e44', '#e67700', '#1971c2', '#7c5cff', '#0c8599', '#c2255c', '#e8590c'];

  function open() {
    if (!store.isAdmin()) return NL.toast('Only an admin can manage tags.');
    let dlg;
    const body = el('div.tag-admin');
    const run = (fn) => { try { fn(); } catch (err) { NL.toast(err.message); } draw(); NL.app.refresh(); };

    const row = (t, isFree) => el('div.ta-row', {},
      isFree ? el('span.ta-hash', {}, '#')
        : el('button.ta-swatch', { style: { background: t.color || 'var(--muted)' }, title: 'Change colour', onclick: () => run(() => store.updateTag(t.id, { color: PAL[(PAL.indexOf(t.color) + 1) % PAL.length] })) }),
      el('span.grow', {}, t.name),
      el('span.faint', {}, t.count + (t.count === 1 ? ' recipe' : ' recipes')),
      el('button.ws-more', { title: 'Rename', onclick: async () => { const n = await NL.ask('Rename “' + t.name + '”', t.name, 'Rename'); if (n) run(() => store.updateTag(t.id, { name: n })); } }, '✎'),
      el('button.ws-more', { title: 'Delete', onclick: () => { if (confirm('Delete “' + t.name + '”?' + (t.count ? ' It comes off ' + t.count + ' recipe(s).' : ''))) run(() => store.deleteTag(t.id)); } }, '×'));

    function draw() {
      const { groups, free } = store.listTagGroups();
      NL.fill(body,
        el('p.faint', {}, 'Groups keep everyone using the same words, so filters work. Editors pick from these; only an admin can change them.'),
        groups.map((g) => el('div.ta-group', {},
          el('div.ta-head', {},
            el('b', {}, g.name), el('span.faint', {}, g.choice === 'one' ? ' · one per recipe' : ' · any number'),
            el('span.spacer'),
            el('button.ws-more', { title: 'Rename group', onclick: async () => { const n = await NL.ask('Rename the group “' + g.name + '”', g.name, 'Rename'); if (n) run(() => store.renameTagGroup(g.id, n)); } }, '✎'),
            g.id === 'g_status' ? null : el('button.ws-more', { title: 'Delete group', onclick: () => { if (confirm('Delete the group “' + g.name + '” and all its options?')) run(() => store.deleteTagGroup(g.id)); } }, '🗑')),
          g.options.map((t) => row(t, false)),
          el('button.linkish.ta-add', { onclick: async () => { const n = await NL.ask('New option in “' + g.name + '”', '', 'Add'); if (n) run(() => store.createTag({ name: n, groupId: g.id })); } }, '＋ Add option'))),
        el('button.btn.sm.ta-newgroup', { onclick: async () => { const n = await NL.ask('Name the new group (e.g. Season, Client type)', '', 'Create'); if (n) run(() => store.createTagGroup({ name: n })); } }, '＋ New group'),
        el('div.ta-group', {},
          el('div.ta-head', {}, el('b', {}, 'Tags people added'), el('span.faint', {}, ' · ' + free.length)),
          free.length ? free.map((t) => row(t, true)) : el('p.faint', {}, 'None yet.')));
    }
    draw();
    dlg = NL.modal('Manage tags', body, [el('span.spacer'), el('button.btn.primary', { onclick: () => dlg.close() }, 'Done')]);
  }

  NL.tagAdmin = { open };
})();
