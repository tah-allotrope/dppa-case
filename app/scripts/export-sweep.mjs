// PHASE-03 (October readiness hardening plan): computes the strike x volume
// gate sweep behind the M5 heatmap, so the "N / M" punchline is data-driven
// from the settlement engine rather than a hard-coded fake.
// Run: node scripts/export-sweep.mjs (from app/). Writes
// assets/teaching/gate-sweep.json. See ## Specification in
// plans/2026-07-10-october-readiness-hardening-plan.md for the exact formulas.
//
// PHASE-06 (2026-08-23, plans/2026-08-22-delivery-stall-recovery-plan.md):
// STRIKES extended from eight strikes (1,100 through 1,450) to ten (1,100
// through 1,550), so the grid now has 70 cells, not the smaller count it had
// before. The prior top of the grid, 1,450, was exactly
// INVESTOR_LCOE_VND_PER_KWH -- every passing cell sat in that one edge
// column, so the headline pass rate was an artifact of where the axis
// stopped rather than a finding about DPPA economics (the two extra strike
// steps roughly tripled the all-three-gates pass count). Both thresholds
// (LENDER_DEBT_SERVICE_VND_PER_KWH = 1,380, INVESTOR_LCOE_VND_PER_KWH =
// 1,450) are now interior to the grid, not at its edge. See
// tools/retired_figures.json for the superseded headline this same commit
// retires everywhere it appeared.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildFiveLineBill } from '../src/modules/settlement.js'
import {
  DEBT_SHARE,
  DSCR_TARGET,
  INVESTOR_LCOE_VND_PER_KWH,
  LOSS_FACTOR_KPP_ONLY,
  LOSS_FACTOR_PRECISE,
  evaluateGates,
} from '../src/modules/gates.js'
import { scenarioProfiles, defaultInputs } from '../src/data/default-scenarios.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const S1 = scenarioProfiles.workshop1
const LOAD = S1.monthlyVolumes.total // 5,000,000 kWh/month
const FMP1 = S1.overrides.marketPrice // 1,150 VND/kWh
const RETAIL1 = defaultInputs.retailTariff // 2,204 VND/kWh
const SERVICE_FEE = defaultInputs.dppaServiceFee
const CLEARING_FEE = defaultInputs.dppaClearingFee
// The gate model itself lives in app/src/modules/gates.js and is shared with the
// application's live gate panel; this exporter keeps only the grid definition, the
// year-loop lifetime accumulation, the anchor assertion and the degeneracy assertions.
const ESCALATION = 0.04 // retail + strike, per year (ASM-005)
const FMP_ESCALATION = 0.04 // FMP, per year (ASM-005)
const HORIZON_YEARS = 20
const MONTHS_PER_YEAR = 12

const STRIKES = [1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550]
const RATIOS = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3]

function contractedForRatio(ratio) {
  return Math.round(LOAD * ratio)
}

function yearBill(strike, ratio, year) {
  const priceFactor = (1 + ESCALATION) ** (year - 1)
  const fmpFactor = (1 + FMP_ESCALATION) ** (year - 1)
  return buildFiveLineBill(
    {
      fmp: FMP1 * fmpFactor,
      strikePrice: strike * priceFactor,
      serviceFee: SERVICE_FEE,
      clearingFee: CLEARING_FEE,
      lossFactorPrecise: LOSS_FACTOR_PRECISE,
      retailTariff: RETAIL1 * priceFactor,
      lossFactorKppOnly: LOSS_FACTOR_KPP_ONLY,
    },
    { contracted: contractedForRatio(ratio), total: LOAD },
  )
}

function evaluateCell(strike, ratio) {
  let lifetimeDppaVnd = 0
  let lifetimeBauVnd = 0
  for (let year = 1; year <= HORIZON_YEARS; year += 1) {
    const bill = yearBill(strike, ratio, year)
    const priceFactor = (1 + ESCALATION) ** (year - 1)
    lifetimeDppaVnd += MONTHS_PER_YEAR * bill.cKh
    lifetimeBauVnd += MONTHS_PER_YEAR * LOAD * RETAIL1 * priceFactor
  }
  const gates = evaluateGates({
    strikeVndPerKwh: strike,
    contractedKwhPerMonth: contractedForRatio(ratio),
    referenceLoadKwhPerMonth: LOAD,
    fmpVndPerKwh: FMP1,
    lifetimeDppaVnd,
    lifetimeBauVnd,
  })
  const {
    buyerPass,
    lenderPass,
    investorPass,
    allPass,
    annualContractRevenueVnd,
    blendedRevenuePerKwh,
  } = gates
  return {
    strike,
    ratio,
    buyerPass,
    lenderPass,
    investorPass,
    allPass,
    lifetimeDppaVnd: Math.round(lifetimeDppaVnd),
    lifetimeBauVnd: Math.round(lifetimeBauVnd),
    annualContractRevenueVnd: Math.round(annualContractRevenueVnd),
    blendedRevenuePerKwh,
  }
}

export function buildSweep() {
  const cells = []
  for (const strike of STRIKES) {
    for (const ratio of RATIOS) {
      cells.push(evaluateCell(strike, ratio))
    }
  }
  const passCount = cells.filter((cell) => cell.allPass).length
  // Per-gate counts, so "N of M pass all three" can be shown alongside
  // *which* gate actually binds -- "buyer 62 / lender 36 / investor 15 /
  // all three 8" under the S1 model in
  // plans/2026-09-05-gate-model-and-october-readiness-plan.md.
  const buyerPassCount = cells.filter((cell) => cell.buyerPass).length
  const lenderPassCount = cells.filter((cell) => cell.lenderPass).length
  const investorPassCount = cells.filter((cell) => cell.investorPass).length
  return {
    meta: {
      generatedBy: 'app/scripts/export-sweep.mjs',
      horizonYears: HORIZON_YEARS,
      escalation: ESCALATION,
      fmpEscalation: FMP_ESCALATION,
      debtShare: DEBT_SHARE,
      annualDebtServiceVnd: LOAD * 12 * INVESTOR_LCOE_VND_PER_KWH * DEBT_SHARE,
      dscrTarget: DSCR_TARGET,
      investorLcoeVndPerKwh: INVESTOR_LCOE_VND_PER_KWH,
      note: 'Lender gate tests contracted revenue against debt service at the target coverage ratio; investor gate tests blended revenue per generated kWh against full LCOE. Both illustrative (settlement.js is buyer-side only) until real deal data lands.',
    },
    strikes: STRIKES,
    ratios: RATIOS,
    cells,
    cellCount: cells.length,
    passCount,
    buyerPassCount,
    lenderPassCount,
    investorPassCount,
  }
}

function assertNonDegenerate(cells) {
  const gates = ['buyerPass', 'lenderPass', 'investorPass']
  const fail = (message) => {
    console.error(`DEGENERACY FAIL: ${message}`)
    process.exit(1)
  }
  for (const gate of gates) {
    const varies = STRIKES.some(
      (strike) =>
        new Set(cells.filter((cell) => cell.strike === strike).map((cell) => cell[gate])).size > 1,
    )
    if (!varies) {
      fail(`${gate} is constant along the volume axis at every strike`)
    }
    const sole = cells.filter(
      (cell) =>
        !cell[gate] && gates.filter((other) => other !== gate).every((other) => cell[other]),
    ).length
    if (sole < 1) {
      fail(`${gate} is never the sole blocker`)
    }
  }
  const passCount = cells.filter((cell) => cell.allPass).length
  for (const gate of gates) {
    const without = cells.filter((cell) =>
      gates.filter((other) => other !== gate).every((other) => cell[other]),
    ).length
    if (without === passCount) {
      fail(`removing ${gate} leaves passCount unchanged`)
    }
  }
}

function main() {
  const sweep = buildSweep()

  // Self-check: anchor cell (strike=1250, ratio=1.00) year-1 cKh must equal
  // assets/teaching/spine-s1.json exactly, or the sweep's inputs have
  // drifted from the canonical S1 spine pack.
  const anchorBill = yearBill(1250, 1.0, 1)
  const EXPECTED_ANCHOR_CKH_VND = 9063196000
  if (anchorBill.cKh !== EXPECTED_ANCHOR_CKH_VND) {
    console.error(`Anchor mismatch: expected cKh ${EXPECTED_ANCHOR_CKH_VND}, got ${anchorBill.cKh}`)
    process.exit(1)
  }
  assertNonDegenerate(sweep.cells)

  writeFileSync(
    join(__dirname, '..', '..', 'assets', 'teaching', 'gate-sweep.json'),
    JSON.stringify(sweep, null, 2),
  )
  console.log('Wrote assets/teaching/gate-sweep.json')
  console.log('passCount:', sweep.passCount, '/', sweep.cells.length)
}

main()
