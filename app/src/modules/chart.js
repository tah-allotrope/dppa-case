import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from 'chart.js'
import { convertMoney, EXCHANGE_RATE, formatMoney } from './formatters.js'
import { t } from './i18n.js'

// PHASE-04: explicit registration instead of chart.js/auto trims the bundle to
// only the line-chart building blocks this app actually renders (all charts
// are `type: 'line'`). Legend is not registered — series names are written
// directly at their line ends by the directLabels plugin below.
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
)

let profileChart
let fmpStripChart
let savingsStripChart
let multiYearChart
let crossoverIndex = -1
// renderAppShell() replaces the canvases on every language switch, while these
// cached instances survive in module scope. Reusing a Chart bound to a detached
// canvas silently paints nowhere and swallows click-to-select-hour, so each
// renderer reclaims its slot when the canvas changed underneath it.
export function takeOver(instance, canvas) {
  if (instance && instance.canvas !== canvas) {
    instance.destroy()
    return undefined
  }
  return instance
}
// Mutated in place on every renderProfileChart call so the tariffOverlay
// plugin's getState() closure (captured once, at chart creation) always
// reads the latest inputs instead of a throwaway per-call object.
const profileChartState = { inputs: null, currency: 'VND' }

function token(name, fallback) {
  if (typeof document === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

// Every chart re-animates on each slider input — exactly the repeated motion
// prefers-reduced-motion exists to suppress. Centralized so the webdriver
// animation kill (deterministic pixels under test) and the user preference
// cannot drift apart across the four renderers.
export function chartAnimation(fallback) {
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return false
  return fallback
}

export function refreshChartTheme() {
  const grid = token('--chart-grid', neonGrid)
  const tick = token('--chart-tick', tickColor)
  for (const chart of [profileChart, fmpStripChart, savingsStripChart, multiYearChart]) {
    if (!chart) continue
    chart.options.animation = false
    for (const scaleId of ['x', 'y']) {
      const scale = chart.options.scales[scaleId]
      if (!scale) continue
      if (scale.ticks) scale.ticks.color = tick
      if (scale.grid) scale.grid.color = grid
    }
    chart.update('none')
  }
}

if (typeof window !== 'undefined') window.addEventListener('dppa-theme-change', refreshChartTheme)

const neonGrid = 'rgba(160, 183, 217, 0.12)'
const tickColor = '#bcd5ff'

// Illustrative tariff-style time blocks for storytelling only.
// They help a CFO read the day shape, but the current app still uses a flat
// retail tariff input rather than time-of-use tariff settlement.
// startHour/endHour map to the 0-23 hour axis. Only the very subtle fill is
// drawn on the plot; band names/prices live in #tariffCaption below the chart.
const TARIFF_BANDS = [
  { key: 'band_off_peak', startHour: 0, endHour: 4, fill: 'rgba(71,215,255,0.05)' },
  { key: 'band_standard', startHour: 4, endHour: 9, fill: 'rgba(255,216,79,0.04)' },
  { key: 'band_peak', startHour: 9, endHour: 11, fill: 'rgba(255,104,216,0.05)' },
  { key: 'band_standard', startHour: 11, endHour: 17, fill: 'rgba(255,216,79,0.04)' },
  { key: 'band_peak', startHour: 17, endHour: 20, fill: 'rgba(255,104,216,0.05)' },
  { key: 'band_standard', startHour: 20, endHour: 22, fill: 'rgba(255,216,79,0.04)' },
  { key: 'band_off_peak', startHour: 22, endHour: 24, fill: 'rgba(71,215,255,0.05)' },
]

// Vivid magenta-red for FMP so it is unmistakably distinct from the amber solar line
const FMP_COLOR = '#ff3d7f'

function makeTariffPlugin() {
  return {
    id: 'tariffOverlay',

    beforeDatasetsDraw(chart) {
      const { ctx } = chart
      const area = chart.chartArea
      if (!area) return
      const totalHours = 24
      const w = area.right - area.left

      for (const band of TARIFF_BANDS) {
        const x0 = area.left + (band.startHour / totalHours) * w
        const x1 = area.left + (band.endHour / totalHours) * w
        ctx.save()
        ctx.fillStyle = band.fill
        ctx.fillRect(x0, area.top, x1 - x0, area.bottom - area.top)
        ctx.restore()
      }
    },
  }
}

// ─── Direct series labels ────────────────────────────────────────────────────
// Series names are drawn at the line's last point instead of a detached
// dot-chip legend row, so the eye never leaves the plot to decode colors.
function makeDirectLabelPlugin() {
  return {
    id: 'directLabels',

    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart
      if (!chartArea) return
      const meta = chart.getDatasetMeta(0)
      if (!meta || !meta.data.length) return

      // Collect every visible series end-point first, then resolve collisions
      // deterministically: sort by y and push labels apart until each has a
      // guaranteed 14px lane, clamped inside the plot area.
      const pending = []
      chart.data.datasets.forEach((dataset, index) => {
        const dsMeta = chart.getDatasetMeta(index)
        if (!dsMeta || dsMeta.hidden) return
        const lastPoint = [...dsMeta.data].reverse().find((p) => p && !Number.isNaN(p.x))
        if (!lastPoint) return
        const label = dataset.endLabel ?? dataset.label ?? ''
        if (!label) return
        pending.push({ label, color: dataset.borderColor, y: lastPoint.y })
      })
      if (!pending.length) return

      pending.sort((a, b) => a.y - b.y)
      const lane = 17
      for (let i = 1; i < pending.length; i++) {
        if (pending[i].y - pending[i - 1].y < lane) pending[i].y = pending[i - 1].y + lane
      }
      const overflow = pending[pending.length - 1].y - (chartArea.bottom - 6)
      if (overflow > 0) {
        for (const item of pending) item.y -= overflow
        for (let i = 1; i < pending.length; i++) {
          if (pending[i].y - pending[i - 1].y < lane) pending[i].y = pending[i - 1].y + lane
        }
      }

      ctx.save()
      ctx.font = '600 10px Inter, system-ui, sans-serif'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      for (const item of pending) {
        ctx.fillStyle = item.color
        ctx.fillText(item.label, chartArea.right + 7, Math.max(item.y, chartArea.top + 6))
      }
      ctx.restore()
      drawnBoxes = drawnBoxes.filter((box) => box.chart !== chart)
    },
  }
}

// Scratch space for per-draw label collision avoidance (reset after each draw)
let drawnBoxes = []

// Vertical marker at the first year DPPA becomes cheaper than BAU (when one
// exists within the horizon) so the crossover is read, not implied.
const crossoverMarkerPlugin = {
  id: 'crossoverMarker',

  afterDatasetsDraw(chart) {
    if (crossoverIndex < 0 || chart.canvas.id !== 'multiYearChart') return
    const { ctx, chartArea, data } = chart
    if (!chartArea || !data.labels || crossoverIndex >= data.labels.length) return
    const x = chart.scales.x.getPixelForValue(crossoverIndex)
    if (x < chartArea.left || x > chartArea.right) return

    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = 'rgba(76, 175, 130, 0.7)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(x, chartArea.top)
    ctx.lineTo(x, chartArea.bottom)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.font = '600 10px Inter, system-ui, sans-serif'
    ctx.textAlign = x > chartArea.right - 90 ? 'right' : 'left'
    ctx.fillStyle = '#4caf82'
    const label = `${t('legend_crossover')} ${data.labels[crossoverIndex]}`
    ctx.fillText(label, x + (ctx.textAlign === 'left' ? 5 : -5), chartArea.top + 10)
    ctx.restore()
  },
}

const directLabelsPlugin = makeDirectLabelPlugin()

// ─── Caption builder ─────────────────────────────────────────────────────────
// All tariff-band names/FMP values and the strike explanation live in a muted
// chip strip below the profile chart — never inside the plot. It reads from
// the same inputs as the shading plugin so they can never disagree.

function range(start, end) {
  const out = []
  for (let h = start; h < end; h++) out.push(h)
  return out
}

// One chip per distinct band name (Standard/Peak/Off-peak each repeat across
// the day): name + FMP min–max over every hour that band covers.
function mergedBandChips(inputs, currency) {
  const groups = []
  for (const band of TARIFF_BANDS) {
    let group = groups.find((g) => g.key === band.key)
    if (!group) {
      group = { key: band.key, hours: [] }
      groups.push(group)
    }
    group.hours.push(...range(band.startHour, band.endHour))
  }

  const fmtOpts = { maximumFractionDigits: currency === 'USD' ? 3 : 0 }
  return groups.map((group) => {
    const values = inputs.fmpCurve
      ? group.hours.map((h) => inputs.fmpCurve[h] ?? inputs.marketPrice)
      : [inputs.marketPrice]
    const min = convertMoney(Math.min(...values), currency)
    const max = convertMoney(Math.max(...values), currency)
    const fmpText =
      min === max
        ? `${min.toLocaleString('en-US', fmtOpts)}`
        : `${min.toLocaleString('en-US', fmtOpts)}–${max.toLocaleString('en-US', fmtOpts)}`
    return `
      <span class="caption-chip">
        ${t(group.key)}
        <b>${fmpText} ${currency}/kWh</b>
      </span>`
  })
}

export function renderTariffCaption(inputs, currency = 'VND') {
  if (typeof document === 'undefined') return
  const el = document.getElementById('tariffCaption')
  if (!el) return
  if (!inputs) {
    el.innerHTML = ''
    return
  }

  const chips = []
  if (inputs.strikePrice != null) {
    chips.push(`
      <span class="caption-chip caption-strike">
        ${t('caption_strike_ref').replace('{value}', formatMoney(inputs.strikePrice, { currency, precise: currency === 'USD' }))}
      </span>`)
  }
  chips.push(...mergedBandChips(inputs, currency))
  el.innerHTML = chips.join('')
}

function sharedTooltipStyle() {
  return {
    backgroundColor: 'rgba(9, 14, 31, 0.92)',
    borderColor: 'rgba(82, 188, 255, 0.45)',
    borderWidth: 1,
    titleColor: '#f6fbff',
    bodyColor: '#dcecff',
  }
}

function baseOptions(narrow = false) {
  const gridColor = token('--chart-grid', neonGrid)
  const tickCol = token('--chart-tick', tickColor)
  const tickFont = { size: 10 }

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: chartAnimation({ duration: 350 }),
    // Right padding reserves a gutter so the end-of-line series labels fit
    // inside the canvas without overlapping the plotted data.
    layout: { padding: { top: 8, right: 92 } },
    plugins: {
      legend: { display: false },
      tooltip: sharedTooltipStyle(),
    },
    scales: {
      x: {
        grid: { color: gridColor },
        // 24 hourly labels mash together below ~520px (seen at 320px); quarter
        // the tick budget there — Chart.js auto-skip does the rest.
        ticks: { color: tickCol, font: tickFont, maxRotation: 0, maxTicksLimit: narrow ? 4 : 12 },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: tickCol, font: tickFont, maxTicksLimit: 6 },
        title: { display: true, text: 'kWh', color: tickCol, font: { size: 10 } },
      },
    },
  }
}

export function renderProfileChart(
  canvas,
  labels,
  intervals,
  selectedHour,
  onSelect,
  inputs,
  currency = 'VND',
) {
  // Shared, module-level state bag read by the plugin on every draw — mutated
  // in place below rather than reassigned, so the plugin's captured closure
  // (set once, at chart creation) always sees the latest values.
  profileChartState.inputs = inputs
  profileChartState.currency = currency
  renderTariffCaption(inputs, currency)
  const isNarrowViewport =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 520px)').matches
      : false
  const basePoint = isNarrowViewport ? 3 : 4
  const selPoint = isNarrowViewport ? 6 : 8
  const baseHover = isNarrowViewport ? 5 : 6
  const selHover = isNarrowViewport ? 8 : 10

  function buildDatasets(ivs, selHour) {
    return [
      {
        label: t('series_load'),
        data: ivs.map((i) => i.load),
        borderColor: '#47d7ff',
        backgroundColor: 'rgba(71,215,255,0.14)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: ivs.map((_, idx) => (idx === selHour ? selPoint : basePoint)),
        pointHoverRadius: ivs.map((_, idx) => (idx === selHour ? selHover : baseHover)),
        pointBackgroundColor: ivs.map((_, idx) => (idx === selHour ? '#c9f7ff' : '#47d7ff')),
      },
      {
        label: t('series_solar'),
        data: ivs.map((i) => i.generation),
        borderColor: '#ffd84f',
        backgroundColor: 'rgba(255,216,79,0.14)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: ivs.map((_, idx) => (idx === selHour ? selPoint : basePoint)),
        pointHoverRadius: ivs.map((_, idx) => (idx === selHour ? selHover : baseHover)),
        pointBackgroundColor: ivs.map((_, idx) => (idx === selHour ? '#fff1b5' : '#ffd84f')),
      },
      {
        label: t('series_matched'),
        data: ivs.map((i) => i.matched),
        borderColor: '#f5fbff',
        backgroundColor: 'rgba(245,251,255,0.16)',
        fill: true,
        tension: 0.25,
        borderWidth: 2,
        pointRadius: 0,
      },
    ]
  }

  profileChart = takeOver(profileChart, canvas)
  if (profileChart) {
    profileChart.data.datasets = buildDatasets(intervals, selectedHour)
    profileChart.data.labels = labels
    profileChart.update('none')
    return profileChart
  }

  profileChart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: buildDatasets(intervals, selectedHour) },
    options: {
      ...baseOptions(isNarrowViewport),
      onClick: (event) => {
        const pts = profileChart.getElementsAtEventForMode(
          event,
          'index',
          { intersect: false },
          true,
        )
        if (pts.length) onSelect(pts[0].index)
      },
    },
    plugins: [makeTariffPlugin(), directLabelsPlugin],
  })

  return profileChart
}

// Slim sparkline-style strip beneath the main plot: the FMP curve (VND/kWh)
// lives here on its own implicit price axis so the main plot stays purely in
// kWh. Shares the same hour axis and click-to-select-hour behavior.
export function renderFmpStrip(canvas, labels, intervals, currency = 'VND', onSelect) {
  if (!canvas) return

  function buildDataset(ivs, curr) {
    return {
      label: `${t('series_fmp')} (${curr}/kWh)`,
      endLabel: t('series_fmp'),
      data: ivs.map((i) => convertMoney(i.fmp, curr)),
      borderColor: FMP_COLOR,
      backgroundColor: 'rgba(255,61,127,0)',
      fill: false,
      tension: 0.35,
      borderWidth: 1.6,
      pointRadius: 0,
      pointHitRadius: 8,
    }
  }

  const strikeLine = {
    id: 'fmpStrikeLine',
    beforeDatasetsDraw(chart) {
      const strike = profileChartState.inputs?.strikePrice
      if (!strike) return
      const { ctx, chartArea } = chart
      const y = chart.scales.y.getPixelForValue(convertMoney(strike, profileChartState.currency))
      if (!chartArea || y < chartArea.top || y > chartArea.bottom) return
      ctx.save()
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = 'rgba(82, 144, 255, 0.65)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(chartArea.left, y)
      ctx.lineTo(chartArea.right, y)
      ctx.stroke()
      ctx.restore()
    },
  }

  fmpStripChart = takeOver(fmpStripChart, canvas)
  if (fmpStripChart) {
    fmpStripChart.data.labels = labels
    fmpStripChart.data.datasets = [buildDataset(intervals, currency)]
    fmpStripChart.options.onClick = makeStripClickHandler(onSelect)
    fmpStripChart.update('none')
    return fmpStripChart
  }

  const gridColor = token('--chart-grid', neonGrid)
  const tickCol = token('--chart-tick', tickColor)

  function makeStripClickHandler(select) {
    if (!select) return undefined
    return (event) => {
      const pts = fmpStripChart.getElementsAtEventForMode(
        event,
        'index',
        { intersect: false },
        true,
      )
      if (pts.length) select(pts[0].index)
    }
  }

  fmpStripChart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [buildDataset(intervals, currency)] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: chartAnimation(undefined),
      layout: { padding: { top: 4, right: 92 } },
      plugins: { legend: { display: false }, tooltip: sharedTooltipStyle() },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: tickCol, font: { size: 9 }, maxRotation: 0, maxTicksLimit: 6 },
        },
        y: {
          grid: { drawOnChartArea: false },
          border: { display: false },
          ticks: { display: false },
        },
      },
      onClick: makeStripClickHandler(onSelect),
    },
    plugins: [strikeLine, directLabelsPlugin],
  })

  return fmpStripChart
}

export function renderMultiYearChart(canvas, multiYear, currency) {
  if (!canvas || !multiYear) return

  const { yearlyData } = multiYear
  const isUsd = currency === 'USD'
  const divisor = isUsd ? EXCHANGE_RATE * 1e6 : 1e9
  const unitLabel = isUsd ? 'Million USD' : 'Billion VND'

  const labels = yearlyData.map((y) => `Y${y.year}`)
  const cumBauData = yearlyData.map((y) => +(y.cumBau / divisor).toFixed(3))
  const cumDppaData = yearlyData.map((y) => +(y.cumDppa / divisor).toFixed(3))

  // Crossover = first year DPPA becomes cheaper than BAU; annotated in-plot by
  // the crossoverMarker plugin below. -1 when the horizon never crosses over.
  crossoverIndex = yearlyData.findIndex((y) => y.cumSavings > 0)

  // BAU vs DPPA cumulative cost lines; the gap between them IS the savings
  // story, so the band between the two lines is filled green. Cumulative
  // savings itself gets its own hero strip below (renderSavingsStrip).
  const datasets = [
    {
      label: t('legend_cum_bau'),
      endLabel: t('legend_cum_bau'),
      data: cumBauData,
      borderColor: '#e06c6c',
      borderDash: [6, 4],
      backgroundColor: 'rgba(224,108,108,0.08)',
      tension: 0.3,
      pointRadius: 2,
      fill: false,
    },
    {
      label: t('legend_cum_dppa'),
      endLabel: t('legend_cum_dppa'),
      data: cumDppaData,
      borderColor: '#4fc3f7',
      backgroundColor: 'rgba(76,175,130,0.22)',
      tension: 0.3,
      pointRadius: 2,
      fill: '-1',
    },
  ]

  multiYearChart = takeOver(multiYearChart, canvas)
  if (multiYearChart) {
    multiYearChart.data.labels = labels
    multiYearChart.data.datasets = datasets
    if (multiYearChart.options.scales.y.title) {
      multiYearChart.options.scales.y.title.text = unitLabel
    }
    multiYearChart.update('none')
    return multiYearChart
  }
  multiYearChart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: chartAnimation({ duration: 200 }),
      layout: { padding: { top: 8, right: 118 } },
      plugins: {
        legend: { display: false },
        tooltip: sharedTooltipStyle(),
      },
      scales: {
        x: {
          grid: { color: token('--chart-grid', neonGrid) },
          ticks: {
            color: token('--chart-tick', tickColor),
            font: { size: 10 },
            maxRotation: 0,
            maxTicksLimit: 12,
          },
        },
        y: {
          grid: { color: token('--chart-grid', neonGrid) },
          ticks: {
            color: token('--chart-tick', tickColor),
            font: { size: 10 },
            maxTicksLimit: 6,
            callback: (v) => v.toLocaleString('en-US'),
          },
          title: {
            display: true,
            text: unitLabel,
            color: token('--chart-tick', tickColor),
            font: { size: 11, weight: '600' },
          },
        },
      },
    },
    plugins: [directLabelsPlugin, crossoverMarkerPlugin],
  })

  return multiYearChart
}

// Hero strip beneath the multi-year chart: cumulative savings on its own
// scale so the headline financial takeaway is never a flat line hugging zero.
export function renderSavingsStrip(canvas, multiYear, currency) {
  if (!canvas || !multiYear) return

  const { yearlyData } = multiYear
  const isUsd = currency === 'USD'
  const divisor = isUsd ? EXCHANGE_RATE * 1e6 : 1e9

  const labels = yearlyData.map((y) => `Y${y.year}`)
  const cumSavData = yearlyData.map((y) => +(y.cumSavings / divisor).toFixed(3))

  function buildDataset(ivs) {
    return {
      label: t('legend_cum_savings'),
      endLabel: t('legend_cum_savings'),
      data: ivs,
      borderColor: '#4caf82',
      backgroundColor: 'rgba(76,175,130,0.14)',
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2.4,
      fill: true,
    }
  }

  savingsStripChart = takeOver(savingsStripChart, canvas)
  if (savingsStripChart) {
    savingsStripChart.data.labels = labels
    savingsStripChart.data.datasets = [buildDataset(cumSavData)]
    savingsStripChart.update('none')
    return savingsStripChart
  }

  savingsStripChart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [buildDataset(cumSavData)] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: chartAnimation({ duration: 200 }),
      layout: { padding: { top: 4, right: 118 } },
      plugins: { legend: { display: false }, tooltip: sharedTooltipStyle() },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: token('--chart-tick', tickColor),
            font: { size: 9 },
            maxRotation: 0,
            maxTicksLimit: 6,
          },
        },
        y: {
          // No min: 0 — cumulative savings can be negative all horizon long,
          // and pinning the floor at zero plots the whole series out of view.
          grace: '12%',
          grid: { drawOnChartArea: false },
          border: { display: false },
          ticks: {
            color: token('--chart-tick', tickColor),
            font: { size: 9 },
            maxTicksLimit: 4,
            callback: (v) => (v === 0 ? '0' : v.toLocaleString('en-US')),
          },
        },
      },
    },
    plugins: [directLabelsPlugin],
  })

  return savingsStripChart
}
