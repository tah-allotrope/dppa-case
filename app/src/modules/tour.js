import { tourSteps } from '../data/tour-steps.js'
import { STRINGS } from '../data/strings.js'
import { getActiveLang, t } from './i18n.js'

const DONE_KEY = 'dppa-tour-done'

export function shouldAutoStartTour(search = window.location.search, storage = localStorage) {
  const p = new URLSearchParams(search)
  return !storage.getItem(DONE_KEY) && p.get('teach') !== '1' && p.get('present') !== '1'
}

export function startTour() {
  let index = 0
  document.querySelector('#tourOverlay')?.remove()
  const overlay = document.createElement('div')
  overlay.id = 'tourOverlay'
  overlay.innerHTML = `<div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourCardTitle"><h2 id="tourCardTitle"></h2><h3></h3><p class="tour-en"></p><p class="tour-vi"></p><div class="tour-actions"><button data-tour="back">${t('tour_back')}</button><button data-tour="skip">${t('tour_skip')}</button><button data-tour="next">${t('tour_next')}</button></div></div>`
  document.body.appendChild(overlay)
  const finish = () => {
    localStorage.setItem(DONE_KEY, '1')
    overlay.remove()
  }
  const render = () => {
    const s = tourSteps[index]
    const isEnglish = getActiveLang() === 'en'
    const enStrings = { title: STRINGS.en[s.titleKey], body: STRINGS.en[s.bodyKey] }
    overlay.querySelector('h2').textContent = t(s.titleKey)
    overlay.querySelector('h3').textContent = isEnglish ? '' : enStrings.title
    overlay.querySelector('.tour-en').textContent = t(s.bodyKey)
    overlay.querySelector('.tour-vi').textContent = isEnglish ? '' : enStrings.body
    document.querySelector(s.target)?.scrollIntoView({ block: 'center' })
  }
  overlay.addEventListener('click', (e) => {
    const a = e.target.dataset.tour
    if (a === 'skip') finish()
    if (a === 'back') {
      index = Math.max(0, index - 1)
      render()
    }
    if (a === 'next') {
      if (index === tourSteps.length - 1) finish()
      else {
        index += 1
        render()
      }
    }
  })
  render()
}

export function initTour() {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'tour-launch'
  b.textContent = '?'
  b.setAttribute('aria-label', t('tour_launch_aria'))
  b.addEventListener('click', startTour)
  ;(
    document.querySelector('#topbarSecondary') || document.querySelector('.topbar-actions')
  )?.appendChild(b)
  if (shouldAutoStartTour()) startTour()
}
