import { formatMoney, formatNumber } from './formatters'


function metricCard(label, value, detail, tone = 'default') {
  return `
    <article class="metric-card ${tone}">
      <p class="metric-label">${label}</p>
      <p class="metric-value">${value}</p>
      <p class="metric-detail">${detail}</p>
    </article>
  `
}

function compactPill(label, value, tone = 'default') {
  return `
    <div class="summary-pill ${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `
}

function flowCard(label, value, detail, tone = 'default') {
  return `
    <article class="flow-card ${tone}">
      <p class="metric-label">${label}</p>
      <strong class="flow-value">${value}</strong>
      <span class="flow-detail">${detail}</span>
    </article>
  `
}

function comparisonCard(label, value, detail, tone = 'default') {
  return `
    <article class="comparison-card ${tone}">
      <p class="metric-label">${label}</p>
      <strong class="figure-value">${value}</strong>
      <span class="flow-detail">${detail}</span>
    </article>
  `
}

function figureCard(label, value, detail, tone = 'default') {
  return `
    <article class="figure-card ${tone}">
      <p class="metric-label">${label}</p>
      <strong class="figure-value">${value}</strong>
      <span class="flow-detail">${detail}</span>
    </article>
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
  shown:  { cls: 'cancel-term-shown',  sign: '+', title: 'FMP appears here — it will cancel' },
  cancel: { cls: 'cancel-term-cancel', sign: '',  title: 'FMP cancels against the developer swap' },
  strike: { cls: 'cancel-term-strike', sign: '+', title: 'Strike price retained' },
  charge: { cls: 'cancel-term-charge', sign: '+', title: 'DPPA system charge' },
  loss:   { cls: 'cancel-term-loss',   sign: '+', title: 'Loss adjustment: tiny residual from grid losses' },
  retail: { cls: 'cancel-term-retail', sign: '+', title: 'Shortfall kWh still bought at retail tariff' },
}

function fmpCancelStrip(steps, resultValue, currency) {
  const terms = steps.map((step) => {
    const meta = ROLE_META[step.role] || ROLE_META.loss
    const valueStr = formatMoney(Math.abs(step.value), { currency, precise: true, perKwh: true })
    const sign = step.role === 'cancel' ? '−' : (meta.sign || '+')
    return `
      <span class="cancel-eq-term ${meta.cls}" title="${meta.title}">
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

function walkthroughCaseCard(item, currency) {
  const evnFormula = item.shortfall > 0
    ? `(${formatNumber(item.matched)} × ${formatMoney(item.marketPerMatched, { currency, precise: true, perKwh: true })}) + (${formatNumber(item.matched)} × ${formatMoney(item.dppaCharge, { currency, precise: true, perKwh: true })}) + (${formatNumber(item.shortfall)} × ${formatMoney(item.retailTariff, { currency, precise: true, perKwh: true })})`
    : `(${formatNumber(item.matched)} × ${formatMoney(item.marketPerMatched, { currency, precise: true, perKwh: true })}) + (${formatNumber(item.matched)} × ${formatMoney(item.dppaCharge, { currency, precise: true, perKwh: true })})`
  const devFormula = `${formatNumber(item.contractQuantity)} × (${formatMoney(item.fmp, { currency, precise: true, perKwh: true })} − ${formatMoney(item.fmp - item.cfdUnitRate, { currency, precise: true, perKwh: true })})`

  return `
    <article class="walkthrough-card ${item.tone} is-selected">
      <div class="walkthrough-head">
        <div class="walkthrough-step">${item.step}</div>
        <div>
          <p class="metric-label">${item.caseLabel}</p>
          <h3>${item.headline}</h3>
        </div>
        <span class="walkthrough-hour">${item.hourLabel}</span>
      </div>
      <div class="walkthrough-metrics">
        ${compactPill('Load', `${formatNumber(item.load)} kWh`, 'default')}
        ${compactPill('Solar', `${formatNumber(item.generation)} kWh`, 'accent')}
        ${compactPill('Contract', `${formatNumber(item.contractQuantity)} kWh`, item.contractQuantity === item.matched ? 'result' : 'warning')}
      </div>
      <div class="walkthrough-lines">
        <p>EVN = ${formatMoney(item.evnAmount, { currency })} = ${evnFormula}</p>
        <p>Developer = ${formatMoney(item.cfdAmount, { currency, signed: true })} = ${devFormula}</p>
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
            <p class="hero-copy">Click any hour to compare BAU without DPPA against DPPA payment using the weighted 22 kV to below 110 kV retail tariff.</p>
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
          <div class="panel chart-panel">
            <div class="chart-headline">
              <div>
                <p class="eyebrow">Profiles</p>
                <h2>Load vs solar overlap</h2>
              </div>
              <div class="summary-pills" id="volumeSummary"></div>
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
                <h2>Selected-hour case from the clicked graph node</h2>
              </div>
            </div>
            <div class="walkthrough-grid" id="walkthroughCases"></div>
          </section>

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
              <p class="eyebrow">Cancellation effect</p>
              <h2>Selected-hour formulas and cancellation diagram</h2>
            </div>
          </div>
          <div class="cancellation-figures" id="cancellationFigures"></div>
          <div class="formula-grid">
            <div class="formula-card">
              <p class="formula-label">Selected-hour EVN settlement</p>
              <pre id="evnExpression"></pre>
            </div>
            <div class="formula-card accent-card">
              <p class="formula-label">Selected-hour developer settlement</p>
              <pre id="developerExpression"></pre>
            </div>
            <div class="formula-card result-card full-span">
              <p class="formula-label">Selected-hour cancellation result</p>
              <pre id="cancellationResult"></pre>
            </div>
          </div>
          <div class="mermaid-card">
            <div class="metric-label">Mermaid logic flow</div>
            <div class="mermaid" id="cancellationMermaid"></div>
          </div>
          <ul class="explain-list" id="explainList"></ul>
          <div class="warning-banner" id="warningBanner" hidden></div>
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
          <label class="control-card">
            <span>Weighted EVN tariff (22 kV-<110 kV)</span>
            <input id="retailTariff" type="range" min="1200" max="3600" step="0.01" />
            <strong data-output="retailTariff"></strong>
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
          <span>Hourly teaching model</span>
          <span>Flat rates in v1</span>
          <span>Internal math stays in VND</span>
          <span>Default strike = 95% of weighted tariff</span>
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
    ? fmpCancelStrip(formulas.fmpCancellationSteps, formulas.dppaUnitCost, currency)
    : ''
  container.innerHTML = walkthroughCaseCard(selectedCase, currency) + strip
}

export function renderVolumeSummary(container, totals) {
  container.innerHTML = [
    compactPill('Matched', `${formatNumber(totals.matchedVolume)} kWh`, 'result'),
    compactPill('Shortfall', `${formatNumber(totals.loadTotal - totals.matchedVolume)} kWh`, 'warning'),
    compactPill('Excess', `${formatNumber(Math.max(totals.generationTotal - totals.matchedVolume, 0))} kWh`, 'accent'),
  ].join('')
}

export function renderMetrics(container, totals, currency) {
  container.innerHTML = [
    metricCard('Total buyer cost', formatMoney(totals.totalCost, { currency }), 'All-in daily cost for the selected scenario.', 'result'),
    metricCard('Matched kWh price', formatMoney(totals.matchedPrice, { currency, precise: true, perKwh: true }), 'Best lens for the cancellation story.', 'result'),
    metricCard('Blended average', formatMoney(totals.blendedPrice, { currency, precise: true, perKwh: true }), 'Includes unmatched retail energy.', 'default'),
    metricCard('Payment to EVN', formatMoney(totals.evnTotal, { currency }), 'Market-linked energy, DPPA charge, and retail shortfall.', 'evn'),
    metricCard('Payment to developer', formatMoney(totals.developerTotal, { currency, signed: true }), 'CfD settlement against strike vs market.', 'developer'),
    metricCard('Savings vs baseline', formatMoney(totals.savings, { currency, signed: true }), `Baseline ${formatMoney(totals.noDppaBlended, { currency, precise: true, perKwh: true })}.`, totals.savings >= 0 ? 'success' : 'warning'),
  ].join('')
}

export function renderFormulas(result, warningText, currency) {
  document.querySelector('#cancellationFigures').innerHTML = [
    figureCard('Retail tariff basis', formatMoney(result.retailTariff, { currency, precise: true, perKwh: true }), 'weighted 22 kV to below 110 kV factory tariff', 'warning'),
    figureCard('Strike price', formatMoney(result.strikePrice, { currency, precise: true, perKwh: true }), 'defaulted at 5% below the weighted tariff basis', 'developer'),
    figureCard('Spot market price', formatMoney(result.marketPrice, { currency, precise: true, perKwh: true }), 'shown first so the CFO can see the cancellation happen explicitly', 'evn'),
    figureCard('Loss adjustment', formatMoney(result.lossAdjustment, { currency, precise: true, perKwh: true }), 'market x loss factor minus market', 'evn'),
    figureCard('Cancellation shortcut', formatMoney(result.impliedCancellation, { currency, precise: true, perKwh: true }), 'strike + DPPA charge + loss adjustment on aligned volume', 'result'),
  ].join('')

  document.querySelector('#evnExpression').textContent = `EVN = (${formatNumber(result.matched)} x ${formatMoney(result.marketPrice, { currency, precise: true, perKwh: true })}) + (${formatNumber(result.matched)} x ${formatMoney(result.lossAdjustment, { currency, precise: true, perKwh: true })}) + (${formatNumber(result.matched)} x ${formatMoney(result.dppaCharge, { currency, precise: true, perKwh: true })}) + (${formatNumber(result.shortfall)} x ${formatMoney(result.retailTariff, { currency, precise: true, perKwh: true })})\n= ${formatMoney(result.evnTotal, { currency })}`

  document.querySelector('#developerExpression').textContent = `Developer = ${formatNumber(result.contractQuantity)} x (${formatMoney(result.strikePrice, { currency, precise: true, perKwh: true })} - ${formatMoney(result.marketPrice, { currency, precise: true, perKwh: true })})\n= ${formatMoney(result.developerTotal, { currency, signed: true })}`

  document.querySelector('#cancellationResult').textContent = result.cleanCancellation
    ? `Clean cancellation on this hour\nThe spot market price is shown first, then canceled by the developer swap on the aligned volume.\n${formatMoney(result.spotMarketVisibleRate, { currency, precise: true, perKwh: true })} + ${formatMoney(result.cancellationViaSwapRate, { currency, precise: true, perKwh: true, signed: true })} + ${formatMoney(result.retainedStrikeRate, { currency, precise: true, perKwh: true })} + ${formatMoney(result.lossAdjustment, { currency, precise: true, perKwh: true })} + ${formatMoney(result.dppaCharge, { currency, precise: true, perKwh: true })} = ${formatMoney(result.retainedEnergyRate, { currency, precise: true, perKwh: true })}`
    : `Partial / broken cancellation on this hour\nMatched volume = ${formatNumber(result.matched)} kWh, contracted volume = ${formatNumber(result.contractQuantity)} kWh, mismatch = ${formatNumber(Math.abs(result.mismatchVolume))} kWh. Use the actual selected-hour DPPA payment of ${formatMoney(result.dppaCost, { currency })} rather than the clean shortcut alone.`

  document.querySelector('#cancellationMermaid').textContent = result.cleanCancellation
    ? `flowchart LR\nA[BAU retail payment\n${formatNumber(result.load)} kWh x ${formatMoney(result.retailTariff, { currency, precise: true, perKwh: true })}\n= ${formatMoney(result.bauCost, { currency })}] --> B[Selected hour comparison]\nC[DPPA matched market\n${formatNumber(result.matched)} kWh x ${formatMoney(result.marketPrice, { currency, precise: true, perKwh: true })}] --> D[Market reference cancels]\nE[Developer CfD swap\n${formatNumber(result.contractQuantity)} kWh x ${formatMoney(result.developerSwapPerContract, { currency, precise: true, perKwh: true, signed: true })}] --> D\nD --> F[Keep strike + DPPA + loss]\nF --> G[DPPA payment\n${formatMoney(result.dppaCost, { currency })}]\nG --> B\nB --> H[Savings vs BAU\n${formatMoney(result.savingsVsBau, { currency, signed: true })}]`
    : `flowchart LR\nA[BAU retail payment\n${formatMoney(result.bauCost, { currency })}] --> B[Selected hour comparison]\nC[Matched volume\n${formatNumber(result.matched)} kWh] --> D[Cancellation only applies here]\nE[Contracted volume\n${formatNumber(result.contractQuantity)} kWh] --> D\nD --> F[Volume mismatch\n${formatNumber(Math.abs(result.mismatchVolume))} kWh]\nF --> G[Uncancelled exposure stays]\nG --> H[DPPA payment\n${formatMoney(result.dppaCost, { currency })}]\nH --> B\nB --> I[Savings vs BAU\n${formatMoney(result.savingsVsBau, { currency, signed: true })}]`

  const steps = result.cleanCancellation
    ? [
        `BAU for this hour is ${formatMoney(result.bauCost, { currency })}, based on ${formatNumber(result.load)} kWh at the weighted retail tariff of ${formatMoney(result.retailTariff, { currency, precise: true, perKwh: true })}.`,
        `The spot market price is shown explicitly at ${formatMoney(result.marketPrice, { currency, precise: true, perKwh: true })}, then canceled by the developer swap on the aligned volume so the CFO can see why it does not stay as a net cost.`,
        `After that cancellation, the retained matched-kWh economics simplify toward strike price + DPPA charge + loss adjustment, or ${formatMoney(result.impliedCancellation, { currency, precise: true, perKwh: true })}.`,
        `Selected-hour DPPA payment is ${formatMoney(result.dppaCost, { currency })}, which is ${formatMoney(result.savingsVsBau, { currency, signed: true })} versus BAU.`,
      ]
    : [
        `BAU for this hour is ${formatMoney(result.bauCost, { currency })}, while DPPA payment is ${formatMoney(result.dppaCost, { currency })}.`,
        `Developer settlement differs from matched volume by ${formatNumber(Math.abs(result.mismatchVolume))} kWh, so cancellation is only partial on this node.`,
        `The clean shortcut is not enough here; the actual selected-hour economics are driven by the mismatch and the resulting DPPA payment of ${formatMoney(result.dppaCost, { currency })}.`,
      ]

  document.querySelector('#explainList').innerHTML = steps
    .map((step) => `<li>${step}</li>`)
    .join('')

  const banner = document.querySelector('#warningBanner')
  if (warningText) {
    banner.hidden = false
    banner.textContent = warningText
  } else {
    banner.hidden = true
    banner.textContent = ''
  }
}

export function renderBauComparison(container, result, currency) {
  const cards = [
    comparisonCard('BAU without DPPA', formatMoney(result.bauCost, { currency }), `${formatNumber(result.load)} kWh x ${formatMoney(result.retailTariff, { currency, precise: true, perKwh: true })}`, 'warning'),
    comparisonCard('DPPA payment', formatMoney(result.dppaCost, { currency }), `${formatMoney(result.evnTotal, { currency })} to EVN and ${formatMoney(result.developerTotal, { currency, signed: true })} to developer`, 'result'),
    comparisonCard('Savings vs BAU', formatMoney(result.savingsVsBau, { currency, signed: true }), result.savingsVsBau >= 0 ? 'Positive means DPPA is cheaper than BAU in this hour' : 'Negative means DPPA is more expensive than BAU in this hour', result.savingsVsBau >= 0 ? 'result' : 'developer'),
    comparisonCard('BAU unit cost', formatMoney(result.bauUnitCost, { currency, precise: true, perKwh: true }), 'factory retail tariff for this hour', 'warning'),
    comparisonCard('DPPA unit cost', formatMoney(result.dppaUnitCost, { currency, precise: true, perKwh: true }), 'all-in DPPA payment divided by selected-hour load', 'result'),
  ].join('')

  const strip = result.fmpCancellationSteps
    ? fmpCancelStrip(result.fmpCancellationSteps, result.dppaUnitCost, currency)
    : ''

  container.innerHTML = `<div class="comparison-grid">${cards}</div>${strip}`
}

export function renderSelectedHour(container, interval, narrative, currency, detailView, inputs) {
  const showFlow = detailView === 'flow'
  const bauCost = interval.baseline
  const dppaCost = interval.total
  const savingsVsBau = bauCost - dppaCost
  const evnUnitCost = interval.load > 0 ? interval.evnTotal / interval.load : 0
  const developerUnitCost = interval.load > 0 ? interval.developer / interval.load : 0
  const totalUnitCost = interval.load > 0 ? dppaCost / interval.load : 0
  const spotMarketReferenceRate = interval.load > 0 ? interval.matched / interval.load * inputs.marketPrice : 0
  const cancellationViaSwapRate = interval.load > 0 ? -(Math.min(interval.matched, interval.contractQuantity) / interval.load * inputs.marketPrice) : 0
  const retainedEnergySliceRate = spotMarketReferenceRate + cancellationViaSwapRate + (interval.load > 0 ? interval.contractQuantity / interval.load * inputs.strikePrice : 0) + (interval.load > 0 ? interval.matched / interval.load * inputs.dppaCharge : 0) + (interval.load > 0 ? (interval.evnMarket - interval.matched * inputs.marketPrice) / interval.load : 0)

  container.innerHTML = `
    <div class="hour-topline">
      <div>
        <span class="hour-chip">${String(interval.hour).padStart(2, '0')}:00 - ${String((interval.hour + 1) % 24).padStart(2, '0')}:00</span>
        <h3 class="hour-title">${interval.classification.label}</h3>
      </div>
      <div class="state-chip state-${interval.classification.key}">${interval.classification.stateText}</div>
    </div>
    <p class="hour-copy">${narrative}</p>

    <div class="hour-stats">
      ${compactPill('Load', `${formatNumber(interval.load)} kWh`, 'default')}
      ${compactPill('Solar', `${formatNumber(interval.generation)} kWh`, 'accent')}
      ${compactPill('Contract', `${formatNumber(interval.contractQuantity)} kWh`, interval.contractQuantity === interval.matched ? 'result' : 'warning')}
      ${compactPill('Total', `${formatMoney(dppaCost, { currency })}`, 'result')}
    </div>

    <div class="hour-outcomes ${showFlow ? '' : 'is-hidden'}">
      ${flowCard('BAU without DPPA', formatMoney(inputs.retailTariff, { currency, precise: true, perKwh: true }), `${formatNumber(interval.load)} kWh x ${formatMoney(inputs.retailTariff, { currency, precise: true, perKwh: true })} = ${formatMoney(bauCost, { currency })}`, 'warning')}
      ${flowCard('Spot market reference', formatMoney(spotMarketReferenceRate, { currency, precise: true, perKwh: true }), `${formatNumber(interval.matched)} matched kWh x ${formatMoney(inputs.marketPrice, { currency, precise: true, perKwh: true })}; shown first, then canceled on aligned volume`, 'evn')}
      ${flowCard('Cancellation via developer swap', formatMoney(cancellationViaSwapRate, { currency, precise: true, perKwh: true, signed: true }), `${formatNumber(Math.min(interval.matched, interval.contractQuantity))} aligned kWh cancel the spot reference and leave strike-led economics`, 'developer')}
      ${flowCard('Net retained energy slice', formatMoney(retainedEnergySliceRate, { currency, precise: true, perKwh: true }), 'after cancellation, what remains is strike price + DPPA charge + loss adjustment on the aligned slice', 'accent')}
      ${flowCard('DPPA total this hour', formatMoney(totalUnitCost, { currency, precise: true, perKwh: true }), `${formatMoney(interval.evnTotal, { currency })} to EVN + ${formatMoney(interval.developer, { currency, signed: true })} to developer = ${formatMoney(dppaCost, { currency })}`, 'result')}
      ${flowCard('Delta vs BAU', formatMoney(savingsVsBau, { currency, signed: true }), savingsVsBau >= 0 ? 'positive means DPPA is cheaper in this hour' : 'negative means DPPA is more expensive in this hour', savingsVsBau >= 0 ? 'result' : 'developer')}
    </div>

    <div class="bars-grid ${showFlow ? 'is-hidden' : ''}">
      <div class="bars-card">
        <p class="metric-label">DPPA payment mix this hour</p>
        <div class="bars-stack">
          <div class="bars-segment bars-evn" style="width:${interval.total > 0 ? (interval.evnMarket / interval.total) * 100 : 0}%"></div>
          <div class="bars-segment bars-dppa" style="width:${interval.total > 0 ? (interval.evnDppa / interval.total) * 100 : 0}%"></div>
          <div class="bars-segment bars-retail" style="width:${interval.total > 0 ? (interval.evnRetail / interval.total) * 100 : 0}%"></div>
          <div class="bars-segment bars-dev" style="width:${interval.total > 0 ? (Math.abs(interval.developer) / interval.total) * 100 : 0}%"></div>
        </div>
        <div class="bars-legend">
          <span>EVN market</span>
          <span>DPPA</span>
          <span>Retail</span>
          <span>Developer</span>
        </div>
      </div>
      <div class="bars-card">
        <p class="metric-label">Per-kWh summary on load</p>
        <div class="bars-values">
          <span>EVN <strong>${formatMoney(evnUnitCost, { currency, precise: true, perKwh: true })}</strong></span>
          <span>Developer <strong>${formatMoney(developerUnitCost, { currency, precise: true, perKwh: true, signed: true })}</strong></span>
          <span>Total DPPA <strong>${formatMoney(totalUnitCost, { currency, precise: true, perKwh: true })}</strong></span>
          <span>BAU retail <strong>${formatMoney(inputs.retailTariff, { currency, precise: true, perKwh: true })}</strong></span>
          <span>Hourly total <strong>${formatMoney(dppaCost, { currency })}</strong></span>
        </div>
      </div>
    </div>
  `
}

export function renderSelectedHourDetails(container, interval, currency, inputs) {
  const evnUnitCost = interval.load > 0 ? interval.evnTotal / interval.load : 0
  const developerUnitCost = interval.load > 0 ? interval.developer / interval.load : 0

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
            `${formatNumber(interval.matched)} / ${formatNumber(interval.load)} x ${formatMoney(inputs.marketPrice * inputs.lossFactor, { currency, precise: true, perKwh: true })}`,
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
            `${formatNumber(interval.contractQuantity)} / ${formatNumber(interval.load)} x (${formatMoney(inputs.strikePrice, { currency, precise: true, perKwh: true })} - ${formatMoney(inputs.marketPrice, { currency, precise: true, perKwh: true })})`,
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
  document.querySelector('[data-output="retailTariff"]').textContent = formatMoney(state.retailTariff, { currency, precise: true, perKwh: true })
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

export function setActiveDetailView(detailView) {
  document.querySelectorAll('[data-detail-view]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.detailView === detailView)
  })
}
