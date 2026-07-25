const PptxGenJS = require('pptxgenjs');

// ── Allotrope Brand Constants ───────────────────────────────────────────────
const COLORS = {
  titleBg: '1A5276',
  sectionBg: '1B4F72',
  contentBg: 'FFFFFF',
  titleText: '1A3550',
  bodyText: '2C3E50',
  accent: '27AE60',
  muted: '7F8C8D',
  red: 'E74C3C',
  cardBg: 'EBF5FB',
  cardBorder: 'D5E8F5',
  tableHeaderBg: 'EBF5FB',
  tableBorder: 'E0E0E0',
  footer: '95A5A6',
  titleSlideSubtitle: 'BDC3C7',
};

function addFooter(slide) {
  slide.addText(
    'Confidential — For Internal Use by Allotrope & Key Partners — Not for Further Circulation',
    { x: 0.3, y: 6.95, w: 12.7, h: 0.2, fontSize: 7, fontFace: 'Calibri', color: COLORS.footer, align: 'center' }
  );
}

function addTitleBar(slide, pptx, title, caption) {
  slide.addText(title, {
    x: 0.5, y: 0.3, w: 12.3, h: 0.65,
    fontSize: 22, fontFace: 'Calibri Light', color: COLORS.titleText, bold: true
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 0.97, w: 12.3, h: 0.04,
    fill: { color: COLORS.accent }, line: { color: COLORS.accent }
  });
  if (caption) {
    slide.addText(caption, {
      x: 0.5, y: 1.05, w: 12.3, h: 0.4,
      fontSize: 11, fontFace: 'Calibri', color: COLORS.muted, valign: 'top'
    });
  }
}

function addStatCards(slide, stats, colX, colW) {
  stats.forEach((stat, i) => {
    const x = colX[i];
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y: 4.4, w: colW, h: 1.8,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.cardBorder, width: 1 },
      rectRadius: 0.05
    });
    slide.addText(stat.value, {
      x, y: 5.05, w: colW, h: 0.6,
      fontSize: 24, fontFace: 'Calibri Light', bold: true,
      color: stat.color, align: 'center'
    });
    slide.addText(stat.label, {
      x, y: 5.6, w: colW, h: 0.4,
      fontSize: 9, fontFace: 'Calibri', color: COLORS.muted, align: 'center'
    });
  });
}

// ── Presentation ────────────────────────────────────────────────────────────
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';

// Slide 1: Title
const titleSlide = pptx.addSlide();
titleSlide.background = { color: COLORS.titleBg };
titleSlide.addText('ALLOTROPE', {
  x: 0.6, y: 0.5, w: 12, h: 0.4,
  fontSize: 11, fontFace: 'Calibri Light', color: 'FFFFFF', bold: false, charSpacing: 5
});
titleSlide.addText('DPPA CFO Visual Explainer — Case Study', {
  x: 0.6, y: 2.4, w: 11.5, h: 1.8,
  fontSize: 36, fontFace: 'Calibri Light', color: 'FFFFFF', bold: true
});
titleSlide.addText('Hourly Matching, Price Mechanics & FMP Cancellation Effect\nMay 2026', {
  x: 0.6, y: 4.4, w: 9, h: 0.8,
  fontSize: 13, fontFace: 'Calibri', color: COLORS.titleSlideSubtitle
});

// Slide 2: What the Calculator Shows
const s2 = pptx.addSlide();
addTitleBar(s2, pptx, 'What the Web App Shows', 'A factory-facing teaching tool for Vietnam synthetic DPPA settlement');
const s2Body = [
  { text: 'Interactive 24-hour profile chart', options: { bullet: true, breakLine: true } },
  { text: 'Factory load vs solar generation overlap with tariff bands (off-peak, standard, peak)', options: { bullet: true, breakLine: true } },
  { text: 'Real-time strike price, market price / FMP, DPPA charge, and loss factor sliders', options: { bullet: true, breakLine: true } },
  { text: 'Click any hour to inspect the settlement walkthrough: EVN payment + developer CfD', options: { bullet: true, breakLine: true } },
  { text: 'Three synthetic scenarios: Load > Gen, Load = Gen, Load < Gen', options: { bullet: true, breakLine: true } },
  { text: 'Mermaid cancellation flow diagram showing how FMP terms cancel out', options: { bullet: true, breakLine: true } },
];
s2.addText(s2Body, { x: 0.5, y: 1.55, w: 12.3, h: 5.1, fontSize: 13, fontFace: 'Calibri', color: COLORS.bodyText, valign: 'top', paraSpaceAfter: 6 });
// Add a stat row for key inputs
addStatCards(s2, [
  { value: '2,100', label: 'Strike Price (VND/kWh)', color: COLORS.accent },
  { value: '1,700', label: 'Market Price / FMP (VND/kWh)', color: COLORS.accent },
  { value: '523', label: 'DPPA Charge (VND/kWh)', color: COLORS.accent },
], [0.6, 4.8, 9.0], 3.9);
addFooter(s2);

// Slide 3: Section 01 - Daily Load & Solar Profile
const s3 = pptx.addSlide();
s3.background = { color: COLORS.sectionBg };
s3.addText('01', { x: 0.6, y: 1.2, w: 3, h: 1.8, fontSize: 72, fontFace: 'Calibri Light', color: COLORS.accent, bold: true });
s3.addText('Daily Load & Solar Profile', { x: 0.6, y: 3.2, w: 12, h: 1.0, fontSize: 28, fontFace: 'Calibri Light', color: 'FFFFFF', bold: true });
addFooter(s3);

// Slide 4: The Three Scenarios (table)
const s4 = pptx.addSlide();
addTitleBar(s4, pptx, 'Three Synthetic Scenarios', 'Same price inputs; only the hourly load and solar profiles differ');
const scenarioRows = [
  [
    { text: 'Scenario', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
    { text: 'Label', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
    { text: 'Daytime Load Range', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
    { text: 'Peak Solar', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
    { text: 'Risk Highlight', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
  ],
  [
    { text: 'A' },
    { text: 'Load > Gen' },
    { text: '5,200 – 6,100 kWh' },
    { text: '4,200 kWh @ 12:00' },
    { text: 'High shortfall → retail tariff exposure' },
  ],
  [
    { text: 'B' },
    { text: 'Load = Gen' },
    { text: '3,900 – 4,700 kWh' },
    { text: '4,700 kWh @ 12:00' },
    { text: 'Best match → minimal shortfall / excess' },
  ],
  [
    { text: 'C' },
    { text: 'Load < Gen' },
    { text: '3,100 – 3,600 kWh' },
    { text: '6,200 kWh @ 12:00' },
    { text: 'Overgeneration → settlement quantity risk' },
  ],
];
s4.addTable(scenarioRows, {
  x: 0.5, y: 1.55, w: 12.3,
  fontSize: 11, fontFace: 'Calibri', color: COLORS.bodyText,
  border: { type: 'solid', color: COLORS.tableBorder, pt: 0.5 },
  rowH: 0.42,
  valign: 'middle',
  colW: [1.5, 2.5, 3.0, 2.5, 2.8]
});
addFooter(s4);

// Slide 5: Load vs Solar Chart Image
const s5 = pptx.addSlide();
addTitleBar(s5, pptx, 'Load vs Solar Overlap — Scenario B (Balanced)', 'Factory load (cyan), solar generation (amber), matched volume (white), FMP curve (magenta)');
s5.addImage({ path: 'desktop-current.png', x: 0.5, y: 1.55, w: 12.3, h: 5.0 });
addFooter(s5);

// Slide 6: Section 02 - Hour-by-Hour Matching
const s6 = pptx.addSlide();
s6.background = { color: COLORS.sectionBg };
s6.addText('02', { x: 0.6, y: 1.2, w: 3, h: 1.8, fontSize: 72, fontFace: 'Calibri Light', color: COLORS.accent, bold: true });
s6.addText('Hour-by-Hour Matching', { x: 0.6, y: 3.2, w: 12, h: 1.0, fontSize: 28, fontFace: 'Calibri Light', color: 'FFFFFF', bold: true });
addFooter(s6);

// Slide 7: Matching Formulas & Concepts
const s7 = pptx.addSlide();
addTitleBar(s7, pptx, 'Matching, Shortfall & Excess', 'The three volume concepts that drive every settlement interval');
const s7Body = [
  { text: 'Matched volume = min(Load, Generation)', options: { bullet: true, breakLine: true } },
  { text: 'Shortfall = max(Load - Generation, 0) → bought at retail tariff', options: { bullet: true, breakLine: true } },
  { text: 'Excess = max(Generation - Load, 0) → not credited to factory under matched-mode settlement', options: { bullet: true, breakLine: true } },
  { text: 'Contract quantity (matched mode) = matched volume', options: { bullet: true, breakLine: true } },
  { text: 'Contract quantity (generation mode) = generation volume → overgeneration risk', options: { bullet: true, breakLine: true } },
];
s7.addText(s7Body, { x: 0.5, y: 1.55, w: 12.3, h: 3.5, fontSize: 13, fontFace: 'Calibri', color: COLORS.bodyText, valign: 'top', paraSpaceAfter: 6 });
addStatCards(s7, [
  { value: '33.1k', label: 'Scenario B — Daily Matched kWh', color: COLORS.accent },
  { value: '58.2k', label: 'Scenario B — Daily Shortfall kWh', color: COLORS.red },
  { value: '0', label: 'Scenario B — Daily Excess kWh', color: COLORS.accent },
], [0.6, 4.8, 9.0], 3.9);
addFooter(s7);

// Slide 8: Section 03 - Settlement Walkthrough
const s8 = pptx.addSlide();
s8.background = { color: COLORS.sectionBg };
s8.addText('03', { x: 0.6, y: 1.2, w: 3, h: 1.8, fontSize: 72, fontFace: 'Calibri Light', color: COLORS.accent, bold: true });
s8.addText('Per-Hour Settlement Arithmetic', { x: 0.6, y: 3.2, w: 12, h: 1.0, fontSize: 28, fontFace: 'Calibri Light', color: 'FFFFFF', bold: true });
addFooter(s8);

// Slide 9: Balanced Hour (12:00) Walkthrough
const s9 = pptx.addSlide();
addTitleBar(s9, pptx, 'Settlement Walkthrough — 12:00 (Balanced Hour)', 'Scenario B | Load 4,700 kWh | Solar 4,700 kWh | Perfect match | FMP 1,836 VND/kWh');
const s9Rows = [
  [
    { text: 'Component', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
    { text: 'Formula', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
    { text: 'Amount (VND)', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
  ],
  [
    { text: 'EVN Market' },
    { text: '4,700 kWh × 1,836 × 1.027' },
    { text: '8,866,517', options: { align: 'right' } },
  ],
  [
    { text: 'EVN DPPA Charge' },
    { text: '4,700 kWh × 523.34' },
    { text: '2,459,698', options: { align: 'right' } },
  ],
  [
    { text: 'EVN Retail Shortfall' },
    { text: '0 kWh × 2,100' },
    { text: '0', options: { align: 'right' } },
  ],
  [
    { text: 'EVN Total', options: { bold: true } },
    { text: 'Market + DPPA + Retail', options: { bold: true } },
    { text: '11,326,215', options: { bold: true, align: 'right' } },
  ],
  [
    { text: 'Developer CfD' },
    { text: '4,700 kWh × (2,100 − 1,836)' },
    { text: '1,240,800', options: { align: 'right' } },
  ],
  [
    { text: 'Net DPPA Payment', options: { bold: true } },
    { text: 'EVN Total + Developer', options: { bold: true } },
    { text: '12,567,015', options: { bold: true, align: 'right', color: COLORS.accent } },
  ],
  [
    { text: 'BAU Retail Baseline' },
    { text: '4,700 kWh × 2,100' },
    { text: '9,870,000', options: { align: 'right' } },
  ],
  [
    { text: 'Savings vs BAU', options: { bold: true } },
    { text: 'BAU − DPPA', options: { bold: true } },
    { text: '−2,697,015', options: { bold: true, align: 'right', color: COLORS.red } },
  ],
];
s9.addTable(s9Rows, {
  x: 0.5, y: 1.55, w: 12.3,
  fontSize: 11, fontFace: 'Calibri', color: COLORS.bodyText,
  border: { type: 'solid', color: COLORS.tableBorder, pt: 0.5 },
  rowH: 0.42,
  valign: 'middle',
  colW: [4.0, 5.0, 3.3]
});
addFooter(s9);

// Slide 10: Shortfall Hour (07:00) Walkthrough
const s10 = pptx.addSlide();
addTitleBar(s10, pptx, 'Settlement Walkthrough — 07:00 (Shortfall Hour)', 'Scenario B | Load 4,000 kWh | Solar 833 kWh | Shortfall 3,167 kWh | FMP 1,496 VND/kWh');
const s10Rows = [
  [
    { text: 'Component', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
    { text: 'Formula', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
    { text: 'Amount (VND)', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
  ],
  [
    { text: 'EVN Market' },
    { text: '833 kWh × 1,496 × 1.027' },
    { text: '1,280,293', options: { align: 'right' } },
  ],
  [
    { text: 'EVN DPPA Charge' },
    { text: '833 kWh × 523.34' },
    { text: '435,942', options: { align: 'right' } },
  ],
  [
    { text: 'EVN Retail Shortfall' },
    { text: '3,167 kWh × 2,100' },
    { text: '6,650,700', options: { align: 'right' } },
  ],
  [
    { text: 'EVN Total', options: { bold: true } },
    { text: 'Market + DPPA + Retail', options: { bold: true } },
    { text: '8,366,935', options: { bold: true, align: 'right' } },
  ],
  [
    { text: 'Developer CfD' },
    { text: '833 kWh × (2,100 − 1,496)' },
    { text: '503,132', options: { align: 'right' } },
  ],
  [
    { text: 'Net DPPA Payment', options: { bold: true } },
    { text: 'EVN Total + Developer', options: { bold: true } },
    { text: '8,870,067', options: { bold: true, align: 'right', color: COLORS.accent } },
  ],
  [
    { text: 'BAU Retail Baseline' },
    { text: '4,000 kWh × 2,100' },
    { text: '8,400,000', options: { align: 'right' } },
  ],
  [
    { text: 'Savings vs BAU', options: { bold: true } },
    { text: 'BAU − DPPA', options: { bold: true } },
    { text: '−470,067', options: { bold: true, align: 'right', color: COLORS.red } },
  ],
];
s10.addTable(s10Rows, {
  x: 0.5, y: 1.55, w: 12.3,
  fontSize: 11, fontFace: 'Calibri', color: COLORS.bodyText,
  border: { type: 'solid', color: COLORS.tableBorder, pt: 0.5 },
  rowH: 0.42,
  valign: 'middle',
  colW: [4.0, 5.0, 3.3]
});
addFooter(s10);

// Slide 11: Excess Hour Walkthrough
const s11 = pptx.addSlide();
addTitleBar(s11, pptx, 'Settlement Walkthrough — 12:00 (Excess / Overgen Hour)', 'Scenario C | Load 3,600 kWh | Solar 6,200 kWh | Excess 2,600 kWh | FMP 1,836 VND/kWh');
const s11Rows = [
  [
    { text: 'Component', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
    { text: 'Formula', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
    { text: 'Amount (VND)', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
  ],
  [
    { text: 'EVN Market' },
    { text: '3,600 kWh × 1,836 × 1.027' },
    { text: '6,782,251', options: { align: 'right' } },
  ],
  [
    { text: 'EVN DPPA Charge' },
    { text: '3,600 kWh × 523.34' },
    { text: '1,884,024', options: { align: 'right' } },
  ],
  [
    { text: 'EVN Retail Shortfall' },
    { text: '0 kWh × 2,100' },
    { text: '0', options: { align: 'right' } },
  ],
  [
    { text: 'EVN Total', options: { bold: true } },
    { text: 'Market + DPPA + Retail', options: { bold: true } },
    { text: '8,666,275', options: { bold: true, align: 'right' } },
  ],
  [
    { text: 'Developer CfD (matched mode)' },
    { text: '3,600 kWh × (2,100 − 1,836)' },
    { text: '950,400', options: { align: 'right' } },
  ],
  [
    { text: 'Net DPPA Payment', options: { bold: true } },
    { text: 'EVN Total + Developer', options: { bold: true } },
    { text: '9,616,675', options: { bold: true, align: 'right', color: COLORS.accent } },
  ],
  [
    { text: 'BAU Retail Baseline' },
    { text: '3,600 kWh × 2,100' },
    { text: '7,560,000', options: { align: 'right' } },
  ],
  [
    { text: 'Savings vs BAU', options: { bold: true } },
    { text: 'BAU − DPPA', options: { bold: true } },
    { text: '−2,056,675', options: { bold: true, align: 'right', color: COLORS.red } },
  ],
];
s11.addTable(s11Rows, {
  x: 0.5, y: 1.55, w: 12.3,
  fontSize: 11, fontFace: 'Calibri', color: COLORS.bodyText,
  border: { type: 'solid', color: COLORS.tableBorder, pt: 0.5 },
  rowH: 0.42,
  valign: 'middle',
  colW: [4.0, 5.0, 3.3]
});
s11.addText('Note: In generation-mode settlement, contract quantity = 6,200 kWh → CfD rises to 1,636,800 VND. Factory pays more despite excess solar.', {
  x: 0.5, y: 6.55, w: 12.3, h: 0.35, fontSize: 10, fontFace: 'Calibri', color: COLORS.muted, valign: 'top'
});
addFooter(s11);

// Slide 12: Section 04 - FMP Cancellation Effect
const s12 = pptx.addSlide();
s12.background = { color: COLORS.sectionBg };
s12.addText('04', { x: 0.6, y: 1.2, w: 3, h: 1.8, fontSize: 72, fontFace: 'Calibri Light', color: COLORS.accent, bold: true });
s12.addText('The FMP Cancellation Effect', { x: 0.6, y: 3.2, w: 12, h: 1.0, fontSize: 28, fontFace: 'Calibri Light', color: 'FFFFFF', bold: true });
addFooter(s12);

// Slide 13: FMP Cancellation Explanation
const s13 = pptx.addSlide();
addTitleBar(s13, pptx, 'Why FMP Mostly Cancels Out', 'The key insight for CFOs: effective cost converges to Strike + DPPA charge, not FMP');
const s13Body = [
  { text: 'Total cost per matched kWh (ignoring loss factor):', options: { bold: true, breakLine: true } },
  { text: 'EVN Market  +  EVN DPPA  +  CfD', options: { breakLine: true } },
  { text: '= (Q × FMP)  +  (Q × C_DPPA)  +  Q × (Strike − FMP)', options: { breakLine: true } },
  { text: '= Q × FMP  +  Q × C_DPPA  +  Q × Strike  −  Q × FMP', options: { breakLine: true } },
  { text: '= Q × Strike  +  Q × C_DPPA', options: { breakLine: true } },
  { text: '', options: { breakLine: true } },
  { text: 'The FMP terms cancel exactly when contract quantity equals matched volume.', options: { bullet: true, breakLine: true } },
  { text: 'Loss factor adds a tiny residual: FMP × (Kpp − 1)', options: { bullet: true, breakLine: true } },
  { text: 'Shortfall hours break the clean cancellation because retail tariff replaces the strike on unmatched kWh.', options: { bullet: true, breakLine: true } },
  { text: 'Overgeneration breaks it because contract quantity exceeds matched volume.', options: { bullet: true, breakLine: true } },
];
s13.addText(s13Body, { x: 0.5, y: 1.55, w: 12.3, h: 4.5, fontSize: 13, fontFace: 'Calibri', color: COLORS.bodyText, valign: 'top', paraSpaceAfter: 5 });
addStatCards(s13, [
  { value: '2,623', label: 'Implied Cost / kWh (Strike + DPPA)', color: COLORS.accent },
  { value: '2,670', label: 'With Loss Factor @ Avg FMP', color: COLORS.accent },
], [0.6, 4.8], 5.9);
addFooter(s13);

// Slide 14: Section 05 - Scenario Comparison
const s14 = pptx.addSlide();
s14.background = { color: COLORS.sectionBg };
s14.addText('05', { x: 0.6, y: 1.2, w: 3, h: 1.8, fontSize: 72, fontFace: 'Calibri Light', color: COLORS.accent, bold: true });
s14.addText('Scenario Comparison — Daily Totals', { x: 0.6, y: 3.2, w: 12, h: 1.0, fontSize: 28, fontFace: 'Calibri Light', color: 'FFFFFF', bold: true });
addFooter(s14);

// Slide 15: Daily Totals Comparison Table
const s15 = pptx.addSlide();
addTitleBar(s15, pptx, 'Daily Settlement: All Three Scenarios', 'Matched-mode settlement. Same price parameters; different solar capacity and load shape.');
const s15Rows = [
  [
    { text: 'Metric', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11 } },
    { text: 'Scenario A\nLoad > Gen', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11, align: 'center' } },
    { text: 'Scenario B\nLoad = Gen', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11, align: 'center' } },
    { text: 'Scenario C\nLoad < Gen', options: { bold: true, fill: { color: COLORS.tableHeaderBg }, color: COLORS.titleText, fontFace: 'Calibri', fontSize: 11, align: 'center' } },
  ],
  [
    { text: 'Daily Load (kWh)' },
    { text: '116,100', options: { align: 'center' } },
    { text: '91,300', options: { align: 'center' } },
    { text: '75,100', options: { align: 'center' } },
  ],
  [
    { text: 'Solar Generation (kWh)' },
    { text: '35,100', options: { align: 'center' } },
    { text: '33,100', options: { align: 'center' } },
    { text: '43,600', options: { align: 'center' } },
  ],
  [
    { text: 'Matched Volume (kWh)' },
    { text: '35,100', options: { align: 'center' } },
    { text: '33,100', options: { align: 'center' } },
    { text: '33,100', options: { align: 'center' } },
  ],
  [
    { text: 'Shortfall (kWh)' },
    { text: '81,000', options: { align: 'center' } },
    { text: '58,200', options: { align: 'center' } },
    { text: '42,000', options: { align: 'center' } },
  ],
  [
    { text: 'Excess (kWh)' },
    { text: '0', options: { align: 'center' } },
    { text: '0', options: { align: 'center' } },
    { text: '10,500', options: { align: 'center' } },
  ],
  [
    { text: 'Total DPPA Cost (VND)', options: { bold: true } },
    { text: '232,947,000', options: { bold: true, align: 'center' } },
    { text: '180,654,000', options: { bold: true, align: 'center' } },
    { text: '149,043,000', options: { bold: true, align: 'center' } },
  ],
  [
    { text: 'BAU Retail Cost (VND)', options: { bold: true } },
    { text: '243,810,000', options: { bold: true, align: 'center' } },
    { text: '191,730,000', options: { bold: true, align: 'center' } },
    { text: '157,710,000', options: { bold: true, align: 'center' } },
  ],
  [
    { text: 'Savings vs BAU (VND)', options: { bold: true } },
    { text: '10,863,000', options: { bold: true, align: 'center', color: COLORS.accent } },
    { text: '11,076,000', options: { bold: true, align: 'center', color: COLORS.accent } },
    { text: '8,667,000', options: { bold: true, align: 'center', color: COLORS.accent } },
  ],
  [
    { text: 'Blended Price (VND/kWh)', options: { bold: true } },
    { text: '2,006', options: { bold: true, align: 'center' } },
    { text: '1,981', options: { bold: true, align: 'center', color: COLORS.accent } },
    { text: '1,983', options: { bold: true, align: 'center', color: COLORS.accent } },
  ],
];
s15.addTable(s15Rows, {
  x: 0.5, y: 1.55, w: 12.3,
  fontSize: 11, fontFace: 'Calibri', color: COLORS.bodyText,
  border: { type: 'solid', color: COLORS.tableBorder, pt: 0.5 },
  rowH: 0.42,
  valign: 'middle',
  colW: [4.0, 2.8, 2.8, 2.7]
});
addFooter(s15);

// Slide 16: Key Takeaways
const s16 = pptx.addSlide();
addTitleBar(s16, pptx, 'Key Takeaways for Factory CFOs', 'Decision-oriented conclusions from the DPPA CFO calculator case study');
const s16Body = [
  { text: '01   FMP mostly cancels', options: { bold: true, breakLine: true } },
  { text: 'The CfD and EVN market charge nearly offset. Effective cost converges to Strike + DPPA charge — not FMP. FMP risk is hedged by design.', options: { breakLine: true, paraSpaceAfter: 10 } },
  { text: '02   Match rate drives value', options: { bold: true, breakLine: true } },
  { text: 'Solar that closely tracks daytime load maximises matched kWh and minimises high-cost shortfall hours. Overbuilding creates settlement risk.', options: { breakLine: true, paraSpaceAfter: 10 } },
  { text: '03   Settlement mode matters', options: { bold: true, breakLine: true } },
  { text: 'Matched-mode is safest. Generation-mode or allocated-mode can expose the factory to paying CfD on unconsumed energy.', options: { breakLine: true, paraSpaceAfter: 10 } },
  { text: '04   Loss factor is small but real', options: { bold: true, breakLine: true } },
  { text: 'At 1.027, the loss factor adds ~2.7% to the EVN market component. It is not enough to change the investment decision.', options: { breakLine: true, paraSpaceAfter: 10 } },
  { text: '05   Shortfall is your biggest cost swing', options: { bold: true, breakLine: true } },
  { text: 'Every unmatched kWh is charged at the full retail tariff (2,100 VND/kWh). Shape the solar array to your load curve.', options: { breakLine: true } },
];
s16.addText(s16Body, { x: 0.5, y: 1.55, w: 12.3, h: 5.1, fontSize: 13, fontFace: 'Calibri', color: COLORS.bodyText, valign: 'top', paraSpaceAfter: 5 });
addFooter(s16);

// Slide 17: Closing Slide
const s17 = pptx.addSlide();
s17.background = { color: COLORS.titleBg };
s17.addText('ALLOTROPE', {
  x: 0.6, y: 0.5, w: 12, h: 0.4,
  fontSize: 11, fontFace: 'Calibri Light', color: 'FFFFFF', bold: false, charSpacing: 5
});
s17.addText('Questions & Next Steps', {
  x: 0.6, y: 2.4, w: 11.5, h: 1.8,
  fontSize: 36, fontFace: 'Calibri Light', color: 'FFFFFF', bold: true
});
s17.addText('Live CFO calculator: https://dppa-case.web.app\nContact: Allotrope VC Research | May 2026', {
  x: 0.6, y: 4.4, w: 9, h: 0.8,
  fontSize: 13, fontFace: 'Calibri', color: COLORS.titleSlideSubtitle
});

// ── Save ────────────────────────────────────────────────────────────────────
const outputPath = 'dppa-web-app-case-study.pptx';
pptx.writeFile({ fileName: outputPath })
  .then(() => console.log(`Saved: ${outputPath}`))
  .catch((err) => console.error('Error:', err));
