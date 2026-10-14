/* item-menu.js — the "⋯" / right-click menu for one item. Shared by grid and list views. */
(function () {
  function open(x, y, item) {
    const canEdit = item.myRole === 'owner' || item.myRole === 'edit';
    const archived = item.status === 'archived';
    const A = NL.app;
    const items = [
      { icon: '↗', label: 'Open', hint: 'Enter', run: () => A.open(item.id) },
      { icon: '✎', label: 'Rename', hint: 'F2', disabled: !canEdit, run: () => A.rename(item.id) },
      { icon: '⇄', label: canEdit ? 'Share' : 'See who has access', run: () => A.share(item.id) },
      { icon: '⇢', label: 'Move to…', disabled: !canEdit || archived, run: () => A.moveTo([item.id]) },
      { icon: '⧉', label: 'Duplicate', run: () => A.duplicate(item.id) },
      { icon: item.starred ? '☆' : '★', label: item.starred ? 'Remove star' : 'Star', run: () => A.star(item.id, !item.starred) },
      { icon: 'ⓘ', label: 'Details', run: () => A.details(item.id) },
      'sep',
      archived
        ? { icon: '↺', label: 'Restore', disabled: !canEdit, run: () => A.restore([item.id]) }
        : { icon: '⌫', label: 'Archive', hint: 'Del', danger: true, disabled: !canEdit, run: () => A.archive([item.id]) },
    ];
    NL.menu(x, y, items);
  }
  NL.itemMenu = { open };
})();
