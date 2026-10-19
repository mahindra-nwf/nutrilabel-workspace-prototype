/* details-panel.js — right-hand ⓘ panel: summary numbers, owner, who has access, recent activity. */
(function () {
  const { el, timeAgo, money } = NL;
  const VERB = { created: 'created', edited: 'edited', shared: 'shared', unshared: 'removed access for', renamed: 'renamed', moved: 'moved',
    versioned: 'saved a new version of', archived: 'archived', restored: 'restored', opened: 'opened', tagged: 'tagged' };

  let lastTracked = null;
  // what the panel describes: the one selected item, else the open folder
  function subject(state) {
    if (state.selected.size === 1) return store.getItem([...state.selected][0]);
    if (state.selected.size > 1) return { multi: state.selected.size };
    if (state.folderId && !state.query) return store.getItem(state.folderId);
    return null;
  }

  function render(state) {
    const root = document.getElementById('details');
    root.hidden = !state.detailsOpen;
    if (!state.detailsOpen) { lastTracked = null; return; }
    const it = subject(state);
    const key = it && it.id ? it.id + '|' + store.me().id : null;
    if (key && key !== lastTracked) { lastTracked = key; NL.app.track({ type: 'details', itemId: it.id }); }
    const close = el('button.ws-more', { title: 'Close details', onclick: () => NL.app.toggleDetails(false) }, '✕');

    if (!it || it.multi) {
      root.replaceChildren(el('div.ws-det-head', {}, el('div.ws-det-title', {}, 'Details'), close),
        el('div.ws-det-empty', {}, el('div.ws-empty-ic', {}, 'ⓘ'),
          el('p', {}, it ? it.multi + ' items selected' : 'Pick a recipe or folder to see who has it, its numbers and what changed lately.')));
      return;
    }

    const me = store.me();
    const isFolder = it.type === 'folder';
    const canEdit = it.myRole === 'owner' || it.myRole === 'edit';
    const shares = store.listShares(it.id);
    const acts = store.activity(it.id).slice(0, 8);

    const stats = isFolder
      ? [['Items inside', it.childCount]]
      : [['kcal / portion', it.kcalPerPortion || '—'], ['Cost / portion', it.costPerPortion ? money(it.costPerPortion) : '—'],
         ['Final weight', it.finalWeightG ? it.finalWeightG + ' g' : '—'], ['Cards', it.cards], ['Versions', it.versions]];

    const access = el('div.ws-det-people', {},
      personRow(it.owner, 'Owner', me),
      shares.map((s) => personRow(s.person, s.role === 'edit' ? 'Can edit' : 'Can view', me)),
      it.orgView ? el('div.ws-det-person', {}, el('span.ws-org-ic', {}, '⌂'), el('span.grow', {}, 'Everyone at ' + store.orgName), el('span.faint', {}, 'Can view')) : null);
    const inherited = store.path(it.id).slice(0, -1).filter((f) => store.listShares(f.id).length);

    root.replaceChildren(
      el('div.ws-det-head', {},
        isFolder ? el('span.ws-folder-ic', { innerHTML: NL.itemGrid.FOLDER_SVG }) : el('span.ws-row-ic', { style: { background: it.thumbnailColor } }),
        el('div.ws-det-title', { title: it.name }, it.name), close),
      el('div.ws-det-body', {},
        it.status === 'archived' ? el('div.ws-det-note', {}, 'Archived · ', el('button.linkish', { onclick: () => NL.app.restore([it.id]) }, 'Restore')) : null,
        !isFolder ? el('div.ws-thumb.ws-det-thumb', { style: { background: it.thumbnailColor } },
          el('span.ws-thumb-tags', {}, (it.tags || []).join(' · '))) : null,
        el('div.ws-det-stats', {}, stats.map(([k, v]) => el('div', {}, el('b', {}, String(v)), el('span', {}, k)))),
        !isFolder ? el('button.btn.primary.ws-det-open', { onclick: () => NL.app.open(it.id) }, '↗ Open in Recipe Builder') : null,

        !isFolder ? el('h4', {}, 'Tags') : null,
        !isFolder ? el('div.ws-det-tags', {}, (it.tagList || []).length ? (it.tagList || []).map((t) => NL.tags.chip(t)) : el('span.faint', {}, 'No tags yet.')) : null,
        !isFolder && canEdit ? el('button.btn.sm', { onclick: () => NL.tags.open([it.id]) }, '🏷 Edit tags') : null,

        el('h4', {}, 'Who has access'),
        access,
        inherited.length ? el('p.faint.ws-det-small', {}, 'People with access to “' + inherited.map((f) => f.name).join('”, “') + '” can also see this.') : null,
        store.isLive ? null : el('button.btn.sm', { onclick: () => NL.shareDialog.open(it.id) }, canEdit ? '⇄ Manage access' : 'See who has access'),

        el('h4', {}, 'Recent activity'),
        acts.length ? el('ul.ws-det-acts', {}, acts.map((a) => el('li', {},
          NL.avatar(a.who, 22),
          el('div', {},
            el('div', {}, el('b', {}, a.who.id === me.id ? 'You' : a.who.name), ' ' + (VERB[a.what] || a.what) + ' this',
              a.detail ? el('span.muted', {}, ' · ' + a.detail) : null),
            el('div.faint', {}, timeAgo(a.when))))))
          : el('p.faint', {}, 'Nothing yet.'),

        el('h4', {}, 'About'),
        el('dl.ws-det-dl', {},
          el('dt', {}, 'Type'), el('dd', {}, isFolder ? 'Folder' : 'Recipe'),
          el('dt', {}, 'Location'), el('dd', {}, whereIs(it, me)),
          el('dt', {}, 'Changed'), el('dd', {}, timeAgo(it.updatedAt) + (it.updatedByPerson ? ' by ' + (it.updatedByPerson.id === me.id ? 'you' : it.updatedByPerson.name) : '')),
          el('dt', {}, 'Created'), el('dd', {}, new Date(it.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })))));
  }

  function personRow(p, role, me) {
    return el('div.ws-det-person', {}, NL.avatar(p, 26),
      el('span.grow', {}, p.name + (p.id === me.id ? ' (you)' : '')), el('span.faint', {}, role));
  }
  function whereIs(it, me) {
    const trail = store.path(it.id).slice(0, -1);
    const root = it.ownerId === me.id ? store.rootName : 'Shared with me';
    return [root, ...trail.map((f) => f.name)].join(' › ');
  }

  NL.detailsPanel = { render };
})();
