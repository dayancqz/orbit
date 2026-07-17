# Orbit — Getting Started

This is the setup guide for you and your friend to go from "empty repo" to
"both of us can code independently without stepping on each other." Follow
it once together (ideally on a call/in person), then you can split up.

## 0. What you're building (in one paragraph)

Orbit is a dashboard that simulates three AI "agents" — **Pulse** (spots
upcoming trips/life events from your calendar), **Yield** (spots idle cash
and suggests moving it somewhere better), and **Shield** (flags forgotten
subscriptions and watches spending while you travel) — all reading from one
shared data model called the **Customer Life Graph**. The attached
`orbit-starter/` folder is a working skeleton of exactly this, reproducing
the "Sarah's Korea Trip" demo from your pitch deck.

## 1. Tech stack (and why)

- **Next.js 14 (App Router) + TypeScript** — one framework does both the
  frontend (React pages) and the backend (API routes), which matters a lot
  for two people: neither of you needs to run two separate servers or learn
  two languages to touch the whole app.
- **Tailwind CSS** — fast styling without a separate CSS architecture
  discussion.
- **Prisma + SQLite** — a real database with a schema you can read (`prisma/schema.prisma`),
  that runs locally with zero setup (SQLite is just a file). Swappable for
  Postgres later by changing one line, with no application code changes.

You don't have to keep any of this — it's a starting point chosen so you can
both be productive in week one. If either of you has a strong reason to use
something else, swap it before you build much on top of it.

## 2. One-time setup (do this together)

1. **Merge the starter into your repo.** Copy everything from the
   `orbit-starter/` folder (and this file, and `WORK_SPLIT.md`) into the
   root of the repository you already created. Commit it:
   ```bash
   git add .
   git commit -m "Add Orbit starter scaffold"
   git push
   ```
2. **Both of you clone/pull the repo** and open it in VS Code:
   ```bash
   git clone <your-repo-url>
   cd <your-repo>
   code .
   ```
3. **Install recommended VS Code extensions** (VS Code will prompt you, or
   install manually): *ESLint*, *Prettier*, *Prisma*, *Tailwind CSS
   IntelliSense*.
4. **Install dependencies and run it:**
   ```bash
   npm install
   cp .env.example .env
   npm run dev
   ```
   Open http://localhost:3000 — you should see three agent cards and a
   timeline. If you see that, your setup works and you're both starting
   from the same known-good state.
5. **(Optional, can wait) Set up the real database:**
   ```bash
   npm run prisma:migrate
   npm run seed
   ```
   This isn't required for week one — the dashboard runs on mock data in
   `src/lib/mockData.ts` until the backend track wires the database in.

## 3. Git workflow for two people

Keep this simple — you don't need anything fancier at this size:

- `main` is always working. Never commit straight to `main`.
- Each of you works on a feature branch: `git checkout -b yourname/short-description`
  (e.g. `dayan/pulse-agent-logic`, `raghav/dashboard-layout`).
- Push your branch and open a pull request into `main` when a chunk of work
  is done and runs locally. Even with just two of you, a PR is worth it —
  it's a checkpoint where the other person glances at what changed before
  it lands.
- Pull `main` and rebase/merge it into your branch often (at least daily)
  so you don't drift apart and hit a giant conflict later.
- **The file most likely to cause conflicts is `src/lib/types.ts`** (the
  shared contract) and `prisma/schema.prisma`. Treat changes to those two
  files as "tell the other person before you push," even though your work
  is otherwise mostly independent (see `WORK_SPLIT.md`).

## 4. Where to track tasks

Use GitHub Issues or a GitHub Project board (Projects tab on your repo) —
free, lives next to the code, and lets you each see what the other is
doing without a separate tool. Create one issue per task from the first
sprint list in `WORK_SPLIT.md` and assign it.

## 5. A note on the npm registry / verifying this scaffold

This scaffold was written and syntax-checked by hand — the environment it
was built in couldn't reach the npm registry to actually run `npm install`,
so treat the very first `npm install` on your own machines as the real
first test. If something doesn't compile, it's most likely a small version
mismatch in `package.json`, not a logic error — check the error message,
it'll usually name the exact package to bump.

## 6. What's already decided vs. what's still open

**Decided (in the scaffold):** the shared data model (Customer Life Graph),
how the three agents are structured as separate modules, the demo scenario,
the folder layout.

**Still open — decide these together before diverging too far:**
- Do you build against your own bank sandbox/API at some point, or keep it
  mocked through the whole MVP phase?
- Auth: skip it for the MVP demo, or add real login early?
- Where you'll eventually deploy (Vercel is the path of least resistance
  for Next.js).
