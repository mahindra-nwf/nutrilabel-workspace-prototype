/* layout-menu.js — "Menu book": recipes laid out like a restaurant menu, one section per folder.
   From the skill's culinary typography match (Playfair Display SC + Karla) and its Minimalism style. */
(function () {
  const { el, money } = NL;
  const L = NL.lab;

  function render(stage) {
    const sections = {};
    L.recipes().forEach((r) => { const f = L.folderOf(r); (sections[f] = sections[f] || []).push(r); });
    const names = Object.keys(sections).sort((a, b) => sections[b].length - sections[a].length || a.localeCompare(b));
    stage.append(el('div.menu-book', {},
      el('header.menu-title', {}, el('span', {}, 'Northwest Frozen · R&D'), el('h2', {}, 'The Recipe Book'), el('span.faint', {}, names.length + ' sections · kcal and cost per portion')),
      names.map((name) => el('section.menu-sec', {},
        el('h3', {}, name),
        el('ul.menu-items', {}, sections[name].sort((a, b) => a.name.localeCompare(b.name)).map((r) => {
          const s = L.statusOf(r);
          const extra = (r.tagList || []).filter((t) => t.groupId && t.groupId !== 'g_status').map((t) => t.name);
          return el('li.menu-item', {},
            el('button.menu-line', { onclick: () => L.open(r.id), title: 'Open ' + r.name + ' in the Recipe Builder' },
              el('span.menu-name', {}, r.name), el('span.menu-dots', { 'aria-hidden': 'true' }),
              el('span.menu-price', {}, (r.kcalPerPortion || '—') + ' kcal · ' + (r.costPerPortion ? money(r.costPerPortion) : '—'))),
            el('div.menu-sub', {}, s ? el('span.menu-status', { style: { '--tc': s.color } }, s.name) : null, extra.join(' · ')));
        }))))));
  }

  L.register({
    id: 'menu', name: 'Menu book', render,
    pitch: 'The recipe library read like a menu: one section per folder, the name on the left and kcal and cost where the price would be. Calm, readable, and familiar to anyone who has worked a pass.',
    source: 'Design system for “recipe library workspace food R&D”: style Minimalism, typography Playfair Display SC + Karla (mood: restaurant, menu, culinary). Its suggested palette (healthy green + macro orange) is not applied, to keep the app’s own colours.',
    bestFor: 'Showing a range to a client, and printing a one-page overview.',
    tradeoff: 'Read-only and wide-spaced; no bulk actions, sharing or tagging here.',
  });
})();
