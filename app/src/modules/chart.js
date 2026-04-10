import Chart from 'chart.js/auto'
import { formatMoney } from './formatters'

let profileChart

const neonGrid = 'rgba(160, 183, 217, 0.12)'
const tickColor = '#bcd5ff'

// Tariff time-band definitions matching the reference screenshot.
// startHour/endHour map to the 0-23 hour axis.
const TARIFF_BANDS = [
  { label: 'Off-peak',  time: '10 pm – 4 am',     startHour: 0,  endHour: 4,  fill: 'rgba(71,215,255,0.06)',   lineColor: 'rgba(71,215,255,0.40)',  textColor: '#47d7ff' },
  { label: 'Standard',  time: '4 am – 9:30 am',    startHour: 4,  endHour: 9,  fill: 'rgba(255,216,79,0.05)',    lineColor: 'rgba(255,216,79,0.40)',   textColor: '#ffd84f' },
  { label: 'Peak',      time: '9:30 am – 11:30 am', startHour: 9,  endHour: 11, fill: 'rgba(255,104,216,0.07)',   lineColor: 'rgba(255,104,216,0.45)',  textColor: '#ff68d8' },
  { label: 'Standard',  time: '11:30 am – 5 pm',   startHour: 11, endHour: 17, fill: 'rgba(255,216,79,0.05)',    lineColor: 'rgba(255,216,79,0.40)',   textColor: '#ffd84f' },
  { label: 'Peak',      time: '5 pm – 8 pm',        startHour: 17, endHour: 20, fill: 'rgba(255,104,216,0.07)',   lineColor: 'rgba(255,104,216,0.45)',  textColor: '#ff68d8' },
  { label: 'Standard',  time: '8 pm – 10 pm',       startHour: 20, endHour: 22, fill: 'rgba(255,216,79,0.05)',    lineColor: 'rgba(255,216,79,0.40)',   textColor: '#ffd84f' },
  { label: 'Off-peak',  time: '10 pm – 12 am',      startHour: 22, endHour: 24, fill: 'rgba(71,215,255,0.06)',   lineColor: 'rgba(71,215,255,0.40)',  textColor: '#47d7ff' },
]

const CALLOUT_COLORS = {
  shortfall: { bg: 'rgba(155,20,24,0.93)',   border: 'rgba(215,55,55,0.9)',   text: '#fff' },
  balanced:  { bg: 'rgba(12,78,158,0.93)',   border: 'rgba(55,135,220,0.9)',  text: '#fff' },
  excess:    { bg: 'rgba(8,106,152,0.93)',   border: 'rgba(55,175,220,0.9)',  text: '#fff' },
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function buildCallouts(intervals, inputs, currency) {
  if (!intervals || !intervals.length) return []

  function bestHour(key) {
    const pool = intervals.filter(i => i.classification?.key === key)
    const src = pool.length ? pool : intervals
    if (key === 'shortfall') return src.reduce((a, b) => (b.load - b.generation > a.load - a.generation ? b : a))
    if (key === 'excess')    return src.reduce((a, b) => (b.generation - b.load > a.generation - a.load ? b : a))
    return src.reduce((a, b) => (Math.abs(b.load - b.generation) < Math.abs(a.load - a.generation) ? b : a))
  }

  const fmt = (v) => formatMoney(v, { currency, signed: false })

  return ['shortfall', 'balanced', 'excess'].map((type) => {
    const iv = bestHour(type)
    const cfdRate = inputs.strikePrice - iv.fmp
    const cfdAmount = iv.contractQuantity * cfdRate
    const volLabel = type === 'shortfall'
      ? `Under supply: ${(iv.shortfall / 1000).toFixed(0)} MWh`
      : `Over supply: ${(iv.excess / 1000).toFixed(0)} MWh`

    return {
      hour: iv.hour,
      type,
      lines: [
        volLabel,
        `CfD = ${Math.round(cfdRate)}x${(iv.contractQuantity/1000).toFixed(0)}kWh = ${fmt(cfdAmount)}`,
        `EVN = ${fmt(iv.evnTotal)}`,
        `Total (DPPA) = ${fmt(iv.total)}`,
        `Total (No-DPPA) = ${fmt(iv.baseline)}`,
        `Savings (DPPA) = ${formatMoney(iv.baseline - iv.total, { currency, signed: true })}`,
      ],
      // Compact version used on narrow canvases (< 320px wide)
      linesCompact: [
        volLabel,
        `CfD = ${fmt(cfdAmount)}`,
        `EVN = ${fmt(iv.evnTotal)}`,
        `DPPA = ${fmt(iv.total)}`,
        `BAU = ${fmt(iv.baseline)}`,
        `Saving = ${formatMoney(iv.baseline - iv.total, { currency, signed: true })}`,
      ],
    }
  })
}

function makeTariffPlugin(getState) {
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
        const x1 = area.left + (band.endHour   / totalHours) * w
        ctx.save()
        ctx.fillStyle = band.fill
        ctx.fillRect(x0, area.top, x1 - x0, area.bottom - area.top)
        ctx.restore()
      }
    },

    afterDatasetsDraw(chart) {
      const { ctx } = chart
      const area = chart.chartArea
      if (!area) return

      const totalHours = 24
      const w = area.right - area.left
      const h = area.bottom - area.top
      const state = getState()

      // ── strike price reference line on yFmp axis ─────────────────────────
      if (state.inputs && state.inputs.strikePrice) {
        const yFmpScale = chart.scales['yFmp']
        if (yFmpScale) {
          const strikeY = yFmpScale.getPixelForValue(state.inputs.strikePrice)
          if (strikeY >= area.top && strikeY <= area.bottom) {
            ctx.save()
            ctx.setLineDash([8, 5])
            ctx.strokeStyle = 'rgba(82, 144, 255, 0.65)'
            ctx.lineWidth = 1.4
            ctx.beginPath()
            ctx.moveTo(area.left, strikeY)
            ctx.lineTo(area.right, strikeY)
            ctx.stroke()
            ctx.setLineDash([])
            // Label on right edge
            ctx.font = '8px "Segoe UI", sans-serif'
            ctx.fillStyle = 'rgba(82, 144, 255, 0.9)'
            ctx.textAlign = 'right'
            ctx.textBaseline = 'bottom'
            ctx.fillText(`Strike ${Math.round(state.inputs.strikePrice).toLocaleString()}`, area.right - 2, strikeY - 2)
            ctx.restore()
          }
        }
      }

      // ── dashed vertical dividers ─────────────────────────────────────────
      ctx.save()
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 1
      for (const band of TARIFF_BANDS) {
        if (band.startHour === 0) continue
        const x = area.left + (band.startHour / totalHours) * w
        ctx.strokeStyle = band.lineColor
        ctx.beginPath()
        ctx.moveTo(x, area.top)
        ctx.lineTo(x, area.bottom)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.restore()

      // ── band header labels ────────────────────────────────────────────────
      // Reserve the top ~52 px of the chart area for the tariff label rows.
      // On narrow canvases each band may be < 60 px wide — skip sub-labels
      // that would collide; only keep the band name when space is very tight.
      for (const band of TARIFF_BANDS) {
        const x0 = area.left + (band.startHour / totalHours) * w
        const x1 = area.left + (band.endHour   / totalHours) * w
        const cx = (x0 + x1) / 2
        const bw = x1 - x0 - 4
        // Width thresholds: below 58 px only show the name; below 72 px skip tariff/spot rows
        const showTime    = bw >= 72
        const showRates   = bw >= 88 && !!state.inputs

        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.beginPath()
        ctx.rect(x0 + 2, area.top, bw, 56)
        ctx.clip()

        // Name (white bold) — scale font down proportionally on very narrow bands
        const nameFontSize = bw < 58 ? 8 : 9.5
        ctx.font = `bold ${nameFontSize}px "Segoe UI", sans-serif`
        ctx.fillStyle = '#f4fbff'
        ctx.fillText(band.label, cx, area.top + 3)

        if (showTime) {
          // Time range (band colour)
          ctx.font = '8.5px "Segoe UI", sans-serif'
          ctx.fillStyle = band.textColor
          ctx.fillText(band.time, cx, area.top + 15)
        }

        if (showRates) {
          // Tariff rate
          ctx.font = '8px "Segoe UI", sans-serif'
          ctx.fillStyle = band.textColor
          ctx.fillText(`${Math.round(state.inputs.retailTariff).toLocaleString()} VND/kWh`, cx, area.top + 27)

          // Per-band FMP: use the midpoint hour of this band to read from fmpCurve
          const midHour = Math.floor((band.startHour + band.endHour) / 2)
          const bandFmp = state.inputs.fmpCurve
            ? (state.inputs.fmpCurve[midHour] ?? state.inputs.marketPrice)
            : state.inputs.marketPrice
          ctx.fillStyle = '#ff9d4f'
          ctx.fillText(`FMP: ${Math.round(bandFmp).toLocaleString()} VND/kWh`, cx, area.top + 38)
        }

        ctx.restore()
      }

      // ── callout boxes ─────────────────────────────────────────────────────
      const callouts = state.callouts
      if (!callouts || !callouts.length) return

      // Scale callout boxes down on narrow canvases (mobile)
      const narrow  = w < 320
      const lineH   = narrow ? 11 : 12.5
      const padX    = narrow ? 5 : 8
      const padY    = narrow ? 5 : 7
      const radius  = 5
      // On narrow canvases use 42% of chart width so compact lines fit
      const boxW    = narrow ? Math.min(130, w * 0.42) : Math.min(165, w * 0.24)

      callouts.forEach((callout, idx) => {
        const hourX = area.left + ((callout.hour + 0.5) / totalHours) * w
        const colors = CALLOUT_COLORS[callout.type] || CALLOUT_COLORS.balanced
        // Use compact lines on narrow canvases
        const lines  = narrow && callout.linesCompact ? callout.linesCompact : callout.lines
        const boxH   = lines.length * lineH + padY * 2

        // Vertical placement: shortfall and excess float near the top (below header),
        // balanced floats in the lower half.
        const headerBottom = area.top + 56
        let boxY
        if (callout.type === 'balanced') {
          boxY = area.top + h * 0.54
        } else {
          boxY = headerBottom + 6
        }

        // Clamp horizontally inside the chart area
        let boxX = hourX - boxW / 2
        boxX = Math.max(area.left + 2, Math.min(boxX, area.right - boxW - 2))

        // Box fill + border
        ctx.save()
        roundRect(ctx, boxX, boxY, boxW, boxH, radius)
        ctx.fillStyle = colors.bg
        ctx.fill()
        ctx.strokeStyle = colors.border
        ctx.lineWidth = 1.4
        ctx.stroke()

        // Text lines
        ctx.font = `${narrow ? 8 : 9.5}px "Segoe UI", sans-serif`
        ctx.fillStyle = colors.text
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        lines.forEach((line, li) => {
          ctx.fillText(line, boxX + padX, boxY + padY + li * lineH, boxW - padX * 2)
        })
        ctx.restore()

        // Numbered badge
        const badgeR = 9
        const badgeCX = boxX + badgeR + 4
        const badgeCY = boxY - badgeR - 1

        ctx.save()
        ctx.beginPath()
        ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2)
        ctx.fillStyle = colors.border
        ctx.fill()
        ctx.font = 'bold 10px "Segoe UI", sans-serif'
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(idx + 1), badgeCX, badgeCY)
        ctx.restore()

        // Dashed connector from badge bottom to hourX at mid-chart
        const connectorY = callout.type === 'balanced' ? boxY - 4 : boxY + boxH + 4
        const anchorY    = callout.type === 'balanced' ? area.top + h * 0.38 : area.top + h * 0.52

        ctx.save()
        ctx.setLineDash([3, 4])
        ctx.strokeStyle = colors.border
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(badgeCX, callout.type === 'balanced' ? badgeCY - badgeR : badgeCY + badgeR)
        ctx.lineTo(hourX, anchorY)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      })
    },
  }
}

function baseOptions(inputs) {
  // Determine a sensible range for the FMP axis based on the curve + strike
  const strikePrice = inputs?.strikePrice ?? 1741
  const fmpCurve = inputs?.fmpCurve ?? []
  const fmpMin = fmpCurve.length ? Math.min(...fmpCurve) : 800
  const fmpMax = fmpCurve.length ? Math.max(...fmpCurve) : 3000
  const yFmpMin = Math.floor(Math.min(fmpMin, strikePrice) * 0.88 / 100) * 100
  const yFmpMax = Math.ceil(Math.max(fmpMax, strikePrice) * 1.08 / 100) * 100

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 350 },
    layout: { padding: { top: 8 } },
    plugins: {
      legend: {
        labels: { color: tickColor, usePointStyle: true, boxWidth: 10, boxHeight: 10 },
      },
      tooltip: {
        backgroundColor: 'rgba(9, 14, 31, 0.92)',
        borderColor: 'rgba(82, 188, 255, 0.45)',
        borderWidth: 1,
        titleColor: '#f6fbff',
        bodyColor: '#dcecff',
      },
    },
    scales: {
      x: { grid: { color: neonGrid }, ticks: { color: tickColor } },
      y: { grid: { color: neonGrid }, ticks: { color: tickColor } },
      yFmp: {
        type: 'linear',
        position: 'right',
        min: yFmpMin,
        max: yFmpMax,
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#ff9d4f',
          callback: (v) => `${(v / 1000).toFixed(1)}k`,
        },
        title: {
          display: true,
          text: 'VND/kWh',
          color: '#ff9d4f',
          font: { size: 10 },
        },
      },
    },
  }
}

export function renderProfileChart(canvas, labels, intervals, selectedHour, onSelect, inputs) {
  const currency = inputs?.currency ?? 'VND'

  // Mutable state bag read by the plugin on every draw
  const state = {
    inputs,
    callouts: buildCallouts(intervals, inputs, currency),
  }

  function buildDatasets(ivs, selHour) {
    return [
      {
        label: 'Factory load',
        data: ivs.map(i => i.load),
        borderColor: '#47d7ff',
        backgroundColor: 'rgba(71,215,255,0.14)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: ivs.map((_, idx) => idx === selHour ? 5 : 1.5),
        pointHoverRadius: ivs.map((_, idx) => idx === selHour ? 7 : 4),
        pointBackgroundColor: ivs.map((_, idx) => idx === selHour ? '#c9f7ff' : '#47d7ff'),
        yAxisID: 'y',
      },
      {
        label: 'Solar generation',
        data: ivs.map(i => i.generation),
        borderColor: '#ffd84f',
        backgroundColor: 'rgba(255,216,79,0.14)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: ivs.map((_, idx) => idx === selHour ? 5 : 1.5),
        pointHoverRadius: ivs.map((_, idx) => idx === selHour ? 7 : 4),
        pointBackgroundColor: ivs.map((_, idx) => idx === selHour ? '#fff1b5' : '#ffd84f'),
        yAxisID: 'y',
      },
      {
        label: 'Matched volume',
        data: ivs.map(i => i.matched),
        borderColor: '#f5fbff',
        backgroundColor: 'rgba(245,251,255,0.16)',
        fill: true,
        tension: 0.25,
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y',
      },
      {
        label: 'FMP (VND/kWh)',
        data: ivs.map(i => i.fmp),
        borderColor: '#ff9d4f',
        backgroundColor: 'rgba(255,157,79,0)',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: ivs.map((_, idx) => idx === selHour ? 4 : 1),
        pointHoverRadius: ivs.map((_, idx) => idx === selHour ? 6 : 3),
        pointBackgroundColor: '#ff9d4f',
        yAxisID: 'yFmp',
      },
    ]
  }

  if (profileChart) {
    state.inputs = inputs
    state.callouts = buildCallouts(intervals, inputs, currency)
    profileChart.data.datasets = buildDatasets(intervals, selectedHour)
    profileChart.data.labels = labels
    // Refresh scale bounds when inputs change (e.g. slider moved)
    const updatedOptions = baseOptions(inputs)
    profileChart.options.scales.yFmp.min = updatedOptions.scales.yFmp.min
    profileChart.options.scales.yFmp.max = updatedOptions.scales.yFmp.max
    profileChart.options.onClick = (event) => {
      const pts = profileChart.getElementsAtEventForMode(event, 'index', { intersect: false }, true)
      if (pts.length) onSelect(pts[0].index)
    }
    profileChart.update('none')
    return profileChart
  }

  profileChart = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: buildDatasets(intervals, selectedHour) },
    options: {
      ...baseOptions(inputs),
      onClick: (event) => {
        const pts = profileChart.getElementsAtEventForMode(event, 'index', { intersect: false }, true)
        if (pts.length) onSelect(pts[0].index)
      },
    },
    plugins: [makeTariffPlugin(() => state)],
  })

  return profileChart
}
