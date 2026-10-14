/* store.js — the ONLY file that touches localStorage.
   Every function here is a stand-in for a future database/API call.
   Screens call these and get plain copies back; they never mutate store data directly.
   All data is made up. */
(function () {
  const KEY = 'nlws.v1';
  const ME = 'u1';
  const ORG = 'Northwest Frozen';
  const H = 3600e3, D = 24 * H;

  let db;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* private mode etc. — fall back to seed */ }
    return seed();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
  }
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const copy = (o) => JSON.parse(JSON.stringify(o));
  const byId = (id) => db.items.find((i) => i.id === id);
  const person = (id) => db.people.find((p) => p.id === id);

  /* ---------- seed ---------- */
  function seed() {
    const now = Date.now();
    const people = [
      { id: 'u1', name: 'Jordan Lee', email: 'jordan@example.com', role: 'admin', initials: 'JL', color: '#2f6fed' },
      { id: 'u2', name: 'Ana Ruiz', email: 'ana@example.com', role: 'editor', initials: 'AR', color: '#e8590c' },
      { id: 'u3', name: 'Marco Bianchi', email: 'marco@example.com', role: 'editor', initials: 'MB', color: '#0f766e' },
      { id: 'u4', name: 'Priya Shah', email: 'priya@example.com', role: 'editor', initials: 'PS', color: '#7c5cff' },
      { id: 'u5', name: 'Ken Watanabe', email: 'ken@example.com', role: 'viewer', initials: 'KW', color: '#c2255c' },
      { id: 'u6', name: 'Lena Okafor', email: 'lena@example.com', role: 'viewer', initials: 'LO', color: '#5c940d' },
    ];
    const folder = (id, name, parentId, ownerId, ago, shares = []) =>
      ({ id, type: 'folder', name, parentId, ownerId, shares, orgView: false, status: 'active', updatedAt: now - ago, createdAt: now - ago - 30 * D });
    const items = [
      folder('f1', 'Soups', null, 'u1', 2 * H, [{ personId: 'u2', role: 'edit' }]),
      folder('f2', 'Bowls', null, 'u1', 5 * H),
      folder('f3', 'Sauces & Dressings', null, 'u1', 3 * D),
      folder('f4', 'Frozen Meals', null, 'u3', 1 * D, [{ personId: 'u1', role: 'edit' }, { personId: 'u4', role: 'view' }]),
      folder('f5', 'Winter Specials', 'f1', 'u1', 6 * D),
      folder('f6', 'Test Kitchen', null, 'u4', 4 * D, [{ personId: 'u1', role: 'view' }]),
    ];
    const colors = ['#0f766e', '#e8590c', '#2f6fed', '#7c5cff', '#c2255c', '#5c940d', '#b08800', '#1971c2'];
    // [name, folderId, ownerId, updatedBy, hoursAgo, kcal, cost, weight, versions, cards, tags, extra]
    const R = [
      ['Spicy Miso Ramen', 'f1', 'u1', 'u2', 2, 721, 1.38, 416.5, 3, 5, ['ramen', 'frozen'], { star: true }],
      ['Tomato Basil Soup', 'f1', 'u1', 'u1', 26, 212, 0.64, 350, 4, 3, ['soup', 'vegetarian']],
      ['Roasted Carrot Ginger Soup', 'f1', 'u1', 'u2', 50, 184, 0.58, 340, 2, 3, ['soup', 'vegan']],
      ['Chicken Noodle Soup', 'f1', 'u1', 'u1', 80, 265, 0.91, 380, 6, 4, ['soup', 'classic'], { star: true }],
      ['Smoky Black Bean Chili', 'f5', 'u1', 'u1', 140, 412, 0.97, 400, 3, 4, ['chili', 'vegan']],
      ['Butternut Squash Bisque', 'f5', 'u1', 'u2', 160, 238, 0.82, 340, 2, 3, ['soup', 'seasonal']],
      ['Chicken Tikka Bowl', 'f2', 'u1', 'u3', 5, 648, 2.14, 450, 5, 6, ['bowl', 'chicken'], { star: true }],
      ['Teriyaki Salmon Bowl', 'f2', 'u1', 'u1', 30, 590, 3.05, 420, 3, 5, ['bowl', 'fish']],
      ['Falafel Grain Bowl', 'f2', 'u1', 'u4', 72, 555, 1.22, 410, 2, 5, ['bowl', 'vegan']],
      ['Korean Beef Bibimbap', 'f2', 'u1', 'u1', 200, 702, 2.48, 460, 4, 6, ['bowl', 'beef']],
      ['House Vinaigrette', 'f3', 'u1', 'u1', 75, 92, 0.11, 30, 7, 1, ['dressing'], { star: true }],
      ['Garlic Aioli', 'f3', 'u1', 'u5', 100, 145, 0.14, 25, 2, 1, ['sauce']],
      ['Peanut Satay Sauce', 'f3', 'u1', 'u1', 300, 118, 0.19, 40, 3, 2, ['sauce', 'contains nuts']],
      ['Green Goddess Dressing', 'f3', 'u1', 'u1', 900, 88, 0.16, 30, 1, 1, ['dressing'], { archived: true }],
      ['Beef Lasagna Tray', 'f4', 'u3', 'u3', 22, 610, 2.31, 400, 8, 7, ['frozen', 'pasta'], { star: true }],
      ['Mac & Cheese Cup', 'f4', 'u3', 'u4', 48, 480, 0.88, 300, 4, 3, ['frozen', 'kids']],
      ['Veggie Pot Pie', 'f4', 'u3', 'u1', 96, 520, 1.45, 330, 3, 5, ['frozen', 'vegetarian']],
      ['Breakfast Burrito', 'f4', 'u3', 'u3', 170, 455, 1.12, 250, 5, 4, ['frozen', 'breakfast']],
      ['Lemon Herb Chicken Thigh', 'f6', 'u4', 'u4', 12, 330, 1.76, 200, 2, 3, ['test', 'chicken']],
      ['Coconut Lentil Dal', 'f6', 'u4', 'u4', 60, 390, 0.74, 350, 1, 3, ['test', 'vegan']],
      ['Pesto Pasta Salad', null, 'u1', 'u1', 1, 435, 0.96, 280, 2, 3, ['salad', 'pasta']],
      ['Overnight Oats Base', null, 'u1', 'u1', 120, 310, 0.42, 250, 1, 2, ['breakfast']],
      ['Sriracha Mayo', null, 'u1', 'u1', 2000, 160, 0.09, 20, 1, 1, ['sauce'], { archived: true }],
      ['Thai Green Curry', null, 'u2', 'u2', 8, 560, 1.64, 420, 3, 5, ['curry'], { shareMe: 'edit' }],
      ['Brown Butter Cookie Dough', null, 'u5', 'u5', 36, 210, 0.33, 50, 2, 2, ['dessert'], { shareMe: 'view', star: true }],
      ['Pulled Pork Sliders', null, 'u3', 'u3', 400, 540, 1.95, 260, 4, 4, ['pork'], { shareMe: 'view', archived: true }],
    ];
    R.forEach((r, i) => {
      const [name, folderId, ownerId, updatedBy, h, kcal, cost, weight, versions, cards, tags, x = {}] = r;
      const shares = [];
      if (x.shareMe) shares.push({ personId: ME, role: x.shareMe });
      if (i % 4 === 1 && ownerId === ME) shares.push({ personId: 'u2', role: 'edit' });
      if (i % 5 === 2 && ownerId === ME) shares.push({ personId: 'u6', role: 'view' });
      items.push({
        id: 'r' + (i + 1), type: 'recipe', name,
        status: x.archived ? 'archived' : 'active',
        updatedAt: now - h * H, updatedBy, createdAt: now - h * H - (10 + i) * D, createdBy: ownerId,
        versions, finalWeightG: weight, kcalPerPortion: kcal, costPerPortion: cost, cards,
        folderId, starredBy: x.star ? [ME] : (i % 3 === 0 ? ['u2'] : []), ownerId,
        shares, orgView: i % 6 === 0, tags, thumbnailColor: colors[i % colors.length],
      });
    });
    const activity = [];
    items.filter((i) => i.type === 'recipe').forEach((r) => {
      activity.push({ id: uid('a'), itemId: r.id, who: r.createdBy, what: 'created', when: r.createdAt });
      for (let v = 1; v < r.versions; v++)
        activity.push({ id: uid('a'), itemId: r.id, who: v % 2 ? r.updatedBy : r.ownerId, what: 'versioned', when: r.createdAt + (r.updatedAt - r.createdAt) * (v / r.versions) });
      r.shares.forEach((s) => activity.push({ id: uid('a'), itemId: r.id, who: r.ownerId, what: 'shared', when: r.updatedAt - 3 * H, detail: person2(people, s.personId) }));
      activity.push({ id: uid('a'), itemId: r.id, who: r.updatedBy, what: 'edited', when: r.updatedAt });
    });
    return { people, items, activity };
  }
  function person2(people, id) { const p = people.find((x) => x.id === id); return p ? p.name : ''; }

  /* ---------- access helpers ---------- */
  function ancestors(item) {
    const out = [];
    let pid = item.type === 'folder' ? item.parentId : item.folderId;
    while (pid) { const f = byId(pid); if (!f) break; out.push(f); pid = f.parentId; }
    return out;
  }
  // "owner" | "edit" | "view" | null — sharing a folder shares everything inside it
  function roleOf(item, pid = ME) {
    let best = null;
    for (const it of [item, ...ancestors(item)]) {
      if (it.ownerId === pid) return 'owner';
      const s = it.shares.find((x) => x.personId === pid);
      if (s && (s.role === 'edit' || !best)) best = s.role;
      if (!best && it.orgView) best = 'view';
    }
    return best;
  }
  const isArchivedDeep = (item) => item.status === 'archived' || ancestors(item).some((a) => a.status === 'archived');
  function decorate(item) {
    const o = copy(item);
    o.myRole = roleOf(item);
    o.starred = (item.starredBy || []).includes(ME);
    o.owner = person(item.ownerId);
    if (item.updatedBy) o.updatedByPerson = person(item.updatedBy);
    if (item.type === 'folder') o.childCount = db.items.filter((c) => (c.type === 'folder' ? c.parentId : c.folderId) === item.id && c.status === 'active').length;
    return o;
  }
  function log(itemId, what, detail) {
    db.activity.push({ id: uid('a'), itemId, who: ME, what, when: Date.now(), detail });
  }
  function touch(item) { item.updatedAt = Date.now(); if (item.type === 'recipe') item.updatedBy = ME; }
  function mustEdit(item) {
    const r = roleOf(item);
    if (r !== 'owner' && r !== 'edit') throw new Error('You can only view “' + item.name + '”.');
  }
  const sortItems = (a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1);

  /* ---------- public API (future database calls) ---------- */
  const store = {
    orgName: ORG,

    me() { return copy(person(ME)); },
    listPeople() { return copy(db.people); },

    listItems({ folderId = null, view = 'mine', query = '' } = {}) {
      const visible = db.items.filter((i) => roleOf(i));
      const q = query.trim().toLowerCase();
      let out;
      if (q) {
        out = visible.filter((i) => !isArchivedDeep(i) &&
          (i.name.toLowerCase().includes(q) || (i.tags || []).some((t) => t.toLowerCase().includes(q))));
      } else if (view === 'archived') {
        out = visible.filter((i) => i.status === 'archived').sort((a, b) => b.updatedAt - a.updatedAt);
        return out.map(decorate);
      } else if (folderId) {
        out = visible.filter((i) => (i.type === 'folder' ? i.parentId : i.folderId) === folderId && i.status === 'active');
      } else if (view === 'mine') {
        out = visible.filter((i) => i.ownerId === ME && !(i.type === 'folder' ? i.parentId : i.folderId) && i.status === 'active');
      } else if (view === 'shared') {
        // items others own, shown at the top level unless their folder is already shared with me
        out = visible.filter((i) => i.ownerId !== ME && i.status === 'active' && !isArchivedDeep(i) && (() => {
          const pid = i.type === 'folder' ? i.parentId : i.folderId;
          return !pid || !roleOf(byId(pid));
        })());
      } else if (view === 'recent') {
        return visible.filter((i) => i.type === 'recipe' && !isArchivedDeep(i))
          .sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20).map(decorate);
      } else if (view === 'starred') {
        out = visible.filter((i) => (i.starredBy || []).includes(ME) && !isArchivedDeep(i));
      } else out = [];
      return out.sort(sortItems).map(decorate);
    },

    getItem(id) { const i = byId(id); return i && roleOf(i) ? decorate(i) : null; },

    // breadcrumb trail, root first (helper; not in the original API list)
    path(id) {
      const i = byId(id); if (!i) return [];
      return [...ancestors(i).reverse(), i].filter((x) => roleOf(x)).map((x) => ({ id: x.id, name: x.name, ownerId: x.ownerId }));
    },

    createRecipe({ name, folderId = null }) {
      if (folderId) mustEdit(byId(folderId));
      const now = Date.now();
      const r = {
        id: uid('r'), type: 'recipe', name: name || 'Untitled recipe', status: 'active',
        updatedAt: now, updatedBy: ME, createdAt: now, createdBy: ME, versions: 1,
        finalWeightG: 0, kcalPerPortion: 0, costPerPortion: 0, cards: 1,
        folderId, starredBy: [], ownerId: ME, shares: [], orgView: false, tags: [],
        thumbnailColor: ['#0f766e', '#e8590c', '#2f6fed', '#7c5cff', '#c2255c'][Math.floor(Math.random() * 5)],
      };
      db.items.push(r); log(r.id, 'created'); save();
      return decorate(r);
    },

    createFolder({ name, parentId = null }) {
      if (parentId) mustEdit(byId(parentId));
      const now = Date.now();
      const f = { id: uid('f'), type: 'folder', name: name || 'New folder', parentId, ownerId: ME, shares: [], orgView: false, status: 'active', updatedAt: now, createdAt: now };
      db.items.push(f); log(f.id, 'created'); save();
      return decorate(f);
    },

    rename(id, name) {
      const i = byId(id); mustEdit(i);
      const old = i.name; i.name = name; touch(i); log(id, 'renamed', old + ' → ' + name); save();
      return decorate(i);
    },

    move(id, folderId) {
      const i = byId(id); mustEdit(i);
      if (folderId) {
        const f = byId(folderId); mustEdit(f);
        if (i.type === 'folder' && (folderId === id || ancestors(f).some((a) => a.id === id))) throw new Error('A folder can’t go inside itself.');
      }
      if (i.type === 'folder') i.parentId = folderId; else i.folderId = folderId;
      touch(i); log(id, 'moved', folderId ? byId(folderId).name : 'My recipes'); save();
      return decorate(i);
    },

    star(id, on) {
      const i = byId(id);
      i.starredBy = (i.starredBy || []).filter((p) => p !== ME);
      if (on) i.starredBy.push(ME);
      save(); return decorate(i);
    },

    archive(id) { const i = byId(id); mustEdit(i); i.status = 'archived'; touch(i); log(id, 'archived'); save(); return decorate(i); },
    restore(id) { const i = byId(id); mustEdit(i); i.status = 'active'; touch(i); log(id, 'restored'); save(); return decorate(i); },

    duplicate(id) {
      const src = byId(id);
      const now = Date.now();
      const d = Object.assign(copy(src), {
        id: uid(src.type === 'folder' ? 'f' : 'r'), name: 'Copy of ' + src.name, ownerId: ME, shares: [], orgView: false,
        starredBy: [], createdAt: now, updatedAt: now, createdBy: ME, updatedBy: ME, versions: 1, status: 'active',
      });
      // keep it next to the original if I can write there, otherwise put it in My recipes
      const pid = src.type === 'folder' ? src.parentId : src.folderId;
      const canWrite = pid && ['owner', 'edit'].includes(roleOf(byId(pid)));
      if (src.type === 'folder') d.parentId = canWrite ? pid : null; else d.folderId = canWrite ? pid : null;
      db.items.push(d); log(d.id, 'created', 'copy of ' + src.name); save();
      return decorate(d);
    },

    listShares(id) {
      const i = byId(id);
      return i.shares.map((s) => ({ person: copy(person(s.personId)), role: s.role }));
    },
    share(id, personId, role) {
      const i = byId(id); mustEdit(i);
      const s = i.shares.find((x) => x.personId === personId);
      if (s) s.role = role; else i.shares.push({ personId, role });
      log(id, 'shared', person(personId).name + ' (' + (role === 'edit' ? 'can edit' : 'can view') + ')'); save();
    },
    unshare(id, personId) {
      const i = byId(id); mustEdit(i);
      i.shares = i.shares.filter((x) => x.personId !== personId);
      log(id, 'unshared', person(personId).name); save();
    },
    // "Everyone at Northwest Frozen can view" (helper; not in the original API list)
    setOrgView(id, on) { const i = byId(id); mustEdit(i); i.orgView = !!on; log(id, 'shared', on ? 'everyone at ' + ORG : 'no longer org-wide'); save(); },

    activity(id) {
      return db.activity.filter((a) => a.itemId === id).sort((a, b) => b.when - a.when)
        .map((a) => ({ who: copy(person(a.who)), what: a.what, when: a.when, detail: a.detail }));
    },

    // per-browser UI preferences such as theme and grid/list (helper; would be a user setting later)
    pref(key, value) {
      const k = 'nlws.pref.' + key;
      try {
        if (value === undefined) return JSON.parse(localStorage.getItem(k));
        localStorage.setItem(k, JSON.stringify(value));
      } catch (e) { return null; }
    },

    // "Reset demo data" button (helper)
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} db = seed(); save(); },
  };

  db = load();
  save();
  window.store = store;
})();
