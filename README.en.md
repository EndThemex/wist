# Where is it

> A local-first, privacy-friendly inventory app for tracking where your belongings live.
> Your data stays in your browser — no cloud, no uploads.

🌐 English · **[简体中文](README.md)**

## ✨ Features

- 📦 **Item management** — name, model, location, tags, price, quantity, notes, photos
- 🗂 **Groups / Categories / Tags** — three flexible dimensions to organize your stuff
- 🔍 **Search + multi-select filters** — full-text search locally, millisecond response
- 📊 **Stats page** — see your inventory structure at a glance
- 🌗 **Light / Dark theme** — follow system or switch manually
- 📱 **Responsive layout** — desktop sidebar + mobile bottom bar (secondary entries fold into a "More" menu)
- 🔒 **Local-first** — all data lives in browser IndexedDB, **zero network requests**
- 💾 **No accounts / No backend / No tracking** — open to use, close to leave

## 📸 Screenshots

When you first open the app with no items yet, an onboarding home page introduces the product and its key capabilities:

![Home](docs/imgs/home.png)

> More screenshots (items list / detail / stats, etc.) will be added to `docs/imgs/`.

## 🚀 Quick Start

Requires Node.js ≥ 18.

```bash
# Install dependencies
pnpm install          # or npm install / yarn install

# Start dev server
pnpm dev              # default http://localhost:5173

# Production build
pnpm build

# Preview the production bundle locally
pnpm preview
```

## 🧱 Tech Stack

| Category    | Choice                                      |
| ----------- | ------------------------------------------- |
| Framework   | React 18 + React Router 6                   |
| Build       | Vite 5 + `@vitejs/plugin-react-swc`         |
| State       | Zustand                                     |
| Persistence | IndexedDB (wrapped in `src/lib/db.js`)      |
| Icons       | lucide-react                                |
| Styling     | Plain CSS + CSS variables (no UI framework) |

## 📁 Project Structure

```
src/
├── components/      # Shared UI (AppShell, MultiSelect, Thumb, Empty…)
├── pages/           # Route-level pages (items list / detail / edit / manage…)
├── store/           # Zustand stores (catalog / prefs / theme)
├── lib/             # Utilities and persistence (db, image, url, prefs…)
├── hooks/           # Custom hooks
├── styles/          # Global styles and design tokens
├── App.jsx          # Route table + Suspense
└── main.jsx         # Entry
```

## 🗃 Data Storage

All data is written to browser IndexedDB (DB name in `src/lib/db.js`). Key object stores:

- `items` — item master data
- `groups` / `categories` / `tags` — groups / categories / tags
- `images` — image binaries (stored as Blob to avoid base64 bloat)

> ⚠️ Clearing browser site data will delete all of the above. Export backups as needed (export feature see Roadmap).

## 🧭 Roadmap

- [ ] Data import / export (JSON)
- [ ] PWA — installable, offline launch
- [ ] UI internationalization (i18n)
- [ ] Barcode / QR code scanning for entry
- [ ] Optional cloud sync (CRDT / WebDAV)

## 🤝 Contributing

Issues and PRs are welcome. Please keep the code style consistent with the existing project (`pnpm build` must pass before submitting).

## 📄 License

[MIT](LICENSE) © 2026 [EndThemex](https://github.com/EndThemex)
