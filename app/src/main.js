import './style.css'
import mermaid from 'mermaid'
import { defaultInputs, hours, scenarioOrder, scenarioProfiles, settlementModes } from './data/default-scenarios'
import { renderProfileChart } from './modules/chart'
import { buildSelectedIntervalNarrative, buildFormulaBreakdown, buildSelectedWalkthroughCase, calculateSettlement } from './modules/settlement'
import { renderAppShell, renderBauComparison, renderFormulas, renderSelectedHour, renderSelectedHourDetails, renderVolumeSummary, renderWalkthroughCases, setActiveCurrency, setActiveDetailView, setActiveScenario, updateControlOutputs } from './modules/ui'

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'dark' })

const state = { ...defaultInputs }
let strikeManuallyOverridden = false

function getScenarioList() {
  return scenarioOrder.map((id) => scenarioProfiles[id])
}

function buildInputs() {
  const scenario = scenarioProfiles[state.scenarioId]

  return {
    ...state,
    loadProfile: scenario.loadProfile,
    generationProfile: scenario.generationProfile,
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

function updateView() {
  const inputs = buildInputs()
  const scenario = scenarioProfiles[state.scenarioId]
  const settlement = calculateSettlement(inputs)
  const hourLabels = hours.map((hour) => `${String(hour).padStart(2, '0')}:00`)
  const selectedInterval = settlement.intervals[state.selectedHour] ?? settlement.intervals[12]
  const formulas = buildFormulaBreakdown(inputs, selectedInterval)
  const selectedWalkthroughCase = buildSelectedWalkthroughCase(inputs, selectedInterval)

  renderProfileChart(document.querySelector('#profileChart'), hourLabels, settlement.intervals, selectedInterval.hour, (hour) => {
    state.selectedHour = hour
    updateView()
  }, inputs)
  renderVolumeSummary(document.querySelector('#volumeSummary'), settlement.totals)
  renderWalkthroughCases(document.querySelector('#walkthroughCases'), selectedWalkthroughCase, state.currency)
  renderFormulas(formulas, getWarningText(settlement.totals, scenario), state.currency)
  renderSelectedHour(
    document.querySelector('#selectedHourPanel'),
    selectedInterval,
    buildSelectedIntervalNarrative(selectedInterval, inputs),
    state.currency,
    state.detailView,
    inputs,
  )
  renderSelectedHourDetails(
    document.querySelector('#selectedHourDetailsPanel'),
    selectedInterval,
    state.currency,
    inputs,
  )
  renderBauComparison(document.querySelector('#bauComparison'), formulas, state.currency)
  updateControlOutputs(state, settlementModes, state.currency)
  setActiveScenario(state.scenarioId)
  setActiveCurrency(state.currency)
  setActiveDetailView(state.detailView)
  mermaid.run({ nodes: [document.querySelector('#cancellationMermaid')] })
}

function applyRetailLinkedStrike(retailTariff) {
  state.strikePrice = Number((retailTariff * 0.95).toFixed(2))
}

function syncControls() {
  const mappings = [
    ['strikePrice', 'strikePrice', Number],
    ['marketPrice', 'marketPrice', Number],
    ['dppaCharge', 'dppaCharge', Number],
    ['lossFactor', 'lossFactor', Number],
    ['retailTariff', 'retailTariff', Number],
    ['settlementMode', 'settlementMode', String],
  ]

  mappings.forEach(([id, key, transform]) => {
    const element = document.querySelector(`#${id}`)
    element.value = state[key]
    element.addEventListener('input', (event) => {
      state[key] = transform(event.target.value)

      if (key === 'strikePrice') {
        strikeManuallyOverridden = true
      }

      if (key === 'retailTariff' && !strikeManuallyOverridden) {
        applyRetailLinkedStrike(state.retailTariff)
        document.querySelector('#strikePrice').value = state.strikePrice
      }

      updateView()
    })
  })

  document.querySelector('#scenarioTabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-scenario]')
    if (!button) return
    state.scenarioId = button.dataset.scenario
    state.selectedHour = 12
    updateView()
  })

  document.querySelector('#currencyToggle').addEventListener('click', (event) => {
    const button = event.target.closest('[data-currency]')
    if (!button) return
    state.currency = button.dataset.currency
    updateView()
  })

  document.querySelector('#detailViewToggle').addEventListener('click', (event) => {
    const button = event.target.closest('[data-detail-view]')
    if (!button) return
    state.detailView = button.dataset.detailView
    updateView()
  })

  document.querySelector('#resetButton').addEventListener('click', () => {
    Object.assign(state, defaultInputs)
    strikeManuallyOverridden = false
    syncInputsFromState()
    updateView()
  })
}

function syncInputsFromState() {
  document.querySelector('#strikePrice').value = state.strikePrice
  document.querySelector('#marketPrice').value = state.marketPrice
  document.querySelector('#dppaCharge').value = state.dppaCharge
  document.querySelector('#lossFactor').value = state.lossFactor
  document.querySelector('#retailTariff').value = state.retailTariff
  document.querySelector('#settlementMode').value = state.settlementMode
}

renderAppShell(document.querySelector('#app'), getScenarioList(), settlementModes)
syncControls()
syncInputsFromState()
updateView()
