---
title: "FMP proxy series & Decree 57/Circular 16 official sourcing"
date: "2026-07-17"
status: "research-note"
request: "PHASE-05 of plans/2026-07-17-prose-parity-second-pipeline-plan.md: locate the official (or best-available authoritative) full text of Decree 57/2025/ND-CP and Circular 16/2025/TT-BCT, and a public FMP proxy series to compare against the app's illustrative ~1,427 VND/kWh figure."
---

# FMP proxy series & Decree 57/Circular 16 official sourcing

## Objective

Close the two "Gaps to fill" bullets in `RESOURCES.md`: (1) official source URLs for the
two regulations the deck cites second-hand, and (2) a public FMP (full market price)
proxy series to sanity-check `app/src/data/default-scenarios.js`'s illustrative
`marketPrice: 1427`.

## 1. Decree 57/2025/NĐ-CP — official text

| Field | Value |
|---|---|
| Title | *"Quy định cơ chế mua bán điện trực tiếp giữa đơn vị phát điện năng lượng tái tạo và khách hàng sử dụng điện lớn"* (Direct power purchase mechanism between renewable generators and large electricity users) |
| Issuing body | Chính phủ (Government of Vietnam) |
| Issued | 2025-03-03 |
| Signatory | Deputy PM Bùi Thanh Sơn |
| **Official URL** | https://vanban.chinhphu.vn/?pageid=27160&docid=213012 |
| Access date | 2026-07-17 |
| Trust | HIGH — official gazette (chinhphu.vn), primary text |
| Portal mirror | https://thuvienphapluat.vn/van-ban/Tai-nguyen-Moi-truong/Nghi-dinh-57-2025-ND-CP-co-che-mua-ban-dien-truc-tiep-giua-don-vi-phat-dien-nang-luong-tai-tao-645610.aspx (secondary, useful for the unofficial English-adjacent commentary linked below) |
| MOIT legal-portal mirror | https://vbpl.vn/bocongthuong/Pages/vbpq-toanvan.aspx?ItemID=176043&dvid=218 |

Notes: replaces Decree 80/2024/NĐ-CP; the deck's citation ("Decree 57/2025/NĐ-CP") is
confirmed accurate. English-language commentary (not primary, background only):
[ADK Lawyers summary](https://adk-lawyers.com/en/key-updates-direct-power-purchase-agreement-dppa-decree-57-2025/),
[Frasers Law Vietnam summary](https://www.frasersvn.com/vi/legal-updates-and-publications/decree-57-vietnam-launches-full-dppa-regime-for-renewable-power).

## 2. Circular 16/2025/TT-BCT — official text

| Field | Value |
|---|---|
| Title | *"Quy định vận hành Thị trường bán buôn điện cạnh tranh"* (Regulations on operation of the competitive wholesale electricity market) |
| Issuing body | Bộ Công Thương (Ministry of Industry and Trade) |
| Issued | 2025-02-01 |
| Signatory | Deputy Minister Trương Thanh Hoài |
| **Official URL** | https://chinhphu.vn/?pageid=27160&docid=212947&classid=1&orggroupid=4 |
| Access date | 2026-07-17 |
| Trust | HIGH — official gazette (chinhphu.vn), primary text |
| MOIT mirror (consolidated with its amendment) | https://minhbach.moit.gov.vn/upload/2005517/20250610/VBHN_so_11_TT16TT36_quy_dinh_van_hanh_thi_truong_dien__clean___1__d56c8.pdf |

**Amendment on file:** Circular 36/2025/TT-BCT (issued 2025-06-03) amends Circular
16/2025/TT-BCT. The MOIT consolidated-text PDF above (`VBHN_so_11_TT16TT36...`) already
merges both; cite Circular 16 as amended by Circular 36 on any slide that quotes a
specific article number, since article numbering may have shifted.

Content confirmation (per Circular 16, Điều [FMP formula], and corroborated by the FMP
sources in section 3): **FMP(i) = SMP(i) + CAN(i)** — spot market price plus the
capacity-market add-on, per 30-minute trading interval — matching the deck's citation.

## 3. FMP proxy series

Vietnam's actual per-interval FMP series is not published as raw data (confirms the
existing `RESOURCES.md` note: "primary FMP data is not publicly published"). However,
**NSMO and industry analysts do publish periodic averages**, which is a usable proxy band:

| Period | Avg. FMP (VND/kWh) | Avg. SMP (VND/kWh) | Source | Access date |
|---|---|---|---|---|
| First 7 months of 2024 | **1,423.5** | 1,091.3 (81.6% of plan) | NSMO data, reported by Tạp chí Năng lượng Việt Nam, published 2024-08-22 — [link](https://nangluongvietnam.vn/gia-dien-toan-phan-binh-quan-fmp-cac-thang-dau-nam-2024-giam-so-voi-cung-ky-2023-33042.html) | 2026-07-17 |
| Q1 2026 | **1,255** | — (CAN component ≈ 160) | EVN/NSMO data, cited via Chứng khoán Rồng Việt (Dragon Securities) research note, reported by VnEconomy, published 2026-04-19 — [link](https://vneconomy.vn/ap-luc-chi-phi-mua-dien-dau-vao-tang-tu-quy-22026.htm) | 2026-07-17 |

**Comparison to the app's illustrative FMP (1,427 VND/kWh,
`app/src/data/default-scenarios.js:159`):** the 2024 seven-month average (1,423.5) is
within 0.25% of the illustrative figure — strong support that 1,427 is a reasonable
representative value for *that period*. The Q1 2026 figure (1,255) is materially lower
(~12%), consistent with the cited analyst commentary that FMP was flat-to-low through
Q1 2026 on abundant hydro and was expected to rise from Q2 2026 as hydro supply
tightens. **This is a real seasonal/annual range, not a contradiction** — FMP moves
with hydro availability and fuel costs year to year; a single illustrative constant
necessarily picks one point in that range.

**Trust:** MEDIUM — these are analyst/press reports of NSMO-sourced averages, not a
raw published dataset from NSMO/ERAV itself. NSMO's own site (nsmo.vn) and EVN's
(evn.com.vn) were checked for a public raw series or downloadable report; neither
surfaced a directly linkable monthly/period FMP table in this pass (a bounded gap, not
an open one — see "Negative result" below).

**Negative result (bounded gap):** No official NSMO/ERAV *raw data table or API* for
FMP was found and confirmed accessible in this pass. What exists are (a) periodic
average figures quoted in NSMO's own press materials and re-reported by trade/finance
press (the two rows above), and (b) NSMO's website (https://www.nsmo.vn/), which likely
publishes periodic market reports but was not confirmed to contain a directly linkable
FMP series as of 2026-07-17. **Do not replace the illustrative FMP 1,427 in the app**
per ASM-007 of the governing plan — this note only bounds the gap and gives two
citable reference points.

## How to cite on a slide

- For the decree/circular: cite by number and the official URL, e.g. *"Decree
  57/2025/NĐ-CP (chinhphu.vn, 2025-03-03)"* — do not cite the portal mirrors as
  primary.
- For FMP: cite as a **range with dates**, not a single number — e.g. *"FMP has
  ranged ~1,255–1,424 VND/kWh across 2024–Q1 2026 (NSMO-sourced averages via
  Năng lượng Việt Nam and VnEconomy/Dragon Securities); this deck's illustrative
  FMP = 1,427 sits at the top of that observed range."* This is more defensible under
  audience questioning than presenting 1,427 as a current point estimate.

## Sources

- [Decree 57/2025/NĐ-CP — official text (vanban.chinhphu.vn)](https://vanban.chinhphu.vn/?pageid=27160&docid=213012)
- [Circular 16/2025/TT-BCT — official text (chinhphu.vn)](https://chinhphu.vn/?pageid=27160&docid=212947&classid=1&orggroupid=4)
- [MOIT consolidated text of Circular 16 + amending Circular 36](https://minhbach.moit.gov.vn/upload/2005517/20250610/VBHN_so_11_TT16TT36_quy_dinh_van_hanh_thi_truong_dien__clean___1__d56c8.pdf)
- [FMP first-7-months-2024 average — Tạp chí Năng lượng Việt Nam](https://nangluongvietnam.vn/gia-dien-toan-phan-binh-quan-fmp-cac-thang-dau-nam-2024-giam-so-voi-cung-ky-2023-33042.html)
- [FMP Q1 2026 average — VnEconomy](https://vneconomy.vn/ap-luc-chi-phi-mua-dien-dau-vao-tang-tu-quy-22026.htm)
- [ADK Lawyers, Decree 57 summary (background, non-primary)](https://adk-lawyers.com/en/key-updates-direct-power-purchase-agreement-dppa-decree-57-2025/)
- [Frasers Law Vietnam, Decree 57 summary (background, non-primary)](https://www.frasersvn.com/vi/legal-updates-and-publications/decree-57-vietnam-launches-full-dppa-regime-for-renewable-power)
