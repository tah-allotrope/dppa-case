// PHASE-02: presenter-facing step-through ("teach mode") for the six scripted
// app moments in the Modules 1-6 teaching revamp. Activated only by ?teach=1
// so normal app UX is untouched without the flag (RISK-02-01 in the plan).
import { teachSteps } from '../data/teach-steps.js'
import { t } from './i18n.js'

function setControlValue(id, value) {
  const el = document.querySelector(`#${id}`)
  if (!el) return
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

function selectScenario(scenarioId) {
  const button = document.querySelector(`[data-scenario="${scenarioId}"]`)
  if (button) button.click()
}

function applyStep(index) {
  const step = teachSteps[index]
  if (!step) return

  selectScenario(step.scenarioId)
  Object.entries(step.controls || {}).forEach(([key, value]) => setControlValue(key, value))

  const target = step.scrollTo ? document.querySelector(step.scrollTo) : null
  if (target && typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const banner = document.querySelector('#teachBanner')
  if (banner) {
    banner.querySelector('.teach-step-counter').textContent = t('teach_demo_counter_template')
      .replace('{index}', index + 1)
      .replace('{total}', teachSteps.length)
      .replace('{title}', t(step.titleKey))
    banner.querySelector('.teach-annotation').textContent = t(step.annotationKey)
    banner.querySelector('.teach-expected').textContent = t(step.expectedKey)
  }
}

function buildBanner(state) {
  const banner = document.createElement('div')
  banner.id = 'teachBanner'
  banner.setAttribute('role', 'region')
  banner.setAttribute('aria-label', t('teach_region_aria'))
  banner.innerHTML = `
    <div class="teach-banner-inner">
      <button type="button" id="teachPrev" aria-label="${t('teach_prev_aria')}">&larr;</button>
      <div class="teach-banner-text">
        <strong class="teach-step-counter"></strong>
        <span class="teach-annotation"></span>
        <em class="teach-expected"></em>
      </div>
      <button type="button" id="teachNext" aria-label="${t('teach_next_aria')}">&rarr;</button>
    </div>
  `
  document.body.appendChild(banner)

  document.querySelector('#teachPrev').addEventListener('click', () => {
    state.index = (state.index - 1 + teachSteps.length) % teachSteps.length
    applyStep(state.index)
  })
  document.querySelector('#teachNext').addEventListener('click', () => {
    state.index = (state.index + 1) % teachSteps.length
    applyStep(state.index)
  })
}

export function initTeachMode() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('teach') !== '1') return

  const state = { index: 0 }
  buildBanner(state)
  applyStep(0)

  window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') document.querySelector('#teachNext').click()
    if (event.key === 'ArrowLeft') document.querySelector('#teachPrev').click()
  })
}
