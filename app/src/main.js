import './style.css'
import './theme.css'
import {
  defaultInputs,
  hours,
  scenarioOrder,
  scenarioProfiles,
  settlementModes,
  buildFmpCurve,
  buildWorkshopFmpCurve,
} from './data/default-scenarios.js'
import { renderMultiYearChart, renderProfileChart } from './modules/chart.js'
import {
  buildFiveLineBill,
  buildFormulaBreakdown,
  buildSelectedWalkthroughCase,
  calculateSettlement,
  projectMultiYear,
} from './modules/settlement.js'
import {
  renderAppShell,
  renderFiveLineBill,
  renderFormulas,
  renderMultiYearPanel,
  renderSelectedHourDetails,
  renderWalkthroughCases,
  setActiveCurrency,
  setActiveScenario,
  updateControlOutputs,
} from './modules/ui.js'
import { initTeachMode } from './modules/teach.js'
import { initTheme } from './modules/theme.js'
import { initTour } from './modules/tour.js'
import { initI18n, t } from './modules/i18n.js'

if (navigator.webdriver) {
  // Headless-Chromium's backdrop-filter blur compositing is not pixel-stable
  // frame-to-frame, which defeats Playwright's screenshot-stability check.
  // Suppressing it only under automation keeps the real neon look untouched.
  document.documentElement.dataset.webdriver = 'true'
}

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
    fmpCurve: isWorkshop
      ? buildWorkshopFmpCurve(state.marketPrice, state.strikePrice, scenario.fmpSide)
      : buildFmpCurve(state.marketPrice),
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
    return t('warning_excess_risk_template').replace('{scenario}', scenario.label)
  }

  if (totals.blendedPrice > totals.noDppaBlended) {
    return t('warning_expensive')
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
    renderProfileChart(
      document.querySelector('#profileChart'),
      hourLabels,
      settlement.intervals,
      selectedInterval.hour,
      (hour) => {
        state.selectedHour = hour
        updateView()
      },
      inputs,
      state.currency,
    )
  } catch (error) {
    console.error('Profile chart render failed:', error)
  }
  renderWalkthroughCases(
    document.querySelector('#walkthroughCases'),
    selectedWalkthroughCase,
    state.currency,
    formulas,
  )
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
    const bill = buildFiveLineBill(
      {
        fmp: state.marketPrice,
        strikePrice: state.strikePrice,
        serviceFee: state.dppaServiceFee,
        clearingFee: state.dppaClearingFee,
        lossFactorPrecise: 1.026 * 1.008,
        lossFactor: state.lossFactor,
        retailTariff: state.retailTariff,
      },
      scenario.monthlyVolumes,
    )
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

function initLangSelector() {
  const actions = document.querySelector('.topbar-actions')
  if (!actions || document.querySelector('#langSelector')) return
  const group = document.createElement('div')
  group.id = 'langSelector'
  group.className = 'toggle-group'
  group.setAttribute('aria-label', 'Language')
  group.innerHTML = ['en', 'vi', 'zh']
    .map(
      (code) =>
        `<button class="toggle-button" data-lang="${code}" type="button">${code.toUpperCase()}</button>`,
    )
    .join('')
  group.addEventListener('click', (event) => {
    const button = event.target.closest('[data-lang]')
    if (!button) return
    const params = new URLSearchParams(window.location.search)
    params.set('lang', button.dataset.lang)
    window.location.search = params.toString()
  })
  actions.appendChild(group)
}

initI18n()
renderAppShell(document.querySelector('#app'), getScenarioList(), settlementModes)
initTheme()
initLangSelector()
syncControls()
syncInputsFromState()
updateView()
initTeachMode()
initTour()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}
