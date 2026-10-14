/* ui.js — small shared helpers (DOM builder, formatting, toast, prompt). No data access here. */
window.NL = window.NL || {};
(function () {
  // el('div.card', { onclick }, child, 'text', …)
  function el(tag, attrs, ...kids) {
    const [name, ...cls] = tag.split('.');
    const n = document.createElement(name || 'div');
    if (cls.length) n.className = cls.join(' ');
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else if (k in n && k !== 'list') n[k] = v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) n.append(k.nodeType ? k : document.createTextNode(k));
    return n;
  }

  function timeAgo(t) {
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    if (s < 86400 * 7) { const d = Math.floor(s / 86400); return d === 1 ? 'yesterday' : d + ' days ago'; }
    return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: s > 86400 * 300 ? 'numeric' : undefined });
  }
  const money = (n) => '$' + (n || 0).toFixed(2);
  const firstName = (p) => (p ? p.name.split(' ')[0] : '');

  function avatar(p, size = 26) {
    return el('span.avatar', { title: p.name, style: { width: size + 'px', height: size + 'px', background: p.color, fontSize: Math.round(size * 0.42) + 'px' } }, p.initials);
  }

  let toastTimer;
  function toast(msg, action) {
    let t = document.querySelector('.ws-toast');
    if (!t) { t = el('div.ws-toast'); document.body.append(t); }
    t.replaceChildren(el('span', {}, msg));
    if (action) t.append(el('button', { onclick: () => { t.classList.remove('show'); action.run(); } }, action.label));
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), action ? 6000 : 2600);
  }

  // Promise-based text prompt using the .nl-prompt styles from base.css
  function ask(label, value = '', okText = 'Save') {
    return new Promise((resolve) => {
      const input = el('input.nl-prompt-input', { value });
      const close = (v) => { ov.remove(); resolve(v); };
      const ok = () => { const v = input.value.trim(); close(v || null); };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') close(null); e.stopPropagation(); });
      const ov = el('div.nl-prompt-ov', { onmousedown: (e) => { if (e.target === ov) close(null); } },
        el('div.nl-prompt', {},
          el('div.nl-prompt-label', {}, label), input,
          el('div.nl-prompt-btns', {},
            el('button.btn', { onclick: () => close(null) }, 'Cancel'),
            el('button.btn.primary', { onclick: ok }, okText))));
      document.body.append(ov);
      input.focus(); input.select();
    });
  }

  // Modal dialog shell. Returns { close, box }. onClose runs once however it closes (✕, Esc, backdrop, close()).
  function modal(title, body, foot, onClose) {
    let done = false;
    const close = () => { if (done) return; done = true; ov.remove(); document.removeEventListener('keydown', onKey, true); onClose && onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    const box = el('div.ws-dialog', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      el('div.ws-dialog-head', {}, el('h2', {}, title), el('button.ws-more', { title: 'Close', onclick: close }, '✕')),
      el('div.ws-dialog-body', {}, body),
      foot ? el('div.ws-dialog-foot', {}, foot) : null);
    const ov = el('div.nl-prompt-ov', { onmousedown: (e) => { if (e.target === ov) close(); } }, box);
    document.body.append(ov);
    document.addEventListener('keydown', onKey, true);
    return { close, box };
  }

  // Floating menu: items = [{ label, icon, run, danger }] | 'sep'
  function menu(x, y, items) {
    closeMenu();
    const m = el('div.ws-menu', { role: 'menu' }, items.map((it) => it === 'sep' ? el('div.ws-menu-sep') :
      el('button' + (it.danger ? '.danger' : ''), { role: 'menuitem', disabled: it.disabled, onclick: () => { closeMenu(); it.run(); } },
        el('span.ic', {}, it.icon || ''), it.label, it.hint ? el('span.kbd', {}, it.hint) : null)));
    document.body.append(m);
    const r = m.getBoundingClientRect();
    m.style.left = Math.min(x, innerWidth - r.width - 8) + 'px';
    m.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    function onDoc(e) { if (!m.contains(e.target)) closeMenu(); }
    m._off = () => document.removeEventListener('mousedown', onDoc);
  }
  function closeMenu() { document.querySelectorAll('.ws-menu').forEach((m) => { m._off && m._off(); m.remove(); }); }

  // replaceChildren() that skips null/false (replaceChildren would print "null")
  const fill = (node, ...kids) => node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));

  Object.assign(NL, { fill, el, timeAgo, money, firstName, avatar, toast, ask, modal, menu, closeMenu });
})();
