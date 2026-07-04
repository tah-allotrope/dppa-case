# DPPA Group Workshop — Facilitator Guide

**Audience:** ~10–25 practitioners, tables of 3–5 · **Duration:** ~90 minutes · **Language:** English (learner artifacts are also in vi / zh-cn).
**Learner pages:** `lessons/0010-group-workshop.html` (run sheet) + `lessons/0011-worksheets.html` (compute grids).
**Live tool:** https://dppa-case.web.app — Workshop 1 / 2 / 3 presets match these answers penny-for-penny.
**Numbers source of truth:** `research/2026-06-29_dppa-scenario-numbers-spec.md`. Do not improvise figures — read them from there.
**Companion:** the conference panel uses `facilitator/dppa-panel-guide.md` (the 22 CEBA panel questions, ranked and routed to a Developer / Genco / Buyer / Bank bench). It assumes this workshop's literacy and does not re-teach mechanics.

> Keep this guide for facilitators only. The answer keys below are **not** on the learner pages — that is deliberate; participants compute first, then self-check in the app.

---

## Before the room

- [ ] Each table has: the printed worksheets (`0011`, print to PDF — one scenario per page), a calculator/phone, and one device that can open the app for self-check.
- [ ] Project the workshop guide (`0010`) or have tables open it themselves. The animated charts (`cfd-s1/s2/s3-*.gif`) play in the page.
- [ ] You (facilitator) have the app open and projected for the negotiation step, with the **strike-price slider** visible.
- [ ] Decide the role split per table: roughly half **off-taker (factory)**, half **developer (RE GENCO)**. Same role all three rounds.

## The three constants (write on the board)
`k × K_pp = 1.026 × 1.008 = 1.034208` · service `360` · clearing `163.30` (fees total `523.30`) · retail `2,204` VND/kWh.
Five-line spine: **1** market `Q_khc × FMP × k × K_pp` · **2** service `Q_khc × 360` · **3** clearing `Q_khc × 163.30` · **4** retail `(Q_KH − Q_khc) × 2,204` · **5** CfD `(strike − FMP) × Q_c`. `C_EVN` = lines 1–4; `C_KH` = `C_EVN + CfD`.
Sign rule: **CfD positive → factory pays developer; negative → developer pays factory.**

---

## Run of show (~90 min)

| Time | Segment | Facilitator action |
|---|---|---|
| 0:00–0:10 | **Frame & roles** | Recap the five-line spine and the CfD sign on the board. Assign off-taker vs developer. State the one rule: compute by hand first, app only to check. |
| 0:10–0:28 | **Round 1 — Matched** | Tables work Worksheet S1. Circulate. At ~0:25 reveal Key S1; have tables self-check in Workshop 1. |
| 0:28–0:46 | **Round 2 — Shortfall** | Worksheet S2. Watch for the two new things: line 4 returns, CfD flips. Reveal Key S2; self-check Workshop 2. |
| 0:46–1:04 | **Round 3 — Excess** | Worksheet S3. Push on the excess block — who loses the 225M? Reveal Key S3; self-check Workshop 3. |
| 1:04–1:18 | **Negotiation** | Pair tables (a factory table vs a developer table). Each proposes a strike. Drive the app slider on the projector; show the CfD crossing zero and the BAU crossover. |
| 1:18–1:30 | **Debrief** | Run the debrief prompts. Land the three lessons. |

Timing flex: if a round runs long, cut the round-2 plant-revenue side first; protect the negotiation and debrief.

---

## Facilitator script — talking points

**Frame (0:00–0:10).** "A DPPA bill is two bills in one: the EVN five-line bill, and a contract-for-difference with the developer. Everything today is those five lines plus the CfD. Your table is split: the factory wants the lowest all-in cost; the developer wants a bankable price. You will compute both sides, then argue over the one number that sets them against each other — the strike."

**Round 1 — Matched.** "Consumption equals matched volume, so there is no shortfall — line 4 is zero. FMP (1,150) is just below the strike (1,250), so the CfD is a small positive: the factory tops the developer up to the strike. Notice the fixed fees (523.3/kWh) are there no matter what the strike is."

**Round 2 — Shortfall.** "Two things change. The factory consumes more than it contracted, so 1,000,000 kWh falls back to retail at 2,204 — line 4 is back. And FMP (1,600) is now above the strike (1,500), so the CfD is negative — the developer pays the factory. That negative CfD is the hedge working: when the market is expensive, the contract protects the buyer."

**Round 3 — Excess.** "The solar is overbuilt — generation exceeds consumption. The factory's bill looks just like Round 1 (line 4 = 0, positive CfD), because the bill only settles consumed volume. The catch is the 1,500,000 kWh of excess: it earns the generator spot only, no CfD. Ask the room: if you over-contracted for that volume, what did you actually buy? Size the contract to consumption."

**Negotiation.** "Take Round 1's volumes. Off-takers, open low; developers, open high. Compute the CfD by hand for your proposal, then I'll put it in the app. Watch C_KH move, watch the CfD flip sign as the strike crosses FMP (1,150), and watch the multi-year panel — where does the buyer first beat BAU?" Drag the slider slowly through 1,150 so the sign flip is visible.

### Common misconceptions to pre-empt
- **C_EVN vs C_KH.** C_EVN is the EVN bill (lines 1–4). C_KH adds the CfD. In S1 the CfD *adds* (9.06B > 8.56B); in S2 it *subtracts* (18.83B < 19.63B).
- **"Negative CfD is bad."** No — a negative CfD means the developer pays the factory; it lowers the bill. The sign just follows FMP vs strike.
- **"The shortfall earns CfD."** No — only matched/contracted volume settles CfD. The shortfall is plain retail (line 4).
- **"Excess helps the buyer."** No one benefits from excess: it earns spot only. It is wasted contract capacity.
- **Loss factor double-counting.** Line 1 uses `k × K_pp` (price + loss); the plant's spot revenue uses `K_pp` only on the generator-meter volume. Don't apply `k` to plant revenue.

---

## Answer keys (read from the numbers spec)

### Key S1 — Matched (Q_c = Q_KH = 5,000,000 · FMP 1,150 · strike 1,250)
| # | Line | VND/month |
|---|---|---:|
| 1 | Market energy | 5,946,696,000 |
| 2 | Service fee | 1,800,000,000 |
| 3 | Clearing fee | 816,500,000 |
| 4 | Additional retail | 0 |
| | **C_EVN** | **8,563,196,000** |
| 5 | CfD | **+500,000,000** |
| | **C_KH** | **9,063,196,000** |
- Effective ≈ **1,813 VND/kWh**. CfD **positive → factory tops up developer**. Plant revenue = 5,796,000,000 + 500,000,000 = **6,296,000,000**.

### Key S2 — Shortfall (Q_c 8,000,000 · Q_KH 9,000,000 · FMP 1,600 · strike 1,500)
| # | Line | VND/month |
|---|---|---:|
| 1 | Market energy | 13,237,862,400 |
| 2 | Service fee | 2,880,000,000 |
| 3 | Clearing fee | 1,306,400,000 |
| 4 | Additional retail | 2,204,000,000 |
| | **C_EVN** | **19,628,262,400** |
| 5 | CfD | **−800,000,000** |
| | **C_KH** | **18,828,262,400** |
- Effective ≈ **2,092 VND/kWh** (÷ 9,000,000). CfD **negative → developer pays factory**. Plant revenue = 12,902,400,000 − 800,000,000 = **12,102,400,000**.

### Key S3 — Excess (Q_KH 5,000,000 · gen 6,500,000 · FMP 1,100 · strike 1,250)
| # | Line | VND/month |
|---|---|---:|
| 1 | Market energy | 5,688,144,000 |
| 2 | Service fee | 1,800,000,000 |
| 3 | Clearing fee | 816,500,000 |
| 4 | Additional retail | 0 |
| | **C_EVN** | **8,304,644,000** |
| 5 | CfD | **+750,000,000** |
| | **C_KH** | **9,054,644,000** |
- Effective ≈ **1,811 VND/kWh**. CfD **positive → factory tops up developer**. Plant revenue (settled 5M) = 5,544,000,000 + 750,000,000 = **6,294,000,000**.
- **Excess block:** excess = 1,500,000 kWh; spot value `1,500,000 × 1.008 × 1,100` = **1,663,200,000**; foregone CfD `(1,250 − 1,100) × 1,500,000` = **225,000,000**.

### Key N — Negotiation (starting from S1: 5,000,000 kWh, FMP 1,150)
- CfD at any strike = `(strike − 1,150) × 5,000,000`. Examples: strike 1,150 → CfD 0; strike 1,250 → +500M (factory pays); strike 1,050 → −500M (developer pays).
- CfD crosses zero at **strike = 1,150** (= FMP).
- C_KH at a given strike = `8,563,196,000 + (strike − 1,150) × 5,000,000` (C_EVN is fixed; only the CfD moves).
- There is no single "right" answer — accept any defensible strike. The teaching point is the **trade-off**: lower strike helps the buyer but fails the lender's DSCR; higher strike is bankable but may leave the buyer above BAU. In the deck's full case study, **0 of 56 scenarios** passed all three gates at once — surface that tension.

---

## Debrief prompts (~12 min)

1. What strikes did each table land on? How wide is the spread, and why?
2. Across S1/S2/S3, which line surprised you most — the retail shortfall, or the excess that earns nothing?
3. In which scenario did the CfD *protect* the factory, and in which did the factory *pay in*? (S2 protects; S1/S3 the factory tops up.)
4. Whose gate was hardest — buyer (≤ BAU), seller (IRR ≥ 12–15%), or lender (DSCR ≥ 1.20×)? (The lender usually.)
5. One sentence each table takes back to their CFO.

### The three lessons to land
- **Matched:** the strike must be bankable, and the fixed fees (523.3) apply to every matched kWh regardless of strike.
- **Shortfall:** anything you under-contract falls back to retail; the CfD is a two-way hedge.
- **Excess:** anything you over-contract earns nothing — size the contract to consumption.

---

## Modules 1–6 Teaching Session (~60 min, October 2026)

**Deck:** `ceba/DPPA Presentation Oct 2026 To Teach.pptx` (27 slides). **Handouts:** `lessons/0012-reference-card/reference-card.html` (A4, print duplex) + `lessons/0012-reference-card/m5-worksheet.html`. **Live tool:** https://dppa-case.web.app — presenter step-through at `?teach=1` (arrow keys or on-screen prev/next; six demos, one per module). **Local fallback if venue wifi is unreliable:** run `npm run preview` inside `app/` and use that URL instead of the hosted one. **Numbers source of truth:** `assets/teaching/spine-s1.json`, generated by `app/scripts/export-spine.mjs` — do not hand-type figures.

This is a *different, shorter session* than the 90-min group workshop above: it is the lecture-style Modules 1–6 walk-through that failed in July 2026 (audience lost at the Module 2 symbol overload) and has been rebuilt visual-first per `research/2026-07-04_dppa-modules-teaching-revamp-brainstorm.md` and `plans/2026-07-04-dppa-modules-teaching-revamp-plan.md`. Success criterion: by the end of Module 5, participants can hand-compute the S1 settlement unaided.

**Spine:** Song Hong Garment Co., Scenario 1 (matched) throughout — same factory, same month, from the cold open to the close.

### Before the room
- [ ] Printed A4 reference cards, one per seat (duplex: side A bill Sankey, side B decoder + rate matrix + gates).
- [ ] Printed M5 worksheets, one per seat, answer key **not** distributed until after the 10-min exercise.
- [ ] App open in a second tab at `?teach=1`, or `npm run preview` running locally as fallback.
- [ ] Confirm the six hidden fallback slides in the deck (after each module divider) — unhide + play only if the live app fails mid-session.

### Run of show

| Time | Module | Facilitator action | Checkpoint question (divider slide) |
|---|---|---|---|
| 0:00–0:02 | Cold open | Show the two-bar bill-shock visual. Do not explain the gap. Hook: "you will compute this yourself." | — |
| 0:02–0:10 | M1 — Baseline | TOU strip slide. Teach mode step 1 (load profile). State: "every DPPA offer is judged against this BAU bill." | If load rises in the evening peak, does your bill rise faster or slower than at noon? |
| 0:10–0:18 | M2 — The Bill | Funnel slide, then Sankey build (play `m2-sankey-build-en.gif`). Teach mode step 2: verify the five-line-bill panel matches (C_EVN 8,563 / CfD 500 / C_KH 9,063 tr VND). | Which of the five lines disappears when consumption exactly equals matched volume? |
| 0:18–0:26 | M3 — The Lock | Seesaw slide, then play `assets/cfd-s1-en.gif`. Teach mode step 3: drag the market-price slider through the strike live, watch the CfD sign flip. | If the market price jumps above the strike mid-afternoon, who pays whom? |
| 0:26–0:34 | M4 — Three Doors | Three-doors slide, no ratio math. Teach mode step 4: multi-year panel, point at the crossover year as the buyer-door check. | Which of the three doors is hardest to pass when the strike is set too high? |
| 0:34–0:36 | M5 setup | Heatmap slide shown but NOT explained yet — that is the reveal after the exercise. | — |
| 0:36–0:46 | M5 — Hand-compute | Distribute worksheets. Participants compute all five lines (volumes pre-filled) and total, compare to the BAU bar. Circulate. Teach mode step 5 to self-check. | — |
| 0:46–0:48 | M5 reveal | "Now scale your month × 12 × 20 strikes" — reveal 0-of-56 heatmap as the punchline. | In the 56-scenario sweep, how many pass all three gates at once? |
| 0:48–0:56 | M6 — Decide | Decoder slide (only slide with Decree-57 notation — frame as translation, not new content), then the five-levers slide. Teach mode step 6: lower the strike live, show the CfD move. | Name one lever that would have flipped this month's CfD sign. |
| 0:56–0:60 | Close | Callback to the cold-open bar pair. Five-levers checklist. Invite to the 90-min scenario workshop above. | — |

Timing flex: if running long, compress M4 (drop the multi-year app moment, state the crossover year verbally) before touching the M5 exercise — the hand-compute is the session's success criterion and should not be cut.

### Contingency
- App fails at any teach-mode step → unhide the matching fallback slide (right after that module's divider) and play the recorded GIF/MP4. M3's fallback is `assets/cfd-s1-en.gif` (already recorded); M1/M2/M4/M5/M6 fallbacks are placeholders pending PHASE-02 TASK-02-05 screen-capture recordings of the live `?teach=1` steps — record these before October.
- Wifi fails entirely → switch to the local `vite preview` build; the URL bar changes but the demo steps are identical.

### Pre-session validation (do this before October, not during)
- [ ] One full timed solo dry-run against this run-of-show, including a deliberate fallback drill (kill the app mid-M3, unhide slide 11, confirm the recorded GIF carries the point).
- [ ] One fresh-viewer test: a colleague who did not attend July sits the full 60 minutes and attempts the M5 worksheet unaided. Pass = they complete all five lines and the total within 10 minutes without symbol re-explanation. This is the direct test of the session's success criterion — do not skip it.
