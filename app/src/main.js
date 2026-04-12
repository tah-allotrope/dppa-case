import './style.css'
import mermaid from 'mermaid'
import { defaultInputs, hours, scenarioOrder, scenarioProfiles, settlementModes, buildFmpCurve } from './data/default-scenarios'
import { renderProfileChart } from './modules/chart'
import { buildFormulaBreakdown, buildSelectedWalkthroughCase, calculateSettlement } from './modules/settlement'
import { renderAppShell, renderFormulas, renderSelectedHourDetails, renderWalkthroughCases, setActiveCurrency, setActiveScenario, updateControlOutputs } from './modules/ui'

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'dark' })

const state = { ...defaultInputs }

function getScenarioList() {
  return scenarioOrder.map((id) => scenarioProfiles[id])
}

function buildInputs() {
  const scenario = scenarioProfiles[state.scenarioId]

  return {
    ...state,
    loadProfile: scenario.loadProfile,
    generationProfile: scenario.generationProfile,
    fmpCurve: buildFmpCurve(state.marketPrice),
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
  renderWalkthroughCases(document.querySelector('#walkthroughCases'), selectedWalkthroughCase, state.currency, formulas)
  renderFormulas(formulas, getWarningText(settlement.totals, scenario), state.currency)
  renderSelectedHourDetails(
    document.querySelector('#selectedHourDetailsPanel'),
    selectedInterval,
    state.currency,
    inputs,
  )
  updateControlOutputs(state, settlementModes, state.currency)
  setActiveScenario(state.scenarioId)
  setActiveCurrency(state.currency)
  mermaid.run({ nodes: [document.querySelector('#cancellationMermaid')] })
}

function syncControls() {
  const mappings = [
    ['strikePrice', 'strikePrice', Number],
    ['marketPrice', 'marketPrice', Number],
    ['dppaCharge', 'dppaCharge', Number],
    ['lossFactor', 'lossFactor', Number],
    ['settlementMode', 'settlementMode', String],
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
}

function syncInputsFromState() {
  document.querySelector('#strikePrice').value = state.strikePrice
  document.querySelector('#marketPrice').value = state.marketPrice
  document.querySelector('#dppaCharge').value = state.dppaCharge
  document.querySelector('#lossFactor').value = state.lossFactor
  document.querySelector('#settlementMode').value = state.settlementMode
}

renderAppShell(document.querySelector('#app'), getScenarioList(), settlementModes)
syncControls()
syncInputsFromState()
updateView()
