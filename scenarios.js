/* scenarios.js — the multi-person use cases and the feature checklist shown in the "▶ Use cases" guide.
   Each step says WHO does it (as) and how to recognise it's done (test) from the events the app and store report.
   Seeded ids used here: f1 Soups, f3 Sauces & Dressings, f4 Frozen Meals, f6 Test Kitchen, r2 Tomato Basil Soup, r11 House Vinaigrette.
   People: u1 Jordan (Head of R&D, admin), u2 Ana (sous chef), u3 Marco (product developer), u4 Priya (food technologist),
   u5 Ken (QA lead, viewer), u6 Lena (sales, viewer). */
(function () {
  const inFolder = (itemId, folderId) => {
    const it = store.getItem(itemId);
    return !!it && (it.id === folderId || it.folderId === folderId || it.parentId === folderId);
  };

  const SCENARIOS = [
    {
      id: 'qa-review',
      title: 'Send a recipe to QA for review',
      people: ['u1', 'u5'],
      story: 'Jordan wants QA to check the Tomato Basil Soup before it goes to a client. Ken in QA can look at it but not change it.',
      steps: [
        { as: 'u1', text: 'Open the Soups folder.', test: (e) => e.type === 'view' && e.folderId === 'f1' },
        { as: 'u1', text: 'Share “Tomato Basil Soup” with Ken Watanabe (⋯ → Share). “Can edit” is greyed out because Ken is a viewer.',
          test: (e) => e.type === 'shared' && e.itemId === 'r2' && e.target === 'u5' },
        { as: 'u5', text: 'Click the 🔔 in the top bar. Jordan’s share is there; click it to jump to the soup.', test: (e) => e.type === 'notifications' },
        { as: 'u5', text: 'With the soup selected, press ⓘ to see its numbers and who has access.', test: (e) => e.type === 'details' && e.itemId === 'r2' },
        { as: 'u5', text: 'Press F2 to try renaming it. Ken only has view access, so it’s refused.', test: (e) => e.type === 'blocked' },
        { as: 'u5', text: 'Double-click the soup to open it in the Recipe Builder and check it. Use the browser’s Back button to come back.',
          test: (e) => e.type === 'opened' && e.itemId === 'r2' },
        { as: 'u1', text: 'Review done. As Jordan, open Soups → ⋯ on the soup → Share, and remove Ken (✕). Click Undo if you change your mind.',
          test: (e) => e.type === 'unshared' && e.itemId === 'r2' && e.target === 'u5' },
      ],
    },
    {
      id: 'product-line',
      title: 'Start a new product line as a team',
      people: ['u1', 'u2', 'u3'],
      story: 'Jordan sets up a folder for a spring range, Ana adds her own recipe to it, then Marco is brought in to take a look.',
      steps: [
        { as: 'u1', text: '＋ New → New folder. Call it “Spring Menu”.', test: (e) => e.type === 'created' && e.kind === 'folder',
          capture: (e, c) => { c.folder = e.itemId; } },
        { as: 'u1', text: 'Open Spring Menu and make a recipe inside it (＋ New → New recipe).',
          test: (e, c) => e.type === 'created' && e.kind === 'recipe' && e.folderId === c.folder },
        { as: 'u1', text: 'Share the Spring Menu folder with Ana Ruiz as “Can edit”. Everything inside is shared with it.',
          test: (e, c) => e.type === 'shared' && e.itemId === c.folder && e.target === 'u2' && e.role === 'edit' },
        { as: 'u2', text: 'Open “Shared with me” → Spring Menu, and add a recipe of your own.',
          test: (e, c) => e.type === 'created' && e.kind === 'recipe' && e.folderId === c.folder },
        { as: 'u2', text: 'Star the Spring Menu folder (⋯ → Star) so it’s easy to find.', test: (e, c) => e.type === 'star' && e.itemId === c.folder && e.on },
        { as: 'u2', text: 'Open Starred in the sidebar: Spring Menu is waiting there.', test: (e) => e.type === 'view' && e.view === 'starred' },
        { as: 'u3', text: 'Open “Shared with me”. Spring Menu isn’t there: nobody has shared it with Marco yet.', test: (e) => e.type === 'view' && e.view === 'shared' },
        { as: 'u2', text: 'Ana can edit the folder, so she can share it too. Share Spring Menu with Marco as “Can view”.',
          test: (e, c) => e.type === 'shared' && e.itemId === c.folder && e.target === 'u3' },
        { as: 'u3', text: 'Open Spring Menu, select something and press ⓘ: who has access, and what Ana and Jordan did.',
          test: (e, c) => e.type === 'details' && inFolder(e.itemId, c.folder) },
        { as: 'u1', text: 'Back as Jordan, click the 🔔: Ana added a recipe to your folder and shared it with Marco.', test: (e) => e.type === 'notifications' },
        { as: 'u1', text: 'Marco will develop recipes too. Open Share on Spring Menu and change Marco to “Can edit”.',
          test: (e, c) => e.type === 'shared' && e.itemId === c.folder && e.target === 'u3' && e.changed && e.role === 'edit' },
      ],
    },
    {
      id: 'house-standard',
      title: 'Share a house standard with the whole company',
      people: ['u1', 'u6', 'u4'],
      story: 'The house vinaigrette is used everywhere. Jordan makes it viewable by everyone; Sales can find it, and Priya builds a low-fat version from it.',
      steps: [
        { as: 'u1', text: 'In Sauces & Dressings, open ⋯ on “House Vinaigrette” → Share, and turn on “Everyone at Northwest Frozen can view”.',
          test: (e) => e.type === 'shared' && e.itemId === 'r11' && e.org === true },
        { as: 'u6', text: 'Press / and search for “vinaigrette”. Lena finds it even though nobody shared it with her by name.',
          test: (e) => e.type === 'search' && /vinai/i.test(e.query) },
        { as: 'u6', text: 'Try ＋ New. Lena is in Sales (a viewer), so she can’t create recipes.', test: (e) => e.type === 'blocked' },
        { as: 'u4', text: 'Find House Vinaigrette (search, or the 🔔) and choose ⋯ → Duplicate. The copy belongs to Priya.',
          test: (e) => e.type === 'created' && e.copyOf === 'r11', capture: (e, c) => { c.copy = e.itemId; } },
        { as: 'u4', text: 'Go to My recipes, select the copy, press F2 and rename it “Low-fat Vinaigrette”.', test: (e, c) => e.type === 'renamed' && e.itemId === c.copy },
        { as: 'u4', text: 'Drag the copy onto her “Test Kitchen” folder (or ⋯ → Move to…).', test: (e, c) => e.type === 'moved' && e.itemId === c.copy },
        { as: 'u1', text: 'Back as Jordan, open Sauces & Dressings, select House Vinaigrette and press ⓘ: the activity shows it went company-wide.',
          test: (e) => e.type === 'details' && e.itemId === 'r11' },
      ],
    },
    {
      id: 'clean-up',
      title: 'Clean-up day, with undo',
      people: ['u3', 'u1'],
      story: 'Marco tidies the Frozen Meals folder he owns, makes a slip and undoes it. Jordan then checks what changed.',
      steps: [
        { as: 'u3', text: 'Open Frozen Meals, switch to ☰ List and click the “Cost / portion” header to sort by cost.',
          test: (e) => e.type === 'sort' && e.key === 'costPerPortion' },
        { as: 'u3', text: 'Tick two recipes, click ⇢ Move in the bar, use “＋ New folder here” to make “Kids range”, and move them in.',
          test: (e) => e.type === 'move' && e.count >= 2 },
        { as: 'u3', text: 'Select a recipe and press Delete to archive it. Then click Undo in the message at the bottom.',
          test: (e) => e.type === 'undo' && e.of === 'archive' },
        { as: 'u3', text: 'Archive a recipe for real, open Archived in the sidebar and Restore it.', test: (e) => e.type === 'restored' },
        { as: 'u1', text: 'Back as Jordan, open Recent: Marco’s changes are at the top.', test: (e) => e.type === 'view' && e.view === 'recent' },
        { as: 'u1', text: 'Jordan works late: switch the theme with ☾ / ☀ in the top bar.', test: (e) => e.type === 'theme' },
      ],
    },
  ];

  // Every feature in the brief. Ticks itself the first time it's used, by anyone.
  const FEATURES = [
    { group: 'Find', id: 'search', label: 'Search by name or tag ( / )', test: (e) => e.type === 'search' },
    { group: 'Find', id: 'folder', label: 'Open a folder (breadcrumbs appear)', test: (e) => e.type === 'view' && !!e.folderId },
    { group: 'Find', id: 'shared', label: 'Shared with me', test: (e) => e.type === 'view' && e.view === 'shared' },
    { group: 'Find', id: 'recent', label: 'Recent', test: (e) => e.type === 'view' && e.view === 'recent' },
    { group: 'Find', id: 'starred', label: 'Starred', test: (e) => e.type === 'view' && e.view === 'starred' },
    { group: 'Find', id: 'archived', label: 'Archived', test: (e) => e.type === 'view' && e.view === 'archived' },
    { group: 'Find', id: 'list', label: 'List view', test: (e) => e.type === 'layout' && e.layout === 'list' },
    { group: 'Find', id: 'sort', label: 'Sort a list column', test: (e) => e.type === 'sort' },
    { group: 'Find', id: 'details', label: 'Details panel ( ⓘ )', test: (e) => e.type === 'details' },
    { group: 'Find', id: 'notes', label: 'Notifications ( 🔔 )', test: (e) => e.type === 'notifications' },
    { group: 'Organise', id: 'new-recipe', label: 'New recipe', test: (e) => e.type === 'created' && e.kind === 'recipe' && !e.copyOf },
    { group: 'Organise', id: 'new-folder', label: 'New folder', test: (e) => e.type === 'created' && e.kind === 'folder' && !e.copyOf },
    { group: 'Organise', id: 'rename', label: 'Rename (F2 or ⋯)', test: (e) => e.type === 'renamed' },
    { group: 'Organise', id: 'move', label: 'Move to… dialog', test: (e) => e.type === 'move' && e.via === 'dialog' },
    { group: 'Organise', id: 'drag', label: 'Drag onto a folder', test: (e) => e.type === 'move' && e.via === 'drag' },
    { group: 'Organise', id: 'bulk', label: 'Move several at once', test: (e) => e.type === 'move' && e.count >= 2 },
    { group: 'Organise', id: 'duplicate', label: 'Duplicate', test: (e) => e.type === 'created' && !!e.copyOf },
    { group: 'Organise', id: 'star', label: 'Star', test: (e) => e.type === 'star' && e.on },
    { group: 'Organise', id: 'archive', label: 'Archive', test: (e) => e.type === 'archived' },
    { group: 'Organise', id: 'undo', label: 'Undo (archive, move or access)', test: (e) => e.type === 'undo' },
    { group: 'Organise', id: 'restore', label: 'Restore from Archived', test: (e) => e.type === 'restored' },
    { group: 'Share', id: 'switch', label: 'Switch person', test: (e) => e.type === 'switch' },
    { group: 'Share', id: 'share-add', label: 'Share with a person', test: (e) => e.type === 'shared' && !!e.target && !e.changed },
    { group: 'Share', id: 'share-change', label: 'Change someone’s access', test: (e) => e.type === 'shared' && e.changed },
    { group: 'Share', id: 'unshare', label: 'Remove someone’s access', test: (e) => e.type === 'unshared' },
    { group: 'Share', id: 'org', label: 'Everyone at Northwest Frozen can view', test: (e) => e.type === 'shared' && e.org === true },
    { group: 'Share', id: 'blocked', label: 'Viewers can’t make changes (try ＋ New as Ken or Lena)', test: (e) => e.type === 'blocked' },
    { group: 'Work', id: 'open', label: 'Open in the Recipe Builder', test: (e) => e.type === 'opened' },
    { group: 'Work', id: 'keys', label: 'Keyboard: / Enter F2 Delete', test: (e) => e.type === 'key' },
    { group: 'Work', id: 'theme', label: 'Light / dark theme', test: (e) => e.type === 'theme' },
  ];

  NL.SCENARIOS = SCENARIOS;
  NL.FEATURES = FEATURES;
})();
