import Chart from 'chart.js/auto'

let profileChart

const neonGrid = 'rgba(160, 183, 217, 0.12)'
const tickColor = '#bcd5ff'

function baseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 350,
    },
    plugins: {
      legend: {
        labels: {
          color: tickColor,
          usePointStyle: true,
          boxWidth: 10,
          boxHeight: 10,
        },
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
      x: {
        grid: { color: neonGrid },
        ticks: { color: tickColor },
      },
      y: {
        grid: { color: neonGrid },
        ticks: { color: tickColor },
      },
    },
  }
}

export function renderProfileChart(canvas, labels, intervals, selectedHour, onSelect) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Factory load',
        data: intervals.map((item) => item.load),
        borderColor: '#47d7ff',
        backgroundColor: 'rgba(71, 215, 255, 0.14)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: intervals.map((_, index) => (index === selectedHour ? 5 : 1.5)),
        pointHoverRadius: intervals.map((_, index) => (index === selectedHour ? 7 : 4)),
        pointBackgroundColor: intervals.map((_, index) => (index === selectedHour ? '#c9f7ff' : '#47d7ff')),
      },
      {
        label: 'Solar generation',
        data: intervals.map((item) => item.generation),
        borderColor: '#ffd84f',
        backgroundColor: 'rgba(255, 216, 79, 0.14)',
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: intervals.map((_, index) => (index === selectedHour ? 5 : 1.5)),
        pointHoverRadius: intervals.map((_, index) => (index === selectedHour ? 7 : 4)),
        pointBackgroundColor: intervals.map((_, index) => (index === selectedHour ? '#fff1b5' : '#ffd84f')),
      },
      {
        label: 'Matched volume',
        data: intervals.map((item) => item.matched),
        borderColor: '#f5fbff',
        backgroundColor: 'rgba(245, 251, 255, 0.16)',
        fill: true,
        tension: 0.25,
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  }

  if (profileChart) {
    profileChart.data = data
    profileChart.options.onClick = (event) => {
      const points = profileChart.getElementsAtEventForMode(event, 'index', { intersect: false }, true)
      if (points.length) {
        onSelect(points[0].index)
      }
    }
    profileChart.update('none')
    return profileChart
  }

  profileChart = new Chart(canvas, {
    type: 'line',
    data,
    options: {
      ...baseOptions(),
      onClick: (event) => {
        const points = profileChart.getElementsAtEventForMode(event, 'index', { intersect: false }, true)
        if (points.length) {
          onSelect(points[0].index)
        }
      },
    },
  })

  return profileChart
}
