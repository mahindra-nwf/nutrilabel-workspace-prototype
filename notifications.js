/* notifications.js — 🔔 in the top bar: what teammates did that concerns the current person. */
(function () {
  const { el, timeAgo } = NL;

  function button() {
    const unread = store.notifications().filter((n) => n.unread).length;
    return el('button.btn.ghost.ws-icon-btn.ws-bell', {
      id: 'bellBtn', title: unread ? unread + ' new' : 'Notifications', 'aria-label': 'Notifications' + (unread ? ', ' + unread + ' new' : ''),
      onclick: (e) => { e.stopPropagation(); open(e.currentTarget); },
    }, '🔔', unread ? el('span.ws-badge-n', {}, unread > 9 ? '9+' : String(unread)) : null);
  }

  function open(anchor) {
    NL.closeMenu();
    const list = store.notifications();
    const r = anchor.getBoundingClientRect();
    const m = el('div.ws-menu.ws-notes', { role: 'dialog', 'aria-label': 'Notifications' },
      el('div.ws-people-head', {}, 'Notifications for ' + store.me().name),
      list.length ? list.map((n) => el('button.ws-note' + (n.unread ? '.unread' : ''), {
        onclick: () => { NL.closeMenu(); NL.app.reveal(n.itemId); },
      }, NL.avatar(n.who, 28), el('span.grow', {}, el('div', {}, n.text), el('div.faint', {}, timeAgo(n.when))), n.unread ? el('span.ws-dot') : null))
        : el('div.ws-notes-empty', {}, 'Nothing new. When someone shares with you or changes your recipes, it shows up here.'));
    document.body.append(m);
    m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8)) + 'px';
    m.style.top = r.bottom + 6 + 'px';
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    function onDoc(e) { if (!m.contains(e.target)) { NL.closeMenu(); NL.app.refresh(); } }
    m._off = () => document.removeEventListener('mousedown', onDoc);
    store.markNotificationsSeen();
    NL.demo && NL.demo.track({ type: 'notifications' });
  }

  NL.notifications = { button, open };
})();
