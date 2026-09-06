import { formatMoney, formatNumber } from './formatters.js'
import { renderCancellationFlow } from './flow-diagram.js'
import { t } from './i18n.js'

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

function roleMeta() {
  return {
    shown: { cls: 'cancel-term-shown', sign: '+', title: t('role_shown_title') },
    cancel: { cls: 'cancel-term-cancel', sign: '−', title: t('role_cancel_title') },
    strike: { cls: 'cancel-term-strike', sign: '+', title: t('role_strike_title') },
    charge: { cls: 'cancel-term-charge', sign: '+', title: t('role_charge_title') },
    loss: { cls: 'cancel-term-loss', sign: '+', title: t('role_loss_title') },
    retail: { cls: 'cancel-term-retail', sign: '+', title: t('role_retail_title') },
  }
}

// Vertical step-by-step breakdown: net headline always visible, term rows collapsed
// behind a keyboard-accessible <details>. No horizontal equation, no stacked strikethroughs.
function fmpCancelStrip(steps, resultValue, currency, selectedFmp) {
  const roleMetaMap = roleMeta()
  const rows = steps
    .map((step) => {
      const meta = roleMetaMap[step.role] || roleMetaMap.loss
      const valueStr = formatMoney(Math.abs(step.value), { currency, precise: true, perKwh: true })
      return `
        <div class="fmp-step-row ${meta.cls}" title="${meta.title}">
          <span class="fmp-step-owner">${step.owner || t('fmp_cancel_owner_default')}</span>
          <span class="fmp-step-label">${step.label}</span>
          <span class="fmp-step-sign">${meta.sign}</span>
          <span class="fmp-step-value">${valueStr}</span>
        </div>
      `
    })
    .join('')

  return `
    <div class="fmp-cancel-strip">
      <div class="fmp-cancel-header">
        <span class="fmp-cancel-title">${t('fmp_cancel_title')}</span>
        <span class="fmp-cancel-context">${t('fmp_cancel_context_selected')} ${formatMoney(selectedFmp, { currency, precise: true, perKwh: true })}</span>
        <span class="fmp-cancel-context">${t('fmp_cancel_context_note')}</span>
      </div>
      <div class="fmp-step-row fmp-step-result">
        <span class="fmp-step-owner"></span>
        <span class="fmp-step-label">${t('fmp_cancel_net_label')}</span>
        <span class="fmp-step-sign"></span>
        <strong class="fmp-step-value">${formatMoney(resultValue, { currency, precise: true, perKwh: true })}</strong>
      </div>
      ${
        steps.length > 0
          ? `
      <details class="fmp-cancel-derivation">
        <summary>${t('fmp_cancel_derivation_summary')}</summary>
        <div class="fmp-cancel-steps">${rows}</div>
      </details>`
          : ''
      }
    </div>
  `
}

function netTerm(text, kind = 'retained') {
  return `<span class="net-${kind}-term default">${text}</span>`
}

function billLineRow(labelKey, formulaHtml, valueHtml, extraCls = '') {
  return `
    <div class="bill-line-row ${extraCls}">
      <div class="bill-line-head">
        <span class="bill-line-label">${t(labelKey)}</span>
        <strong class="bill-line-value">${valueHtml}</strong>
      </div>
      <div class="bill-line-formula">${formulaHtml}</div>
    </div>
  `
}

function buildNetEquations(item, formulas, currency) {
  const fmt = (v) => formatMoney(v, { currency, precise: true, perKwh: true })
  const fmtN = (v) => formatNumber(v)
  const fmtT = (v) => formatMoney(v, { currency })
  const kppFig = item.lossFactor != null ? item.lossFactor.toFixed(3) : '1.000'
  const lossAmount =
    formulas?.evnLossCharge ?? Math.max(item.evnMarket - item.matched * item.fmp, 0)

  const visibleTerms = [
    item.matched > 0
      ? netTerm(`FMP (${fmt(item.fmp)}) × Kpp (${kppFig}) × ${fmtN(item.matched)} kWh`, 'cancelled')
      : '',
    item.matched > 0
      ? netTerm(`CDPPA (${fmt(item.dppaCharge)}) × ${fmtN(item.matched)} kWh`, 'retained')
      : '',
    Math.min(item.matched, item.contractQuantity) > 0
      ? netTerm(
          `− FMP (${fmt(item.fmp)}) × ${fmtN(Math.min(item.matched, item.contractQuantity))} kWh`,
          'cancelled',
        )
      : '',
    item.contractQuantity > 0
      ? netTerm(
          `Strike (${fmt(item.strikePrice)}) × ${fmtN(item.contractQuantity)} kWh`,
          'retained',
        )
      : '',
    item.shortfall > 0
      ? netTerm(`Retail (${fmt(item.retailTariff)}) × ${fmtN(item.shortfall)} kWh`, 'retained')
      : '',
    lossAmount > 0 ? netTerm(`${t('netterm_loss_adj')} ${fmtT(lossAmount)}`, 'retained') : '',
  ].filter(Boolean)

  return { expandedTerms: visibleTerms }
}

function walkthroughCaseCard(item, currency, formulas) {
  const fmtN = (v) => formatNumber(v)
  const fmtT = (v) => formatMoney(v, { currency })
  const fmtS = (v) => formatMoney(v, { currency, signed: true })
  const netEquations = buildNetEquations(item, formulas, currency)

  // Structured term lines instead of one wrapped prose formula — compact
  // figures so every factor fits on its own single unwrapped line.
  const fmtC = (v) => formatMoney(Math.round(v), { currency })
  const kppFig = item.lossFactor != null ? item.lossFactor.toFixed(3) : '1.000'
  const fmpFigC = fmtC(item.fmp)
  const dppaFigC = fmtC(item.dppaCharge)
  const retailFigC = fmtC(item.retailTariff)
  const strikeFigC = fmtC(item.strikePrice)
  const evnTerms = [
    `<span class="bill-term">FMP ${fmpFigC} × Kpp ${kppFig} × ${fmtN(item.matched)} kWh</span>`,
    `<span class="bill-term">CDPPA ${dppaFigC} × ${fmtN(item.matched)} kWh</span>`,
    ...(item.shortfall > 0
      ? [`<span class="bill-term">Retail ${retailFigC} × ${fmtN(item.shortfall)} kWh</span>`]
      : []),
  ].join('')

  const netTotal = item.evnAmount + item.cfdAmount
  const developerTerms = [
    `<span class="bill-term">− FMP ${fmpFigC} × ${fmtN(item.contractQuantity)} kWh</span>`,
    `<span class="bill-term">+ Strike ${strikeFigC} × ${fmtN(item.contractQuantity)} kWh</span>`,
  ].join('')

  const derivationRows = netEquations.expandedTerms
    .map(
      (term, i) => `
      <div class="net-derivation-row">
        <span class="net-operator">${i === 0 ? '' : '+'}</span>
        ${term}
      </div>
    `,
    )
    .join('')

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
        ${billLineRow('wt_row_evn', evnTerms, fmtT(item.evnAmount))}
        ${billLineRow('wt_row_developer', developerTerms, fmtS(item.cfdAmount), 'bill-line-developer')}
        ${billLineRow('wt_row_net', 'Net = EVN + Developer', fmtT(netTotal), 'bill-line-net')}
        ${
          derivationRows
            ? `
        <details class="walkthrough-derivation">
          <summary>${t('wt_derivation_summary')}</summary>
          <div class="net-derivation">
            ${derivationRows}
            <div class="net-derivation-row net-derivation-total">
              <span class="net-operator">=</span>
              <strong class="net-total">${fmtT(netTotal)}</strong>
            </div>
          </div>
        </details>`
            : ''
        }
      </div>
    </article>
  `
}

export function renderAppShell(root, scenarios, settlementModes) {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar panel">
        <div class="brand-block">
          <img class="brand-logo" src="/brand/allotrope-logo.png" alt="Allotrope logo" />
          <div>
            <p class="eyebrow">${t('header_eyebrow')}</p>
            <h1>${t('header_title')}</h1>
          </div>
        </div>
        <div class="topbar-actions">
          <div class="toggle-group" id="currencyToggle" aria-label="${t('currency_toggle_aria')}">
            <button class="toggle-button" data-currency="VND" type="button">${t('currency_vnd')}</button>
            <button class="toggle-button" data-currency="USD" type="button">${t('currency_usd')}</button>
          </div>
          <div class="topbar-secondary" id="topbarSecondary"></div>
        </div>
      </header>
      <p class="hero-note">${t('header_hero')}</p>

      <main class="story-grid">
        <section class="focus-column">
          <div class="chart-walkthrough-row">
            <div class="panel chart-panel">
              <div class="chart-headline">
              <div>
                <p class="eyebrow">${t('chart_eyebrow')}</p>
                <h2>${t('chart_title')}</h2>
              </div>
            </div>
              <div class="scenario-tabs" id="scenarioTabs">
                ${scenarios.map((scenario) => `<button class="scenario-tab" data-scenario="${scenario.id}">${scenario.label}</button>`).join('')}
              </div>
              <div class="chart-legend-row" id="profileLegend"></div>
              <div class="chart-wrap profile-wrap">
                <canvas id="profileChart" aria-label="${t('chart_aria')}"></canvas>
              </div>
              <div class="chart-wrap fmp-strip-wrap">
                <canvas id="fmpStrip" aria-label="${t('fmp_strip_aria')}"></canvas>
              </div>
              <div class="chart-caption" id="tariffCaption"></div>
              <p class="chart-tap-hint" id="chartTapHint">${t('chart_tap_hint')}</p>
              <div id="fiveLineBill"></div>
              <div class="hour-nav" id="hourNav">
                <button class="hour-nav-btn" id="prevHour" type="button" aria-label="${t('hour_prev_aria')}">${t('hour_prev_label')}</button>
                <span class="hour-nav-label" id="hourNavLabel">12:00</span>
                <button class="hour-nav-btn" id="nextHour" type="button" aria-label="${t('hour_next_aria')}">${t('hour_next_label')}</button>
              </div>
            </div>

            <section class="panel walkthrough-panel" tabindex="0">
              <div class="panel-header">
              <div>
                <p class="eyebrow">${t('walkthrough_eyebrow')}</p>
                <h2>${t('walkthrough_title')}</h2>
              </div>
              </div>
              <div class="walkthrough-grid" id="walkthroughCases"></div>
            </section>
          </div>

          <section class="panel multi-year-panel bottom-panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">${t('multiyear_eyebrow')}</p>
                <h2 id="multiYearTitle">${t('multiyear_title_template').replace('{years}', '20')}</h2>
              </div>
            </div>
            <div class="multi-year-rollups" id="multiYearRollups"></div>
            <div class="gate-panel" id="gatePanel"></div>
            <div class="chart-legend-row" id="multiYearLegend"></div>
            <div class="chart-wrap multi-year-chart-wrap" style="height:260px">
              <canvas id="multiYearChart" aria-label="${t('multiyear_chart_aria')}"></canvas>
            </div>
            <div class="chart-wrap savings-strip-wrap">
              <canvas id="savingsStrip" aria-label="${t('savings_strip_aria')}"></canvas>
            </div>
            <div class="assumptions-inline" id="multiYearParams"></div>
          </section>

          <div class="panel details-panel stage-panel">
            <div class="panel-header">
              <div>
                <p class="eyebrow">${t('details_eyebrow')}</p>
                <h2>${t('details_title')}</h2>
              </div>
            </div>
            <div id="selectedHourDetailsPanel"></div>
          </div>
        </section>

      </main>

      <section class="lower-grid">
        <div class="panel formula-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">${t('flow_eyebrow')}</p>
              <h2>${t('flow_title')}</h2>
            </div>
          </div>
          <div class="cancellation-flow-card">
            <div class="metric-label">${t('flow_metric_label')}</div>
            <div class="cancellation-flow" id="cancellationFlow"></div>
          </div>
          <p class="walkthrough-note" id="cancellationFlowNote"></p>
        </div>
      </section>

      <section class="panel controls-panel bottom-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">${t('controls_eyebrow')}</p>
            <h2>${t('controls_title')}</h2>
          </div>
          <div class="controls-header-actions">
            <button class="ghost-button" id="lockedStrikeButton" type="button">${t('controls_locked_strike')}</button>
            <button class="ghost-button" id="resetButton" type="button">${t('controls_reset')}</button>
          </div>
        </div>
        <div class="controls-grid">
          <label class="control-card">
            <span>${t('control_strike_label')}</span>
            <input id="strikePrice" type="range" min="1200" max="3200" step="1" />
            <strong data-output="strikePrice"></strong>
          </label>
          <label class="control-card">
            <span>${t('control_market_label')}</span>
            <input id="marketPrice" type="range" min="900" max="2600" step="10" />
            <strong data-output="marketPrice"></strong>
          </label>
          <label class="control-card">
            <span>${t('control_charge_label')}</span>
            <input id="dppaCharge" type="range" min="250" max="800" step="1" />
            <strong data-output="dppaCharge"></strong>
          </label>
          <label class="control-card">
            <span>${t('control_loss_label')}</span>
            <input id="lossFactor" type="range" min="1" max="1.08" step="0.001" />
            <strong data-output="lossFactor"></strong>
          </label>
          <label class="control-card select-card">
            <span>${t('control_settlement_label')}</span>
            <select id="settlementMode">
              ${settlementModes.map((mode) => `<option value="${mode.value}">${mode.label}</option>`).join('')}
            </select>
          </label>
          <label class="control-card">
            <span>${t('control_evn_esc_label')}</span>
            <input id="evnEscalation" type="range" min="0" max="0.10" step="0.005" />
            <strong data-output="evnEscalation"></strong>
          </label>
          <label class="control-card">
            <span>${t('control_strike_esc_label')}</span>
            <input id="strikeEscalation" type="range" min="0" max="0.10" step="0.005" />
            <strong data-output="strikeEscalation"></strong>
          </label>
          <label class="control-card">
            <span>${t('control_horizon_label')}</span>
            <input id="horizonYears" type="range" min="5" max="25" step="1" />
            <strong data-output="horizonYears"></strong>
          </label>
        </div>
        <p class="control-hints">${t('control_hints')}</p>
        <div class="assumptions-inline">
          <span>${t('assumptions_2025')}</span>
          <span>${t('assumptions_flat_retail')}</span>
          <span>${t('assumptions_internal_vnd')}</span>
          <span>${t('assumptions_illustrative_blocks')}</span>
          <span>${t('assumptions_synthetic_fmp')}</span>
          <span>${t('assumptions_click_hint')}</span>
        </div>
      </section>
    </div>
  `
}

export function renderFiveLineBill(container, bill, currency, scenario) {
  if (!container) return
  if (!bill) {
    container.innerHTML = ''
    return
  }

  const fmt = (value, signed = false) => formatMoney(value, { currency, signed })
  const fmtN = (value) => formatNumber(value)
  const lines = [
    ['1', t('bill_line_market_energy'), bill.lines.marketEnergy],
    ['2', t('bill_line_system_service'), bill.lines.systemService],
    ['3', t('bill_line_diff_clearing'), bill.lines.diffClearing],
    ['4', t('bill_line_additional_purchase'), bill.lines.additionalPurchase],
  ]

  container.innerHTML = `
    <section class="five-line-bill" aria-label="Monthly five-line settlement bill">
      <div class="five-line-head">
        <div>
          <p class="eyebrow">${t('bill_eyebrow')}</p>
          <h3>${scenario.label} ${t('bill_title_suffix')}</h3>
        </div>
        <span>${fmtN(bill.volumes.contracted)} ${t('bill_contracted_suffix')}</span>
      </div>
      <p class="five-line-caption">${t('bill_caption')}</p>
      <div class="five-line-table">
        ${lines
          .map(
            ([idx, label, value]) => `
          <div class="five-line-row">
            <span>${idx}</span>
            <strong>${label}</strong>
            <b>${fmt(value)}</b>
          </div>
        `,
          )
          .join('')}
        <div class="five-line-row subtotal">
          <span></span>
          <strong>${t('bill_cevn')}</strong>
          <b>${fmt(bill.cEvn)}</b>
        </div>
        <div class="five-line-row cfd">
          <span>5</span>
          <strong>${t('bill_cfd_settlement')}</strong>
          <b>${fmt(bill.lines.cfd, true)}</b>
        </div>
        <div class="five-line-row total">
          <span></span>
          <strong>${t('bill_ckh')}</strong>
          <b>${fmt(bill.cKh)}</b>
        </div>
      </div>
      <div class="plant-revenue-mirror">
        <span>${t('bill_mirror_label')}</span>
        <strong>${fmt(bill.plantRevenue.market)} ${t('bill_mirror_market_suffix')} ${bill.plantRevenue.cfd >= 0 ? '+' : '-'} ${fmt(Math.abs(bill.plantRevenue.cfd))} ${t('bill_mirror_cfd_suffix')} = ${fmt(bill.plantRevenue.total)}</strong>
      </div>
    </section>
  `
}

export function renderWalkthroughCases(container, selectedCase, currency, formulas) {
  if (!selectedCase) {
    container.innerHTML = ''
    return
  }
  const strip =
    formulas && formulas.fmpCancellationSteps
      ? fmpCancelStrip(
          formulas.fmpCancellationSteps,
          formulas.dppaUnitCost,
          currency,
          formulas.marketPrice,
        )
      : ''
  container.innerHTML = walkthroughCaseCard(selectedCase, currency, formulas) + strip
}

export function renderFormulas(result, warningText, currency) {
  if (!result) return null

  const flowHtml = renderCancellationFlow(result, currency)
  const container = document.querySelector('#cancellationFlow')
  if (container) {
    container.innerHTML = flowHtml
    container.classList.add('cancellation-flow')
  }

  const note = result.cleanCancellation ? t('flow_clean_note') : t('flow_partial_note')
  const warningSuffix = warningText ? ` ${warningText}` : ''
  const noteNode = document.querySelector('#cancellationFlowNote')
  if (noteNode) noteNode.textContent = `${note}${warningSuffix}`

  return { flowHtml, kind: result.cleanCancellation ? 'clean' : 'partial' }
}

export function renderSelectedHourDetails(container, interval, currency, inputs) {
  const evnUnitCost = interval.load > 0 ? interval.evnTotal / interval.load : 0
  const developerUnitCost = interval.load > 0 ? interval.developer / interval.load : 0
  const intervalFmp = interval.fmp ?? inputs.marketPrice

  container.innerHTML = `
    <div class="settlement-grid">
      <div class="formula-detail-card evn-detail payment-panel">
        <p class="formula-label">${t('details_evn_label')}</p>
        <div class="payment-stack">
          ${paymentEquation(
            t('details_evn_matched'),
            formatMoney(interval.load > 0 ? interval.evnMarket / interval.load : 0, {
              currency,
              precise: true,
              perKwh: true,
            }),
            `${formatNumber(interval.matched)} matched kWh`,
            formatMoney(interval.evnMarket, { currency }),
            `${formatNumber(interval.matched)} / ${formatNumber(interval.load)} x ${formatMoney(intervalFmp * inputs.lossFactor, { currency, precise: true, perKwh: true })}`,
            'evn',
          )}
          ${paymentEquation(
            t('details_evn_dppa_network'),
            formatMoney(interval.load > 0 ? interval.evnDppa / interval.load : 0, {
              currency,
              precise: true,
              perKwh: true,
            }),
            `${formatNumber(interval.matched)} matched kWh`,
            formatMoney(interval.evnDppa, { currency }),
            `${formatNumber(interval.matched)} / ${formatNumber(interval.load)} x ${formatMoney(inputs.dppaCharge, { currency, precise: true, perKwh: true })}`,
            'accent',
          )}
          ${paymentEquation(
            t('details_evn_shortfall'),
            formatMoney(interval.load > 0 ? interval.evnRetail / interval.load : 0, {
              currency,
              precise: true,
              perKwh: true,
            }),
            `${formatNumber(interval.shortfall)} shortfall kWh`,
            formatMoney(interval.evnRetail, { currency }),
            `${formatNumber(interval.shortfall)} / ${formatNumber(interval.load)} x ${formatMoney(inputs.retailTariff, { currency, precise: true, perKwh: true })}`,
            'warning',
          )}
        </div>
        <div class="payment-total-card evn-tone">
          <span class="metric-label">${t('details_evn_total')}</span>
          <strong>${formatMoney(evnUnitCost, { currency, precise: true, perKwh: true })}</strong>
          <span>${formatMoney(interval.evnTotal, { currency })} for ${formatNumber(interval.load)} ${t('details_load_suffix')}</span>
        </div>
      </div>
      <div class="formula-detail-card developer-detail payment-panel">
        <p class="formula-label">${t('details_dev_label')}</p>
        <div class="payment-stack">
          ${paymentEquation(
            t('details_dev_cfd'),
            formatMoney(developerUnitCost, { currency, precise: true, perKwh: true, signed: true }),
            `${formatNumber(interval.contractQuantity)} contracted kWh`,
            formatMoney(interval.developer, { currency, signed: true }),
            `${formatNumber(interval.contractQuantity)} / ${formatNumber(interval.load)} x (${formatMoney(inputs.strikePrice, { currency, precise: true, perKwh: true })} - ${formatMoney(intervalFmp, { currency, precise: true, perKwh: true })})`,
            'developer',
          )}
        </div>
        <div class="payment-total-card developer-tone">
          <span class="metric-label">${t('details_dev_total')}</span>
          <strong>${formatMoney(developerUnitCost, { currency, precise: true, perKwh: true, signed: true })}</strong>
          <span>${formatMoney(interval.developer, { currency, signed: true })} for ${formatNumber(interval.load)} ${t('details_load_suffix')}</span>
        </div>
      </div>
    </div>
  `
}

export function updateControlOutputs(state, settlementModes, currency) {
  document.querySelector('[data-output="strikePrice"]').textContent = formatMoney(
    state.strikePrice,
    { currency, precise: true, perKwh: true },
  )
  document.querySelector('[data-output="marketPrice"]').textContent = formatMoney(
    state.marketPrice,
    { currency, precise: true, perKwh: true },
  )
  document.querySelector('[data-output="dppaCharge"]').textContent = formatMoney(state.dppaCharge, {
    currency,
    precise: true,
    perKwh: true,
  })
  document.querySelector('[data-output="lossFactor"]').textContent = state.lossFactor.toFixed(3)
  document.querySelector('[data-output="evnEscalation"]').textContent =
    `${(state.evnEscalation * 100).toFixed(1)}%/yr`
  document.querySelector('[data-output="strikeEscalation"]').textContent =
    `${(state.strikeEscalation * 100).toFixed(1)}%/yr`
  document.querySelector('[data-output="horizonYears"]').textContent = `${state.horizonYears} yr`
}

export function renderMultiYearPanel(multiYear, currency) {
  const rollupsEl = document.querySelector('#multiYearRollups')
  const paramsEl = document.querySelector('#multiYearParams')
  const titleEl = document.querySelector('#multiYearTitle')
  if (!rollupsEl || !multiYear) return

  const { rollups, crossoverYear, years, evnEscalation, strikeEscalation } = multiYear
  const fmt = (v) => formatMoney(v, { currency })
  const fmtPct = (v) => `${(v * 100).toFixed(1)}%`
  const savTone = (s) => (s > 0 ? 'result' : s < 0 ? 'warning' : 'default')
  const crossoverText = crossoverYear
    ? `${t('crossover_year_prefix')} ${crossoverYear}`
    : `${t('crossover_gt_prefix')} ${years} ${t('crossover_gt_suffix')}`

  // The differential (EVN escalation minus strike escalation) is the quantity
  // MISSION.md's second success criterion is actually about -- "why a virtual
  // DPPA is rarely a Year-1 discount, and where the value comes from (EVN
  // escalation vs a locked strike)". Showing EVN%/yr and strike%/yr as two
  // separate facts (below, in #multiYearParams) never states the differential
  // itself; this pill does.
  const differential = evnEscalation - strikeEscalation
  const differentialText = t('multiyear_differential_template')
    .replace('{sign}', differential >= 0 ? '+' : '-')
    .replace('{value}', Math.abs(differential * 100).toFixed(1))
  const differentialTone = differential > 0 ? 'result' : differential < 0 ? 'warning' : 'default'

  if (titleEl) titleEl.textContent = t('multiyear_title_template').replace('{years}', years)

  rollupsEl.innerHTML = `
    ${compactPill(t('pill_year1_savings'), fmt(rollups.year1.savings), savTone(rollups.year1.savings))}
    ${rollups.year10 ? compactPill(t('pill_10yr_cumulative'), fmt(rollups.year10.savings), savTone(rollups.year10.savings)) : ''}
    ${compactPill(`${years}${t('pill_lifetime_suffix')}`, fmt(rollups.lifetime.savings), savTone(rollups.lifetime.savings))}
    ${compactPill(t('pill_crossover'), crossoverText, crossoverYear ? 'accent' : 'default')}
    ${compactPill('', differentialText, differentialTone)}
  `

  if (paramsEl) {
    paramsEl.innerHTML = `
      <span>${t('param_evn')} ${fmtPct(evnEscalation)}${t('param_pct_suffix')}</span>
      <span>${t('param_strike')} ${fmtPct(strikeEscalation)}${t('param_pct_suffix')}</span>
      <span>${t('param_fmp_flat')}</span>
      <span>${t('param_rep_day')}</span>
    `
  }
}
export function renderGatePanel(container, gates, currency) {
  if (!container || !gates) return
  const lamp = (labelKey, pass, headroom) =>
    compactPill(
      `${t(labelKey)}: ${pass ? t('gate_pass_value') : t('gate_fail_value')}`,
      headroom,
      pass ? 'result' : 'warning',
    )
  const failing = [
    ['buyer', gates.buyerPass],
    ['lender', gates.lenderPass],
    ['investor', gates.investorPass],
  ]
    .filter(([, pass]) => !pass)
    .map(([name]) => t(`gate_${name}_label`))
    .join(', ')
  const bindingText = gates.allPass
    ? t('gate_all_clear')
    : t('gate_binding_template').replace('{gate}', failing)
  container.innerHTML = `
    <p class="gate-panel-title">${t('gate_panel_title')}</p>
    <div class="gate-lamps">
      ${lamp('gate_buyer_label', gates.buyerPass, formatMoney(gates.buyerHeadroomVnd, { currency }))}
      ${lamp('gate_lender_label', gates.lenderPass, formatMoney(gates.lenderHeadroomVnd, { currency }))}
      ${lamp('gate_investor_label', gates.investorPass, formatMoney(gates.investorHeadroomVndPerKwh, { currency, precise: true, perKwh: true }))}
    </div>
    <p class="gate-binding">${bindingText}</p>
  `
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
