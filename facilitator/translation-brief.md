---
title: "Translation Brief — Vietnamese & Chinese"
date: "2026-08-23"
status: "ready to hand off"
---

# Translation Brief — Vietnamese (vi) & Chinese (zh)

For the translator engaged under item H2 of the human-blocked register
(`plans/2026-october-readiness-checklist.md`). Read this whole page before opening either file —
it explains the rules that keep your work from breaking a build.

## The two files, and only these two files

| File | What it is | Units outstanding |
|---|---|---|
| `app/src/data/strings.js` | Every label, button, and caption in the live app (https://dppa-case.web.app) | vi: 140 / zh: 148 (of 151 keys each) |
| `assets/teaching/terminology-map.json` | Slide text for the October deck (`ceba/DPPA Presentation Oct 2026 To Teach.pptx`) | vi: 43 / zh: 43 pending entries (of 43 each — every entry needs both languages) |

**Total: 288 + 86 = 374 units across the two files, of which 352 are currently marked
`UNTRANSLATED`.** Nothing else in the repository needs translation from you.

## The key set is frozen

`app/src/data/strings.js`'s English key set was frozen on **2026-08-23** in
`app/src/data/strings.baseline.json` (151 keys). `node scripts/i18n-report.mjs --check` (run
automatically in CI) fails if a key is added or removed after that date, or if `vi`/`zh` don't
carry exactly the same key set as `en`. **This means the scope of your work will not change out
from under you mid-engagement.** If a coding session needs to add a new UI string after you've
started, it must re-freeze the baseline and this brief must be re-issued for the delta — that is
the coding session's obligation, not something you need to track.

`assets/teaching/terminology-map.json` has no separate freeze mechanism; its entry count is fixed
by `build_oct_teaching_deck.py`'s `TEXT["en"]` dict, which does not change without a deck-content
change.

## Never type a number

Some entries and keys contain a `{placeholder}` token instead of a figure — for example:

```
"en": "Today: {bau} tr VND. With a DPPA: {ckh} tr VND. Where did the gap come from? You will compute it."
```

**Copy every `{placeholder}` token verbatim into your translation, in whatever position makes the
sentence read naturally in the target language.** Do not translate the token itself, do not
replace it with a number, and do not remove it. The build script
(`build_oct_teaching_deck.py`) fills each one in automatically from the settlement engine's own
JSON export (`assets/teaching/spine-s1.json`) at build time — that is what guarantees a number on
a slide can never disagree with the number the app computes. If you see a bare number instead of a
placeholder anywhere in `terminology-map.json`, stop and flag it — `tools/check_terminology_numbers.py`
will fail the build until it's fixed, so it should never reach you, but if it does, it's a bug in
the source file, not something to translate around.

Two entries in `terminology-map.json` use this today: `cold_open_body` and `m2b_body`. Every other
entry is plain prose with no placeholders — translate those normally.

`app/src/data/strings.js` currently has **no placeholder keys** that need this treatment; every
key there is translatable as plain text. If that changes, this brief will be updated to say so
explicitly.

## Vietnamese numeral typography

If your Vietnamese translation needs to state a number directly (rare — almost every figure in
`terminology-map.json` is a placeholder, and `strings.js` mostly holds UI labels, not figures),
use Vietnamese convention: **`.` groups thousands, `,` marks the decimal** — the reverse of
English. `5.000.000` (five million), `1,0342` (one point oh-three-four-two). Do not write
`5,000,000` in a Vietnamese sentence — under Vietnamese rules that reads as `5.000000`, i.e. five,
not five million. `app/src/modules/formatters.js` already formats app-displayed numbers this way
automatically; this rule only matters for a number you type by hand into a translated string.

## What "done" looks like

```bash
cd app
node scripts/i18n-report.mjs
```

Exits with `vi: 0 untranslated` and `zh: 0 untranslated` and prints no key names. For the deck
file, every `vi` and `zh` field in `assets/teaching/terminology-map.json`'s `entries` object should
read as real Vietnamese/Chinese text, never the literal string `UNTRANSLATED`.

After both files are complete, a coding session runs:

```bash
PYTHONPATH= py tools/check_terminology_numbers.py   # confirms no stray figures were typed
PYTHONPATH= py build_oct_teaching_deck.py --lang vi
PYTHONPATH= py build_oct_teaching_deck.py --lang zh
PYTHONPATH= py audit_teaching_deck.py
PYTHONPATH= py verify_deck_numbers.py
```

to build and verify the translated decks. You do not need to run these yourself.

## Questions

If a source sentence is ambiguous, or a `{placeholder}` doesn't fit the target language's word
order, leave a comment in your delivery rather than guessing — a wrong translation of a real
sentence is a much smaller problem than a mistranslated placeholder contract.
