import { deriveVolumes, sumVolume } from './profiles'

export function classifyInterval(volume) {
  if (volume.load > volume.generation) {
    return {
      key: 'shortfall',
      label: 'Shortfall hour',
      stateText: 'Load > Gen',
    }
  }

  if (volume.generation > volume.load) {
    return {
      key: 'excess',
      label: 'Excess solar hour',
      stateText: 'Load < Gen',
    }
  }

  return {
    key: 'balanced',
    label: 'Balanced hour',
    stateText: 'Load = Gen',
  }
}

export function determineContractQuantity(volume, settlementMode) {
  switch (settlementMode) {
    case 'matched':
      return volume.matched
    case 'allocated':
      return Math.round(volume.generation * 0.88)
    case 'generation':
      return volume.generation
    case 'minimum':
      return Math.min(volume.load, volume.generation)
    default:
      return volume.matched
  }
}

export function calculateSettlement(inputs) {
  const volumes = deriveVolumes(inputs.loadProfile, inputs.generationProfile).map((volume) => ({
    ...volume,
    contractQuantity: determineContractQuantity(volume, inputs.settlementMode),
  }))

  const intervals = volumes.map((volume) => {
    const evnMarket = volume.matched * inputs.marketPrice * inputs.lossFactor
    const evnDppa = volume.matched * inputs.dppaCharge
    const evnRetail = volume.shortfall * inputs.retailTariff
    const developer = volume.contractQuantity * (inputs.strikePrice - inputs.marketPrice)
    const evnTotal = evnMarket + evnDppa + evnRetail
    const total = evnTotal + developer
    const baseline = volume.load * inputs.retailTariff
    const intervalMatchedPrice = volume.matched > 0 ? (evnMarket + evnDppa + developer) / volume.matched : 0
    const classification = classifyInterval(volume)

    return {
      ...volume,
      classification,
      evnMarket,
      evnDppa,
      evnRetail,
      evnTotal,
      developer,
      total,
      baseline,
      intervalMatchedPrice,
    }
  })

  const matchedVolume = sumVolume(intervals, 'matched')
  const loadTotal = sumVolume(intervals, 'load')
  const generationTotal = sumVolume(intervals, 'generation')
  const contractTotal = sumVolume(intervals, 'contractQuantity')
  const evnMarketTotal = sumVolume(intervals, 'evnMarket')
  const evnDppaTotal = sumVolume(intervals, 'evnDppa')
  const evnRetailTotal = sumVolume(intervals, 'evnRetail')
  const evnTotal = evnMarketTotal + evnDppaTotal + evnRetailTotal
  const developerTotal = sumVolume(intervals, 'developer')
  const totalCost = sumVolume(intervals, 'total')
  const baselineCost = sumVolume(intervals, 'baseline')
  const savings = baselineCost - totalCost
  const matchedPrice = matchedVolume > 0 ? (evnMarketTotal + evnDppaTotal + developerTotal) / matchedVolume : 0
  const blendedPrice = loadTotal > 0 ? totalCost / loadTotal : 0
  const noDppaBlended = loadTotal > 0 ? baselineCost / loadTotal : 0
  const impliedCancellation = matchedVolume > 0
    ? inputs.strikePrice + inputs.dppaCharge + (inputs.marketPrice * inputs.lossFactor - inputs.marketPrice)
    : 0

  return {
    intervals,
    totals: {
      matchedVolume,
      loadTotal,
      generationTotal,
      contractTotal,
      evnMarketTotal,
      evnDppaTotal,
      evnRetailTotal,
      evnTotal,
      developerTotal,
      totalCost,
      baselineCost,
      savings,
      matchedPrice,
      blendedPrice,
      noDppaBlended,
      impliedCancellation,
      excessRisk: contractTotal > matchedVolume,
    },
  }
}

function getCasePresentation(key) {
  switch (key) {
    case 'shortfall':
      return {
        caseLabel: 'Load > Gen',
        headline: 'Under-supply case',
        tone: 'warning',
      }
    case 'excess':
      return {
        caseLabel: 'Load < Gen',
        headline: 'Over-supply case',
        tone: 'accent',
      }
    default:
      return {
        caseLabel: 'Load = Gen',
        headline: 'Balanced case',
        tone: 'result',
      }
  }
}

function pickRepresentativeInterval(intervals, key) {
  if (!intervals.length) return null

  const exactMatches = intervals.filter((interval) => interval.classification?.key === key)

  if (key === 'shortfall') {
    const source = exactMatches.length ? exactMatches : intervals
    return source.reduce((best, interval) => {
      const bestGap = best.load - best.generation
      const nextGap = interval.load - interval.generation
      return nextGap > bestGap ? interval : best
    })
  }

  if (key === 'excess') {
    const source = exactMatches.length ? exactMatches : intervals
    return source.reduce((best, interval) => {
      const bestGap = best.generation - best.load
      const nextGap = interval.generation - interval.load
      return nextGap > bestGap ? interval : best
    })
  }

  const source = exactMatches.length ? exactMatches : intervals
  return source.reduce((best, interval) => {
    const bestGap = Math.abs(best.load - best.generation)
    const nextGap = Math.abs(interval.load - interval.generation)
    return nextGap < bestGap ? interval : best
  })
}

function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00 - ${String((hour + 1) % 24).padStart(2, '0')}:00`
}

function buildWalkthroughCase(inputs, interval, step = 1) {
  const presentation = getCasePresentation(interval.classification.key)
  const breakdown = buildFormulaBreakdown(inputs, interval)

  return {
    step,
    key: interval.classification.key,
    tone: presentation.tone,
    caseLabel: presentation.caseLabel,
    headline: presentation.headline,
    hour: interval.hour,
    hourLabel: formatHourLabel(interval.hour),
    classification: interval.classification,
    sourceScenario: interval.sourceScenario,
    load: interval.load,
    generation: interval.generation,
    matched: interval.matched,
    shortfall: interval.shortfall,
    excess: interval.excess,
    contractQuantity: interval.contractQuantity,
    cfdUnitRate: inputs.strikePrice - inputs.marketPrice,
    cfdAmount: interval.developer,
    evnAmount: interval.evnTotal,
    totalDppa: interval.total,
    totalNoDppa: interval.baseline,
    savingsVsBau: interval.baseline - interval.total,
    cancellationNote: breakdown.cleanCancellation
      ? 'Cancellation is clean on the aligned matched slice, so the market reference mostly collapses back to strike price + DPPA charge + loss adjustment.'
      : 'Cancellation only applies on matched energy here, so any contract mismatch stays visible in the selected-hour economics.',
  }
}

export function buildSelectedWalkthroughCase(inputs, interval) {
  return buildWalkthroughCase(inputs, interval, 1)
}

export function buildWalkthroughCases(inputs, intervals) {
  return ['shortfall', 'balanced', 'excess']
    .map((key, index) => {
      const interval = pickRepresentativeInterval(intervals, key)

      if (!interval) return null

      return buildWalkthroughCase(inputs, interval, index + 1)
    })
    .filter(Boolean)
}

export function buildFormulaBreakdown(inputs, interval) {
  const lossAdjustment = inputs.marketPrice * inputs.lossFactor - inputs.marketPrice
  const cleanCancellation = interval.matched > 0 && interval.contractQuantity === interval.matched
  const mismatchVolume = interval.contractQuantity - interval.matched
  const bauCost = interval.load * inputs.retailTariff
  const dppaCost = interval.total
  const savingsVsBau = bauCost - dppaCost
  const evnMarketReference = interval.matched * inputs.marketPrice
  const evnLossCharge = interval.evnMarket - evnMarketReference
  const cleanCancelledEnergy = Math.min(interval.matched, interval.contractQuantity)
  const uncancelledContractVolume = Math.max(interval.contractQuantity - interval.matched, 0)
  const uncancelledMatchedGap = Math.max(interval.matched - interval.contractQuantity, 0)
  const dppaUnitCost = interval.load > 0 ? dppaCost / interval.load : 0
  const bauUnitCost = interval.load > 0 ? bauCost / interval.load : 0
  const matchedShareOfLoad = interval.load > 0 ? interval.matched / interval.load : 0
  const shortfallShareOfLoad = interval.load > 0 ? interval.shortfall / interval.load : 0
  const contractShareOfLoad = interval.load > 0 ? interval.contractQuantity / interval.load : 0
  const evnMarketUnitOnLoad = interval.load > 0 ? interval.evnMarket / interval.load : 0
  const evnDppaUnitOnLoad = interval.load > 0 ? interval.evnDppa / interval.load : 0
  const evnRetailUnitOnLoad = interval.load > 0 ? interval.evnRetail / interval.load : 0
  const evnUnitCost = interval.load > 0 ? interval.evnTotal / interval.load : 0
  const developerUnitCost = interval.load > 0 ? interval.developer / interval.load : 0
  const spotMarketVisibleRate = interval.load > 0 ? interval.matched / interval.load * inputs.marketPrice : 0
  const cancellationViaSwapRate = interval.load > 0 ? -(Math.min(interval.matched, interval.contractQuantity) / interval.load * inputs.marketPrice) : 0
  const retainedStrikeRate = interval.load > 0 ? interval.contractQuantity / interval.load * inputs.strikePrice : 0
  const retainedEnergyRate = spotMarketVisibleRate + cancellationViaSwapRate + retainedStrikeRate + evnDppaUnitOnLoad + (interval.load > 0 ? evnLossCharge / interval.load : 0)
  const cancellationBaseUnit = inputs.marketPrice
  const cancellationSwapUnit = interval.contractQuantity > 0 ? inputs.marketPrice - inputs.strikePrice : 0
  const cancellationRecoveredUnit = interval.matched > 0 ? Math.min(interval.matched, interval.contractQuantity) / interval.load * inputs.marketPrice : 0
  const uncancelledContractUnit = interval.load > 0 ? uncancelledContractVolume / interval.load * (inputs.strikePrice - inputs.marketPrice) : 0

  return {
    hour: interval.hour,
    load: interval.load,
    generation: interval.generation,
    matched: interval.matched,
    shortfall: interval.shortfall,
    contractQuantity: interval.contractQuantity,
    strikePrice: inputs.strikePrice,
    marketPrice: inputs.marketPrice,
    retailTariff: inputs.retailTariff,
    dppaCharge: inputs.dppaCharge,
    marketPerMatched: inputs.marketPrice * inputs.lossFactor,
    developerSwapPerContract: inputs.strikePrice - inputs.marketPrice,
    lossAdjustment,
    impliedCancellation: inputs.strikePrice + inputs.dppaCharge + lossAdjustment,
    currentMatchedPrice: interval.intervalMatchedPrice,
    cleanCancelledEnergy,
    uncancelledContractVolume,
    uncancelledMatchedGap,
    evnMarketReference,
    evnLossCharge,
    matchedShareOfLoad,
    shortfallShareOfLoad,
    contractShareOfLoad,
    evnMarketUnitOnLoad,
    evnDppaUnitOnLoad,
    evnRetailUnitOnLoad,
    evnUnitCost,
    developerUnitCost,
    spotMarketVisibleRate,
    cancellationViaSwapRate,
    retainedStrikeRate,
    retainedEnergyRate,
    cancellationBaseUnit,
    cancellationSwapUnit,
    cancellationRecoveredUnit,
    uncancelledContractUnit,
    evnTotal: interval.evnTotal,
    developerTotal: interval.developer,
    dppaCost,
    total: interval.total,
    bauCost,
    bauUnitCost,
    dppaUnitCost,
    savingsVsBau,
    premiumVsBau: savingsVsBau,
    cleanCancellation,
    mismatchVolume,
  }
}

export function buildSelectedIntervalNarrative(interval, inputs) {
  const base = interval.classification.key === 'shortfall'
    ? `At ${String(interval.hour).padStart(2, '0')}:00, the factory still buys the unmatched load from EVN at the weighted 22 kV to below 110 kV retail tariff.`
    : interval.classification.key === 'excess'
      ? `At ${String(interval.hour).padStart(2, '0')}:00, solar is above load, so the commercial question is whether contracted volume stays disciplined enough for clean cancellation.`
      : `At ${String(interval.hour).padStart(2, '0')}:00, load and solar are aligned, so this is the clearest hour to compare BAU payment against DPPA payment.`

  if (interval.contractQuantity > interval.matched) {
    return `${base} Developer settlement is based on more energy than matched consumption, so the market-linked cancellation only works on the matched slice.`
  }

  return `${base} Contract quantity tracks matched consumption here, so the market-linked terms mostly cancel back toward strike price plus DPPA charge and the loss adjustment.`
}
