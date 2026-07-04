// Exports the canonical S1 "spine pack" (PHASE-01 TASK-01-01) for the Modules 1-6
// teaching revamp: every number used in slides/visuals/worksheet/A4 card is
// generated here from the settlement engine, never hand-typed downstream.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildFiveLineBill } from '../src/modules/settlement.js'
import { scenarioProfiles, defaultInputs } from '../src/data/default-scenarios.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const S1 = scenarioProfiles.workshop1
const fmp = S1.overrides.marketPrice
const strikePrice = S1.overrides.strikePrice
const lossFactorKppOnly = 1.008
const lossFactorPrecise = 1.026 * 1.008

const bill = buildFiveLineBill(
  {
    fmp,
    strikePrice,
    serviceFee: defaultInputs.dppaServiceFee,
    clearingFee: defaultInputs.dppaClearingFee,
    lossFactorPrecise,
    lossFactor: defaultInputs.lossFactor,
    retailTariff: defaultInputs.retailTariff,
    lossFactorKppOnly,
  },
  S1.monthlyVolumes,
)

const million = (vnd) => Math.round(vnd / 1e6)
const roundedSig3 = (vnd) => {
  const millions = vnd / 1e6
  if (millions === 0) return 0
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(millions))) - 2)
  return Math.round(millions / magnitude) * magnitude
}

// The spine factory persona (Q-003 in the plan's Grill Me; using the recommended
// default: a neutral fictional Vietnamese garment factory sized to S1's load).
const spineFactory = {
  name: 'Song Hong Garment Co.',
  nameVi: 'Công ty May Sông Hồng',
  nameZh: '红河制衣公司',
  sector: 'Garment manufacturing, 110kV connection',
  monthlyLoadKwh: S1.monthlyVolumes.total,
}

const bauMonthlyVnd = S1.monthlyVolumes.total * defaultInputs.retailTariff

const spinePack = {
  meta: {
    scenario: 'S1 matched (base case)',
    source: 'app/src/modules/settlement.js buildFiveLineBill + research/2026-06-29_dppa-scenario-numbers-spec.md',
    generatedBy: 'app/scripts/export-spine.mjs',
  },
  factory: spineFactory,
  inputs: {
    fmp,
    strikePrice,
    serviceFee: defaultInputs.dppaServiceFee,
    clearingFee: defaultInputs.dppaClearingFee,
    retailTariff: defaultInputs.retailTariff,
    lossFactorPrecise,
    lossFactorKppOnly,
    contractedKwh: S1.monthlyVolumes.contracted,
    totalConsumptionKwh: S1.monthlyVolumes.total,
  },
  bau: {
    monthlyVnd: bauMonthlyVnd,
    monthlyVndMillionsRounded: million(bauMonthlyVnd),
  },
  bill: {
    lines: {
      marketEnergy: { label: 'Market energy', vnd: bill.lines.marketEnergy, vndMillionsRounded: million(bill.lines.marketEnergy) },
      systemService: { label: 'DPPA service fee', vnd: bill.lines.systemService, vndMillionsRounded: million(bill.lines.systemService) },
      diffClearing: { label: 'Balancing / clearing fee', vnd: bill.lines.diffClearing, vndMillionsRounded: million(bill.lines.diffClearing) },
      additionalPurchase: { label: 'Residual retail purchase', vnd: bill.lines.additionalPurchase, vndMillionsRounded: million(bill.lines.additionalPurchase) },
      cfd: { label: 'CfD settlement', vnd: bill.lines.cfd, vndMillionsRounded: million(bill.lines.cfd) },
    },
    cEvn: { vnd: bill.cEvn, vndMillionsRounded: million(bill.cEvn) },
    cKh: { vnd: bill.cKh, vndMillionsRounded: million(bill.cKh) },
    plantRevenue: {
      market: { vnd: bill.plantRevenue.market, vndMillionsRounded: million(bill.plantRevenue.market) },
      cfd: { vnd: bill.plantRevenue.cfd, vndMillionsRounded: million(bill.plantRevenue.cfd) },
      total: { vnd: bill.plantRevenue.total, vndMillionsRounded: million(bill.plantRevenue.total) },
    },
  },
  comparison: {
    bauMonthlyVndMillionsRounded: million(bauMonthlyVnd),
    dppaMonthlyVndMillionsRounded: million(bill.cKh),
    deltaVndMillionsRounded: million(bill.cKh) - million(bauMonthlyVnd),
    effectiveVndPerKwh: Math.round((bill.cKh / S1.monthlyVolumes.total) * 10) / 10,
  },
  gates: {
    buyer: { label: 'Buyer gate', rule: 'Cumulative DPPA cost <= cumulative BAU cost', thresholdText: 'C_KH (life) <= C_BAU (life)' },
    lender: { label: 'Lender gate', rule: 'DSCR every year', thresholdText: '>= 1.20x' },
    investor: { label: 'Investor gate', rule: 'Equity IRR', thresholdText: '12-15%' },
  },
  levers: [
    { name: 'Strike price', movesWhen: 'Lower strike -> lower CfD cost when FMP is below strike' },
    { name: 'Contracted volume (Q_c)', movesWhen: 'Match Q_c to real consumption to avoid excess/shortfall risk' },
    { name: 'Tenor / escalation', movesWhen: 'Longer lock trades flexibility for price certainty' },
    { name: 'Settlement mode', movesWhen: 'Matched-only vs generation vs allocated changes who bears volume risk' },
    { name: 'Termination / step-out terms', movesWhen: 'Determines the cost of exiting if the deal stops passing the three gates' },
  ],
}

writeFileSync(join(__dirname, '..', '..', 'assets', 'teaching', 'spine-s1.json'), JSON.stringify(spinePack, null, 2))
console.log('Wrote assets/teaching/spine-s1.json')
console.log(JSON.stringify(spinePack.bill, null, 2))
