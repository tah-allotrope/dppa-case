---
title: "DPPA App as Live Workshop Tool + Deck Scenario Consolidation"
date: "2026-06-22"
type: "brainstorm"
depth: "standard"
source_request: "(1) How can the DPPA web app benefit from the CEBA DPPA 2026 deck; (2) how can the 6 deck scenarios be consolidated using insights from the web app?"
slug: "dppa-app-deck-consolidation"
---

# Brainstorm: DPPA App as Live Workshop Tool + Deck Scenario Consolidation

## Problem & Why Now

The CEBA DPPA 2026 deck (`ceba/CEBA DPPA 2026.pptx`, 57 slides) and the web app (`app/`) teach the same Vietnam virtual-DPPA settlement but have drifted apart: the deck is the broad, well-calibrated workshop narrative (Modules 1–6 + worked scenarios), while the app is a narrow, interactive but mis-calibrated single-day calculator covering only Module 2. The deck's scenarios (Case Studies 5 & 6 plus workshop Scenarios 1–5) overlap heavily — the app's own engine reveals most are one parameterized model. With the 2026 research brief (`research/2026-06-22_vietnam-dppa-2026.md`) now establishing verified values and the first real grid DPPA live, the moment is right to (1) grow the app into the live engine that powers the workshop, and (2) consolidate the redundant deck scenarios down to the app's canonical archetypes.

## Current vs Desired State

- **Current state:** App models a 24-hour synthetic day: five-line settlement + cancellation effect (`settlement.js`), 3 load/gen profiles and 3 settlement modes (`default-scenarios.js`), flat slider prices, single-period only. Defaults are stale/contradictory (retail 2,100 in code vs 1,833 in `assumptions.md`; folded `lossFactor 1.027263` ≠ k×K_pp 1.0342). Deck carries the full lifecycle (TOU baseline, CfD mechanics, developer economics + three gates, BESS case studies, 6–7 worked scenarios, GHG/takeaways) but as static slides with redundant, separately-numbered examples.
- **Desired state:** App becomes the **live workshop tool** — buyers manipulate the same cases the deck teaches — extended with a **multi-year BAU-vs-DPPA** horizon view (escalation + cumulative cost) and recalibrated to verified 2026 values. The deck's worked scenarios collapse to **3 canonical teaching cases** (matched / shortfall / excess) matching the app's archetypes, with multi-party netting and developer-financing each compressed to a single callout/slide.
- **Key repo surfaces:** `app/src/modules/settlement.js` (engine; `classifyInterval` already produces shortfall/balanced/excess), `app/src/data/default-scenarios.js` (profiles, defaults, settlement modes), `app/src/modules/ui.js` (render layer), `app/docs/assumptions.md` + `formulas.md` (must be reconciled), `ceba/CEBA DPPA 2026.pptx` (scenarios to consolidate), `research/2026-06-22_vietnam-dppa-2026.md` (verified values).

## Resolved Decisions

- **DEC-001:** End goal = app becomes the **live workshop tool** (buyers manipulate the deck's scenarios live, replacing static slides) — not merely a deeper self-serve CFO tool. Sets the bar: the app must carry the deck's teaching arc.
- **DEC-002:** App absorbs **multi-year BAU vs DPPA only** (EVN escalation, strike escalation, 10-yr & lifetime cumulative cost). It deliberately does **not** absorb developer economics/three gates, BESS sizing, or a full TOU build-out — stays buyer-facing and lean.
- **DEC-003:** Time model = **representative day × 365, then escalate** year-over-year to the horizon. Reuses the entire existing hourly engine; avoids 8760/monthly rebuild.
- **DEC-004:** Expose **separate EVN tariff escalation + strike escalation sliders and a horizon selector** (Year 1 / 10-yr / lifetime). Mirrors deck slide 16 ("negotiate the escalation index as hard as the strike").
- **DEC-005:** **Adopt the research brief's verified 2026 values** as new defaults: retail → 2,204; fixed fees → 523.3 (split/labeled); loss factor → k×K_pp = 1.0342; default EVN escalation ~4%. Keep **FMP as an explicitly-labeled illustrative input** until an NSMO/ERAV primary source is provided.
- **DEC-006:** Consolidate the deck's 6–7 scenarios into the app's **3 canonical teaching cases** — matched (=), shortfall (Load>Gen), excess (Load<Gen) — folding every scenario into one and dropping redundancy. (Scenario 1 → matched; Scenario 2 duck-curve → matched with FMP-below-strike; Scenario 3 → shortfall; Cases 5/6 overbuild → excess.)
- **DEC-007:** **Multi-party Scenarios 4 & 5 fold in as a netting callout** ("net CfD = sum of per-pair settlements") on the 3 cases, not as standalone scenarios or a new model.
- **DEC-008:** The developer-economics / three-gates / empty-window lesson from Cases 5/6 compresses into **one summary takeaway slide** referenced from the excess case — kept in the deck, not modeled in the app.

## Assumptions & Constraints

- **ASM-001:** Lifetime horizon default ~20 yr (deck case studies use 25 yr; expose as input). Strike escalation default ~4%/yr with selectable index (fixed VND / CPI / USD-linked).
- **ASM-002:** Annualizing one representative day × 365 is accepted as a teaching simplification; it will not capture seasonality (the deck's monthly examples do, but DEC-003 trades that away for reuse).
- **ASM-003:** The 3 canonical cases map cleanly onto `classifyInterval`'s existing keys, so consolidation reuses current classification logic.
- **CON-001:** App stays a "teaching tool, not a legal settlement engine" (per README/assumptions) — multi-year is a buyer decision lens, not a financing model.
- **CON-002:** FMP and exact DPPA fee VND values remain publicly unverifiable; both artifacts must label them illustrative until primary-sourced.

## Approaches Considered

- **Chosen (app):** Extend the existing hourly engine with a multi-year escalation wrapper + recalibrated defaults. — Minimal new surface, maximal reuse, matches the buyer-decision framing.
- **Chosen (deck):** Reduce to 3 canonical cases; multi-party as a netting callout; financing as one summary slide. — Removes redundancy while preserving every distinct lesson.
- **ALT-001:** Make the app the single source of truth that generates the deck. — Rejected for now; bigger lift than the workshop-tool goal requires (DEC-001).
- **ALT-002:** Full 8760-hour / 12-month engine. — Rejected (DEC-003): heavier build, needs real meter data, beyond teaching scope.
- **ALT-003:** Keep all scenarios, just standardize numbers. — Rejected (DEC-006): leaves the redundancy the app exposes.
- **ALT-004:** Keep multi-party as a 4th portfolio case in the app. — Rejected (DEC-007): adds model complexity for no new buyer archetype.

## Out of Scope

- Developer IRR/NPV/DSCR/three-gates modeling in the app (deck-only, one summary slide).
- BESS sizing/replacement interactivity in the app.
- Full TOU tariff table as a live retail input (flat retail retained).
- Seasonality / 8760-hour / real meter-data ingestion.
- GHG/Scope-emissions content (deck-only).
- Auto-generating the deck from the app.

## Open Questions

1. **Q-001:** What primary source should set the FMP (and exact DPPA fee) defaults?
   - **Recommended default:** Label FMP illustrative (deck's ~1,427) until an NSMO/ERAV figure is supplied; keep fees at 523.3 citing EVN's annual notice rather than the training deck.
   - **Why this matters:** FMP is the one input that materially moves the calculator and is currently unverifiable; it gates how confidently the workshop tool can state results.
2. **Q-002:** Lifetime horizon and strike-escalation index defaults (20 vs 25 yr; fixed/CPI/USD)?
   - **Recommended default:** 20-yr lifetime, 4%/yr fixed-VND strike escalation, both user-adjustable.
   - **Why this matters:** Sets the cumulative-cost story's baseline; deck uses 25-yr in case studies, so alignment may be preferred.

## Suggested Next Step
Run `/plan dppa-app-deck-consolidation` to turn this into a multi-phase implementation plan.
