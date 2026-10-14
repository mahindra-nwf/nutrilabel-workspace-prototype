/* share-dialog.js — add people (Can view / Can edit), change or remove access, org-wide view switch. */
(function () {
  const { el } = NL;

  function open(id) {
    let dlg;
    const body = el('div.ws-share');
    const draw = () => {
      const it = store.getItem(id);
      if (!it) { dlg && dlg.close(); return; } // you removed your own access
      const me = store.me();
      const canEdit = it.myRole === 'owner' || it.myRole === 'edit';
      const shares = store.listShares(id);
      const taken = new Set([it.ownerId, ...shares.map((s) => s.person.id)]);
      const free = store.listPeople().filter((p) => !taken.has(p.id));

      const who = el('select.ws-sel', { 'aria-label': 'Person' },
        el('option', { value: '' }, free.length ? 'Add a person…' : 'Everyone already has access'),
        free.map((p) => el('option', { value: p.id }, p.name + ' · ' + p.email)));
      const role = el('select.ws-sel', { 'aria-label': 'Access' }, el('option', { value: 'view' }, 'Can view'), el('option', { value: 'edit' }, 'Can edit'));
      const add = el('button.btn.primary', {
        disabled: true,
        onclick: () => { store.share(id, who.value, role.value); NL.toast(nameOf(who.value) + ' can now ' + (role.value === 'edit' ? 'edit' : 'view')); draw(); NL.app.refresh(); },
      }, 'Add');
      who.addEventListener('change', () => { add.disabled = !who.value; });

      const owner = it.owner;
      const rows = [
        el('div.ws-share-row', {}, NL.avatar(owner, 32), info(owner, me), el('span.faint.ws-share-role', {}, 'Owner')),
        ...shares.map((s) => el('div.ws-share-row', {}, NL.avatar(s.person, 32), info(s.person, me),
          canEdit
            ? el('select.ws-sel.ws-share-role', {
                'aria-label': 'Access for ' + s.person.name,
                onchange: (e) => { store.share(id, s.person.id, e.target.value); draw(); NL.app.refresh(); },
              }, el('option', { value: 'view', selected: s.role === 'view' }, 'Can view'), el('option', { value: 'edit', selected: s.role === 'edit' }, 'Can edit'))
            : el('span.faint.ws-share-role', {}, s.role === 'edit' ? 'Can edit' : 'Can view'),
          canEdit ? el('button.ws-more', {
            title: 'Remove ' + s.person.name, 'aria-label': 'Remove ' + s.person.name,
            onclick: () => {
              store.unshare(id, s.person.id); draw(); NL.app.refresh();
              NL.toast(s.person.name + ' no longer has access', { label: 'Undo', run: () => { store.share(id, s.person.id, s.role); NL.app.refresh(); } });
            },
          }, '✕') : null)),
      ];

      const inherited = store.path(id).slice(0, -1).filter((f) => store.listShares(f.id).length);
      const org = el('label.ws-share-org', {},
        el('span.ws-org-ic', {}, '⌂'),
        el('span.grow', {}, el('b', {}, 'Everyone at ' + store.orgName + ' can view'),
          el('div.faint', {}, it.orgView ? 'Anyone in the company can find and open this, but not change it.' : 'Only the people above can open this.')),
        el('input.ws-switch', {
          type: 'checkbox', role: 'switch', checked: !!it.orgView, disabled: !canEdit,
          onchange: (e) => { store.setOrgView(id, e.target.checked); draw(); NL.app.refresh(); },
        }));

      NL.fill(body,
        canEdit ? el('div.ws-share-add', {}, who, role, add)
          : el('p.ws-det-note', {}, 'You can view this but not share it. Ask ' + owner.name + ' to add people.'),
        el('h4', {}, 'People with access'),
        el('div.ws-share-list', {}, rows),
        inherited.length ? el('p.faint.ws-det-small', {}, 'People with access to the folder “' + inherited.map((f) => f.name).join('”, “') + '” can also see this.') : null,
        it.type === 'folder' ? el('p.faint.ws-det-small', {}, 'Sharing a folder shares everything inside it.') : null,
        el('h4', {}, 'General access'),
        org);
    };
    draw();
    const it = store.getItem(id);
    dlg = NL.modal('Share “' + it.name + '”', body, [el('span.spacer'), el('button.btn.primary', { onclick: () => dlg.close() }, 'Done')]);
    const first = dlg.box.querySelector('select');
    first && first.focus();
  }

  function info(p, me) {
    return el('div.grow', {}, el('div', {}, p.name + (p.id === me.id ? ' (you)' : '')), el('div.faint', {}, p.email));
  }
  const nameOf = (pid) => (store.listPeople().find((p) => p.id === pid) || {}).name;

  NL.shareDialog = { open };
})();
