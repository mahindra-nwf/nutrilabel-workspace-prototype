# Handoff: NutriLabel Workspace prototype

Status: **steps 1–2 done**. Everything in the brief is clickable: grid + list views, details panel, share dialog, Move to…, bulk Move/Archive, drag to move, undo, keyboard, light/dark.

## How it runs
Plain HTML/CSS/JS, no build. Opens from `index.html` (works from disk or GitHub Pages).
Files load as classic `<script>`s, not ES modules, so `file://` works too. Each screen file puts one object on `window.NL` with a `render(state)` function.

## Files
| File | What it is |
|---|---|
| `index.html` | Shell: top bar, sidebar, main area. Loads scripts in order. |
| `builder.html` | Fallback placeholder (`?id=`), used only when the v3 Recipe Builder can't be reached. |
| `base.css` | Design tokens + shared components, copied from NLv4 `src/styles/base.css`. Don't edit; copy again when it changes. |
| `workspace.css` | All Workspace styles. Colors only via base.css tokens. |
| `store.js` | **The only data layer.** All localStorage access lives here. Seed data. |
| `ui.js` | Helpers: `el()` DOM builder, `timeAgo`, `money`, `avatar`, `toast` (with Undo), `ask` (name prompt), `menu`. |
| `app.js` | Screen state, `#/view/folderId` routing, actions, selection, keyboard shortcuts. |
| `toolbar.js` | Top bar: brand, search, grid ⇄ list toggle, theme toggle, avatar. |
| `sidebar.js` | ＋ New, the five views, Reset demo data. |
| `breadcrumbs.js` | My recipes › Soups › … (crumbs are drop targets). |
| `new-menu.js` | New recipe / New folder. |
| `item-menu.js` | ⋯ / right-click menu. |
| `item-grid.js` | Folder cards and recipe cards; shared `wire()` for click/select/drag. |
| `item-list.js` | Table view with sortable columns (folders stay on top). Columns drop out on narrow widths. |
| `details-panel.js` | ⓘ panel: numbers, owner, who has access, recent activity, location. |
| `share-dialog.js` | Add people (Can view / Can edit), change or remove access (with undo), the org-wide switch. |
| `move-dialog.js` | Move to… folder tree, also makes a new folder in place. Used for one item or a selection. |

## store.js functions, and who calls them
| Function | Used by |
|---|---|
| `me()` | toolbar, breadcrumbs, item-grid, item-list, details-panel, share-dialog, app |
| `listItems({folderId, view, query})` | app (every render), move-dialog (folder tree) |
| `getItem(id)` | app, new-menu, details-panel, share-dialog, move-dialog, builder.html |
| `path(id)` *(helper)* | breadcrumbs, details-panel, share-dialog |
| `createRecipe` / `createFolder` | new-menu; move-dialog (New folder here) |
| `rename` | app (menu, F2) |
| `move` | app.moveIds (drag & drop, Move to… dialog, Undo) |
| `star` | app (card star, menu) |
| `archive` / `restore` | app (menu, Delete key, selection bar, Undo toast) |
| `duplicate` | app (menu) |
| `listShares(id)` | details-panel, share-dialog |
| `share` / `unshare` | share-dialog |
| `setOrgView` *(helper)* | share-dialog |
| `listPeople()` | share-dialog |
| `activity(id)` | details-panel |
| `openInBuilder(id)` *(helper)* | app.open (double-click, Enter, Open, details panel button) |

Helpers added beyond the brief's list (flag these when rebuilding):
- `store.path(id)`: breadcrumb trail.
- `store.setOrgView(id, on)`: the "Everyone at Northwest Frozen can view" switch.
- `store.pref(key, value)`: per-browser UI prefs (theme, grid/list). It would become a user setting.
- `store.reset()`: Reset demo data.
- `store.openInBuilder(id)`: connects to the v3 Recipe Builder (see below).

Objects from `listItems`/`getItem` carry extra computed fields: `myRole` (`owner|edit|view`), `starred`, `owner`, `updatedByPerson`, `childCount` (folders).

## Recipe Builder connection (v3)
Opening a recipe goes to the v3 builder at `https://mahindra-nwf.github.io/nutrilabel-recipe-layout-v3/`. The v3 repo was **not** changed.
- Both sites are on the same GitHub Pages origin, so they share localStorage. v3 stores its recipes as tabs in `nlv3_cards_book` (`{ active, tabs: [{ id, state, title? }] }`) and always opens the active tab.
- `store.openInBuilder(id)` finds the recipe's tab (saved as `builderTabId` on the recipe, or a v3 tab with the same name), or creates one. It then makes that tab active and returns v3's URL.
- New tabs: recipes made in the Workspace start as a blank v3 assembly; the made-up seeded recipes start from v3's own sample (loaded from v3's `shared/data.js`), renamed.
- The Workspace name wins: each open renames the v3 tab to match the recipe.
- One-way only: card numbers (kcal, cost, weight) are still the seed values and don't update from v3 yet.
- v3 has no "back to Workspace" button; the browser Back button returns.
- **Fragile on purpose:** this depends on v3's storage format. If v3 changes `nlv3_cards_book` or its state shape, this breaks. In the real app, "open recipe" should be a route with the recipe id.
- When v3 isn't reachable (opened from disk, local server without v3), Open falls back to `builder.html`.
- Local test of the connection: serve a folder that contains both repos side by side (same names as on Pages).

## Faked or hard-coded
- Signed-in user is always **u1 "Jordan Lee"** (`ME` in store.js). No login.
- All people, recipes, numbers and emails are made up (`@example.com`).
- Access rules live in `roleOf()` in store.js: owner, direct share, share inherited from a parent folder, or org-wide view. The real backend must enforce these. The prototype only hides and disables things.
- Folders have a `status` (to archive them) and an `orgView` flag; neither is in the brief's data shape.
- Seed timestamps are relative to the first page load. Folders have no seeded activity, so their panel says "Nothing yet" until you act on them.
- "Activity" entries are written by store.js itself on each change. A real backend would write them server-side.
- Sharing doesn't notify anyone. A real version would email or notify the person added.
- The share list shows direct shares only; access inherited from a folder is a one-line note, not a list of names.
- Selection bar replaces the breadcrumbs while something is selected (uses CSS `:has()`).
- White text on avatars is the only color literal outside the tokens (same exception as base.css `.btn.primary`).
