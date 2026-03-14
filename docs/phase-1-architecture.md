# MyHalftimeQuiz.com Phase 1 Architecture

## Existing Scaffold

This architecture extends the current scaffold instead of replacing it:

- Public routes already present:
  - `/`
  - `/login`
  - `/choose`
  - `/sports`
  - `/sports/soccer`
  - `/quiz/[quizId]`
- Admin routes already present:
  - `/admin`
  - `/admin/login`
  - `/admin/games`
  - `/admin/quizzes`
  - `/admin/quizzes/[quizId]`
  - `/admin/results`
  - `/admin/leaderboards`
  - `/admin/users`
  - `/admin/settings`
- Existing brand assets already present:
  - `/public/HQ25_logo.png`
  - `/public/sports-login-bg.png`
  - `/public/splash.mp4`
  - `/public/icons/*`

The path forward is to keep those entry points alive while migrating their internals onto a sports-first typed architecture.

## Proposed Folder Structure

```text
app/
  page.js                              # existing splash entry, later migrated to typed shell
  login/page.js                        # existing login route, later moved onto shared auth services
  choose/page.js                       # existing choose flow, refactored to event selection service
  sports/page.js                       # existing sport chooser
  sports/[sportSlug]/page.tsx          # recommended next step after current /sports/soccer
  quiz/[quizId]/page.tsx               # compatibility route; later event-aware quiz play entry
  results/[eventId]/page.tsx           # recommended canonical event results route
  leaderboard/[eventId]/page.tsx       # recommended canonical public leaderboard route
  admin/
    layout.tsx
    page.tsx
    login/page.tsx
    sports/page.tsx
    leagues/page.tsx
    teams/page.tsx
    stadiums/page.tsx
    events/page.tsx
    questions/page.tsx
    ads/page.tsx
    results/page.tsx
    leaderboards/page.tsx
    users/page.tsx
    settings/page.tsx
    games/page.tsx                     # kept as compatibility alias to events
    quizzes/page.tsx                   # kept as compatibility alias to questions

components/
  public/                              # branded shells, event cards, quiz UI, countdown, ad player
  admin/                               # dashboard cards, collection tables, forms, status chips
  shared/                              # buttons, loaders, empty states, section headers
  branding/                            # logo/media wrappers around existing assets

hooks/
  use-auth-session.ts
  use-current-user.ts
  use-public-event.ts
  use-leaderboard-summary.ts

lib/
  firebase/
    client.ts                          # Firebase web client bootstrap
    admin.ts                           # server-only Firebase Admin bootstrap
  constants.ts                         # app constants, collections, routes, asset paths
  firestore.ts                         # typed Firestore helpers, refs, serializers
  firebaseConfig.js                    # compatibility re-export for existing scaffold

services/
  firestore.ts                         # collection-specific service modules
  server/
    leaderboard-worker.ts              # cloud-function or server-route-ready aggregation logic

types/
  domain.ts                            # shared entities and unions

utils/
  event-timing.ts                      # kickoff, halftime, countdown, status logic
  event-questions.ts                   # frozen event question snapshot generation
  leaderboards.ts                      # tie-break sort and cached summary builders

docs/
  phase-1-architecture.md

firestore.rules
```

## Shared Domain Model

Collections:

- `users`
- `sports`
- `leagues`
- `teams`
- `stadiums`
- `events`
- `questions`
- `quizResults`
- `leaderboards`
- `ads`
- `adminSettings`
- `events/{eventId}/eventQuestions`

Core relationships:

- `league` belongs to one `sport`
- `team` belongs to one `league` and one `sport`
- `event` references one `sport`, one `league`, one `stadium`, one home team, and one away team
- `question` belongs primarily to a team pool, with schema support for league and sport pools
- `eventQuestions` are frozen copies created from team pools before public traffic arrives
- `quizResults` are append-only completion documents
- `leaderboards/{eventId}` is a server-controlled cached summary

## Firestore Service Architecture

Page components should not own raw query logic. Service modules are responsible for:

- document lookup and list queries
- public vs admin read patterns
- normalization of Firestore timestamps into `Date`
- collection path safety
- write helpers for create/update flows
- event question snapshot reads
- quiz result submission
- leaderboard summary fetches

Recommended usage pattern:

- public pages call only `eventsService`, `leaderboardsService`, `quizResultsService`, `adsService`
- admin pages call collection-specific services plus reusable create/update helpers
- any leaderboard rebuild or event snapshot generation runs in a trusted environment, not directly from the public client

## Routing Plan

### Public

- `/`
  - splash / brand intro using `/public/splash.mp4`
- `/login`
  - login / signup / reset / Google sign-in using `/public/sports-login-bg.png`
- `/choose`
  - nearby event or manual event selection
- `/sports`
  - sport chooser using `/public/icons/*`
- `/sports/[sportSlug]`
  - sport-specific event list
- `/quiz/[quizId]`
  - compatibility route that maps older quiz-centric flow into event-driven play
- `/results/[eventId]`
  - player result summary plus CTA to cached leaderboard
- `/leaderboard/[eventId]`
  - cached leaderboard summary only

### Admin

- `/admin`
  - dashboard with counts and status cards
- `/admin/sports`
  - sport CRUD and defaults
- `/admin/leagues`
  - league CRUD and sport linking
- `/admin/teams`
  - team CRUD, logos, question pool management entry
- `/admin/stadiums`
  - stadium CRUD and geodata
- `/admin/events`
  - event CRUD, ad assignment, snapshot generation
- `/admin/questions`
  - bulk question management and filtering
- `/admin/ads`
  - upload metadata, assignment, and preview
- `/admin/results`
  - raw result inspection and export shape
- `/admin/leaderboards`
  - cached summary inspection and rebuild actions
- `/admin/users`
  - user lookup, roles, paid state
- `/admin/settings`
  - admin config and operational flags

Compatibility mapping:

- `/admin/games` should evolve into an alias/redirect for `/admin/events`
- `/admin/quizzes` should evolve into an alias/redirect for `/admin/questions`

## Admin Panel Page Map

- Dashboard
  - cards: active events, upcoming events, recent completions, leaderboard freshness
  - components: stat cards, recent activity table, quick actions panel
- Sports
  - fields: name, slug, default quiz offset, default question count, active flag
  - components: sport form, list table
- Leagues
  - fields: sport link, name, slug, logo, active flag
  - components: league form, sport filter
- Teams
  - fields: sport, league, city, nickname, branding colors, logo
  - components: team form, question pool count badge
- Stadiums
  - fields: timezone, address, geo, sportIds, leagueIds
  - components: stadium form, geo summary card
- Events
  - fields: kickoff, halftime offset, quiz window, question sources, ads, status
  - components: event form, snapshot builder, schedule summary
- Questions
  - fields: source type, source id, difficulty, category, active flag
  - components: bulk paste import, table filters, edit drawer
- Ads
  - fields: media type, storage URL, dates, assigned targets
  - components: upload form, preview tile
- Results
  - fields: event, score, time, city, ad viewed/skipped
  - components: filter bar, export table
- Leaderboards
  - fields: top entries, player count, last updated, version
  - components: summary viewer, rebuild action panel
- Users
  - fields: role, paid state, active state, last login
  - components: user table, profile detail panel

## Leaderboard Aggregation Design

### Non-Negotiable Rules

- `quizResults` receives one document per completion
- clients never read and sort the full raw results set for public ranking
- clients read only `leaderboards/{eventId}`
- clients never write to `leaderboards/{eventId}`
- the update flow is trusted and server-controlled

### Safe Write Flow

1. User completes the quiz.
2. Client writes one append-only `quizResults` document.
3. A trusted worker reacts to the new result.
4. The worker reads the existing cached leaderboard summary.
5. The worker merges the new result into a small ranked working set.
6. The worker writes back a compact `leaderboards/{eventId}` summary:
   - `topEntries`
   - `playerCount`
   - `lastUpdated`
   - `version`
7. Public leaderboard pages read only that summary document.

### Tie-Break Logic

1. Higher `score`
2. Lower `timeSeconds`
3. Earlier `completedAt`

### Scale Notes

- append-only `quizResults` avoids hot-document write contention from players
- cached summary docs stay small
- aggregation worker updates one event summary at a controlled cadence
- `eventQuestions` are precomputed before traffic, so clients do not build quizzes from raw team pools during halftime
- public reads remain lightweight:
  - event doc
  - frozen `eventQuestions`
  - assigned ad
  - cached leaderboard summary

### Trusted Execution Options

- Preferred for sustained scale: Firebase Cloud Functions triggered by `quizResults` writes
- Acceptable fallback for admin tools: server-side route or action that rebuilds `leaderboards/{eventId}` on demand

## Firestore Security Rules Draft

Policy goals:

- public users read only active/public docs
- users write only their own result docs
- users cannot update or delete result docs after creation
- users cannot write leaderboard docs
- content collections are admin-only write
- event question snapshots are admin/server generated

See `firestore.rules` for the draft implementation.

## Assumptions And Risks

- Leaderboard worker choice
  - Cloud Functions is the safer long-term choice for thousands of simultaneous halftime submissions.
  - A server action alone is weaker for event-driven aggregation and retry behavior.
- Event snapshot generation
  - Recommended to run from admin action or server worker when an event is activated.
  - Public clients should never generate the snapshot.
- Icon mapping
  - Best pattern is slug-based mapping with explicit overrides in constants.
  - This keeps `/public/icons/*` swappable without page rewrites.
- Current scaffold migration
  - Existing `/admin/games` and `/admin/quizzes` naming should be preserved short-term for continuity.
  - Internally they should move onto `events` and `questions` services.
- JS and TS coexistence
  - The current scaffold mixes `.js` and `.ts(x)`.
  - Shared foundation is added in TypeScript first, then existing pages can be migrated incrementally.

## Existing Asset Wiring Plan

- `/public/HQ25_logo.png`
  - splash fallback
  - login page branding
  - choose page header
  - admin shell masthead
- `/public/sports-login-bg.png`
  - login background
  - choose page background
  - optional public shell image layer for mobile-first branded flows
- `/public/splash.mp4`
  - home splash / intro experience before redirect to login
- `/public/icons/*`
  - sport selection grid
  - event cards
  - admin sport/team metadata rows where the slug is mapped to icon art

These assets should be wrapped behind constants and lightweight branding components so the visual layer stays swappable without route rewrites.
