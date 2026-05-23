# CalculaHora — agent guide

Simple time tracking backed by **Google Sheets** in the user’s Drive. The SPA runs in the browser; almost all logic is client-side. A single serverless route exchanges OAuth tokens so the client secret never ships to the browser.

## Product model

- **Workspaces** = one Google Spreadsheet per workspace, created under a `CalculaHora` folder in Drive (`drive.file` scope).
- **Data** lives in three sheets: `workspace` (metadata), `projects`, `time-tracker`. Schemas and parsing live in `src/lib/sheets/schema.ts`; read/write in `src/lib/sheets/repository.ts`.
- **Auth**: OAuth 2.0 PKCE in the browser; tokens in `localStorage`. Refresh and code exchange go through `/api/oauth/token`.
- **i18n**: Spanish + English via `react-i18next`. User-facing strings belong in `src/locales/en.json` and `src/locales/es.json` (both keys).

## Repository layout

```
api/                    # Vercel serverless (separate TS project — see below)
  lib/oauth-token.ts    # Token exchange logic (shared with dev)
  oauth/token.ts        # POST /api/oauth/token handler
server/
  oauth-token.ts        # Re-export for Vite dev plugin only
src/
  app/                  # Routes, providers, HomePage
  features/             # Page-level UI (auth, tracker, projects, reports, workspace)
  components/           # Shared UI (shadcn-style under components/ui/)
  hooks/
  lib/                  # Domain logic (google, sheets, time, export, storage)
  locales/              # en.json, es.json
  i18n/
vite.oauth-plugin.ts    # Dev middleware mirroring /api/oauth/token
```

Path alias: `@/*` → `src/*` (see `tsconfig.app.json`).

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 19, React Router 7, Tailwind v4, Radix/shadcn-style components |
| Data fetching | TanStack Query (`src/app/providers.tsx`) |
| Validation | Zod (`src/lib/sheets/schema.ts`) |
| Dates | `date-fns`, `date-fns-tz`; workspace timezone from sheet metadata |
| Export | CSV + PDF (`jspdf`, `jspdf-autotable`) in `src/lib/export.ts` |
| Build | Vite 8, TypeScript project references (`tsc -b`) |

## Routes

| Path | Purpose |
|------|---------|
| `/` | Landing (logged out) or redirect to app (logged in) |
| `/connect` | Redirects to `/` |
| `/oauth/callback` | PKCE callback |
| `/workspaces` | Pick/create workspace |
| `/w/:spreadsheetId/tracker` | Time entries |
| `/w/:spreadsheetId/projects` | Projects |
| `/w/:spreadsheetId/reports` | Filters + export |
| `/w/:spreadsheetId/settings` | Workspace name, timezone, 12/24h format |

## OAuth and secrets

- **Browser**: `VITE_GOOGLE_CLIENT_ID` only (bundled). Never add `GOOGLE_CLIENT_SECRET` with a `VITE_` prefix.
- **Server** (`api/lib/oauth-token.ts`): reads `GOOGLE_CLIENT_SECRET` and `VITE_GOOGLE_CLIENT_ID` (or `GOOGLE_CLIENT_ID`).
- **Client flow** (`src/lib/google/oauth.ts`): PKCE → POST JSON to `/api/oauth/token` → store tokens via `src/lib/storage/local-storage.ts`.
- **Local dev**: `vite.oauth-plugin.ts` serves the same endpoint; it imports `handleTokenRequest` from `server/oauth-token.ts` (re-export of `api/lib/oauth-token.ts`).
- **Google Console**: redirect URI must match `${origin}/oauth/callback` exactly (see README).

## Vercel / API TypeScript (important)

Vercel type-checks `api/**` with **NodeNext** module resolution, not the app’s `tsconfig.app.json`.

- Put shared server logic under `api/lib/`.
- Use **`.js` extensions** in relative imports inside `api/` (e.g. `from '../lib/oauth-token.js'`).
- Keep `api/tsconfig.json` with `"module": "NodeNext"`, `"types": ["node"]`.
- Do **not** include `api/**` in `tsconfig.node.json` (avoids conflicting resolution).
- `vercel.json` rewrites SPA routes but **excludes** `/api/*` from the `index.html` fallback.

Production env vars on Vercel: `VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## Commands

```bash
npm install
npm run dev          # Vite on :5173; restart after .env changes
npm run build        # tsc -b && vite build
npm run lint
npx tsc -p api/tsconfig.json   # Verify API types like Vercel
```

Node version: see `.nvmrc`. Vercel may use Node 24.

## Conventions for changes

1. **Sheets are the source of truth** — persist through `repository.ts`, not ad-hoc `fetch` to Sheets API in components.
2. **Time math** — use `src/lib/time.ts` for durations, shifting dates, ISO parsing, and `endDayOffset` for multi-day entries.
3. **Running entries** — `endTime` empty/`0` means running (`isRunningEntry` in schema).
4. **UI** — feature folders own pages; reuse `components/ui/*` and existing patterns (`EntryRow`, `EntryTimeRangeField`, `ProjectSelect`).
5. **Copy** — add keys to **both** locale files; use `useTranslation()` in components.
6. **Scope** — prefer small, focused diffs; no drive-by refactors or extra markdown unless asked.
7. **Commits** — only when the user explicitly asks.

## Sensitive areas

- **`repository.ts` `writeSheetValues`**: after updates, trailing rows must be cleared or deleted entries reappear on reload.
- **OAuth redirect URIs** and **test users** (Google “Testing” mode) break login if misconfigured — not fixable in code alone.
- **XSS** — tokens in `localStorage`; avoid introducing `dangerouslySetInnerHTML` or untrusted HTML.

## Testing changes locally

1. `.env` from `.env.example` with real Google OAuth client (Web application).
2. `npm run dev` — sign in, create/open a workspace, CRUD entries and projects.
3. For API-only work: `npx tsc -p api/tsconfig.json`; optional `vercel dev` for full serverless parity.

## Further reading

- `README.md` — setup, Google Cloud steps, deploy checklist
- `src/lib/sheets/template.ts` — initial sheet structure when bootstrapping a workspace
