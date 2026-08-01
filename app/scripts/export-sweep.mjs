// PHASE-03 (October readiness hardening plan): computes the 56-cell strike x
// volume gate sweep behind the M5 heatmap, so the "N / 56" punchline is
// data-driven from the settlement engine rather than a hard-coded fake.
// Run: node scripts/export-sweep.mjs (from app/). Writes
// assets/teaching/gate-sweep.json. See ## Specification in
// plans/2026-07-10-october-readiness-hardening-plan.md for the exact formulas.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildFiveLineBill } from '../src/modules/settlement.js'
import { scenarioProfiles, defaultInputs } from '../src/data/default-scenarios.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const S1 = scenarioProfiles.workshop1
const LOAD = S1.monthlyVolumes.total // 5,000,000 kWh/month
const FMP1 = S1.overrides.marketPrice // 1,150 VND/kWh
const RETAIL1 = defaultInputs.retailTariff // 2,204 VND/kWh
const SERVICE_FEE = defaultInputs.dppaServiceFee
const CLEARING_FEE = defaultInputs.dppaClearingFee
const LOSS_FACTOR_PRECISE = 1.026 * 1.008
const LOSS_FACTOR_KPP_ONLY = 1.008

const ESCALATION = 0.04 // retail + strike, per year (ASM-005)
const FMP_ESCALATION = 0.04 // FMP, per year (ASM-005)
const HORIZON_YEARS = 20
const MONTHS_PER_YEAR = 12

const STRIKES = [1100, 1150, 1200, 1250, 1300, 1350, 1400, 1450]
const RATIOS = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3]

// Illustrative developer-side proxy constants (ASM-003): settlement.js is
// buyer-side only and does not model debt schedules or equity IRR, so the
// lender/investor gates compare the grid's nominal strike (not escalated)
// against a fixed per-kWh debt-service threshold and a full-LCOE threshold.
const LENDER_DEBT_SERVICE_VND_PER_KWH = 1150 * 1.2 // 1,380
const DSCR_TARGET = 1.2
const INVESTOR_LCOE_VND_PER_KWH = 1450

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
  const buyerPass = lifetimeDppaVnd <= lifetimeBauVnd
  const lenderPass = strike >= LENDER_DEBT_SERVICE_VND_PER_KWH
  const investorPass = strike >= INVESTOR_LCOE_VND_PER_KWH
  const allPass = buyerPass && lenderPass && investorPass
  return {
    strike,
    ratio,
    buyerPass,
    lenderPass,
    investorPass,
    allPass,
    lifetimeDppaVnd: Math.round(lifetimeDppaVnd),
    lifetimeBauVnd: Math.round(lifetimeBauVnd),
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
  return {
    meta: {
      generatedBy: 'app/scripts/export-sweep.mjs',
      horizonYears: HORIZON_YEARS,
      escalation: ESCALATION,
      fmpEscalation: FMP_ESCALATION,
      lenderDebtServiceVndPerKwh: LENDER_DEBT_SERVICE_VND_PER_KWH,
      dscrTarget: DSCR_TARGET,
      investorLcoeVndPerKwh: INVESTOR_LCOE_VND_PER_KWH,
      note: 'Lender/investor gates use illustrative developer-side proxies (settlement.js is buyer-side only and does not model debt schedules or equity IRR). Buyer gate is the exact lifetime-cost comparison via buildFiveLineBill.',
    },
    strikes: STRIKES,
    ratios: RATIOS,
    cells,
    passCount,
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

  writeFileSync(
    join(__dirname, '..', '..', 'assets', 'teaching', 'gate-sweep.json'),
    JSON.stringify(sweep, null, 2),
  )
  console.log('Wrote assets/teaching/gate-sweep.json')
  console.log('passCount:', sweep.passCount, '/', sweep.cells.length)
}

main()
