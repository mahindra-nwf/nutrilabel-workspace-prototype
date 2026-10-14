# Handoff: NutriLabel Workspace prototype

Status: **step 1 done**: store, sidebar, grid view, routing, item menu, archive/undo, drag to move. Still to come: list view, details panel, share dialog, Move to… dialog, bulk Move.

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
| `toolbar.js` | Top bar: brand, search, theme toggle, avatar. |
| `sidebar.js` | ＋ New, the five views, Reset demo data. |
| `breadcrumbs.js` | My recipes › Soups › … (crumbs are drop targets). |
| `new-menu.js` | New recipe / New folder. |
| `item-menu.js` | ⋯ / right-click menu. |
| `item-grid.js` | Folder cards and recipe cards; shared `wire()` for click/select/drag. |

## store.js functions, and who calls them
| Function | Used by |
|---|---|
| `me()` | toolbar, breadcrumbs, item-grid, app |
| `listItems({folderId, view, query})` | app (every render) |
| `getItem(id)` | app, new-menu, builder.html |
| `createRecipe` / `createFolder` | new-menu |
| `rename` | app (menu, F2) |
| `move` | app (drag & drop) |
| `star` | app (card star, menu) |
| `archive` / `restore` | app (menu, Delete key, selection bar, Undo toast) |
| `duplicate` | app (menu) |
| `listShares`, `share`, `unshare`, `listPeople`, `activity` | built, not wired yet (share dialog / details panel next) |

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
- Seed timestamps are relative to the first page load.
- White text on avatars is the only color literal outside the tokens (same exception as base.css `.btn.primary`).
