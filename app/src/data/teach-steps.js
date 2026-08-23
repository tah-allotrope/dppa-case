// PHASE-02 TASK-02-01: the six scripted app moments for the Modules 1-6 teaching
// revamp, one per module. Each step drives the existing DOM controls (scenario
// tabs, sliders) exactly as a presenter's click/drag would, so it needs no new
// state plumbing in main.js. Numbers reconcile to assets/teaching/spine-s1.json.
// PHASE-03: title/annotation/expected moved to app/src/data/strings.js as key
// references so the banner can be localized; module/scenarioId/controls/scrollTo
// stay literal because they drive app state.
export const teachSteps = [
  {
    module: 1,
    titleKey: 'teach_m1_title',
    scenarioId: 'workshop1',
    controls: { marketPrice: 1150, strikePrice: 1250 },
    scrollTo: '#profileChart',
    annotationKey: 'teach_m1_annotation',
    expectedKey: 'teach_m1_expected',
  },
  {
    module: 2,
    titleKey: 'teach_m2_title',
    scenarioId: 'workshop1',
    controls: { marketPrice: 1150, strikePrice: 1250 },
    scrollTo: '#fiveLineBill',
    annotationKey: 'teach_m2_annotation',
    expectedKey: 'teach_m2_expected',
  },
  {
    module: 3,
    titleKey: 'teach_m3_title',
    scenarioId: 'workshop1',
    controls: { marketPrice: 1150, strikePrice: 1250 },
    scrollTo: '#fiveLineBill',
    annotationKey: 'teach_m3_annotation',
    expectedKey: 'teach_m3_expected',
  },
  {
    // Deliberately NOT workshop1: at workshop1's basis (strike 1,250 / FMP
    // 1,150) the DPPA line is already below BAU from year 1 regardless of
    // strikeEscalation (0, 0.02, or 0.04 all give crossoverYear 1) -- the
    // buyer-gate question this step asks has a fixed answer no matter what
    // the presenter does, which demonstrates nothing. The 'balanced' curve
    // scenario (strike 2,000 / FMP ~1,427, the app's original constants)
    // genuinely depends on strikeEscalation: no crossover within 20 years at
    // 0.04, year 14 at the default 0.02, year 9 with the "Locked strike"
    // preset (strikeEscalation 0) -- a real, visible before/after.
    module: 4,
    titleKey: 'teach_m4_title',
    scenarioId: 'balanced',
    controls: { marketPrice: 1427, strikePrice: 2000, horizonYears: 20 },
    scrollTo: '#multiYearChart',
    annotationKey: 'teach_m4_annotation',
    expectedKey: 'teach_m4_expected',
  },
  {
    module: 5,
    titleKey: 'teach_m5_title',
    scenarioId: 'workshop1',
    controls: { marketPrice: 1150, strikePrice: 1250 },
    scrollTo: '#fiveLineBill',
    annotationKey: 'teach_m5_annotation',
    expectedKey: 'teach_m5_expected',
  },
  {
    module: 6,
    titleKey: 'teach_m6_title',
    scenarioId: 'workshop1',
    controls: { marketPrice: 1150, strikePrice: 1100 },
    scrollTo: '#fiveLineBill',
    annotationKey: 'teach_m6_annotation',
    expectedKey: 'teach_m6_expected',
  },
]
