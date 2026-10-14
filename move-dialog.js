/* move-dialog.js — "Move to…": pick a folder from a tree of folders you can edit, or My recipes. */
(function () {
  const { el } = NL;

  // every folder I can put things in, as a flat list with depth (skips the items being moved and what's inside them)
  function tree(skip) {
    const out = [];
    const walk = (folders, depth) => folders.forEach((f) => {
      if (skip.has(f.id) || f.type !== 'folder') return;
      const ok = f.myRole === 'owner' || f.myRole === 'edit';
      out.push({ f, depth, ok });
      walk(store.listItems({ folderId: f.id }).filter((c) => c.type === 'folder'), depth + 1);
    });
    walk(store.listItems({ view: 'mine' }).filter((i) => i.type === 'folder'), 1);
    const shared = store.listItems({ view: 'shared' }).filter((i) => i.type === 'folder');
    if (shared.length) { out.push({ heading: 'Shared with me' }); walk(shared, 1); }
    return out;
  }

  function open(ids) {
    const items = ids.map((id) => store.getItem(id)).filter(Boolean);
    if (!items.length) return;
    const here = new Set(items.map((i) => (i.type === 'folder' ? i.parentId : i.folderId) || null));
    const current = here.size === 1 ? [...here][0] : undefined;
    let chosen = current === undefined ? null : current;
    let dlg;

    const moveBtn = el('button.btn.primary', { onclick: () => { dlg.close(); NL.app.moveIds(ids, chosen); } }, 'Move here');
    const list = el('div.ws-move-list', { role: 'listbox', 'aria-label': 'Folders' });
    const rows = [{ f: null, depth: 0, ok: true }, ...tree(new Set(ids))];

    const draw = () => {
      list.replaceChildren(...rows.map((r) => {
        if (r.heading) return el('div.ws-move-heading', {}, r.heading);
        const id = r.f ? r.f.id : null;
        const isHere = current !== undefined && id === current;
        return el('button.ws-move-row' + (id === chosen ? '.on' : ''), {
          role: 'option', 'aria-selected': String(id === chosen), disabled: !r.ok,
          title: r.ok ? '' : 'You can only view this folder',
          style: { paddingLeft: 12 + r.depth * 20 + 'px' },
          onclick: () => { chosen = id; draw(); },
          ondblclick: () => { if (r.ok && !isHere) { chosen = id; dlg.close(); NL.app.moveIds(ids, chosen); } },
        },
          r.f ? el('span.ws-row-ic.folder', { innerHTML: NL.itemGrid.FOLDER_SVG }) : el('span.ws-row-ic.folder', {}, '▤'),
          el('span.grow', {}, r.f ? r.f.name : 'My recipes (top level)'),
          isHere ? el('span.faint', {}, 'current') : null,
          !r.ok ? el('span.faint', {}, 'view only') : null);
      }));
      moveBtn.disabled = current !== undefined && chosen === current;
    };
    draw();

    const what = items.length === 1 ? '“' + items[0].name + '”' : items.length + ' items';
    dlg = NL.modal('Move ' + what, list, [
      el('button.btn', {
        onclick: async () => {
          const name = await NL.ask('Name the new folder' + (chosen ? ' (goes in “' + store.getItem(chosen).name + '”)' : ''), 'New folder', 'Create');
          if (!name) return;
          try {
            const nf = store.createFolder({ name, parentId: chosen });
            dlg.close(); NL.app.moveIds(ids, nf.id);
          } catch (err) { NL.toast(err.message); }
        },
      }, '＋ New folder here'),
      el('span.spacer'),
      el('button.btn', { onclick: () => dlg.close() }, 'Cancel'),
      moveBtn]);
  }

  NL.moveDialog = { open };
})();
