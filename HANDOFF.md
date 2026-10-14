# Handoff: NutriLabel Workspace prototype

Status: **steps 1–2 done**. Everything in the brief is clickable: grid + list views, details panel, share dialog, Move to…, bulk Move/Archive, drag to move, undo, keyboard, light/dark.

## How it runs
Plain HTML/CSS/JS, no build. Opens from `index.html` (works from disk or GitHub Pages).
Files load as classic `<script>`s, not ES modules, so `file://` works too. Each screen file puts one object on `window.NL` with a `render(state)` function.

## Files
| File | What it is |
|---|---|
| `index.html` | Shell: top bar, sidebar, main area. Loads scripts in order. |
| `builder.html` | "Recipe Builder opens here" placeholder (`?id=`). |
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

Helpers added beyond the brief's list (flag these when rebuilding):
- `store.path(id)`: breadcrumb trail.
- `store.setOrgView(id, on)`: the "Everyone at Northwest Frozen can view" switch.
- `store.pref(key, value)`: per-browser UI prefs (theme, grid/list). It would become a user setting.
- `store.reset()`: Reset demo data.

Objects from `listItems`/`getItem` carry extra computed fields: `myRole` (`owner|edit|view`), `starred`, `owner`, `updatedByPerson`, `childCount` (folders).

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
