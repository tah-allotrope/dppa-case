# 0006 — The gate model said nothing, and every guard agreed

2026-09-06. The M5 heatmap advertised a three-gate sweep — 15 of 70 strike×volume
combinations clearing the buyer, lender and investor gates — and the number was
provably, reproducibly wrong in the specific sense that matters: the lender gate was a
`strike >= 1380` step function that never read the volume axis, the investor gate was a
`strike >= 1450` step function that never read it either, and because 1380 < 1450 the
lender-passing set strictly contained the investor-passing set, so the lender gate was
the sole blocker in exactly 0 of 70 cells. Deleting it left the headline unchanged.
`DSCR_TARGET = 1.2` sat in the export's meta block, used by no computation.
Every integrity guard passed throughout. Deck parity reconciled the figures, the prose
guard confirmed the slides said what the JSON said, the retired-figure guard confirmed
nobody cited a superseded headline. All true, all beside the point: each guard verified
a number's *provenance* — that it came from the engine and matched everywhere it
appeared — and none asked whether the computation *carried information*. A model whose
gates are constant along an axis, or whose gates are strictly ordered so one can never
bind alone, passes every provenance check while saying nothing.

The fix (plans/2026-09-05-gate-model-and-october-readiness-plan.md, PHASE-02) made each
gate two-dimensional — the lender tests contracted revenue against debt service at the
coverage ratio, the investor tests blended revenue per generated kWh against full LCOE —
and, just as importantly, added the guard the repo lacked: `assertNonDegenerate` fails the export
unless each gate varies with volume somewhere, each gate is the sole blocker somewhere
(buyer 6, lender 1, investor 20), and deleting any single gate moves the headline (15 →
8 of 70). The template generalises: any model with a headline figure gets a
non-degeneracy assertion alongside its provenance checks, because "this number is
correct" and "this computation says something" are different claims and only the first
had a guard.
