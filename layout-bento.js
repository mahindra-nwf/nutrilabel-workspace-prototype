/* layout-bento.js — "Today": the skill's Bento Box Grid. Tiles of different sizes answer "what should I look at now?". */
(function () {
  const { el, money, timeAgo, firstName } = NL;
  const L = NL.lab;

  function render(stage) {
    const all = L.recipes();
    const me = store.me();
    const byRecent = [...all].sort((a, b) => b.updatedAt - a.updatedAt);
    const last = byRecent[0];
    const trial = all.filter((r) => (L.statusOf(r) || {}).id === 't_trial');
    const starred = all.filter((r) => r.starred);
    const shared = all.filter((r) => r.ownerId !== me.id).sort((a, b) => b.updatedAt - a.updatedAt);
    const notes = store.notifications();
    const approved = all.filter((r) => (L.statusOf(r) || {}).id === 't_approved');

    const tile = (cls, title, iconName, ...body) => el('section.bento-tile.' + cls, {}, el('h2', {}, L.icon(iconName, 16), title), ...body);
    const mini = (r) => el('button.bento-row', { onclick: () => L.open(r.id), title: 'Open ' + r.name },
      el('span.con-sw', { style: { background: r.thumbnailColor } }), el('span.grow', {}, r.name), el('span.faint', {}, timeAgo(r.updatedAt)));

    stage.append(el('div.bento', {},
      last ? tile('t-hero', 'Pick up where you left off', 'clock',
        el('div.bento-hero', { style: { '--rc': last.thumbnailColor } },
          el('div.bento-hero-strip'),
          el('b.bento-hero-name', {}, last.name),
          el('div.faint', {}, L.folderOf(last) + ' · edited ' + timeAgo(last.updatedAt) + (last.updatedByPerson ? ' by ' + (last.updatedByPerson.id === me.id ? 'you' : firstName(last.updatedByPerson)) : '')),
          el('div.bento-stats', {},
            el('div', {}, el('b', {}, String(last.kcalPerPortion || '—')), el('span', {}, 'kcal / portion')),
            el('div', {}, el('b', {}, last.costPerPortion ? money(last.costPerPortion) : '—'), el('span', {}, 'cost / portion')),
            el('div', {}, el('b', {}, String(last.versions)), el('span', {}, 'versions'))),
          el('div.board-tags', {}, NL.tags.chips(last.tagList, 4)),
          el('button.btn.primary', { onclick: () => L.open(last.id) }, L.icon('open', 16), 'Open in Recipe Builder'))) : null,
      tile('t-wide', 'Waiting for approval · ' + trial.length, 'flask',
        trial.length ? el('div.bento-list', {}, trial.slice(0, 5).map(mini)) : el('p.faint', {}, 'Nothing in trial right now.')),
      tile('t-small t-accent', 'Approved', 'check', el('b.bento-big', {}, String(approved.length)), el('span.faint', {}, 'recipes ready to sell')),
      tile('t-small', 'New recipe', 'plus', el('p.faint', {}, 'Start from scratch or copy one you have.'), el('a.btn', { href: 'index.html#/mine' }, 'Go to My recipes')),
      tile('t-wide', 'Shared with you', 'share', shared.length ? el('div.bento-list', {}, shared.slice(0, 4).map(mini)) : el('p.faint', {}, 'Nobody has shared anything yet.')),
      tile('t-small', 'Starred', 'star', starred.length ? el('div.bento-list', {}, starred.slice(0, 3).map(mini)) : el('p.faint', {}, 'Star recipes to keep them here.')),
      tile('t-small', 'What changed', 'bell', notes.length ? el('ul.bento-notes', {}, notes.slice(0, 3).map((n) => el('li', {}, n.text, el('div.faint', {}, timeAgo(n.when))))) : el('p.faint', {}, 'All quiet.'))));
  }

  L.register({
    id: 'bento', name: 'Today', render,
    pitch: 'A home screen rather than a file list: the recipe you were last on is big, and smaller tiles show what is waiting for approval, what was shared with you and what changed.',
    source: 'Style “Bento Box Grid” (search: bento grid): modular cards of varied sizes (1×1, 2×1, 2×2), 16–24 px corners, soft shadows, grid 4 → 2 → 1 columns. Design dials: variance 8 for an asymmetric grid.',
    bestFor: 'The first screen each morning, before going into folders.',
    tradeoff: 'Shows a curated slice, not everything; it sits on top of the folder view, it doesn’t replace it.',
  });
})();
