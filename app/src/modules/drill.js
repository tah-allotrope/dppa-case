// PHASE-06 (plans/2026-09-05-gate-model-and-october-readiness-plan.md): presenter drill
// mode (?drill=1) -- the mission statement's first instrument ("draw the five-line bill
// from memory"). Presenter-private practice, not projected material, so its labels are
// English literals at their call sites and never enter the string table (ASM-005 of that
// plan -- do not "fix" this by routing them through i18n).
import { buildFiveLineBill } from './settlement.js'
import { defaultInputs, scenarioProfiles } from '../data/default-scenarios.js'

const STORAGE_KEY = 'dppa-drill'
const LINES = ['marketEnergy', 'systemService', 'diffClearing', 'additionalPurchase', 'cfd']
const LINE_LABELS = {
  marketEnergy: 'Market energy (million VND)',
  systemService: 'System service (million VND)',
  diffClearing: 'Differential clearing (million VND)',
  additionalPurchase: 'Additional retail purchase (million VND)',
  cfd: 'Contract-for-difference settlement (million VND, negative when the developer pays you)',
}

export function gradeBillEntry(entered, expected, tolerance = 0.005) {
  const lines = {}
  let correctCount = 0
  for (const key of LINES) {
    const expectedVnd = expected.lines[key]
    const enteredVnd = entered[key]
    const correct =
      expectedVnd === 0
        ? enteredVnd === 0
        : Math.abs(enteredVnd - expectedVnd) <= tolerance * Math.abs(expectedVnd)
    if (correct) correctCount += 1
    lines[key] = {
      entered: enteredVnd,
      expected: expectedVnd,
      correct,
      deltaVnd: enteredVnd - expectedVnd,
    }
  }
  return { lines, correctCount, allCorrect: correctCount === LINES.length }
}

export function formatDrillDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function loadDrillRecords(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveDrillRecords(storage, records) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // Storage unavailable (e.g. private browsing) -- the drill still grades.
  }
}

function sliderValue(id, fallback) {
  const el = document.querySelector(`#${id}`)
  const value = el ? Number(el.value) : NaN
  return Number.isFinite(value) ? value : fallback
}

function activeScenarioId() {
  const active = document.querySelector('.scenario-tab.is-active')
  const id = active ? active.dataset.scenario : null
  return id && scenarioProfiles[id] ? id : 'workshop1'
}

function expectedBill() {
  const scenarioId = activeScenarioId()
  const scenario = scenarioProfiles[scenarioId]
  const volumes = scenario.monthlyVolumes || scenarioProfiles.workshop1.monthlyVolumes
  return {
    scenarioId,
    bill: buildFiveLineBill(
      {
        fmp: sliderValue('marketPrice', defaultInputs.marketPrice),
        strikePrice: sliderValue('strikePrice', defaultInputs.strikePrice),
        serviceFee: defaultInputs.dppaServiceFee,
        clearingFee: defaultInputs.dppaClearingFee,
        lossFactorPrecise: 1.026 * 1.008,
        lossFactor: sliderValue('lossFactor', defaultInputs.lossFactor),
        retailTariff: defaultInputs.retailTariff,
      },
      volumes,
    ),
  }
}

export function initDrillMode(search) {
  const params = new URLSearchParams(typeof search === 'string' ? search : window.location.search)
  if (params.get('drill') !== '1') return

  const fiveLineBill = document.querySelector('#fiveLineBill')
  if (fiveLineBill) fiveLineBill.hidden = true

  const overlay = document.createElement('div')
  overlay.id = 'drillOverlay'
  overlay.setAttribute('role', 'region')
  overlay.setAttribute('aria-label', 'Presenter bill drill')
  overlay.innerHTML = `
    <div class="drill-inner">
      <h2>Bill drill — draw the five lines from memory</h2>
      <p>Enter each line in million VND (negative when the developer pays you). The timer starts on your first keystroke.</p>
      <div class="drill-inputs">
        ${LINES.map(
          (key) => `
          <label>${LINE_LABELS[key]}
            <input type="number" step="any" data-drill-line="${key}" inputmode="decimal">
          </label>`,
        ).join('')}
      </div>
      <div class="drill-actions">
        <button type="button" id="drillSubmit">Grade attempt</button>
        <button type="button" id="drillReset">New attempt</button>
      </div>
      <p class="drill-timer" aria-live="polite"></p>
      <div class="drill-result" aria-live="polite"></div>
      <p class="drill-best" aria-live="polite"></p>
    </div>
  `
  document.body.appendChild(overlay)

  const inputs = [...overlay.querySelectorAll('[data-drill-line]')]
  const timerEl = overlay.querySelector('.drill-timer')
  const resultEl = overlay.querySelector('.drill-result')
  const bestEl = overlay.querySelector('.drill-best')
  let startedAt = null

  const renderBest = (scenarioId) => {
    const records = loadDrillRecords(window.localStorage)
    const record = records[scenarioId]
    bestEl.textContent =
      record && record.bestMs != null
        ? `Best on ${scenarioId}: ${formatDrillDuration(record.bestMs)} (streak ${record.streak || 0})`
        : `No timed attempt yet on ${scenarioId}.`
  }

  const markStarted = () => {
    if (startedAt === null) {
      startedAt = Date.now()
      timerEl.textContent = 'Timer running…'
    }
  }
  inputs.forEach((input) => input.addEventListener('input', markStarted))

  const reset = () => {
    startedAt = null
    timerEl.textContent = ''
    resultEl.innerHTML = ''
    inputs.forEach((input) => {
      input.value = ''
    })
    renderBest(activeScenarioId())
    if (fiveLineBill) fiveLineBill.hidden = true
  }

  const submit = () => {
    const { scenarioId, bill } = expectedBill()
    const entered = {}
    for (const input of inputs) {
      const millions = Number(input.value)
      entered[input.dataset.drillLine] = Number.isFinite(millions)
        ? Math.round(millions * 1e6)
        : NaN
    }
    const elapsedMs = startedAt === null ? 0 : Date.now() - startedAt
    const grading = gradeBillEntry(entered, bill)
    const rows = LINES.map((key) => {
      const line = grading.lines[key]
      const mark = line.correct ? 'correct' : 'wrong'
      const deltaMillions = (line.deltaVnd / 1e6).toFixed(1)
      return `<li class="drill-line-${mark}">${LINE_LABELS[key]}: you entered ${(line.entered / 1e6).toFixed(1)}m, expected ${(line.expected / 1e6).toFixed(1)}m (off by ${deltaMillions}m).</li>`
    }).join('')
    resultEl.innerHTML = `
      <p>${grading.correctCount} of 5 lines correct in ${formatDrillDuration(elapsedMs)}.</p>
      <ul>${rows}</ul>
    `
    timerEl.textContent = `Attempt: ${formatDrillDuration(elapsedMs)}.`
    const records = loadDrillRecords(window.localStorage)
    const previous = records[scenarioId] || {}
    const bestMs =
      grading.allCorrect && (previous.bestMs == null || elapsedMs < previous.bestMs)
        ? elapsedMs
        : previous.bestMs != null
          ? previous.bestMs
          : null
    records[scenarioId] = {
      bestMs,
      streak: grading.allCorrect ? (previous.streak || 0) + 1 : 0,
      lastMs: elapsedMs,
    }
    saveDrillRecords(window.localStorage, records)
    renderBest(scenarioId)
  }

  overlay.querySelector('#drillSubmit').addEventListener('click', submit)
  overlay.querySelector('#drillReset').addEventListener('click', reset)
  renderBest(activeScenarioId())
}
