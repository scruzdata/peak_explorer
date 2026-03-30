# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking (tsc --noEmit)
```

No test framework is configured.

## Architecture

**Next.js 14 App Router** + TypeScript + Tailwind CSS + Firebase/Firestore.

A full-stack app for discovering mountain trekking and ferrata routes in Spain.

### Key Directories

- `app/` — Next.js App Router pages and API routes
- `components/` — React components organized by feature (layout, routes, blog, admin, user, providers, editor, cookies)
- `lib/` — Utilities, data helpers, GPX processing, AI enrichment, and Firebase integration
- `lib/firebase/` — Firestore CRUD operations (routes, blogs, storage, tracks, refugios)
- `types/` — TypeScript type definitions

### Data Flow

**Primary data source**: Firestore. All Firestore calls have a static fallback to `lib/data.ts` sample data if Firebase fails.

- Trekking routes: `lib/firebase/routes.ts` → `getTrekkingRoutesAsync()`, `getFerratasAsync()`, `getRouteBySlugAsync(slug, type)`
- Blog posts: `lib/firebase/blogs.ts` → `getAllBlogsFromFirestore()`, `getBlogBySlugFromFirestore(slug, published)`
- Refugios: `lib/firebase/refugios.ts`

Firebase is **lazily initialized** — `lib/firebase/config.ts` defers initialization to avoid loading Firebase on the landing page.

### Authentication

NextAuth v4 with Google OAuth. Only one superadmin is allowed, validated by email (`NEXT_PUBLIC_SUPERADMIN_EMAIL` env var). `middleware.ts` protects all `/admin/*` routes using JWT session strategy.

### State Management

Global state via React Context providers (in `app/layout.tsx`):
- `AuthProvider` — user auth state
- `UserProgressProvider` — bookmarks, completed routes, badges, stats
- `CookieConsentProvider` — cookie consent

No Redux or Zustand — just React Context.

### Rich Text / Blog

Blog content is stored as **Tiptap JSON** (`contentJson` field). `BlogEditor.tsx` is the Tiptap editor; `BlogRenderer.tsx` renders Tiptap JSON server-side.

### Maps & GPX

Two map libraries are used: **Leaflet** (via react-leaflet) for general maps, **Mapbox GL** (via react-map-gl) for high-performance rendering. GPX files are parsed with `lib/gpxParser.ts` and processed (elevation analysis, waypoint extraction) in `lib/gpxProcessor.ts`. Heavy map components are always dynamically imported.

### Performance Patterns

- Heavy components (maps, editors, admin panel) use `next/dynamic` with `ssr: false` or lazy imports
- Images use LQIP + srcset via `lib/imageOptimizer.ts` + Firebase Storage
- Server Components fetch data at request time; client components receive data as props

### Path Alias

`@/*` maps to the project root (e.g., `import { Route } from '@/types'`).

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox map tiles
- `NEXT_PUBLIC_FIREBASE_*` — Firebase project config
- `GEMINI_API_KEY` + `AI_MODEL` + `AI_MODEL` — Gemini AI for blog generation
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth
- `NEXT_PUBLIC_SUPERADMIN_EMAIL` — Single admin user
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_GA_ID` — Google Analytics

## Docker

Multi-stage Docker build targeting Alpine Linux with Next.js `output: standalone`. Use `docker-compose.yml` for local development with volume mounting.
