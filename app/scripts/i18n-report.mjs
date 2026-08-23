// PHASE-03 (2026-06-29): reports per-language UNTRANSLATED key counts. Default
// mode is a report, not a gate -- exits 0 regardless -- because the real gate is
// the translator engagement deadline (item H2), not CI.
//
// PHASE-03 (2026-08-23): --check adds a real gate: it fails if the English key
// set has drifted from src/data/strings.baseline.json (added or removed keys),
// or if vi/zh don't carry exactly the same key set as en. This exists to freeze
// the translation surface's *size* before a translator is engaged -- a key added
// mid-engagement silently changes what was quoted as the scope.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { STRINGS } from '../src/data/strings.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASELINE_PATH = join(__dirname, '..', 'src', 'data', 'strings.baseline.json')

export function untranslatedKeys(lang) {
  return Object.entries(STRINGS[lang])
    .filter(([, value]) => value === 'UNTRANSLATED')
    .map(([key]) => key)
    .sort()
}

export function keySetDiff(current, baseline) {
  const currentSet = new Set(current)
  const baselineSet = new Set(baseline)
  return {
    added: current.filter((key) => !baselineSet.has(key)).sort(),
    removed: baseline.filter((key) => !currentSet.has(key)).sort(),
  }
}

function report() {
  for (const lang of ['vi', 'zh']) {
    const keys = untranslatedKeys(lang)
    console.log(`${lang}: ${keys.length} untranslated`)
    for (const key of keys) console.log(`  - ${key}`)
  }
}

function check() {
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'))
  const currentEnKeys = Object.keys(STRINGS.en).sort()
  const diff = keySetDiff(currentEnKeys, baseline.keys)

  let ok = true

  if (diff.added.length || diff.removed.length) {
    ok = false
    console.log(
      `I18N-CHECK FAIL: en key set has drifted from the frozen baseline (${BASELINE_PATH}, frozen ${baseline.frozenOn})`,
    )
    if (diff.added.length) console.log(`  added: ${diff.added.join(', ')}`)
    if (diff.removed.length) console.log(`  removed: ${diff.removed.join(', ')}`)
  }

  for (const lang of ['vi', 'zh']) {
    const langKeys = Object.keys(STRINGS[lang]).sort()
    const langDiff = keySetDiff(langKeys, currentEnKeys)
    if (langDiff.added.length || langDiff.removed.length) {
      ok = false
      console.log(`I18N-CHECK FAIL: ${lang} key set does not match en`)
      if (langDiff.added.length)
        console.log(`  ${lang} has extra keys: ${langDiff.added.join(', ')}`)
      if (langDiff.removed.length)
        console.log(`  ${lang} is missing keys: ${langDiff.removed.join(', ')}`)
    }
  }

  if (ok) {
    console.log(`I18N-CHECK PASS (${currentEnKeys.length} keys, frozen ${baseline.frozenOn})`)
    return 0
  }
  return 1
}

function main() {
  if (process.argv.includes('--check')) {
    process.exit(check())
  }
  report()
}

main()
