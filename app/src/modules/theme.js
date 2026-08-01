import { t } from './i18n.js'

const STORAGE_KEY = 'dppa-theme'

export function resolveTheme(search = window.location.search, storage = window.localStorage) {
  const params = new URLSearchParams(search)
  if (params.get('present') === '1' || params.get('teach') === '1') return 'present'
  return storage.getItem(STORAGE_KEY) === 'present' ? 'present' : 'default'
}

export function applyTheme(theme, { persist = false } = {}) {
  const normalized = theme === 'present' ? 'present' : 'default'
  document.documentElement.dataset.theme = normalized
  if (persist) localStorage.setItem(STORAGE_KEY, normalized)
  window.dispatchEvent(new CustomEvent('dppa-theme-change', { detail: normalized }))
  return normalized
}

export function initTheme() {
  applyTheme(resolveTheme())
  const actions = document.querySelector('.topbar-actions')
  if (!actions || document.querySelector('#themeToggle')) return
  const button = document.createElement('button')
  button.id = 'themeToggle'
  button.type = 'button'
  button.className = 'theme-toggle'
  button.textContent = t('theme_presenter_toggle')
  button.setAttribute('aria-label', t('theme_presenter_toggle_aria'))
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'present' ? 'default' : 'present'
    applyTheme(next, { persist: true })
  })
  actions.appendChild(button)
}
