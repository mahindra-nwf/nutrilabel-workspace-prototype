/* new-menu.js — "＋ New" → New recipe / New folder / New case. Creates inside the open folder when you can edit it. */
(function () {
  // an R&D case: one folder named after the case, with the same folders inside as the SharePoint case template
  const CASE_FOLDERS = [
    ['Development brief'], ['Inspiration'], ['Others'], ['Procurement'], ['QA-QC'],
    ['Recipes', [['Final recipes'], ['In process'], ['Production recipe']]],
    ['Sales & marketing'],
  ];

  function target(state) {
    if (!state.folderId || state.query) return null;
    const f = store.getItem(state.folderId);
    return f && (f.myRole === 'owner' || f.myRole === 'edit') ? f : null;
  }

  // company viewers (QA, sales) can't create; say why instead of silently hiding the button
  function blocked() {
    if (store.canCreate()) return false;
    NL.toast('Viewers can’t create recipes or folders. Ask an editor or an admin.');
    NL.app.track({ type: 'blocked', action: 'new' });
    return true;
  }

  function open(x, y, state) {
    if (blocked()) return;
    const f = target(state);
    const where = f ? ' in “' + f.name + '”' : '';
    NL.menu(x, y, [
      { icon: '▤', label: 'New recipe', run: () => newRecipe(state) },
      { icon: '▸', label: 'New folder', run: () => newFolder(state) },
      { icon: '▣', label: 'New case', run: () => newCase(state) },
    ]);
  }

  async function newRecipe(state) {
    if (blocked()) return;
    const f = target(state);
    const name = await NL.ask('Name your new recipe' + (f ? ' (goes in “' + f.name + '”)' : ''), 'Untitled recipe', 'Create');
    if (!name) return;
    let r;
    try { r = store.createRecipe({ name, folderId: f ? f.id : null }); } catch (e) { NL.toast(e.message); return; } // Live: the database can refuse
    if (!f) NL.app.go({ view: 'mine', folderId: null, query: '' });
    NL.app.refresh({ select: r.id });
    NL.toast('Created “' + r.name + '”', { label: 'Open', run: () => NL.app.open(r.id) });
  }

  async function newFolder(state) {
    if (blocked()) return;
    const f = target(state);
    const name = await NL.ask('Name your new folder' + (f ? ' (goes in “' + f.name + '”)' : ''), 'New folder', 'Create');
    if (!name) return;
    const nf = store.createFolder({ name, parentId: f ? f.id : null });
    if (!f) NL.app.go({ view: 'mine', folderId: null, query: '' });
    NL.app.refresh({ select: nf.id });
    NL.toast('Folder “' + nf.name + '” created');
  }

  async function newCase(state) {
    if (blocked()) return;
    const f = target(state);
    const name = await NL.ask('Name the new case' + (f ? ' (goes in “' + f.name + '”)' : '') + ' — its folders are made for you', 'New case', 'Create');
    if (!name) return;
    let top;
    try {
      top = store.createFolder({ name, parentId: f ? f.id : null });
      const make = (list, parentId) => list.forEach(([n, inside]) => {
        const sub = store.createFolder({ name: n, parentId });
        if (inside) make(inside, sub.id);
      });
      make(CASE_FOLDERS, top.id);
    } catch (e) { NL.toast(e.message); if (top) NL.app.refresh({ select: top.id }); return; } // Live: the database can refuse
    if (!f) NL.app.go({ view: 'mine', folderId: null, query: '' });
    NL.app.refresh({ select: top.id });
    NL.toast('Case “' + top.name + '” created with its folders', { label: 'Open', run: () => NL.app.go({ folderId: top.id, query: '' }) });
  }

  NL.newMenu = { open, newRecipe, newFolder, newCase };
})();
