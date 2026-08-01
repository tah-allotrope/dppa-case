// PHASE-03: reports per-language UNTRANSLATED key counts. This is a report, not a
// gate — the gate is the translator engagement deadline (item H2), not CI — so it
// always exits 0.
import { STRINGS } from '../src/data/strings.js'

export function untranslatedKeys(lang) {
  return Object.entries(STRINGS[lang])
    .filter(([, value]) => value === 'UNTRANSLATED')
    .map(([key]) => key)
    .sort()
}

function main() {
  for (const lang of ['vi', 'zh']) {
    const keys = untranslatedKeys(lang)
    console.log(`${lang}: ${keys.length} untranslated`)
    for (const key of keys) console.log(`  - ${key}`)
  }
}

main()
