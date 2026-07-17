# Orbit — Work Split

You said you're both roughly similar in coding experience, so this splits
the work **vertically by layer** (backend/data vs. frontend/UX) rather than
having one person "lead" — that's the split with the fewest merge conflicts
for two people of similar skill, because you're almost always editing
different files. It also roughly maps onto the roles in your pitch deck
(Dayan → architecture/infra, Raghav → product/compliance) if you want to
keep that assignment; swap it however makes sense for you two.

The one rule that matters: **`src/lib/types.ts` and `prisma/schema.prisma`
are the shared contract.** Whoever changes either one pings the other person
before pushing, because both tracks depend on them.

## Track A — Backend, data, agent logic

**Owns:** `prisma/schema.prisma`, `src/lib/db.ts`, `src/lib/agents/*`,
`src/lib/mockData.ts`, `src/app/api/**`

**Sprint 1 (get comfortable, extend what's there):**
1. Run `npm run prisma:migrate` and `npm run seed`, confirm the SQLite DB
   has Sarah's data in it (`npx prisma studio` opens a GUI to check).
2. Read `src/lib/agents/pulse.ts`, `yieldAgent.ts`, `shield.ts` — they're
   deliberately simple rule-based functions, not real AI calls yet. Extend
   one: e.g. make Pulse also infer a "relocation" event type, or make
   Shield's usage-score threshold configurable per user.
3. Wire `src/app/api/agents/*/route.ts` to read from the real database via
   `src/lib/db.ts` instead of `mockData.ts` (this is the first real
   integration point with Track B — see below).
4. Make agent actions persist: when an agent generates a recommendation,
   write a row to the `AgentAction` table so there's a real audit trail
   (the deck promises this to regulators — worth having early).
5. Add a second scenario to `mockData.ts` (e.g. a user with *no* idle
   money, or *no* upcoming trips) and confirm the agents handle it without
   crashing — cheap way to catch bugs before real data shows up.

**Later (once sprint 1 is solid):** real bank/calendar API integration
(even a sandbox), inter-agent coordination (e.g. Yield checking with Pulse
before recommending a move, like the deck's demo shows), MAS-style
guardrail thresholds.

## Track B — Frontend, UX, product surface

**Owns:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/*`,
Tailwind config/styling, any new pages you add

**Sprint 1:**
1. Build an **approve/dismiss UI** on each agent action card — buttons that
   call a (stubbed, for now) API endpoint. This is the human-in-the-loop
   piece the deck emphasizes ("requiresApproval" is already on every
   action in the data model — just needs a UI).
2. Build the **Spend Health Report** and a **Trip Mode banner** — both are
   called out explicitly in the deck's Orbit Shield feature list and don't
   exist as UI yet.
3. Build a simple **guardrails/settings page** (e.g. "never move more than
   S$X without asking me") — UI only for now, Track A can wire it to
   actually constrain the Yield agent later.
4. Polish the dashboard layout to match the deck's dark, teal/cyan visual
   style (colors are already stubbed in `tailwind.config.ts` as
   `orbit.pulse` / `orbit.yield` / `orbit.shield`).
5. **Integration point:** switch `src/app/page.tsx` from calling
   `detectLifeEvents()` etc. directly to `fetch("/api/agents/pulse")` and
   friends. Right now the page and the API routes both compute the same
   thing independently — once Track A's routes read from the real DB,
   this switch is what makes the frontend show real (not just mock) data.

**Later:** a proper login/account page if you decide to add auth, a
subscriptions list view, onboarding flow for connecting a bank account
(even if mocked).

## Suggested rhythm

- Both: 30 min sync at the start of each week — what shipped, what's next,
  anything that touches `types.ts` or `schema.prisma`.
- Aim for small, frequent PRs (a few hundred lines, not a few thousand) —
  easier for the other person to actually read.
- Pick a demo day each week (even just to each other) — run `npm run dev`
  and click through what's new. Catches integration drift early, which
  matters most here since you're on separate layers most of the time.
