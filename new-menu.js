/* new-menu.js — "＋ New" → New recipe / New folder. Creates inside the open folder when you can edit it. */
(function () {
  function target(state) {
    if (!state.folderId || state.query) return null;
    const f = store.getItem(state.folderId);
    return f && (f.myRole === 'owner' || f.myRole === 'edit') ? f : null;
  }

  function open(x, y, state) {
    const f = target(state);
    const where = f ? ' in “' + f.name + '”' : '';
    NL.menu(x, y, [
      { icon: '▤', label: 'New recipe', run: () => newRecipe(state) },
      { icon: '▸', label: 'New folder', run: () => newFolder(state) },
    ]);
  }

  async function newRecipe(state) {
    const f = target(state);
    const name = await NL.ask('Name your new recipe' + (f ? ' (goes in “' + f.name + '”)' : ''), 'Untitled recipe', 'Create');
    if (!name) return;
    const r = store.createRecipe({ name, folderId: f ? f.id : null });
    if (!f) NL.app.go({ view: 'mine', folderId: null, query: '' });
    NL.app.refresh({ select: r.id });
    NL.toast('Created “' + r.name + '”', { label: 'Open', run: () => NL.app.open(r.id) });
  }

  async function newFolder(state) {
    const f = target(state);
    const name = await NL.ask('Name your new folder' + (f ? ' (goes in “' + f.name + '”)' : ''), 'New folder', 'Create');
    if (!name) return;
    const nf = store.createFolder({ name, parentId: f ? f.id : null });
    if (!f) NL.app.go({ view: 'mine', folderId: null, query: '' });
    NL.app.refresh({ select: nf.id });
    NL.toast('Folder “' + nf.name + '” created');
  }

  NL.newMenu = { open, newRecipe, newFolder };
})();
