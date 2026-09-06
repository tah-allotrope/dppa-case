// Exports the canonical S1/S2/S3 "spine packs" (PHASE-01 TASK-01-01, extended by
// PHASE-03 of plans/2026-07-17-prose-parity-second-pipeline-plan.md) for the
// Modules 1-6 teaching revamp: every number used in slides/visuals/worksheet/A4
// card is generated here from the settlement engine, never hand-typed downstream.
import { writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { buildFiveLineBill } from '../src/modules/settlement.js'
import { scenarioProfiles, defaultInputs } from '../src/data/default-scenarios.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const lossFactorKppOnly = 1.008
const lossFactorPrecise = 1.026 * 1.008

// S3's over-generation is chart/narrative context, not a bill line (the bill
// settles on matched volume only). Provenance: research/2026-06-29_dppa-scenario-numbers-spec.md.
const EXCESS_GENERATION_KWH = 6500000

const million = (vnd) => Math.round(vnd / 1e6)

function buildCommonBill(profile) {
  const fmp = profile.overrides.marketPrice
  const strikePrice = profile.overrides.strikePrice
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
    profile.monthlyVolumes,
  )
  return { fmp, strikePrice, bill }
}

function buildInputsSection(profile, fmp, strikePrice) {
  return {
    fmp,
    strikePrice,
    serviceFee: defaultInputs.dppaServiceFee,
    clearingFee: defaultInputs.dppaClearingFee,
    retailTariff: defaultInputs.retailTariff,
    lossFactorPrecise,
    lossFactorKppOnly,
    contractedKwh: profile.monthlyVolumes.contracted,
    totalConsumptionKwh: profile.monthlyVolumes.total,
  }
}

function buildBillSection(bill) {
  return {
    lines: {
      marketEnergy: {
        label: 'Market energy',
        vnd: bill.lines.marketEnergy,
        vndMillionsRounded: million(bill.lines.marketEnergy),
      },
      systemService: {
        label: 'DPPA service fee',
        vnd: bill.lines.systemService,
        vndMillionsRounded: million(bill.lines.systemService),
      },
      diffClearing: {
        label: 'Balancing / clearing fee',
        vnd: bill.lines.diffClearing,
        vndMillionsRounded: million(bill.lines.diffClearing),
      },
      additionalPurchase: {
        label: 'Residual retail purchase',
        vnd: bill.lines.additionalPurchase,
        vndMillionsRounded: million(bill.lines.additionalPurchase),
      },
      cfd: {
        label: 'CfD settlement',
        vnd: bill.lines.cfd,
        vndMillionsRounded: million(bill.lines.cfd),
      },
    },
    cEvn: { vnd: bill.cEvn, vndMillionsRounded: million(bill.cEvn) },
    cKh: { vnd: bill.cKh, vndMillionsRounded: million(bill.cKh) },
    plantRevenue: {
      market: {
        vnd: bill.plantRevenue.market,
        vndMillionsRounded: million(bill.plantRevenue.market),
      },
      cfd: { vnd: bill.plantRevenue.cfd, vndMillionsRounded: million(bill.plantRevenue.cfd) },
      total: { vnd: bill.plantRevenue.total, vndMillionsRounded: million(bill.plantRevenue.total) },
    },
  }
}

function buildComparisonSection(bauMonthlyVnd, bill, totalKwh) {
  return {
    bauMonthlyVndMillionsRounded: million(bauMonthlyVnd),
    dppaMonthlyVndMillionsRounded: million(bill.cKh),
    deltaVndMillionsRounded: million(bill.cKh) - million(bauMonthlyVnd),
    effectiveVndPerKwh: Math.round((bill.cKh / totalKwh) * 10) / 10,
  }
}

const SOURCE_NOTE =
  'app/src/modules/settlement.js buildFiveLineBill + research/2026-06-29_dppa-scenario-numbers-spec.md'

export function buildSpinePack(scenarioKey) {
  if (scenarioKey === 's1') {
    const S1 = scenarioProfiles.workshop1
    const { fmp, strikePrice, bill } = buildCommonBill(S1)
    const bauMonthlyVnd = S1.monthlyVolumes.total * defaultInputs.retailTariff

    return {
      meta: {
        scenario: 'S1 matched (base case)',
        source: SOURCE_NOTE,
        generatedBy: 'app/scripts/export-spine.mjs',
      },
      factory: {
        name: 'Song Hong Garment Co.',
        nameVi: 'Công ty May Sông Hồng',
        nameZh: '红河制衣公司',
        sector: 'Garment manufacturing, 110kV connection',
        monthlyLoadKwh: S1.monthlyVolumes.total,
      },
      inputs: buildInputsSection(S1, fmp, strikePrice),
      bau: { monthlyVnd: bauMonthlyVnd, monthlyVndMillionsRounded: million(bauMonthlyVnd) },
      bill: buildBillSection(bill),
      comparison: buildComparisonSection(bauMonthlyVnd, bill, S1.monthlyVolumes.total),
      gates: {
        buyer: {
          label: 'Buyer gate',
          rule: 'Cumulative DPPA cost <= cumulative BAU cost',
          thresholdText: 'C_KH (life) <= C_BAU (life)',
        },
        lender: { label: 'Lender gate', rule: 'DSCR every year', thresholdText: '>= 1.20x' },
        investor: { label: 'Investor gate', rule: 'Equity IRR', thresholdText: '12-15%' },
      },
      levers: [
        {
          name: 'Strike price',
          movesWhen: 'Lower strike -> lower CfD cost when FMP is below strike',
        },
        {
          name: 'Contracted volume (Q_c)',
          movesWhen: 'Match Q_c to real consumption to avoid excess/shortfall risk',
        },
        {
          name: 'Tenor / escalation',
          movesWhen: 'Longer lock trades flexibility for price certainty',
        },
        {
          name: 'Settlement mode',
          movesWhen: 'Matched-only vs generation vs allocated changes who bears volume risk',
        },
        {
          name: 'Termination / step-out terms',
          movesWhen: 'Determines the cost of exiting if the deal stops passing the three gates',
        },
      ],
    }
  }

  if (scenarioKey === 's2' || scenarioKey === 's3') {
    const profile = scenarioKey === 's2' ? scenarioProfiles.workshop2 : scenarioProfiles.workshop3
    const { fmp, strikePrice, bill } = buildCommonBill(profile)
    const bauMonthlyVnd = profile.monthlyVolumes.total * defaultInputs.retailTariff

    const pack = {
      meta: {
        scenario:
          scenarioKey === 's2'
            ? 'S2 shortfall (contracted below consumption)'
            : 'S3 excess (over-generation, matched settlement)',
        source: SOURCE_NOTE,
        generatedBy: 'app/scripts/export-spine.mjs',
      },
      inputs: buildInputsSection(profile, fmp, strikePrice),
      bau: { monthlyVnd: bauMonthlyVnd, monthlyVndMillionsRounded: million(bauMonthlyVnd) },
      bill: buildBillSection(bill),
      comparison: buildComparisonSection(bauMonthlyVnd, bill, profile.monthlyVolumes.total),
    }

    if (scenarioKey === 's3') {
      const excessKwh = EXCESS_GENERATION_KWH - profile.monthlyVolumes.total
      const spotValueVnd = Math.round(excessKwh * lossFactorKppOnly * fmp)
      pack.excess = {
        generationKwh: EXCESS_GENERATION_KWH,
        excessKwh,
        spotValueVnd,
        spotFormulaText: '1,500,000 × 1.008 × 1,100',
        note: 'Narrative only — the excess settles at spot with no CfD; it is not a bill line.',
      }
    }

    return pack
  }

  throw new Error(`Unknown scenario key: ${scenarioKey}`)
}

function writePack(name, pack) {
  const path = join(__dirname, '..', '..', 'assets', 'teaching', `spine-${name}.json`)
  writeFileSync(path, JSON.stringify(pack, null, 2))
  console.log(`Wrote assets/teaching/spine-${name}.json`)
}

function writeAppFigures(s1) {
  const figures = {
    bauMillions: s1.bau.monthlyVndMillionsRounded,
    cEvnMillions: s1.bill.cEvn.vndMillionsRounded,
    cfdMillions: s1.bill.lines.cfd.vndMillionsRounded,
    cKhMillions: s1.bill.cKh.vndMillionsRounded,
  }
  const lines = [
    '// GENERATED by app/scripts/export-spine.mjs -- do not hand-edit. See CLAUDE.md section 4.',
    'export const SPINE_FIGURES = {',
    `  s1: { bauMillions: ${figures.bauMillions}, cEvnMillions: ${figures.cEvnMillions}, cfdMillions: ${figures.cfdMillions}, cKhMillions: ${figures.cKhMillions} },`,
    '}',
    '',
  ]
  const path = join(__dirname, '..', 'src', 'data', 'spine-figures.js')
  writeFileSync(path, lines.join('\n'))
  console.log('Wrote app/src/data/spine-figures.js')
}

function assertAnchor(label, actual, expected) {
  if (actual !== expected) {
    console.error(`ANCHOR FAIL ${label}: expected ${expected}, got ${actual}`)
    process.exit(1)
  }
}

export function main() {
  const s1 = buildSpinePack('s1')
  const s2 = buildSpinePack('s2')
  const s3 = buildSpinePack('s3')

  assertAnchor('s2.cEvn', s2.bill.cEvn.vnd, 19628262400)
  assertAnchor('s2.cKh', s2.bill.cKh.vnd, 18828262400)
  assertAnchor('s2.additionalPurchase', s2.bill.lines.additionalPurchase.vnd, 2204000000)
  assertAnchor('s3.cEvn', s3.bill.cEvn.vnd, 8304644000)
  assertAnchor('s3.cKh', s3.bill.cKh.vnd, 9054644000)
  assertAnchor('s3.cfd', s3.bill.lines.cfd.vnd, 750000000)

  writePack('s1', s1)
  writePack('s2', s2)
  writePack('s3', s3)
  writeAppFigures(s1)
  console.log(JSON.stringify(s1.bill, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
