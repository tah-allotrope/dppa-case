import './style.css'
import mermaid from 'mermaid'
import { defaultInputs, hours, scenarioOrder, scenarioProfiles, settlementModes, buildFmpCurve } from './data/default-scenarios'
import { renderMultiYearChart, renderProfileChart } from './modules/chart'
import { buildFormulaBreakdown, buildSelectedWalkthroughCase, calculateSettlement, projectMultiYear } from './modules/settlement'
import { renderAppShell, renderFormulas, renderMultiYearPanel, renderSelectedHourDetails, renderWalkthroughCases, setActiveCurrency, setActiveScenario, updateControlOutputs } from './modules/ui'

mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'dark' })

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

const state = { ...defaultInputs }
let mermaidRenderToken = 0

function showMermaidFallback(node) {
  if (!node) return
  node.innerHTML = '<p class="mermaid-fallback">Diagram updating…</p>'
}

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

async function renderMermaidDiagram(definition) {
  const node = document.querySelector('#cancellationMermaid')
  if (!node || !definition) return

  const token = ++mermaidRenderToken
  const renderId = `cancellation-flow-${token}`
  try {
    const { svg, bindFunctions } = await mermaid.render(renderId, definition)

    if (token !== mermaidRenderToken) return

    node.innerHTML = svg
    bindFunctions?.(node)
  } catch (error) {
    console.error('Mermaid render failed:', error)
    if (token === mermaidRenderToken) {
      showMermaidFallback(node)
    }
  }
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
  const mermaidDefinition = renderFormulas(formulas, getWarningText(settlement.totals, scenario), state.currency)
  renderSelectedHourDetails(
    document.querySelector('#selectedHourDetailsPanel'),
    selectedInterval,
    state.currency,
    inputs,
  )
  updateControlOutputs(state, settlementModes, state.currency)
  setActiveScenario(state.scenarioId)
  setActiveCurrency(state.currency)

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

  try {
    await renderMermaidDiagram(mermaidDefinition)
  } catch (error) {
    console.error('Mermaid diagram update failed:', error)
    const node = document.querySelector('#cancellationMermaid')
    showMermaidFallback(node)
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
  document.querySelector('#evnEscalation').value = state.evnEscalation
  document.querySelector('#strikeEscalation').value = state.strikeEscalation
  document.querySelector('#horizonYears').value = state.horizonYears
}

renderAppShell(document.querySelector('#app'), getScenarioList(), settlementModes)
syncControls()
syncInputsFromState()
updateView()
