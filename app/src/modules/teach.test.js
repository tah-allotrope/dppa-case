// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { renderAppShell } from './ui'
import { scenarioOrder, scenarioProfiles, settlementModes } from '../data/default-scenarios'
import { teachSteps } from '../data/teach-steps'
import { STRINGS } from '../data/strings'
import { initTeachMode } from './teach'

function setup(search) {
  document.body.innerHTML = '<div id="app"></div>'
  renderAppShell(
    document.querySelector('#app'),
    scenarioOrder.map((id) => scenarioProfiles[id]),
    settlementModes,
  )
  window.history.pushState(null, '', search)
}

describe('teach mode', () => {
  beforeEach(() => {
    window.history.pushState(null, '', '/')
  })

  it('stays inactive without ?teach=1', () => {
    setup('/')
    initTeachMode()
    expect(document.querySelector('#teachBanner')).toBeNull()
  })

  it('renders the step banner and applies the first step when ?teach=1', () => {
    setup('/?teach=1')
    initTeachMode()

    const banner = document.querySelector('#teachBanner')
    expect(banner).not.toBeNull()
    expect(banner.querySelector('.teach-step-counter').textContent).toContain(
      `1/${teachSteps.length}`,
    )
    expect(banner.querySelector('.teach-step-counter').textContent).toContain(
      STRINGS.en[teachSteps[0].titleKey],
    )

    const strikeInput = document.querySelector('#strikePrice')
    expect(Number(strikeInput.value)).toBe(teachSteps[0].controls.strikePrice)
  })

  it('advances to the next step on click and wraps around', () => {
    setup('/?teach=1')
    initTeachMode()

    document.querySelector('#teachNext').click()
    expect(document.querySelector('.teach-step-counter').textContent).toContain(
      `2/${teachSteps.length}`,
    )

    for (let i = 0; i < teachSteps.length - 1; i++) {
      document.querySelector('#teachNext').click()
    }
    expect(document.querySelector('.teach-step-counter').textContent).toContain(
      `1/${teachSteps.length}`,
    )
  })

  it('goes back to the previous step, wrapping to the last one', () => {
    setup('/?teach=1')
    initTeachMode()

    document.querySelector('#teachPrev').click()
    expect(document.querySelector('.teach-step-counter').textContent).toContain(
      `${teachSteps.length}/${teachSteps.length}`,
    )
  })
})
