/* demo-panel.js — "▶ Use cases" guide: walk through multi-person use cases step by step, and a feature checklist.
   Listens to everything the app and store report (NL.demo.track) and ticks steps / features by itself.
   Progress is a per-browser preference (store.pref('demo')); it isn't recipe data. */
(function () {
  const { el } = NL;
  const P = (id) => store.listPeople().find((p) => p.id === id);
  const firstName = (id) => P(id).name.split(' ')[0];

  let st = Object.assign({ open: false, min: false, tab: 'cases', active: null, progress: {}, ctx: {}, done: {} }, store.pref('demo') || {});
  const save = () => store.pref('demo', st);

  function track(e) {
    if (!e.who) e.who = store.me().id;
    let changed = false;
    NL.FEATURES.forEach((f) => { if (!st.done[f.id] && f.test(e)) { st.done[f.id] = true; changed = true; } });
    const sc = NL.SCENARIOS.find((s) => s.id === st.active);
    if (sc) {
      const n = st.progress[sc.id] || 0;
      const step = sc.steps[n];
      const ctx = st.ctx[sc.id] || (st.ctx[sc.id] = {});
      if (step && e.who === step.as && safe(() => step.test(e, ctx))) {
        if (step.capture) step.capture(e, ctx);
        st.progress[sc.id] = n + 1;
        changed = true;
        flash = true;
      }
    }
    if (changed) { save(); render(); }
  }
  const safe = (fn) => { try { return fn(); } catch (x) { return false; } };
  let flash = false;

  function toggle(on) {
    st.open = on === undefined ? !st.open : on;
    st.min = false;
    save(); NL.app.refresh();
  }
  const isOpen = () => !!st.open;

  function start(id) {
    st.active = id; st.progress[id] = 0; st.ctx[id] = {}; st.tab = 'cases'; st.min = false;
    save(); render();
  }
  function skip(sc) { st.progress[sc.id] = (st.progress[sc.id] || 0) + 1; save(); render(); }

  /* ---------- render ---------- */
  function render() {
    const root = document.getElementById('demo');
    root.hidden = !st.open || store.isLive; // the guide plays made-up people: Playground only
    if (root.hidden) return;
    const sc = NL.SCENARIOS.find((s) => s.id === st.active);
    const doneCount = NL.FEATURES.filter((f) => st.done[f.id]).length;

    if (st.min) {
      const n = sc ? (st.progress[sc.id] || 0) : 0;
      const step = sc && sc.steps[n];
      NL.fill(root, el('button.ws-demo-pill', { onclick: () => { st.min = false; save(); render(); } },
        '▶ ', sc ? (step ? 'Step ' + (n + 1) + '/' + sc.steps.length + ' · ' + firstName(step.as) : sc.title + ' ✓') : 'Use cases',
        el('span.faint', {}, '  ·  ' + doneCount + '/' + NL.FEATURES.length + ' features')));
      root.classList.add('min');
      return;
    }
    root.classList.remove('min');

    const head = el('div.ws-demo-head', {},
      el('div.ws-demo-tabs', { role: 'tablist' },
        el('button' + (st.tab === 'cases' ? '.on' : ''), { role: 'tab', onclick: () => { st.tab = 'cases'; save(); render(); } }, 'Use cases'),
        el('button' + (st.tab === 'check' ? '.on' : ''), { role: 'tab', onclick: () => { st.tab = 'check'; save(); render(); } },
          'Feature checklist ', el('span.ws-demo-count', {}, doneCount + '/' + NL.FEATURES.length))),
      el('button.ws-more', { title: 'Minimise', onclick: () => { st.min = true; save(); render(); } }, '–'),
      el('button.ws-more', { title: 'Close the guide', onclick: () => toggle(false) }, '✕'));

    const body = el('div.ws-demo-body');
    NL.fill(body, st.tab === 'check' ? checklist(doneCount) : sc ? scenarioView(sc) : caseList());
    NL.fill(root, head, body);
    if (flash) { flash = false; body.classList.add('flash'); } // brief highlight when a step ticks
    const cur = root.querySelector('.ws-step.current');
    cur && cur.scrollIntoView({ block: 'nearest' });
  }

  function people(ids, size = 24) { return el('span.ws-demo-people', {}, ids.map((id) => NL.avatar(P(id), size))); }

  function caseList() {
    return [
      el('p.ws-demo-intro', {}, 'Play several people in one browser. Each step says who to be; switch with one click. Steps tick themselves when you do them.'),
      el('div.ws-demo-cases', {}, NL.SCENARIOS.map((s) => {
        const n = st.progress[s.id] || 0;
        const complete = n >= s.steps.length;
        return el('div.ws-demo-case', {},
          el('div.ws-demo-case-top', {}, people(s.people), el('span.faint', {}, s.people.map(firstName).join(', '))),
          el('b', {}, s.title),
          el('p', {}, s.story),
          el('div.ws-demo-case-foot', {},
            el('span.faint', {}, complete ? 'Done ✓' : n ? 'Step ' + (n + 1) + ' of ' + s.steps.length : s.steps.length + ' steps'),
            el('button.btn.sm' + (complete ? '' : '.primary'), { onclick: () => (n && !complete ? (st.active = s.id, save(), render()) : start(s.id)) },
              complete ? 'Play again' : n ? 'Continue' : 'Start')));
      })),
      el('p.faint.ws-demo-small', {}, 'Steps use the made-up recipes as they start. If you’ve changed a lot, ',
        el('button.linkish', { onclick: () => { if (confirm('Put all demo recipes, folders and sharing back the way they started?')) NL.app.resetDemo(); } }, 'reset the demo data'), ' first.'),
    ];
  }

  function scenarioView(sc) {
    const n = st.progress[sc.id] || 0;
    const me = store.me().id;
    const complete = n >= sc.steps.length;
    return [
      el('button.linkish.ws-demo-back', { onclick: () => { st.active = null; save(); render(); } }, '← All use cases'),
      el('div.ws-demo-title', {}, people(sc.people, 26), el('b', {}, sc.title)),
      el('p.ws-demo-story', {}, sc.story),
      el('ol.ws-steps', {}, sc.steps.map((step, i) => {
        const cls = i < n ? '.done' : i === n ? '.current' : '';
        const p = P(step.as);
        const needSwitch = i === n && step.as !== me;
        return el('li.ws-step' + cls, {},
          el('span.ws-step-mark', {}, i < n ? '✓' : String(i + 1)),
          el('div.grow', {},
            el('div.ws-step-who', {}, NL.avatar(p, 20), el('b', {}, p.name), el('span.faint', {}, ' · ' + p.title)),
            el('div.ws-step-text', {}, step.text),
            i === n ? el('div.ws-step-act', {},
              needSwitch
                ? el('button.btn.primary.sm', { onclick: () => NL.app.switchUser(step.as) }, 'Switch to ' + p.name)
                : el('span.ws-step-turn', {}, 'Your turn as ' + firstName(step.as)),
              el('button.linkish.ws-step-skip', { title: 'Tick this step without doing it', onclick: () => skip(sc) }, 'Mark done')) : null));
      })),
      complete ? el('div.ws-demo-done', {},
        el('b', {}, 'Use case complete ✓'),
        el('div', {}, nextCase(sc) ? el('button.btn.primary.sm', { onclick: () => start(nextCase(sc).id) }, 'Next: ' + nextCase(sc).title) : 'That’s all of them. Check the feature checklist for anything left.')) : null,
    ];
  }
  const nextCase = (sc) => NL.SCENARIOS.find((s) => s.id !== sc.id && (st.progress[s.id] || 0) < s.steps.length);

  function checklist(doneCount) {
    const groups = [...new Set(NL.FEATURES.map((f) => f.group))];
    return [
      el('div.ws-demo-meter', {}, el('span', { style: { width: Math.round(doneCount / NL.FEATURES.length * 100) + '%' } })),
      el('p.ws-demo-intro', {}, doneCount === NL.FEATURES.length ? 'Every feature has been tried. 🎉' : 'Features tick off the first time anyone uses them, in a use case or just clicking around.'),
      ...groups.map((g) => el('div.ws-check-group', {},
        el('h4', {}, g),
        el('ul.ws-checklist', {}, NL.FEATURES.filter((f) => f.group === g).map((f) =>
          el('li' + (st.done[f.id] ? '.on' : ''), {}, el('span.ws-check-ic', {}, st.done[f.id] ? '✓' : '○'), f.label))))),
      el('button.linkish.ws-demo-small', { onclick: () => { st.done = {}; save(); render(); } }, 'Clear the checklist'),
    ];
  }

  NL.demo = { track, render, toggle, isOpen, start };
})();
