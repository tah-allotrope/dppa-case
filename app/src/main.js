import './style.css'
import { defaultInputs, hours, scenarioOrder, scenarioProfiles, settlementModes, buildFmpCurve } from './data/default-scenarios'
import { renderMultiYearChart, renderProfileChart } from './modules/chart'
import { buildFiveLineBill, buildFormulaBreakdown, buildSelectedWalkthroughCase, calculateSettlement, projectMultiYear } from './modules/settlement'
import { renderAppShell, renderFiveLineBill, renderFormulas, renderMultiYearPanel, renderSelectedHourDetails, renderWalkthroughCases, setActiveCurrency, setActiveScenario, updateControlOutputs } from './modules/ui'

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

const state = { ...defaultInputs }

function showCancellationFlowFallback(node) {
  if (!node) return
  node.innerHTML = '<p class="cancellation-flow-fallback">Flow diagram updating…</p>'
}

function getScenarioList() {
  return scenarioOrder.map((id) => scenarioProfiles[id])
}

function buildInputs() {
  const scenario = scenarioProfiles[state.scenarioId]
  const isWorkshop = scenario.kind === 'workshop'

  return {
    ...state,
    loadProfile: scenario.loadProfile,
    generationProfile: scenario.generationProfile,
    fmpCurve: isWorkshop ? Array(24).fill(state.marketPrice) : buildFmpCurve(state.marketPrice),
    monthlyVolumes: scenario.monthlyVolumes,
  }
}

function applyScenarioDefaults(scenario) {
  if (scenario.overrides) {
    Object.assign(state, scenario.overrides)
  } else {
    state.strikePrice = defaultInputs.strikePrice
    state.marketPrice = defaultInputs.marketPrice
  }
}

function getWarningText(totals, scenario) {
  if (totals.excessRisk) {
    return `Warning: ${scenario.label} currently settles more contracted energy than matched consumption. This is the overgeneration risk your CFO should watch.`
  }

  if (totals.blendedPrice > totals.noDppaBlended) {
    return 'Current setup is more expensive than the no-DPPA baseline because either strike is high, DPPA charge is large, or matched volume is too low.'
  }

  return ''
}

async function updateView() {
  const inputs = buildInputs()
  const scenario = scenarioProfiles[state.scenarioId]
  const settlement = calculateSettlement(inputs)
  const hourLabels = hours.map((hour) => `${String(hour).padStart(2, '0')}:00`)
  const selectedInterval = settlement.intervals[state.selectedHour] ?? settlement.intervals[12]
  const formulas = buildFormulaBreakdown(inputs, selectedInterval)
  const selectedWalkthroughCase = buildSelectedWalkthroughCase(inputs, selectedInterval)

  try {
    renderProfileChart(document.querySelector('#profileChart'), hourLabels, settlement.intervals, selectedInterval.hour, (hour) => {
      state.selectedHour = hour
      updateView()
    }, inputs)
  } catch (error) {
    console.error('Profile chart render failed:', error)
  }
  renderWalkthroughCases(document.querySelector('#walkthroughCases'), selectedWalkthroughCase, state.currency, formulas)
  try {
    renderFormulas(formulas, getWarningText(settlement.totals, scenario), state.currency)
  } catch (error) {
    console.error('Cancellation flow render failed:', error)
    const node = document.querySelector('#cancellationFlow')
    showCancellationFlowFallback(node)
  }
  renderSelectedHourDetails(
    document.querySelector('#selectedHourDetailsPanel'),
    selectedInterval,
    state.currency,
    inputs,
  )
  if (scenario.kind === 'workshop') {
    const bill = buildFiveLineBill({
      fmp: state.marketPrice,
      strikePrice: state.strikePrice,
      serviceFee: state.dppaServiceFee,
      clearingFee: state.dppaClearingFee,
      lossFactorPrecise: 1.026 * 1.008,
      lossFactor: state.lossFactor,
      retailTariff: state.retailTariff,
    }, scenario.monthlyVolumes)
    renderFiveLineBill(document.querySelector('#fiveLineBill'), bill, state.currency, scenario)
  } else {
    renderFiveLineBill(document.querySelector('#fiveLineBill'), null, state.currency, scenario)
  }
  updateControlOutputs(state, settlementModes, state.currency)
  setActiveScenario(state.scenarioId)
  setActiveCurrency(state.currency)

  const hourLabelNode = document.querySelector('#hourNavLabel')
  if (hourLabelNode) {
    hourLabelNode.textContent = `${String(selectedInterval.hour).padStart(2, '0')}:00`
  }

  const multiYear = projectMultiYear(inputs, {
    years: state.horizonYears,
    evnEscalation: state.evnEscalation,
    strikeEscalation: state.strikeEscalation,
  })
  renderMultiYearPanel(multiYear, state.currency)
  try {
    renderMultiYearChart(document.querySelector('#multiYearChart'), multiYear, state.currency)
  } catch (error) {
    console.error('Multi-year chart render failed:', error)
  }
}

function syncControls() {
  const mappings = [
    ['strikePrice', 'strikePrice', Number],
    ['marketPrice', 'marketPrice', Number],
    ['dppaCharge', 'dppaCharge', Number],
    ['lossFactor', 'lossFactor', Number],
    ['settlementMode', 'settlementMode', String],
    ['evnEscalation', 'evnEscalation', Number],
    ['strikeEscalation', 'strikeEscalation', Number],
    ['horizonYears', 'horizonYears', Number],
  ]

  mappings.forEach(([id, key, transform]) => {
    const element = document.querySelector(`#${id}`)
    element.value = state[key]
    element.addEventListener('input', (event) => {
      state[key] = transform(event.target.value)

      updateView()
    })
  })

  document.querySelector('#scenarioTabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-scenario]')
    if (!button) return
    state.scenarioId = button.dataset.scenario
    state.selectedHour = 12
    applyScenarioDefaults(scenarioProfiles[state.scenarioId])
    syncInputsFromState()
    updateView()
  })

  document.querySelector('#currencyToggle').addEventListener('click', (event) => {
    const button = event.target.closest('[data-currency]')
    if (!button) return
    state.currency = button.dataset.currency
    updateView()
  })

  document.querySelector('#resetButton').addEventListener('click', () => {
    Object.assign(state, defaultInputs)
    syncInputsFromState()
    updateView()
  })

  document.querySelector('#prevHour').addEventListener('click', () => {
    state.selectedHour = (state.selectedHour - 1 + hours.length) % hours.length
    updateView()
  })

  document.querySelector('#nextHour').addEventListener('click', () => {
    state.selectedHour = (state.selectedHour + 1) % hours.length
    updateView()
  })
}

function syncInputsFromState() {
  document.querySelector('#strikePrice').value = state.strikePrice
  document.querySelector('#marketPrice').value = state.marketPrice
  document.querySelector('#dppaCharge').value = state.dppaCharge
  document.querySelector('#lossFactor').value = state.lossFactor
  document.querySelector('#settlementMode').value = state.settlementMode
  document.querySelector('#evnEscalation').value = state.evnEscalation
  document.querySelector('#strikeEscalation').value = state.strikeEscalation
  document.querySelector('#horizonYears').value = state.horizonYears
}

renderAppShell(document.querySelector('#app'), getScenarioList(), settlementModes)
syncControls()
syncInputsFromState()
updateView()
