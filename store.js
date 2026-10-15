/* store.js — the ONLY file that touches localStorage.
   Every function here is a stand-in for a future database/API call.
   Screens call these and get plain copies back; they never mutate store data directly.
   All data is made up. */
(function () {
  const KEY = 'nlws.v4'; // v4: tag groups + tags (recipe.tags holds tag ids)
  let ME = 'u1'; // who is "signed in"; the demo can switch person (store.switchUser)
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
      { id: 'u1', name: 'Jordan Lee', email: 'jordan@example.com', role: 'admin', title: 'Head of R&D', initials: 'JL', color: '#2f6fed' },
      { id: 'u2', name: 'Ana Ruiz', email: 'ana@example.com', role: 'editor', title: 'Sous chef', initials: 'AR', color: '#e8590c' },
      { id: 'u3', name: 'Marco Bianchi', email: 'marco@example.com', role: 'editor', title: 'Product developer', initials: 'MB', color: '#0f766e' },
      { id: 'u4', name: 'Priya Shah', email: 'priya@example.com', role: 'editor', title: 'Food technologist', initials: 'PS', color: '#7c5cff' },
      { id: 'u5', name: 'Ken Watanabe', email: 'ken@example.com', role: 'viewer', title: 'QA lead', initials: 'KW', color: '#c2255c' },
      { id: 'u6', name: 'Lena Okafor', email: 'lena@example.com', role: 'viewer', title: 'Sales', initials: 'LO', color: '#5c940d' },
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
      ['Garlic Aioli', 'f3', 'u1', 'u4', 100, 145, 0.14, 25, 2, 1, ['sauce']],
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
      ['Brown Butter Cookie Dough', null, 'u4', 'u4', 36, 210, 0.33, 50, 2, 2, ['dessert'], { shareMe: 'view', star: true }],
      ['Pulled Pork Sliders', null, 'u3', 'u3', 400, 540, 1.95, 260, 4, 4, ['pork'], { shareMe: 'view', archived: true }],
    ];
    R.forEach((r, i) => {
      const [name, folderId, ownerId, updatedBy, h, kcal, cost, weight, versions, cards, tags, x = {}] = r;
      const shares = [];
      if (x.shareMe) shares.push({ personId: 'u1', role: x.shareMe });
      if (i % 4 === 1 && ownerId === 'u1') shares.push({ personId: 'u2', role: 'edit' });
      if (i % 5 === 2 && ownerId === 'u1') shares.push({ personId: 'u6', role: 'view' });
      items.push({
        id: 'r' + (i + 1), type: 'recipe', name,
        status: x.archived ? 'archived' : 'active',
        updatedAt: now - h * H, updatedBy, createdAt: now - h * H - (10 + i) * D, createdBy: ownerId,
        versions, finalWeightG: weight, kcalPerPortion: kcal, costPerPortion: cost, cards,
        folderId, starredBy: x.star ? ['u1'] : (i % 3 === 0 ? ['u2'] : []), ownerId,
        shares, orgView: i % 6 === 0, tags, thumbnailColor: colors[i % colors.length],
      });
    });
    const activity = [];
    items.filter((i) => i.type === 'recipe').forEach((r) => {
      activity.push({ id: uid('a'), itemId: r.id, who: r.createdBy, what: 'created', when: r.createdAt });
      for (let v = 1; v < r.versions; v++)
        activity.push({ id: uid('a'), itemId: r.id, who: v % 2 ? r.updatedBy : r.ownerId, what: 'versioned', when: r.createdAt + (r.updatedAt - r.createdAt) * (v / r.versions) });
      r.shares.forEach((s) => activity.push({ id: uid('a'), itemId: r.id, who: r.ownerId, what: 'shared', when: r.updatedAt - 3 * H, detail: person2(people, s.personId), target: s.personId, role: s.role }));
      activity.push({ id: uid('a'), itemId: r.id, who: r.updatedBy, what: 'edited', when: r.updatedAt });
    });
    // Jordan last checked notifications 6 h ago, so a couple of teammates' edits show as new
    // ---- tags: admin-managed groups (Status, Diet, Channel) + free tags anyone can add
    const tagGroups = [
      { id: 'g_status', name: 'Status', choice: 'one' },
      { id: 'g_diet', name: 'Diet', choice: 'many' },
      { id: 'g_channel', name: 'Channel', choice: 'many' },
    ];
    const tags = [
      { id: 't_draft', name: 'Draft', groupId: 'g_status', color: '#868e96' },
      { id: 't_trial', name: 'In trial', groupId: 'g_status', color: '#b08800' },
      { id: 't_approved', name: 'Approved', groupId: 'g_status', color: '#2b8a3e' },
      { id: 't_disc', name: 'Discontinued', groupId: 'g_status', color: '#c92a2a' },
      { id: 't_vegan', name: 'Vegan', groupId: 'g_diet', color: '#5c940d' },
      { id: 't_vegetarian', name: 'Vegetarian', groupId: 'g_diet', color: '#2f9e44' },
      { id: 't_gf', name: 'Gluten-free', groupId: 'g_diet', color: '#e67700' },
      { id: 't_df', name: 'Dairy-free', groupId: 'g_diet', color: '#1971c2' },
      { id: 't_retail', name: 'Retail', groupId: 'g_channel', color: '#7c5cff' },
      { id: 't_foodservice', name: 'Food service', groupId: 'g_channel', color: '#0c8599' },
      { id: 't_airline', name: 'Airline', groupId: 'g_channel', color: '#c2255c' },
    ];
    const free = (name) => {
      let t = tags.find((x) => !x.groupId && x.name.toLowerCase() === name.toLowerCase());
      if (!t) { t = { id: 'tf_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, groupId: null, color: null }; tags.push(t); }
      return t.id;
    };
    const STATUS = ['t_approved', 't_approved', 't_trial', 't_draft'];
    items.filter((i) => i.type === 'recipe').forEach((r, i) => {
      const ids = [r.status === 'archived' ? 't_disc' : STATUS[i % STATUS.length]];
      r.tags.forEach((t) => ids.push(t === 'vegan' ? 't_vegan' : t === 'vegetarian' ? 't_vegetarian' : free(t)));
      if (r.tags.includes('vegan')) ids.push('t_df');
      if (r.folderId === 'f4' || r.tags.includes('frozen')) ids.push('t_retail');
      if (r.folderId === 'f2') ids.push('t_foodservice');
      if (i % 7 === 3) ids.push('t_airline');
      r.tags = [...new Set(ids)];
    });
    return { people, items, activity, tagGroups, tags, meId: 'u1', seen: { u1: now - 6 * H } };
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
    if (item.type === 'recipe') o.tagList = resolveTags(item.tags);
    if (item.type === 'folder') o.childCount = db.items.filter((c) => (c.type === 'folder' ? c.parentId : c.folderId) === item.id && c.status === 'active').length;
    return o;
  }
  // tag ids -> [{ id, name, color, groupId, groupName }], Status first, then the other groups in order, then free tags
  function resolveTags(ids) {
    const order = (t) => (t.groupId ? db.tagGroups.findIndex((g) => g.id === t.groupId) : 99);
    return (ids || []).map((id) => db.tags.find((t) => t.id === id)).filter(Boolean)
      .map((t) => Object.assign(copy(t), { groupName: t.groupId ? (db.tagGroups.find((g) => g.id === t.groupId) || {}).name : null }))
      .sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
  }
  const tagName = (id) => (db.tags.find((t) => t.id === id) || {}).name;
  const isAdmin = () => person(ME).role === 'admin';
  function mustAdmin() { if (!isAdmin()) throw new Error('Only an admin can manage tag groups.'); }
  // a recipe matches the filter when it has at least one chosen tag in every group that has a choice (free tags count as one group)
  function matchesTags(item, tagIds) {
    if (!tagIds || !tagIds.length) return true;
    const byGroup = {};
    tagIds.forEach((id) => { const t = db.tags.find((x) => x.id === id); if (t) (byGroup[t.groupId || 'free'] = byGroup[t.groupId || 'free'] || []).push(id); });
    return Object.values(byGroup).every((ids) => ids.some((id) => (item.tags || []).includes(id)));
  }

  // activity log + change event. extra = machine-readable details (target person, folder, …) used by notifications and the demo guide
  function log(itemId, what, detail, extra = {}) {
    db.activity.push(Object.assign({ id: uid('a'), itemId, who: ME, what, when: Date.now(), detail }, extra));
    emit(Object.assign({ type: what, itemId }, extra));
  }
  const listeners = [];
  function emit(e) { e.who = ME; e.when = Date.now(); listeners.forEach((fn) => { try { fn(e); } catch (x) { console.error(x); } }); }
  // company "viewers" (QA, sales) can look but not create or copy recipes
  function mustCreate() {
    if (person(ME).role === 'viewer') throw new Error('Viewers can’t create or copy recipes. Ask an editor or an admin.');
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

    // tagId: the sidebar's "browse one tag" view. tags: filter chips (recipes only; folders are hidden while filtering)
    listItems({ folderId = null, view = 'mine', query = '', tagId = null, tags = [] } = {}) {
      const visible = db.items.filter((i) => roleOf(i));
      const q = query.trim().toLowerCase();
      const filt = (list) => (tags.length ? list.filter((i) => i.type === 'recipe' && matchesTags(i, tags)) : list);
      let out;
      if (q) {
        out = visible.filter((i) => !isArchivedDeep(i) &&
          (i.name.toLowerCase().includes(q) || (i.tags || []).some((id) => (tagName(id) || '').toLowerCase().includes(q))));
      } else if (view === 'archived') {
        out = visible.filter((i) => i.status === 'archived').sort((a, b) => b.updatedAt - a.updatedAt);
        return filt(out).map(decorate);
      } else if (view === 'tag') {
        out = visible.filter((i) => i.type === 'recipe' && !isArchivedDeep(i) && (i.tags || []).includes(tagId));
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
        return filt(visible.filter((i) => i.type === 'recipe' && !isArchivedDeep(i))
          .sort((a, b) => b.updatedAt - a.updatedAt)).slice(0, 20).map(decorate);
      } else if (view === 'starred') {
        out = visible.filter((i) => (i.starredBy || []).includes(ME) && !isArchivedDeep(i));
      } else out = [];
      return filt(out).sort(sortItems).map(decorate);
    },

    getItem(id) { const i = byId(id); return i && roleOf(i) ? decorate(i) : null; },

    // breadcrumb trail, root first (helper; not in the original API list)
    path(id) {
      const i = byId(id); if (!i) return [];
      return [...ancestors(i).reverse(), i].filter((x) => roleOf(x)).map((x) => ({ id: x.id, name: x.name, ownerId: x.ownerId }));
    },

    createRecipe({ name, folderId = null }) {
      mustCreate();
      if (folderId) mustEdit(byId(folderId));
      const now = Date.now();
      const r = {
        id: uid('r'), type: 'recipe', name: name || 'Untitled recipe', status: 'active',
        updatedAt: now, updatedBy: ME, createdAt: now, createdBy: ME, versions: 1,
        finalWeightG: 0, kcalPerPortion: 0, costPerPortion: 0, cards: 1,
        folderId, starredBy: [], ownerId: ME, shares: [], orgView: false, tags: ['t_draft'],
        thumbnailColor: ['#0f766e', '#e8590c', '#2f6fed', '#7c5cff', '#c2255c'][Math.floor(Math.random() * 5)],
      };
      db.items.push(r); log(r.id, 'created', null, { kind: 'recipe', folderId }); save();
      return decorate(r);
    },

    createFolder({ name, parentId = null }) {
      mustCreate();
      if (parentId) mustEdit(byId(parentId));
      const now = Date.now();
      const f = { id: uid('f'), type: 'folder', name: name || 'New folder', parentId, ownerId: ME, shares: [], orgView: false, status: 'active', updatedAt: now, createdAt: now };
      db.items.push(f); log(f.id, 'created', null, { kind: 'folder', folderId: parentId }); save();
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
      touch(i); log(id, 'moved', folderId ? byId(folderId).name : 'My recipes', { folderId }); save();
      return decorate(i);
    },

    star(id, on) {
      const i = byId(id);
      i.starredBy = (i.starredBy || []).filter((p) => p !== ME);
      if (on) i.starredBy.push(ME);
      save(); emit({ type: 'star', itemId: id, on: !!on }); return decorate(i);
    },

    archive(id) { const i = byId(id); mustEdit(i); i.status = 'archived'; touch(i); log(id, 'archived'); save(); return decorate(i); },
    restore(id) { const i = byId(id); mustEdit(i); i.status = 'active'; touch(i); log(id, 'restored'); save(); return decorate(i); },

    duplicate(id) {
      mustCreate();
      const src = byId(id);
      const now = Date.now();
      const d = Object.assign(copy(src), {
        id: uid(src.type === 'folder' ? 'f' : 'r'), name: 'Copy of ' + src.name, ownerId: ME, shares: [], orgView: false,
        starredBy: [], createdAt: now, updatedAt: now, createdBy: ME, updatedBy: ME, versions: 1, status: 'active',
        builderTabId: null, // the copy gets its own Recipe Builder tab the first time it's opened
        tags: src.type === 'recipe' ? (src.tags || []).filter((id) => (db.tags.find((t) => t.id === id) || {}).groupId !== 'g_status').concat(['t_draft']) : src.tags,
      });
      // keep it next to the original if I can write there, otherwise put it in My recipes
      const pid = src.type === 'folder' ? src.parentId : src.folderId;
      const canWrite = pid && ['owner', 'edit'].includes(roleOf(byId(pid)));
      if (src.type === 'folder') d.parentId = canWrite ? pid : null; else d.folderId = canWrite ? pid : null;
      db.items.push(d); log(d.id, 'created', 'copy of ' + src.name, { kind: d.type, copyOf: src.id, folderId: src.type === 'folder' ? d.parentId : d.folderId }); save();
      return decorate(d);
    },

    listShares(id) {
      const i = byId(id);
      return i.shares.map((s) => ({ person: copy(person(s.personId)), role: s.role }));
    },
    share(id, personId, role) {
      const i = byId(id); mustEdit(i);
      if (role === 'edit' && person(personId).role === 'viewer') throw new Error(person(personId).name + ' is a viewer, so can only be given “Can view”.');
      const s = i.shares.find((x) => x.personId === personId);
      const changed = !!s;
      if (s) s.role = role; else i.shares.push({ personId, role });
      log(id, 'shared', person(personId).name + ' (' + (role === 'edit' ? 'can edit' : 'can view') + ')', { target: personId, role, changed }); save();
    },
    unshare(id, personId) {
      const i = byId(id); mustEdit(i);
      i.shares = i.shares.filter((x) => x.personId !== personId);
      log(id, 'unshared', person(personId).name, { target: personId }); save();
    },
    // "Everyone at Northwest Frozen can view" (helper; not in the original API list)
    setOrgView(id, on) { const i = byId(id); mustEdit(i); i.orgView = !!on; log(id, 'shared', on ? 'everyone at ' + ORG : 'no longer org-wide', { org: !!on }); save(); },

    activity(id) {
      return db.activity.filter((a) => a.itemId === id).sort((a, b) => b.when - a.when)
        .map((a) => ({ who: copy(person(a.who)), what: a.what, when: a.when, detail: a.detail }));
    },

    /* Recipe Builder link (helper; not in the original API list).
       The v3 builder (mahindra-nwf/nutrilabel-recipe-layout-v3) is served from the same GitHub Pages origin,
       so both sites share localStorage. v3 keeps its recipes as tabs in 'nlv3_cards_book' = { active, tabs: [{ id, state, title? }] }
       and always opens the active tab. Opening a recipe here = find or create its tab, make it active, go to v3.
       v3 itself is not changed. If v3 isn't reachable (opened from disk, another host), returns null → placeholder page. */
    async openInBuilder(id) {
      const item = byId(id);
      if (!item || item.type !== 'recipe') return null;
      try {
        const ok = await fetch(V3_URL + 'index.html', { method: 'HEAD', cache: 'no-store' });
        if (!ok.ok) return null;
      } catch (e) { return null; }

      let book = null;
      try { book = JSON.parse(localStorage.getItem(V3_KEY)); } catch (e) {}
      if (!book || !Array.isArray(book.tabs)) book = { active: null, tabs: [] };
      const tabName = (t) => t.title || (t.state && t.state.asm && t.state.asm[t.state.root] && t.state.asm[t.state.root].name) || (t.state && t.state.draftName) || '';

      let tab = book.tabs.find((t) => t.id === item.builderTabId)
        // a v3 tab that already has this recipe's name (e.g. the "Spicy Miso Ramen" sample) is reused
        || book.tabs.find((t) => tabName(t).trim().toLowerCase() === item.name.trim().toLowerCase());
      if (!tab) {
        // recipes made here start empty; the made-up seeded ones start from v3's sample so there's something to look at
        const state = item.kcalPerPortion ? await v3Sample() : null;
        tab = { id: 't' + Math.random().toString(36).slice(2, 9), state: state || { root: null, draftName: item.name, asm: {} } };
        book.tabs.push(tab);
      }
      if (!tab.state || !tab.state.asm) tab.state = { root: null, draftName: item.name, asm: {} };
      // the Workspace name wins: keep the v3 tab named like the recipe
      if (tab.state.root && tab.state.asm[tab.state.root]) tab.state.asm[tab.state.root].name = item.name;
      else tab.state.draftName = item.name;
      delete tab.title;
      book.active = tab.id;
      try { localStorage.setItem(V3_KEY, JSON.stringify(book)); } catch (e) { return null; }

      item.builderTabId = tab.id;
      log(id, 'opened', 'in the Recipe Builder');
      save();
      return V3_URL;
    },

    /* ---------- tags (not in the original API list) ---------- */
    isAdmin,
    // groups with their options, plus how many recipes I can see carry each tag
    listTagGroups() {
      const visible = db.items.filter((i) => i.type === 'recipe' && i.status === 'active' && roleOf(i));
      const count = (id) => visible.filter((i) => (i.tags || []).includes(id)).length;
      const withCount = (t) => Object.assign(copy(t), { count: count(t.id) });
      return {
        groups: db.tagGroups.map((g) => Object.assign(copy(g), { options: db.tags.filter((t) => t.groupId === g.id).map(withCount) })),
        free: db.tags.filter((t) => !t.groupId).map(withCount).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      };
    },
    getTag(id) { return db.tags.find((x) => x.id === id) ? resolveTags([id])[0] : null; },
    // replace one recipe's tags (a "one"-choice group like Status keeps only the last one given)
    setTags(id, tagIds) {
      const i = byId(id); mustEdit(i);
      const clean = [];
      tagIds.forEach((tid) => {
        const t = db.tags.find((x) => x.id === tid); if (!t) return;
        const at = clean.indexOf(tid); if (at >= 0) clean.splice(at, 1); // a repeated id counts where it last appears
        const g = db.tagGroups.find((x) => x.id === t.groupId);
        if (g && g.choice === 'one') for (let k = clean.length - 1; k >= 0; k--) if ((db.tags.find((x) => x.id === clean[k]) || {}).groupId === g.id) clean.splice(k, 1);
        clean.push(tid);
      });
      const before = i.tags || [];
      const added = clean.filter((t) => !before.includes(t)).map(tagName), removed = before.filter((t) => !clean.includes(t)).map(tagName);
      if (!added.length && !removed.length) return decorate(i);
      i.tags = clean; touch(i);
      log(id, 'tagged', [added.length ? '+ ' + added.join(', ') : '', removed.length ? '− ' + removed.join(', ') : ''].filter(Boolean).join('  '), { added, removed });
      save(); return decorate(i);
    },
    // free tags: any editor can add one. Group options: admin only
    createTag({ name, groupId = null }) {
      name = String(name || '').trim().slice(0, 40);
      if (!name) throw new Error('Give the tag a name.');
      if (groupId) mustAdmin(); else if (!store.canCreate()) throw new Error('Viewers can’t add tags.');
      const same = db.tags.find((t) => (t.groupId || null) === groupId && t.name.toLowerCase() === name.toLowerCase());
      if (same) return copy(same);
      const PAL = ['#0f766e', '#e8590c', '#2f6fed', '#7c5cff', '#c2255c', '#5c940d', '#b08800', '#1971c2'];
      const t = { id: uid('t'), name, groupId, color: groupId ? PAL[db.tags.filter((x) => x.groupId === groupId).length % PAL.length] : null };
      db.tags.push(t); save(); emit({ type: 'tagcreated', tagId: t.id, groupId, name });
      return copy(t);
    },
    updateTag(id, patch) {
      mustAdmin();
      const t = db.tags.find((x) => x.id === id); if (!t) return;
      if (patch.name != null) t.name = String(patch.name).trim().slice(0, 40) || t.name;
      if (patch.color !== undefined) t.color = patch.color;
      save(); emit({ type: 'tagadmin', action: 'update', tagId: id });
    },
    deleteTag(id) {
      mustAdmin();
      db.tags = db.tags.filter((t) => t.id !== id);
      db.items.forEach((i) => { if (i.tags) i.tags = i.tags.filter((t) => t !== id); });
      save(); emit({ type: 'tagadmin', action: 'delete', tagId: id });
    },
    createTagGroup({ name, choice = 'many' }) {
      mustAdmin();
      name = String(name || '').trim().slice(0, 40); if (!name) throw new Error('Give the group a name.');
      const g = { id: uid('g'), name, choice: choice === 'one' ? 'one' : 'many' };
      db.tagGroups.push(g); save(); emit({ type: 'tagadmin', action: 'group' });
      return copy(g);
    },
    renameTagGroup(id, name) { mustAdmin(); const g = db.tagGroups.find((x) => x.id === id); if (g && String(name).trim()) { g.name = String(name).trim().slice(0, 40); save(); emit({ type: 'tagadmin', action: 'group' }); } },
    deleteTagGroup(id) {
      mustAdmin();
      if (id === 'g_status') throw new Error('Status is used everywhere and can’t be deleted. Rename or change its options instead.');
      db.tags.filter((t) => t.groupId === id).forEach((t) => store.deleteTag(t.id));
      db.tagGroups = db.tagGroups.filter((g) => g.id !== id); save(); emit({ type: 'tagadmin', action: 'group' });
    },

    /* ---------- demo helpers (not in the original API list) ---------- */
    // switch who is "signed in" — stands in for real login so one browser can play several people
    switchUser(personId) {
      if (!person(personId)) return;
      ME = personId; db.meId = personId; save();
      emit({ type: 'switch', to: personId });
    },
    canCreate() { return person(ME).role !== 'viewer'; },
    // tell the demo guide (or anything else) about every change; returns an unsubscribe function
    subscribe(fn) { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1); },

    // What teammates did that concerns me: shared with me / with everyone, changes to my items, things added to my folders.
    notifications() {
      const seen = (db.seen && db.seen[ME]) || 0;
      const me = person(ME);
      const out = [];
      const VERB = { edited: 'edited', renamed: 'renamed', moved: 'moved', archived: 'archived', restored: 'restored', unshared: 'changed who can see', tagged: 'tagged' };
      for (const a of db.activity) {
        if (a.who === ME || a.what === 'opened' || a.what === 'versioned') continue;
        const it = byId(a.itemId);
        if (!it || !roleOf(it)) continue;
        const who = person(a.who).name;
        const kind = it.type === 'folder' ? 'folder' : 'recipe';
        const parent = byId(it.type === 'folder' ? it.parentId : it.folderId);
        let text = null;
        if (a.what === 'shared' && a.target === ME) text = who + ' shared the ' + kind + ' “' + it.name + '” with you' + (a.role === 'edit' ? ' (can edit)' : ' (can view)');
        else if (a.what === 'shared' && a.org === true && it.ownerId !== ME) text = who + ' made “' + it.name + '” viewable by everyone at ' + ORG;
        else if (a.what === 'created' && parent && parent.ownerId === ME) text = who + ' added “' + it.name + '” to your folder “' + parent.name + '”';
        else if (it.ownerId === ME && a.what === 'shared' && a.target) text = who + ' shared your ' + kind + ' “' + it.name + '” with ' + person(a.target).name;
        else if (it.ownerId === ME && VERB[a.what]) text = who + ' ' + VERB[a.what] + ' your ' + kind + ' “' + it.name + '”';
        if (text) out.push({ id: a.id, itemId: it.id, who: copy(person(a.who)), text, when: a.when, unread: a.when > seen });
      }
      return out.sort((x, y) => y.when - x.when).slice(0, 30);
    },
    markNotificationsSeen() { db.seen = db.seen || {}; db.seen[ME] = Date.now(); save(); },

    // per-browser UI preferences such as theme and grid/list (helper; would be a user setting later)
    pref(key, value) {
      const k = 'nlws.pref.' + key;
      try {
        if (value === undefined) return JSON.parse(localStorage.getItem(k));
        localStorage.setItem(k, JSON.stringify(value));
      } catch (e) { return null; }
    },

    // "Reset demo data" button (helper)
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} db = seed(); ME = db.meId; save(); emit({ type: 'reset' }); },
  };

  /* ---------- v3 Recipe Builder ---------- */
  const V3_URL = '../nutrilabel-recipe-layout-v3/';
  const V3_KEY = 'nlv3_cards_book';
  // v3's own sample assembly, prepared the way v3's fromSample() does (colors, empty steps, auto-arrange on open)
  async function v3Sample() {
    try {
      const src = await (await fetch(V3_URL + 'shared/data.js', { cache: 'no-store' })).text();
      const box = {};
      new Function('window', 'NL', src)({ NL: box }, box); // runs v3's data file against a private object, not our window.NL
      const s = JSON.parse(JSON.stringify(box.SAMPLE));
      const COLORS = ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#14b8a6', '#ec4899', '#f97316', '#6366f1'];
      Object.entries(s.asm).forEach(([aid, a], i) => {
        a.color = aid === s.root ? '#0f766e' : COLORS[(i - 1) % COLORS.length];
        a.steps = a.steps || []; a.notes = a.notes || ''; a.x = 0; a.y = 0;
      });
      s._arrange = true;
      return s;
    } catch (e) { return null; }
  }

  db = load();
  ME = person(db.meId) ? db.meId : 'u1';
  save();
  window.store = store;
})();
