import { formatMoney, formatNumber } from './formatters'


function compactPill(label, value, tone = 'default') {
  return `
    <div class="summary-pill ${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `
}

function paymentEquation(label, rate, quantityText, amount, formula, tone = 'default') {
  return `
    <article class="payment-equation ${tone}">
      <div class="payment-equation-head">
        <p class="metric-label">${label}</p>
        <strong class="equation-rate">${rate}</strong>
      </div>
      <p class="equation-formula">${formula}</p>
      <div class="equation-footer">
        <span class="equation-quantity">${quantityText}</span>
        <strong class="equation-amount">${amount}</strong>
      </div>
    </article>
  `
}

const ROLE_META = {
  shown:  { cls: 'cancel-term-shown', sign: '+', title: 'FMP appears here — it will cancel' },
  cancel: { cls: 'cancel-term-cancel', sign: '', title: 'FMP cancels against the developer swap' },
  strike: { cls: 'cancel-term-strike', sign: '+', title: 'Strike price retained' },
  charge: { cls: 'cancel-term-charge', sign: '+', title: 'DPPA system charge' },
  loss:   { cls: 'cancel-term-loss', sign: '+', title: 'Loss adjustment: tiny residual from grid losses' },
  retail: { cls: 'cancel-term-retail', sign: '+', title: 'Shortfall kWh still bought at retail tariff' },
}

function fmpCancelStrip(steps, resultValue, currency, selectedFmp) {
  const terms = steps.map((step) => {
    const meta = ROLE_META[step.role] || ROLE_META.loss
    const valueStr = formatMoney(Math.abs(step.value), { currency, precise: true, perKwh: true })
    const sign = step.role === 'cancel' ? '−' : (meta.sign || '+')
    const crossed = step.role === 'shown' || step.role === 'cancel' ? ' cancel-term-crossed' : ''
    return `
      <span class="cancel-eq-term ${meta.cls}${crossed}" title="${meta.title}">
        <span class="cancel-eq-owner">${step.owner || 'Net'}</span>
        <span class="cancel-eq-sign">${sign}</span>
        <span class="cancel-eq-value">${valueStr}</span>
        <span class="cancel-eq-label">${step.label}</span>
      </span>
    `
  }).join('<span class="cancel-eq-separator"></span>')

  return `
    <div class="fmp-cancel-strip">
      <div class="fmp-cancel-header">
        <span class="fmp-cancel-title">FMP cancellation — per kWh on factory load</span>
        <span class="fmp-cancel-context">Selected graph FMP: ${formatMoney(selectedFmp, { currency, precise: true, perKwh: true })}</span>
        <span class="fmp-cancel-context">Boxes below are load-normalized contributions, so they can be smaller than the raw graph FMP.</span>
      </div>
      <div class="fmp-cancel-equation">
        ${terms}
        <span class="cancel-eq-separator cancel-eq-equals">=</span>
        <span class="cancel-eq-term cancel-term-result">
          <span class="cancel-eq-value">${formatMoney(resultValue, { currency, precise: true, perKwh: true })}</span>
          <span class="cancel-eq-label">net cost / kWh</span>
        </span>
      </div>
    </div>
  `
}

function netTerm(text, kind = 'retained') {
  return `<span class="net-${kind}-term default">${text}</span>`
}

function joinNetTerms(terms) {
  return terms.filter(Boolean).join('<span class="net-operator"> + </span>')
}

function buildNetEquations(item, formulas, currency) {
  const fmt = (v) => formatMoney(v, { currency, precise: true, perKwh: true })
  const fmtN = (v) => formatNumber(v)
  const fmtT = (v) => formatMoney(v, { currency })
  const kppFig = item.lossFactor != null ? item.lossFactor.toFixed(3) : '1.000'
  const lossAmount = formulas?.evnLossCharge ?? Math.max(item.evnMarket - item.matched * item.fmp, 0)

  const visibleTerms = [
    item.matched > 0
      ? netTerm(`FMP (${fmt(item.fmp)}) × Kpp (${kppFig}) × ${fmtN(item.matched)} kWh`, 'cancelled')
      : '',
    item.matched > 0
      ? netTerm(`CDPPA (${fmt(item.dppaCharge)}) × ${fmtN(item.matched)} kWh`, 'retained')
      : '',
    Math.min(item.matched, item.contractQuantity) > 0
      ? netTerm(`− FMP (${fmt(item.fmp)}) × ${fmtN(Math.min(item.matched, item.contractQuantity))} kWh`, 'cancelled')
      : '',
    item.contractQuantity > 0
      ? netTerm(`Strike (${fmt(item.strikePrice)}) × ${fmtN(item.contractQuantity)} kWh`, 'retained')
      : '',
    item.shortfall > 0
      ? netTerm(`Retail (${fmt(item.retailTariff)}) × ${fmtN(item.shortfall)} kWh`, 'retained')
      : '',
    lossAmount > 0
      ? netTerm(`Loss adj. ${fmtT(lossAmount)}`, 'retained')
      : '',
  ]

  const retainedTerms = [
    item.matched > 0
      ? netTerm(`CDPPA (${fmt(item.dppaCharge)}) × ${fmtN(item.matched)} kWh`, 'retained')
      : '',
    item.contractQuantity > 0
      ? netTerm(`Strike (${fmt(item.strikePrice)}) × ${fmtN(item.contractQuantity)} kWh`, 'retained')
      : '',
    item.shortfall > 0
      ? netTerm(`Retail (${fmt(item.retailTariff)}) × ${fmtN(item.shortfall)} kWh`, 'retained')
      : '',
    lossAmount > 0
      ? netTerm(`Loss adj. ${fmtT(lossAmount)}`, 'retained')
      : '',
  ]

  return {
    expanded: joinNetTerms(visibleTerms),
    simplified: joinNetTerms(retainedTerms),
    showExpanded: visibleTerms.filter(Boolean).length > 0,
    showSimplified: retainedTerms.filter(Boolean).length > 0 && joinNetTerms(visibleTerms) !== joinNetTerms(retainedTerms),
  }
}

function walkthroughCaseCard(item, currency, formulas) {
  const fmt = (v) => formatMoney(v, { currency, precise: true, perKwh: true })
  const fmtN = (v) => formatNumber(v)
  const fmtT = (v) => formatMoney(v, { currency })
  const fmtS = (v) => formatMoney(v, { currency, signed: true })
  const netEquations = buildNetEquations(item, formulas, currency)

  const fmpFig = fmt(item.fmp)
  const kppFig = item.lossFactor != null ? item.lossFactor.toFixed(3) : '1.000'
  const dppachargeFig = fmt(item.dppaCharge)
  const retailFig = fmt(item.retailTariff)

  const evnFormula = item.shortfall > 0
    ? `FMP (${fmpFig}) × Kpp (${kppFig}) × ${fmtN(item.matched)} kWh + CDPPA (${dppachargeFig}) × ${fmtN(item.matched)} kWh + Retail (${retailFig}) × ${fmtN(item.shortfall)} kWh`
    : `FMP (${fmpFig}) × Kpp (${kppFig}) × ${fmtN(item.matched)} kWh + CDPPA (${dppachargeFig}) × ${fmtN(item.matched)} kWh`

  const netTotal = item.evnAmount + item.cfdAmount
  const developerFormula = `− FMP (${fmpFig}) × ${fmtN(item.contractQuantity)} kWh + Strike (${fmt(item.strikePrice)}) × ${fmtN(item.contractQuantity)} kWh`

  return `
    <article class="walkthrough-card ${item.tone} is-selected">
      <div class="walkthrough-head">
        <div>
          <p class="metric-label">${item.caseLabel}</p>
          <h3>${item.headline}</h3>
        </div>
        <span class="walkthrough-hour">${item.hourLabel}</span>
      </div>
      <div class="walkthrough-metrics">
        ${compactPill('Load', `${fmtN(item.load)} kWh`, 'default')}
        ${compactPill('Gen', `${fmtN(item.generation)} kWh`, 'accent')}
        ${compactPill('DPPA', `${fmtN(item.contractQuantity)} kWh`, item.contractQuantity === item.matched ? 'result' : 'warning')}
      </div>
      <div class="walkthrough-lines">
        <p class="wl-eq-head">EVN = ${evnFormula} = <strong>${fmtT(item.evnAmount)}</strong></p>

        <p class="wl-eq-head">Developer = ${developerFormula} = <strong class="developer-total">${fmtS(item.cfdAmount)}</strong></p>

        <div class="net-row">
          <p class="wl-eq-head net-label">Net = EVN + Developer =</p>
          ${netEquations.showExpanded ? `<p class="net-formula-line"><span class="net-equals">=</span>${netEquations.expanded}${!netEquations.showSimplified ? `<span class="net-equals">=</span><strong class="net-total">${fmtT(netTotal)}</strong>` : ''}</p>` : ''}
          ${netEquations.showSimplified ? `<p class="net-formula-line net-formula-simplified"><span class="net-equals">=</span>${netEquations.simplified}<span class="net-equals">=</span><strong class="net-total">${fmtT(netTotal)}</strong></p>` : ''}
        </div>
      </div>
    </article>
  `
}

export function renderAppShell(root, scenarios, settlementModes) {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar panel glow-frame">
        <div class="brand-block">
          <img class="brand-logo" src="/brand/allotrope-logo.png" alt="Allotrope logo" />
          <div>
            <p class="eyebrow">Rob — Vietnam synthetic DPPA</p>
            <h1>DPPA CFO visual explainer</h1>
            <p class="hero-copy">Click any hour to compare the 2025 teaching-model baseline against DPPA payment using documented example inputs and synthetic hourly FMP.</p>
          </div>
        </div>
        <div class="topbar-actions">
          <div class="toggle-group" id="currencyToggle" aria-label="Currency toggle">
            <button class="toggle-button" data-currency="VND" type="button">VND</button>
            <button class="toggle-button" data-currency="USD" type="button">USD</button>
          </div>
        </div>
      </header>

      <main class="story-grid">
        <section class="focus-column">
          <div class="chart-walkthrough-row">
            <div class="panel chart-panel">
              <div class="chart-headline">
              <div>
                <p class="eyebrow">Profiles</p>
                <h2>Load vs solar overlap</h2>
              </div>
            </div>
              <div class="scenario-tabs" id="scenarioTabs">
                ${scenarios.map((scenario) => `<button class="scenario-tab" data-scenario="${scenario.id}">${scenario.label}</button>`).join('')}
              </div>
              <div class="chart-wrap profile-wrap">
                <canvas id="profileChart" aria-label="Load and generation chart"></canvas>
              </div>
            </div>

            <section class="panel walkthrough-panel glow-frame">
              <div class="panel-header">
              <div>
                <p class="eyebrow">Load-vs-generation cases</p>
                <h2>Clicked-hour cancellation view</h2>
              </div>
              </div>
              <div class="walkthrough-grid" id="walkthroughCases"></div>
            </section>
          </div>

          <div class="panel details-panel stage-panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">Selected hour details</p>
                <h2>EVN and developer payment build-up</h2>
              </div>
            </div>
            <div id="selectedHourDetailsPanel"></div>
          </div>
        </section>

      </main>

      <section class="lower-grid">
        <div class="panel formula-panel glow-frame">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Mermaid flow</p>
              <h2>Selected-hour cancellation logic flow</h2>
            </div>
          </div>
          <div class="mermaid-card">
            <div class="metric-label">Mermaid logic flow</div>
            <div class="mermaid" id="cancellationMermaid"></div>
          </div>
          <p class="walkthrough-note" id="mermaidInlineNote"></p>
        </div>
      </section>

      <section class="panel controls-panel bottom-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Controls</p>
            <h2>Pricing assumptions</h2>
          </div>
          <button class="ghost-button" id="resetButton" type="button">Reset defaults</button>
        </div>
        <div class="controls-grid">
          <label class="control-card">
            <span>Developer strike price</span>
            <input id="strikePrice" type="range" min="1200" max="3200" step="0.01" />
            <strong data-output="strikePrice"></strong>
          </label>
          <label class="control-card">
            <span>Market price / FMP</span>
            <input id="marketPrice" type="range" min="900" max="2600" step="10" />
            <strong data-output="marketPrice"></strong>
          </label>
          <label class="control-card">
            <span>DPPA charge</span>
            <input id="dppaCharge" type="range" min="250" max="800" step="1" />
            <strong data-output="dppaCharge"></strong>
          </label>
          <label class="control-card">
            <span>Loss factor</span>
            <input id="lossFactor" type="range" min="1" max="1.08" step="0.001" />
            <strong data-output="lossFactor"></strong>
          </label>
          <label class="control-card select-card">
            <span>Settlement quantity mode</span>
            <select id="settlementMode">
              ${settlementModes.map((mode) => `<option value="${mode.value}">${mode.label}</option>`).join('')}
            </select>
            <strong data-output="settlementMode"></strong>
          </label>
        </div>
        <div class="assumptions-inline">
          <span>2025 teaching assumptions</span>
          <span>Flat retail tariff in v1</span>
          <span>Internal math stays in VND</span>
          <span>Illustrative tariff blocks</span>
          <span>Synthetic FMP curve</span>
          <span>Click chart to inspect one hour</span>
        </div>
      </section>
    </div>
  `
}

export function renderWalkthroughCases(container, selectedCase, currency, formulas) {
  if (!selectedCase) {
    container.innerHTML = ''
    return
  }
  const strip = formulas && formulas.fmpCancellationSteps
    ? fmpCancelStrip(formulas.fmpCancellationSteps, formulas.dppaUnitCost, currency, formulas.marketPrice)
    : ''
  container.innerHTML = walkthroughCaseCard(selectedCase, currency, formulas) + strip
}

export function renderFormulas(result, warningText, currency) {
  const mermaidDefinition = result.cleanCancellation
    ? `flowchart LR\nA[BAU retail payment\n${formatNumber(result.load)} kWh x ${formatMoney(result.retailTariff, { currency, precise: true, perKwh: true })}\n= ${formatMoney(result.bauCost, { currency })}] --> B[Selected hour comparison]\nC[Spot reference shown on EVN\n${formatNumber(result.matched)} kWh x ${formatMoney(result.marketPrice, { currency, precise: true, perKwh: true })}] --> D[Canceled on aligned volume\n${formatNumber(result.cleanCancelledEnergy)} kWh]\nE[Developer CfD swap\n- ${formatNumber(result.cleanCancelledEnergy)} kWh x ${formatMoney(result.marketPrice, { currency, precise: true, perKwh: true })}\n+ ${formatNumber(result.contractQuantity)} kWh x ${formatMoney(result.strikePrice, { currency, precise: true, perKwh: true })}] --> D\nD --> F[Keep strike + DPPA charge + loss]\nF --> G[DPPA payment\n${formatMoney(result.dppaCost, { currency })}]\nG --> B\nB --> H[Savings vs BAU\n${formatMoney(result.savingsVsBau, { currency, signed: true })}]`
    : `flowchart LR\nA[BAU retail payment\n${formatMoney(result.bauCost, { currency })}] --> B[Selected hour comparison]\nC[Matched volume\n${formatNumber(result.matched)} kWh] --> D[Cancellation only applies here]\nE[Contracted volume\n${formatNumber(result.contractQuantity)} kWh] --> D\nD --> F[Volume mismatch\n${formatNumber(Math.abs(result.mismatchVolume))} kWh]\nF --> G[Uncancelled exposure stays]\nG --> H[DPPA payment\n${formatMoney(result.dppaCost, { currency })}]\nH --> B\nB --> I[Savings vs BAU\n${formatMoney(result.savingsVsBau, { currency, signed: true })}]`

  document.querySelector('#cancellationMermaid').textContent = mermaidDefinition

  const note = result.cleanCancellation
    ? `Clean cancellation: the spot/FMP reference is shown on EVN, then canceled on aligned volume, leaving strike + DPPA charge + loss adjustment.`
    : `Partial cancellation: mismatch volume keeps some uncancelled exposure, so rely on the actual selected-hour DPPA payment.`
  const warningSuffix = warningText ? ` ${warningText}` : ''
  document.querySelector('#mermaidInlineNote').textContent = `${note}${warningSuffix}`

  return mermaidDefinition
}


export function renderSelectedHourDetails(container, interval, currency, inputs) {
  const evnUnitCost = interval.load > 0 ? interval.evnTotal / interval.load : 0
  const developerUnitCost = interval.load > 0 ? interval.developer / interval.load : 0
  const intervalFmp = interval.fmp ?? inputs.marketPrice

  container.innerHTML = `
    <div class="settlement-grid">
      <div class="formula-detail-card evn-detail payment-panel">
        <p class="formula-label">Payment to EVN per kWh of factory load</p>
        <div class="payment-stack">
          ${paymentEquation(
            'Matched market slice',
            formatMoney(interval.load > 0 ? interval.evnMarket / interval.load : 0, { currency, precise: true, perKwh: true }),
            `${formatNumber(interval.matched)} matched kWh`,
             formatMoney(interval.evnMarket, { currency }),
            `${formatNumber(interval.matched)} / ${formatNumber(interval.load)} x ${formatMoney(intervalFmp * inputs.lossFactor, { currency, precise: true, perKwh: true })}`,
            'evn',
          )}
          ${paymentEquation(
            'DPPA network charge',
            formatMoney(interval.load > 0 ? interval.evnDppa / interval.load : 0, { currency, precise: true, perKwh: true }),
            `${formatNumber(interval.matched)} matched kWh`,
            formatMoney(interval.evnDppa, { currency }),
            `${formatNumber(interval.matched)} / ${formatNumber(interval.load)} x ${formatMoney(inputs.dppaCharge, { currency, precise: true, perKwh: true })}`,
            'accent',
          )}
          ${paymentEquation(
            'Shortfall retail slice',
            formatMoney(interval.load > 0 ? interval.evnRetail / interval.load : 0, { currency, precise: true, perKwh: true }),
            `${formatNumber(interval.shortfall)} shortfall kWh`,
            formatMoney(interval.evnRetail, { currency }),
            `${formatNumber(interval.shortfall)} / ${formatNumber(interval.load)} x ${formatMoney(inputs.retailTariff, { currency, precise: true, perKwh: true })}`,
            'warning',
          )}
        </div>
        <div class="payment-total-card evn-tone">
          <span class="metric-label">EVN total</span>
          <strong>${formatMoney(evnUnitCost, { currency, precise: true, perKwh: true })}</strong>
          <span>${formatMoney(interval.evnTotal, { currency })} for ${formatNumber(interval.load)} kWh load</span>
        </div>
      </div>
      <div class="formula-detail-card developer-detail payment-panel">
        <p class="formula-label">Payment to developer per kWh of factory load</p>
        <div class="payment-stack">
          ${paymentEquation(
            'CfD swap on contract quantity',
            formatMoney(developerUnitCost, { currency, precise: true, perKwh: true, signed: true }),
             `${formatNumber(interval.contractQuantity)} contracted kWh`,
             formatMoney(interval.developer, { currency, signed: true }),
            `${formatNumber(interval.contractQuantity)} / ${formatNumber(interval.load)} x (${formatMoney(inputs.strikePrice, { currency, precise: true, perKwh: true })} - ${formatMoney(intervalFmp, { currency, precise: true, perKwh: true })})`,
            'developer',
          )}
        </div>
        <div class="payment-total-card developer-tone">
          <span class="metric-label">Developer total</span>
          <strong>${formatMoney(developerUnitCost, { currency, precise: true, perKwh: true, signed: true })}</strong>
          <span>${formatMoney(interval.developer, { currency, signed: true })} for ${formatNumber(interval.load)} kWh load</span>
        </div>
      </div>
    </div>
  `
}

export function updateControlOutputs(state, settlementModes, currency) {
  document.querySelector('[data-output="strikePrice"]').textContent = formatMoney(state.strikePrice, { currency, precise: true, perKwh: true })
  document.querySelector('[data-output="marketPrice"]').textContent = formatMoney(state.marketPrice, { currency, precise: true, perKwh: true })
  document.querySelector('[data-output="dppaCharge"]').textContent = formatMoney(state.dppaCharge, { currency, precise: true, perKwh: true })
  document.querySelector('[data-output="lossFactor"]').textContent = state.lossFactor.toFixed(3)
  const activeMode = settlementModes.find((mode) => mode.value === state.settlementMode)
  document.querySelector('[data-output="settlementMode"]').textContent = activeMode ? activeMode.label : state.settlementMode
}

export function setActiveScenario(scenarioId) {
  document.querySelectorAll('.scenario-tab').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.scenario === scenarioId)
  })
}

export function setActiveCurrency(currency) {
  document.querySelectorAll('[data-currency]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.currency === currency)
  })
}
