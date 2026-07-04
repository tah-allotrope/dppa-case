// PHASE-02: presenter-facing step-through ("teach mode") for the six scripted
// app moments in the Modules 1-6 teaching revamp. Activated only by ?teach=1
// so normal app UX is untouched without the flag (RISK-02-01 in the plan).
import { teachSteps } from '../data/teach-steps'

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
    banner.querySelector('.teach-step-counter').textContent = `Demo ${index + 1}/${teachSteps.length} — ${step.title}`
    banner.querySelector('.teach-annotation').textContent = step.annotation
    banner.querySelector('.teach-expected').textContent = step.expected
  }
}

function buildBanner(state) {
  const banner = document.createElement('div')
  banner.id = 'teachBanner'
  banner.setAttribute('role', 'region')
  banner.setAttribute('aria-label', 'Presenter teach mode')
  banner.innerHTML = `
    <div class="teach-banner-inner">
      <button type="button" id="teachPrev" aria-label="Previous demo">&larr;</button>
      <div class="teach-banner-text">
        <strong class="teach-step-counter"></strong>
        <span class="teach-annotation"></span>
        <em class="teach-expected"></em>
      </div>
      <button type="button" id="teachNext" aria-label="Next demo">&rarr;</button>
    </div>
  `
  document.body.appendChild(banner)

  const style = document.createElement('style')
  style.textContent = `
    #teachBanner { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10000;
      background: #0b1220; color: #f6fbff; border-top: 2px solid #47d7ff;
      font-family: 'Inter', system-ui, sans-serif; padding: 10px 16px; }
    .teach-banner-inner { display: flex; align-items: center; gap: 16px; max-width: 1100px; margin: 0 auto; }
    .teach-banner-text { flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: 0.9rem; }
    .teach-step-counter { color: #47d7ff; }
    .teach-expected { color: #8b97a8; font-size: 0.8rem; }
    #teachPrev, #teachNext { background: #16213a; color: #f6fbff; border: 1px solid #2a3a5c;
      border-radius: 6px; padding: 6px 14px; cursor: pointer; font-size: 1rem; }
    #teachPrev:hover, #teachNext:hover { background: #1f2d4d; }
  `
  document.head.appendChild(style)

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
