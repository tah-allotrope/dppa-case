const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'REF_16_9', width: 10, height: 5.625 });
pptx.layout = 'REF_16_9';
pptx.author = 'Allotrope';
pptx.subject = 'DPPA 2026 updated from current dppa-case repository';
pptx.title = 'DPPA 2026 - Addressing Pricing Concerns';

const C = {
  dark: '2E3A49',
  green: '1B786E',
  greenDark: '2F645B',
  paleGreen: 'B5D8D0',
  grey: 'F7F7F7',
  text: '131314',
  muted: '5B646E',
  white: 'FFFFFF',
  red: 'C54E4B',
  amber: 'F1A722',
  cyan: '168A9A',
  magenta: '8B4F96',
  line: 'D7E2E0',
};

const F = {
  head: 'Montserrat',
  body: 'Roboto',
  alt: 'Cabin',
};

const hours = Array.from({ length: 24 }, (_, h) => h);
const fmpShape = [
  0.70, 0.69, 0.68, 0.69, 0.72,
  0.78, 0.84, 0.88, 0.92, 0.97,
  1.00, 1.04, 1.08, 1.11, 1.15,
  1.18, 1.22, 1.28, 1.36, 1.42,
  1.30, 1.08, 0.92, 0.80,
];

const inputs = {
  strike: 2100,
  market: 1700,
  dppa: 523.34,
  loss: 1.027263,
  retail: 2100,
};
const fmp = fmpShape.map((m) => Math.round(inputs.market * m));

function solarCurve(scale, shoulder) {
  return hours.map((hour) => {
    if (hour < 6 || hour > 18) return 0;
    const normalized = Math.sin(((hour - 6) / 12) * Math.PI);
    return Math.round((Math.max(0, normalized) ** (1 + shoulder)) * scale);
  });
}

const scenarios = {
  higherLoad: {
    label: 'Load > Gen',
    load: hours.map((h) => (h < 6 ? 4300 : h < 10 ? 5200 : h < 17 ? 6100 : h < 22 ? 5000 : 4400)),
    gen: solarCurve(4200, 0.42),
  },
  balanced: {
    label: 'Load = Gen',
    load: hours.map((h) => (h < 6 ? 3000 : h < 9 ? 4000 : h < 16 ? 4700 : h < 20 ? 3900 : 3200)),
    gen: solarCurve(4700, 0.28),
  },
  higherGen: {
    label: 'Load < Gen',
    load: hours.map((h) => (h < 7 ? 2600 : h < 10 ? 3200 : h < 16 ? 3600 : h < 20 ? 3100 : 2700)),
    gen: solarCurve(6200, 0.22),
  },
};

function calc(sc, mode = 'matched') {
  const intervals = hours.map((hour) => {
    const load = sc.load[hour];
    const generation = sc.gen[hour];
    const matched = Math.min(load, generation);
    const shortfall = Math.max(load - generation, 0);
    const excess = Math.max(generation - load, 0);
    const contract = mode === 'generation' ? generation : matched;
    const evnMarket = matched * fmp[hour] * inputs.loss;
    const evnDppa = matched * inputs.dppa;
    const evnRetail = shortfall * inputs.retail;
    const evnTotal = evnMarket + evnDppa + evnRetail;
    const developer = contract * (inputs.strike - fmp[hour]);
    const total = evnTotal + developer;
    const baseline = load * inputs.retail;
    return { hour, load, generation, matched, shortfall, excess, contract, fmp: fmp[hour], evnMarket, evnDppa, evnRetail, evnTotal, developer, total, baseline };
  });
  const sum = (key) => intervals.reduce((acc, it) => acc + it[key], 0);
  const totals = {
    load: sum('load'),
    generation: sum('generation'),
    matched: sum('matched'),
    shortfall: sum('shortfall'),
    excess: sum('excess'),
    total: sum('total'),
    baseline: sum('baseline'),
  };
  totals.savings = totals.baseline - totals.total;
  totals.blended = totals.total / totals.load;
  totals.matchRate = totals.matched / totals.load;
  return { intervals, totals };
}

const res = {
  higherLoad: calc(scenarios.higherLoad),
  balanced: calc(scenarios.balanced),
  higherGen: calc(scenarios.higherGen),
};

function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

function addLogos(slide) {
  slide.addText('Allotrope', { x: 8.32, y: 5.34, w: 0.76, h: 0.18, fontFace: F.head, fontSize: 7.5, bold: true, color: C.dark, margin: 0 });
  slide.addText('Partners', { x: 8.32, y: 5.49, w: 0.76, h: 0.1, fontFace: F.body, fontSize: 4.8, color: C.green, margin: 0 });
  slide.addText('CEBA', { x: 9.15, y: 5.34, w: 0.72, h: 0.22, fontFace: F.head, fontSize: 8.5, bold: true, color: C.dark, margin: 0, align: 'right' });
}

function chrome(slide, title, opts = {}) {
  if (!opts.noRail) {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.81, h: 5.625, fill: { color: C.dark }, line: { color: C.dark } });
    slide.addText(' ', { x: 0.13, y: 0, w: 0.56, h: 0.71, fill: { color: C.white }, line: { color: C.white } });
  }
  slide.addText(title, { x: opts.titleX || 1.06, y: 0.12, w: opts.titleW || 7.8, h: 0.56, fontFace: F.head, fontSize: 21, bold: true, color: C.dark, margin: 0, fit: 'shrink' });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: opts.ruleY || 0.81, w: 7.59, h: 0.08, fill: { color: C.green }, line: { color: C.green } });
  addLogos(slide);
}

function titleSlide(title, kicker) {
  const slide = pptx.addSlide();
  slide.background = { color: C.grey };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 7.27, h: 5.625, fill: { color: C.dark }, line: { color: C.dark } });
  slide.addShape(pptx.ShapeType.rect, { x: 7.27, y: 0, w: 2.73, h: 5.625, fill: { color: C.grey }, line: { color: C.grey } });
  slide.addShape(pptx.ShapeType.rect, { x: 2.35, y: 1.9, w: 0.08, h: 1.8, fill: { color: C.green }, line: { color: C.green } });
  slide.addShape(pptx.ShapeType.rect, { x: 8.51, y: 1.51, w: 1.49, h: 2.58, fill: { color: C.green }, line: { color: C.green } });
  slide.addText(kicker, { x: 3.08, y: 2.1, w: 5.9, h: 0.42, fontFace: F.head, fontSize: 17, color: C.grey, margin: 0 });
  slide.addText(title, { x: 3.08, y: 2.56, w: 5.95, h: 0.9, fontFace: F.head, fontSize: 28, bold: true, color: C.grey, margin: 0, fit: 'shrink' });
  addLogos(slide);
}

function headlineSlide(title, headline, draw) {
  const slide = pptx.addSlide();
  chrome(slide, title);
  slide.addText(headline, { x: 0.96, y: 1.02, w: 8.65, h: 0.75, fontFace: F.head, fontSize: 18, bold: true, color: C.text, margin: 0, fit: 'shrink' });
  draw(slide);
}

function bullets(slide, items, x, y, w, h, size = 11) {
  slide.addText(items.map((text) => ({ text, options: { bullet: { type: 'bullet' }, breakLine: true } })), {
    x, y, w, h, fontFace: F.body, fontSize: size, color: C.text, fit: 'shrink', breakLine: false,
    paraSpaceAfterPt: 7, margin: 0.03,
  });
}

function panel(slide, x, y, w, h, fill = C.grey, line = C.line) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.04, fill: { color: fill }, line: { color: line, width: 0.7 } });
}

function chart(slide, x, y, w, h, sc, mode = 'energy') {
  panel(slide, x, y, w, h, C.white, C.line);
  const maxEnergy = 6500;
  const maxFmp = 2600;
  for (let i = 1; i < 5; i++) {
    const yy = y + (h * i) / 5;
    slide.addShape(pptx.ShapeType.line, { x, y: yy, w, h: 0, line: { color: 'E5ECEB', width: 0.35 } });
  }
  for (let i = 0; i < 24; i += 4) {
    const xx = x + (w * i) / 23;
    slide.addShape(pptx.ShapeType.line, { x: xx, y, w: 0, h, line: { color: 'EEF3F2', width: 0.25 } });
    slide.addText(String(i).padStart(2, '0'), { x: xx - 0.1, y: y + h + 0.04, w: 0.22, h: 0.11, fontFace: F.body, fontSize: 5.5, color: C.muted, margin: 0, align: 'center' });
  }
  const toY = (v, max) => y + h - (v / max) * h;
  const lines = [
    [sc.load, maxEnergy, C.cyan, 1.4],
    [sc.gen, maxEnergy, C.amber, 1.4],
    [fmp, maxFmp, C.magenta, 1.05],
  ];
  lines.forEach(([arr, max, color, width]) => {
    for (let i = 0; i < 23; i++) {
      const x1 = x + (w * i) / 23;
      const x2 = x + (w * (i + 1)) / 23;
      slide.addShape(pptx.ShapeType.line, { x: x1, y: toY(arr[i], max), w: x2 - x1, h: toY(arr[i + 1], max) - toY(arr[i], max), line: { color, width } });
    }
  });
  const legend = [['Load', C.cyan], ['Solar', C.amber], ['FMP', C.magenta]];
  legend.forEach(([txt, color], i) => {
    const lx = x + 0.18 + i * 0.72;
    slide.addShape(pptx.ShapeType.rect, { x: lx, y: y + 0.14, w: 0.12, h: 0.05, fill: { color }, line: { color } });
    slide.addText(txt, { x: lx + 0.16, y: y + 0.1, w: 0.5, h: 0.12, fontFace: F.body, fontSize: 6.1, color: C.text, margin: 0 });
  });
}

function stat(slide, value, label, x, y, w, color = C.green) {
  slide.addText(value, { x, y, w, h: 0.26, fontFace: F.head, fontSize: 18, bold: true, color, margin: 0, align: 'center' });
  slide.addText(label, { x, y: y + 0.32, w, h: 0.25, fontFace: F.body, fontSize: 6.8, color: C.muted, margin: 0, align: 'center', fit: 'shrink' });
}

function table(slide, rows, x, y, w, colW, rowH, fontSize = 7.2) {
  slide.addTable(rows, {
    x, y, w, colW, rowH,
    fontFace: F.body,
    fontSize,
    color: C.text,
    margin: 0.035,
    valign: 'mid',
    border: { type: 'solid', color: 'DCE6E4', pt: 0.4 },
  });
}

function th(text) {
  return { text, options: { fontFace: F.head, bold: true, color: C.dark, fill: { color: 'EAF3F1' }, align: 'center' } };
}

titleSlide('Addressing DPPA Pricing Concerns', 'Session 4.4: Off-Site Solutions:');

{
  const slide = pptx.addSlide();
  chrome(slide, 'About the 2026 Update');
  slide.addText('The reference deck explained why DPPA buyers worry about market price. This update uses the current CFO calculator repo to show the actual settlement mechanics behind that concern.', {
    x: 1.06, y: 1.08, w: 5.9, h: 0.72, fontFace: F.head, fontSize: 15, bold: true, color: C.text, fit: 'shrink', margin: 0,
  });
  bullets(slide, [
    'Current source: dppa-case web app, formulas, test suite, screenshots, and readiness report.',
    'Same audience: factory CFOs, procurement teams, and workshop facilitators in Vietnam.',
    'New focus: hourly matching, settlement quantity, FMP cancellation, and buyer-ready diagnostics.',
  ], 1.08, 2.08, 5.45, 1.45, 9.5);
  panel(slide, 7.05, 1.08, 2.15, 3.25, C.grey, C.green);
  stat(slide, '35', 'tests passing in current repo', 7.32, 1.55, 1.55);
  stat(slide, '3', 'synthetic load/solar cases', 7.32, 2.42, 1.55);
  stat(slide, '0', 'critical workshop gaps', 7.32, 3.28, 1.55);
}

headlineSlide('Understanding Market Price', 'Spot market price remains the visible buyer concern, but the current calculator shows where it truly affects cost', (slide) => {
  chart(slide, 1.06, 1.95, 8.48, 3.08, scenarios.balanced);
  slide.addText('Synthetic FMP curve used in the app: 1,156-2,414 VND/kWh around a 1,700 VND/kWh midpoint.', { x: 1.08, y: 5.08, w: 7.4, h: 0.18, fontFace: F.body, fontSize: 7.4, color: C.muted, margin: 0 });
});

headlineSlide('Understanding Market Price', 'CFMP and loss factors still matter, but the major decision variable is the matched quantity, not the headline FMP line', (slide) => {
  panel(slide, 1.04, 2.0, 2.4, 1.3, C.grey, C.green);
  panel(slide, 3.82, 2.0, 2.4, 1.3, C.grey, C.green);
  panel(slide, 6.6, 2.0, 2.4, 1.3, C.grey, C.green);
  stat(slide, '2,100', 'strike price Pc', 1.32, 2.32, 1.85);
  stat(slide, '523.34', 'DPPA charge', 4.1, 2.32, 1.85);
  stat(slide, '1.027263', 'Kpp loss factor', 6.88, 2.32, 1.85);
  bullets(slide, [
    'The app keeps FMP visible so buyers can audit each hour.',
    'Matched kWh collapse toward strike price + DPPA charge + loss adjustment.',
    'Shortfall and excess volumes decide whether the clean cancellation story holds.',
  ], 1.08, 3.72, 7.75, 0.92, 9.3);
});

headlineSlide('Diurnal Profile', 'Accurate allocation of matched energy is critical for determining DPPA cost settlement', (slide) => {
  const rows = [
    [th('Scenario'), th('Load shape'), th('Solar peak'), th('Buyer risk')],
    ['Load > Gen', '4,300-6,100 kWh/h', '4,200 kWh @ 12:00', 'High retail shortfall'],
    ['Load = Gen', '3,000-4,700 kWh/h', '4,700 kWh @ 12:00', 'Cleanest matched case'],
    ['Load < Gen', '2,600-3,600 kWh/h', '6,200 kWh @ 12:00', 'Excess / contract quantity risk'],
  ];
  table(slide, rows, 1.05, 1.94, 8.45, [1.55, 2.1, 2.05, 2.75], 0.44, 7.4);
  chart(slide, 1.05, 4.0, 3.55, 0.82, scenarios.higherLoad);
  chart(slide, 5.15, 4.0, 3.55, 0.82, scenarios.higherGen);
});

{
  const slide = pptx.addSlide();
  chrome(slide, 'Payment Mechanisms');
  panel(slide, 0.96, 1.03, 8.9, 4.3, 'E9F3F0', C.line);
  slide.addText('CKH = CDN + CDPPA + CCL + CBL', { x: 1.35, y: 1.28, w: 3.15, h: 0.3, fontFace: F.head, fontSize: 16, bold: true, color: C.greenDark, margin: 0 });
  const blocks = [
    ['CDN', 'Matched x CFMP x Kpp', 1.12, 2.08],
    ['CDPPA', 'Matched x DPPA charge', 1.12, 2.92],
    ['CBL', 'Shortfall x retail price', 1.12, 3.76],
    ['CCL', 'Contract qty x (strike - FMP)', 5.55, 2.08],
  ];
  blocks.forEach(([head, body, x, y]) => {
    panel(slide, x, y, 3.05, 0.58, C.white, C.green);
    slide.addText(head, { x: x + 0.12, y: y + 0.1, w: 0.75, h: 0.24, fontFace: F.head, fontSize: 13, bold: true, color: C.greenDark, margin: 0 });
    slide.addText(body, { x: x + 0.9, y: y + 0.14, w: 1.95, h: 0.18, fontFace: F.body, fontSize: 8.2, color: C.text, margin: 0, fit: 'shrink' });
  });
  slide.addText('Strike price - Spot Market', { x: 5.9, y: 4.65, w: 2.35, h: 0.22, fontFace: F.head, fontSize: 11.5, bold: true, color: C.text, margin: 0 });
}

headlineSlide('Diurnal Profile', 'QKHhc is the key factor in all DPPA cost calculations: buyers must calculate it accurately', (slide) => {
  panel(slide, 1.05, 2.0, 2.65, 1.15, C.grey, C.green);
  slide.addText('QKHhc(i) = min(QKH(i), Qm(i))', { x: 1.22, y: 2.42, w: 2.32, h: 0.24, fontFace: F.head, fontSize: 11.5, bold: true, color: C.greenDark, margin: 0, fit: 'shrink' });
  panel(slide, 4.0, 2.0, 2.65, 1.15, C.grey, C.green);
  slide.addText('Shortfall = max(load - gen, 0)', { x: 4.17, y: 2.42, w: 2.32, h: 0.24, fontFace: F.head, fontSize: 11, bold: true, color: C.red, margin: 0, fit: 'shrink' });
  panel(slide, 6.95, 2.0, 2.65, 1.15, C.grey, C.green);
  slide.addText('Excess = max(gen - load, 0)', { x: 7.12, y: 2.42, w: 2.32, h: 0.24, fontFace: F.head, fontSize: 11, bold: true, color: C.amber, margin: 0, fit: 'shrink' });
  bullets(slide, [
    'Matched mode: contract quantity equals QKHhc.',
    'Generation mode: contract quantity equals renewable generation, exposing excess generation.',
    'Allocated mode: quantity follows contract allocation, so mismatch can remain visible.',
  ], 1.1, 3.7, 7.8, 0.9, 9.2);
});

headlineSlide('Payment Mechanism under the CFD', 'Strike price determines financial settlement through CFD, converting market price volatility into predictable financial flows', (slide) => {
  slide.addText('RC = Σ [Qca(i) × (Pc(i) - FMP(i))]', { x: 1.35, y: 2.05, w: 6.55, h: 0.42, fontFace: F.head, fontSize: 19, bold: true, color: C.greenDark, margin: 0 });
  const rows = [
    [th('Term'), th('Meaning in the current app')],
    ['Pc(i)', 'Strike price: 2,100 VND/kWh'],
    ['FMP(i)', 'Hourly synthetic reference price'],
    ['Qca(i)', 'Contract quantity: matched, generation, or allocated mode'],
  ];
  table(slide, rows, 1.35, 2.9, 6.9, [1.4, 5.5], 0.38, 7.5);
});

headlineSlide('Quantify DPPA Costs to Assess Feasibility & Negotiate RE Supply', 'Feasibility analysis enables buyers to compare DPPA against traditional procurement with confidence', (slide) => {
  const rows = [
    [th('Metric'), th('Load > Gen'), th('Load = Gen'), th('Load < Gen')],
    ['Daily load kWh', fmt(res.higherLoad.totals.load), fmt(res.balanced.totals.load), fmt(res.higherGen.totals.load)],
    ['Matched kWh', fmt(res.higherLoad.totals.matched), fmt(res.balanced.totals.matched), fmt(res.higherGen.totals.matched)],
    ['Shortfall kWh', fmt(res.higherLoad.totals.shortfall), fmt(res.balanced.totals.shortfall), fmt(res.higherGen.totals.shortfall)],
    ['Excess kWh', fmt(res.higherLoad.totals.excess), fmt(res.balanced.totals.excess), fmt(res.higherGen.totals.excess)],
    ['DPPA cost VND', fmt(res.higherLoad.totals.total), fmt(res.balanced.totals.total), fmt(res.higherGen.totals.total)],
    ['BAU cost VND', fmt(res.higherLoad.totals.baseline), fmt(res.balanced.totals.baseline), fmt(res.higherGen.totals.baseline)],
  ];
  table(slide, rows, 1.04, 1.95, 8.55, [2.05, 2.15, 2.15, 2.2], 0.34, 6.8);
  slide.addText('Current model takeaway: all three synthetic cases show a cost premium at the default price inputs; sizing and contract quantity remain the negotiation levers.', { x: 1.08, y: 4.8, w: 7.95, h: 0.32, fontFace: F.body, fontSize: 8.4, color: C.muted, margin: 0 });
});

{
  const slide = pptx.addSlide();
  chrome(slide, 'Understanding Market Price');
  slide.addText('The FMP cancellation effect is the bridge between last year\'s market-price concern and this year\'s CFO calculator', { x: 0.96, y: 1.02, w: 8.55, h: 0.65, fontFace: F.head, fontSize: 18, bold: true, color: C.text, margin: 0, fit: 'shrink' });
  panel(slide, 1.1, 2.0, 7.7, 1.4, C.grey, C.green);
  slide.addText('EVN Market + DPPA Charge + CfD\n= Q × FMP + Q × CDPPA + Q × (Strike - FMP)\n= Q × Strike + Q × CDPPA', {
    x: 1.35, y: 2.25, w: 7.1, h: 0.82, fontFace: 'Roboto Mono', fontSize: 14, bold: true, color: C.greenDark, margin: 0, fit: 'shrink',
  });
  const avgFmp = fmp.reduce((a, b) => a + b, 0) / fmp.length;
  const implied = inputs.strike + inputs.dppa + avgFmp * (inputs.loss - 1);
  stat(slide, fmt(implied), 'implied matched-kWh cost incl. loss', 1.3, 4.05, 2.05);
  stat(slide, fmt(avgFmp), 'average synthetic FMP', 4.0, 4.05, 2.05);
  stat(slide, 'matched', 'default settlement mode', 6.7, 4.05, 2.05);
}

{
  const slide = pptx.addSlide();
  slide.background = { color: C.grey };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0.67, w: 10, h: 3.98, fill: { color: C.dark }, line: { color: C.dark } });
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 1.6, w: 6.97, h: 0.07, fill: { color: C.green }, line: { color: C.green } });
  slide.addText('Interactive Exercise:', { x: 0.33, y: 0.78, w: 7.2, h: 0.3, fontFace: F.head, fontSize: 16, bold: true, color: C.grey, margin: 0 });
  slide.addText('DPPA Scenario Analysis', { x: 0.33, y: 1.1, w: 7.6, h: 0.36, fontFace: F.head, fontSize: 25, bold: true, color: C.grey, margin: 0 });
  slide.addText('(~60 minutes)', { x: 4.55, y: 1.12, w: 2.2, h: 0.23, fontFace: F.body, fontSize: 10.5, color: C.grey, margin: 0 });
  slide.addText('Use the calculator to test one factory load profile against three questions: matched volume, shortfall exposure, and settlement quantity risk.', {
    x: 0.55, y: 1.95, w: 8.55, h: 0.45, fontFace: F.head, fontSize: 14.5, bold: true, color: C.grey, margin: 0, fit: 'shrink',
  });
  bullets(slide, [
    'Start with the balanced profile, then switch to Load > Gen and Load < Gen.',
    'Click 07:00, 12:00, and 18:00 to compare shortfall, balanced, and peak-price periods.',
    'Decide which settlement mode is acceptable before discussing strike price.',
  ], 0.65, 2.78, 7.9, 1.0, 9.2);
  addLogos(slide);
}

{
  const slide = pptx.addSlide();
  chrome(slide, 'Scenario DPPA Negotiation');
  slide.addText('Your factory is located in Northern Vietnam and purchases electricity from an EVN-subsidiary or industrial park retailer. Annual demand is 150 GWh.', {
    x: 0.95, y: 0.98, w: 3.35, h: 1.0, fontFace: F.body, fontSize: 10.5, color: C.text, margin: 0, fit: 'shrink',
  });
  panel(slide, 4.15, 1.12, 5.2, 2.85, C.grey, C.green);
  chart(slide, 4.45, 1.45, 4.55, 1.75, scenarios.balanced);
  slide.addText('Determine the essential conditions for proceeding with an appropriate DPPA arrangement:', { x: 0.95, y: 2.28, w: 3.1, h: 0.38, fontFace: F.head, fontSize: 10.5, bold: true, color: C.text, margin: 0, fit: 'shrink' });
  bullets(slide, [
    'Electricity retailer',
    'Selection of optimal RE source',
    'Required capacity',
    'Contract duration',
    'Settlement quantity mode',
    'Risk allocation for shortfall / excess',
  ], 0.95, 2.86, 3.1, 1.45, 8.2);
  addLogos(slide);
}

{
  const slide = pptx.addSlide();
  slide.background = { color: C.dark };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0.75, w: 6.31, h: 0.08, fill: { color: C.green }, line: { color: C.green } });
  slide.addText('Next Step', { x: 0.9, y: 0.65, w: 4.8, h: 0.45, fontFace: F.head, fontSize: 24, bold: true, color: C.white, margin: 0 });
  slide.addText('Validate one real factory load profile in the CFO calculator, then use matched volume and settlement quantity as the negotiation baseline.', {
    x: 0.9, y: 1.55, w: 7.6, h: 0.95, fontFace: F.head, fontSize: 19, bold: true, color: C.white, margin: 0, fit: 'shrink',
  });
  slide.addText('Current repo content: May 2026 | Reference style: ref/DPPA 2025 ref.pptx', { x: 0.92, y: 4.75, w: 6.6, h: 0.18, fontFace: F.body, fontSize: 7.8, color: C.grey, margin: 0 });
  addLogos(slide);
}

pptx.writeFile({ fileName: 'dppa-2026-factory-energy-proposal.pptx' })
  .then(() => console.log('Saved ref-style deck: dppa-2026-factory-energy-proposal.pptx'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
