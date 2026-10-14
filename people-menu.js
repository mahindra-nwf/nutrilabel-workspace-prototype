/* people-menu.js — "Viewing as" switcher in the top bar. Stands in for real login so one browser can play several people. */
(function () {
  const { el } = NL;
  const ROLE = { admin: 'Admin', editor: 'Editor', viewer: 'Viewer' };

  function button() {
    const me = store.me();
    return el('button.ws-me-btn', {
      title: 'Switch person (demo)', 'aria-haspopup': 'menu',
      onclick: (e) => { e.stopPropagation(); open(e.currentTarget); },
    },
      el('span.ws-me-txt', {}, el('b', {}, me.name), el('span', {}, me.title + ' · ' + ROLE[me.role])),
      NL.avatar(me, 32),
      el('span.ws-caret', {}, '▾'));
  }

  function open(anchor) {
    NL.closeMenu();
    const me = store.me();
    const r = anchor.getBoundingClientRect();
    const m = el('div.ws-menu.ws-people', { role: 'menu' },
      el('div.ws-people-head', {}, 'Viewing the Workspace as…'),
      store.listPeople().map((p) => el('button' + (p.id === me.id ? '.on' : ''), {
        role: 'menuitemradio', 'aria-checked': String(p.id === me.id),
        onclick: () => { NL.closeMenu(); NL.app.switchUser(p.id); },
      },
        NL.avatar(p, 30),
        el('span.grow', {}, el('b', {}, p.name), el('div.faint', {}, p.title + ' · ' + ROLE[p.role])),
        p.id === me.id ? el('span.ws-check-ic', {}, '✓') : null)),
      el('div.ws-people-foot', {}, 'Demo only: real sign-in replaces this. Viewers can look and comment later, but not create or edit.'));
    document.body.append(m);
    m.style.left = Math.max(8, Math.min(r.right - m.offsetWidth, innerWidth - m.offsetWidth - 8)) + 'px';
    m.style.top = r.bottom + 6 + 'px';
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    function onDoc(e) { if (!m.contains(e.target)) NL.closeMenu(); }
    m._off = () => document.removeEventListener('mousedown', onDoc);
  }

  NL.peopleMenu = { button, open, ROLE };
})();
