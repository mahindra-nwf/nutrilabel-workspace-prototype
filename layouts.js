/* layouts.js — the Layout lab shell: four alternative Workspace layouts on the same demo data.
   Directions came from the ui-ux-pro-max skill (style + design-dial searches); each layout says which and why.
   Read-mostly: layouts read through store.js; the board can change a recipe's Status (store.setTags). */
(function () {
  const { el } = NL;

  // small inline SVG icons (the skill's checklist: SVG, not emoji). Lucide-style strokes.
  const P = {
    open: '<path d="M7 17 17 7M8 7h9v9"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    flask: '<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    grip: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  };
  const icon = (name, size = 16) => el('span.lab-ic', { 'aria-hidden': 'true', innerHTML: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[name]}</svg>` });

  // shared data helpers
  const recipes = () => store.listItems({ view: 'all' });
  const statusOf = (r) => (r.tagList || []).find((t) => t.groupId === 'g_status') || null;
  const folderOf = (r) => { const p = store.path(r.id); return p.length > 1 ? p[p.length - 2].name : (r.ownerId === store.me().id ? 'My recipes' : 'Shared with me'); };
  const canEdit = (r) => r.myRole === 'owner' || r.myRole === 'edit';
  // open in the Recipe Builder, same as the Workspace does
  async function open(id) {
    NL.toast('Opening in the Recipe Builder…');
    const url = await store.openInBuilder(id);
    location.href = url || 'builder.html?id=' + encodeURIComponent(id);
  }

  const LAYOUTS = [];
  function register(def) { LAYOUTS.push(def); }

  let current = null;
  function show(id) {
    const def = LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
    current = def.id;
    store.pref('lab', current);
    history.replaceState(null, '', '#' + current);
    NL.fill(document.getElementById('labSeg'), LAYOUTS.map((l) => el('button' + (l.id === current ? '.on' : ''), {
      'aria-pressed': String(l.id === current), onclick: () => show(l.id),
    }, l.name)));
    NL.fill(document.getElementById('labIntro'),
      el('div.lab-intro-main', {}, el('h1', {}, def.name), el('p', {}, def.pitch)),
      el('dl.lab-facts', {},
        el('dt', {}, 'From ui-ux-pro-max'), el('dd', {}, def.source),
        el('dt', {}, 'Best for'), el('dd', {}, def.bestFor),
        el('dt', {}, 'Trade-off'), el('dd', {}, def.tradeoff)));
    const stage = document.getElementById('labStage');
    stage.className = 'lab-stage lab-' + def.id;
    stage.replaceChildren();
    def.render(stage);
  }
  const rerender = () => show(current);

  function start() {
    const me = store.me();
    document.getElementById('labWho').textContent = 'Viewing as ' + me.name + ' · ' + me.title;
    const themeBtn = document.getElementById('labTheme');
    const paint = () => { themeBtn.textContent = document.documentElement.dataset.theme === 'dark' ? '☀' : '☾'; };
    themeBtn.onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; store.pref('theme', t); paint(); };
    paint();
    show(location.hash.slice(1) || store.pref('lab') || 'board');
  }

  NL.lab = { register, start, rerender, icon, recipes, statusOf, folderOf, canEdit, open };
})();
