# Fox Hollow League — Build Summary

## What Was Built

A full-stack Next.js 16 web app for managing the Fox Hollow Men's Golf League weekly scheduling. Players receive unique links to submit their preferences (who they want to play with, time slots, etc.), and the league manager has a dashboard to track submissions, manage the roster, and generate links.

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Backend:** Convex (real-time database + serverless functions)
- **Auth:** Clerk (manager-only authentication)
- **UI:** shadcn/ui + Tailwind CSS 4
- **Fonts:** DM Serif Display (headings) + DM Sans (body)
- **Design:** Dark green / cream / brass golf-club aesthetic

---

## File List

### Convex Backend (`convex/`)
| File | Purpose |
|------|---------|
| `schema.ts` | Database schema: players, weeks, requests, tokens, preferences |
| `players.ts` | CRUD for player roster |
| `weeks.ts` | Create/manage weekly rounds |
| `requests.ts` | Player submissions (upsert, query by week, stats) |
| `tokens.ts` | Unique player tokens (generate per-week links) |
| `preferences.ts` | Persistent player preferences (carried between weeks) |

### App Pages (`src/app/`)
| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout (fonts, Clerk, Convex providers) |
| `page.tsx` | Landing page (hero with links to manager/sign-in) |
| `globals.css` | Design system (green/cream/brass CSS variables) |
| `sign-in/[[...sign-in]]/page.tsx` | Clerk sign-in page |
| `request/[token]/page.tsx` | Player request form (no auth required, token-based) |
| `manager/layout.tsx` | Manager layout (sidebar nav, Clerk auth) |
| `manager/page.tsx` | Overview dashboard (week status, submission stats) |
| `manager/requests/page.tsx` | View all player submissions with filter tabs |
| `manager/roster/page.tsx` | Player roster table with add/toggle active |
| `manager/links/page.tsx` | Generate & copy unique player submission links |

### Components (`src/components/`)
| File | Purpose |
|------|---------|
| `convex-provider.tsx` | Convex React client provider |
| `RequestForm.tsx` | Full player request form (playing Y/N, partners, times, notes) |
| `PlayerCombobox.tsx` | Searchable player selector with chip badges |
| `ConfirmationScreen.tsx` | Post-submission success screen |
| `DeadlinePassed.tsx` | "Submissions closed" screen |
| `manager/WeekOverview.tsx` | Week stats card with deadline countdown |
| `manager/CreateWeekDialog.tsx` | Dialog to create a new week |
| `manager/AddPlayerDialog.tsx` | Dialog to add a player |
| `manager/RequestCard.tsx` | Card showing one player's submission |

### UI Primitives (`src/components/ui/`)
All shadcn/ui components: badge, button, card, command, dialog, input, input-group, label, select, separator, table, textarea, toggle, tooltip.

---

## Setup Guide

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### 1. Clone & Install
```bash
cd fox-hollow-league
pnpm install
```

### 2. Set Up Convex
1. Create a free account at [convex.dev](https://convex.dev)
2. Run the Convex dev server:
   ```bash
   npx convex dev
   ```
3. This will create a project and give you a deployment URL
4. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
5. Set `NEXT_PUBLIC_CONVEX_URL` to your Convex deployment URL

### 3. Set Up Clerk
1. Create a free account at [clerk.com](https://clerk.com)
2. Create a new application
3. Add the following to `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   ```

### 4. Run Development Server
```bash
# Terminal 1: Convex dev server
npx convex dev

# Terminal 2: Next.js dev server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 5. Add Initial Players
**Option A: Via Convex Dashboard**
1. Go to your Convex dashboard → Data tab
2. Add rows to the `players` table:
   - `name`: "John Smith"
   - `active`: true
   - `handicapIndex`: 12.4 (optional)
   - `phone`: "(801) 555-1234" (optional)
   - `email`: "john@example.com" (optional)

**Option B: Via the Manager Dashboard**
1. Sign in at `/sign-in`
2. Go to `/manager/roster`
3. Click "Add Player" and fill in details

---

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/fox-hollow-league.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Import your repo at [vercel.com/new](https://vercel.com/new)
2. Set environment variables:
   - `NEXT_PUBLIC_CONVEX_URL` → your production Convex URL
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → your Clerk key
   - `CLERK_SECRET_KEY` → your Clerk secret
3. Deploy!

### 3. Deploy Convex to Production
```bash
npx convex deploy
```

---

## How It Works

### Player Flow
1. Manager creates a week (play date + deadline)
2. Manager generates unique links for all active players
3. Links are sent to players (text, email, etc.)
4. Players open their link → see the request form (no login needed)
5. Players submit: playing Y/N, who to pair with, time prefs, notes
6. Preferences are saved for auto-fill next week

### Manager Flow
1. Sign in → Overview dashboard shows week status
2. Real-time view of who has/hasn't submitted
3. Open/close submissions
4. View detailed request cards
5. Manage player roster

---

## Phase 2: AI Pairing Engine (Next Steps)

The app is designed for an AI pairing engine to be added:

1. **Data is structured for optimization** — `weeklyRequests` contain `wantsWith`, `avoid`, and time constraints
2. **Add a `convex/pairings.ts` module** — Store generated foursomes
3. **Claude integration** — Use Anthropic API (already in package.json) to:
   - Analyze all player requests for a week
   - Generate optimal foursomes respecting constraints
   - Handle edge cases (odd numbers, strong avoid preferences)
4. **Add `/manager/pairings` page** — Review AI-generated pairings, make manual tweaks, publish
5. **Golf Genius integration** — Push finalized pairings to Golf Genius via their API
