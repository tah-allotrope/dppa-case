# DPPA Terminology Map (EN / VI / ZH-CN)

PHASE-05 of `plans/2026-07-10-october-readiness-hardening-plan.md`. This is the
human-readable companion to `assets/teaching/terminology-map.json` (the
machine-readable overlay `build_oct_teaching_deck.py` reads for `--lang vi|zh`).

**Purpose:** capture the reusable, already-approved EN→VI→ZH vocabulary for the
Modules 1–6 deck, sourced only from translations that already exist elsewhere in
this repo — never invented here. Full slide-body sentences are a separate,
larger translation task that happens **after EN content freeze** (DEC-018); this
document exists so that work starts from a fixed vocabulary instead of a blank
page.

## How to use this

- Term rows below are safe to reuse verbatim in any future translation of the
  deck, worksheets, or handouts — they are already in production elsewhere.
- `assets/teaching/terminology-map.json` has one entry per `TEXT["en"]` key in
  `build_oct_teaching_deck.py`; entries are `UNTRANSLATED` unless a **verbatim or
  near-verbatim** existing translation was found (cited inline). 31 of 43 entries
  are currently `UNTRANSLATED` — that is expected and correct, not a gap to rush:
  these are new Oct-2026 slide sentences with no prior translation to reuse.
- When translation work actually starts (post-freeze), translate the
  `UNTRANSLATED` entries directly in the JSON file, using the term table below
  for consistent vocabulary, then re-run `build_oct_teaching_deck.py --lang vi`
  / `--lang zh` — the script refuses to build while any consumed key is still
  `UNTRANSLATED` for that language (PHASE-05 TASK-05-02).

## Term-level vocabulary table

| English | Tiếng Việt | 中文 | Source |
|---|---|---|---|
| Module 1: The Baseline | 1 Nền giá | 1 基准价 | `build_teaching_visuals.py` `TEXTS.{vi,zh}.breadcrumb_labels[0]` |
| Module 2: The Bill | 2 Hóa đơn | 2 账单 | same, `[1]` |
| Module 3: The Lock | 3 Khóa giá | 3 锁价 | same, `[2]` |
| Module 4: Three Doors | 4 Ba cửa | 4 三道门 | same, `[3]` |
| Module 5: The Case | 5 Tình huống | 5 案例 | same, `[4]` |
| Module 6: Decide | 6 Quyết định | 6 决策 | same, `[5]` |
| "How much energy actually settles?" | Bao nhiêu điện thực sự được thanh toán? | 实际结算多少电量? | `TEXTS.{vi,zh}.m2_funnel_title` — exact match to deck's `m2a_title` |
| "A lock, not a discount" | Khóa giá, không phải giảm giá | 锁价,而非折扣 | `TEXTS.{vi,zh}.m3_title` — exact match to deck's `m3_title` |
| "Three doors the deal must pass" | Ba cánh cửa giao dịch phải vượt qua | 交易必须通过的三道门 | `TEXTS.{vi,zh}.m4_title` — exact match to deck's `m4_title` |
| Matched / settled volume | Sản lượng khớp | *(not yet sourced)* | `facilitator/dppa-workshop-facilitator-guide.md` |
| Total consumption / load | Phụ tải | *(not yet sourced)* | `facilitator/dppa-workshop-facilitator-guide.md` |
| Strike price (locked price) | Giá thực hiện | 执行价 | `facilitator/dppa-workshop-facilitator-guide.md` (VI); `lessons/0011-worksheets-zh-cn.html` (ZH, used throughout, e.g. `执行价 = 1,250`) |
| Matched (case label) | Khớp | 匹配 | `lessons/0011-worksheets-{vi,zh-cn}.html` worksheet headers |
| Shortfall (case label) | Thiếu hụt *(inferred — not directly cited)* | 缺口 | `lessons/0011-worksheets-zh-cn.html` (`练习表 S2 — 缺口`) |
| Excess (case label) | Dư thừa / Sản lượng dư thừa | 过剩 | `lessons/0011-worksheets-{vi,zh-cn}.html` |
| Excess volume | Sản lượng dư thừa | 过剩电量 | `lessons/0011-worksheets-vi.html`, `-zh-cn.html` |
| Foregone CfD | CfD bị bỏ lỡ | 放弃的 CfD | `lessons/0011-worksheets-vi.html`, `-zh-cn.html` |
| Spot value of excess | Giá spot của dư thừa | 过剩的现货价值 | `lessons/0011-worksheets-vi.html`, `-zh-cn.html` |
| Buyer opens (negotiation) | Bên mua mở | 买方开价 | `lessons/0011-worksheets-vi.html`, `-zh-cn.html` |
| Developer opens (negotiation) | Nhà phát triển mở | 开发商开价 | `lessons/0011-worksheets-vi.html`, `-zh-cn.html` |
| Agreed strike | Giá TH thống nhất | 商定执行价 | `lessons/0011-worksheets-vi.html`, `-zh-cn.html` |
| Proposed strike (VND/kWh) | Giá TH đề xuất (VND/kWh) | 提议执行价（VND/kWh） | `lessons/0011-worksheets-vi.html`, `-zh-cn.html` |
| Strike where CfD crosses zero (= FMP) | Giá TH nơi CfD cắt qua không (= FMP) | CfD 过零处的执行价（= FMP） | `lessons/0011-worksheets-vi.html`, `-zh-cn.html` |
| Round (negotiation) | Lượt | 轮次 | `lessons/0011-worksheets-vi.html`, `-zh-cn.html` |
| Flows to… | Chảy về… | 流向… | `lessons/0011-worksheets-vi.html`, `-zh-cn.html` |
| Calculation | Phép tính | 计算 | `lessons/0011-worksheets-vi.html`, `-zh-cn.html` |
| C_EVN, CfD, C_KH, FMP, Q_c, Q_KH | *(kept identical — symbols, not translated)* | *(same)* | `lessons/0011-worksheets-{vi,zh-cn}.html` — Decree-57 notation is retained verbatim in every language |

## Known gaps (do not guess these — translate fresh when the time comes)

- Every checkpoint question (6), every M-module body sentence (M1–M6), the
  cold-open hook, the close-slide callback, and the three appendix takeaway
  sentences have **no existing translation anywhere in the repo**. These are
  new sentences written for the October rebuild; `assets/teaching/terminology-map.json`
  marks all of them `UNTRANSLATED` rather than approximating from the
  differently-worded VI/ZH chart captions in `build_teaching_visuals.py`.
- "Market price" (plain-language label for FMP) has no sourced translation —
  FMP itself stays as the symbol "FMP" in every language, but the plain-English
  gloss needs a fresh translation.
- "Total bill" (plain-language label for C_KH) — same situation.
- "Shortfall" as a standalone case-label word (VI) is inferred from the ZH
  worksheet's parallel structure, not directly cited from a VI source; verify
  with a VI speaker before use.

## Assumptions

- **ASM-007** (from the plan): only translations that already exist verbatim
  elsewhere in the repo were copied in; everything else is honestly
  `UNTRANSLATED`, never invented, even when a "close enough" paraphrase existed
  in `build_teaching_visuals.py`'s differently-worded chart captions.
