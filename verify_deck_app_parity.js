const scenarios = {
  'Workshop 1': {
    constants: { fmp: 1150, strike: 1250, service: 360, clearing: 163.3, retail: 2204 },
    volumes: { contracted: 5000000, total: 5000000 },
    expected: {
      marketEnergy: 5946696000,
      systemService: 1800000000,
      diffClearing: 816500000,
      additionalPurchase: 0,
      cEvn: 8563196000,
      cfd: 500000000,
      cKh: 9063196000,
      plantMarket: 5796000000,
      plantRevenue: 6296000000,
    },
  },
  'Workshop 2': {
    constants: { fmp: 1600, strike: 1500, service: 360, clearing: 163.3, retail: 2204 },
    volumes: { contracted: 8000000, total: 9000000 },
    expected: {
      marketEnergy: 13237862400,
      systemService: 2880000000,
      diffClearing: 1306400000,
      additionalPurchase: 2204000000,
      cEvn: 19628262400,
      cfd: -800000000,
      cKh: 18828262400,
      plantMarket: 12902400000,
      plantRevenue: 12102400000,
    },
  },
}

const lossFactorPrecise = 1.026 * 1.008
const kppOnly = 1.008

function buildBill(constants, volumes) {
  const contracted = volumes.contracted
  const shortfall = Math.max(volumes.total - contracted, 0)
  const marketEnergy = Math.round(contracted * constants.fmp * lossFactorPrecise)
  const systemService = Math.round(contracted * constants.service)
  const diffClearing = Math.round(contracted * constants.clearing)
  const additionalPurchase = Math.round(shortfall * constants.retail)
  const cfd = Math.round(contracted * (constants.strike - constants.fmp))
  const cEvn = marketEnergy + systemService + diffClearing + additionalPurchase
  const plantMarket = Math.round(contracted * kppOnly * constants.fmp)
  return {
    marketEnergy,
    systemService,
    diffClearing,
    additionalPurchase,
    cEvn,
    cfd,
    cKh: cEvn + cfd,
    plantMarket,
    plantRevenue: plantMarket + cfd,
  }
}

let failed = false
for (const [name, scenario] of Object.entries(scenarios)) {
  const actual = buildBill(scenario.constants, scenario.volumes)
  for (const [key, expected] of Object.entries(scenario.expected)) {
    const ok = actual[key] === expected
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${key}: actual=${actual[key]} expected=${expected}`)
    failed ||= !ok
  }
}

if (failed) process.exit(1)
