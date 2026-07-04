// PHASE-02 TASK-02-01: the six scripted app moments for the Modules 1-6 teaching
// revamp, one per module. Each step drives the existing DOM controls (scenario
// tabs, sliders) exactly as a presenter's click/drag would, so it needs no new
// state plumbing in main.js. Numbers reconcile to assets/teaching/spine-s1.json.
export const teachSteps = [
  {
    module: 1,
    title: 'M1 — The baseline',
    scenarioId: 'workshop1',
    controls: { marketPrice: 1150, strikePrice: 1250 },
    scrollTo: '#profileChart',
    annotation: 'This is Song Hong Garment Co.’s load today. Point at the midday hours — that is what EVN bills at TOU rates.',
    expected: 'Baseline BAU bill: ~11,020 million VND/month.',
  },
  {
    module: 2,
    title: 'M2 — The five-line bill',
    scenarioId: 'workshop1',
    controls: { marketPrice: 1150, strikePrice: 1250 },
    scrollTo: '#fiveLineBill',
    annotation: 'Five lines assemble into one bill. Read each line’s VND amount off the panel as the Sankey slide names it.',
    expected: 'C_EVN 8,563m + CfD 500m = C_KH 9,063 million VND/month.',
  },
  {
    module: 3,
    title: 'M3 — The lock (CfD sign flip)',
    scenarioId: 'workshop1',
    controls: { marketPrice: 1150, strikePrice: 1250 },
    scrollTo: '#fiveLineBill',
    annotation: 'Drag the market-price slider up past 1,250 (the strike) live — watch the CfD line flip from a factory top-up to a developer payment.',
    expected: 'Below strike: CfD +500m (factory pays). Above strike: CfD flips negative (developer pays).',
  },
  {
    module: 4,
    title: 'M4 — Three doors (developer economics)',
    scenarioId: 'workshop1',
    controls: { marketPrice: 1150, strikePrice: 1250, horizonYears: 20 },
    scrollTo: '#multiYearChart',
    annotation: 'This cumulative view is the buyer-gate check: does the DPPA line ever cross below the BAU line?',
    expected: 'Read the crossover year off the multi-year panel.',
  },
  {
    module: 5,
    title: 'M5 — Verify the hand-compute',
    scenarioId: 'workshop1',
    controls: { marketPrice: 1150, strikePrice: 1250 },
    scrollTo: '#fiveLineBill',
    annotation: 'Participants: check your worksheet totals against this panel now.',
    expected: 'Matches the worksheet answer key exactly (spine-s1.json).',
  },
  {
    module: 6,
    title: 'M6 — Levers (strike sensitivity)',
    scenarioId: 'workshop1',
    controls: { marketPrice: 1150, strikePrice: 1100 },
    scrollTo: '#fiveLineBill',
    annotation: 'Lower the strike live — show how much the CfD line (and the total) moves. That is lever #1.',
    expected: 'Lower strike narrows or reverses the CfD top-up.',
  },
]
