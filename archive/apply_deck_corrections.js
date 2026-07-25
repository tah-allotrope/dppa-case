const fs = require('fs')
const path = require('path')
const JSZip = require('jszip')

const deckPath = path.join('ceba', 'DPPA Presentation July 2026 Scenario Training.pptx')
const backupPath = path.join('ceba', 'DPPA Presentation July 2026 Scenario Training.backup-2026-06-26.pptx')
const verifyPath = path.join('deck-qa', 'july-deck-corrections-verify.txt')

const replacements = {
  'ppt/slides/slide5.xml': [
    { anyOf: [['8,263,196,000', '8,563,196,000']] },
  ],
  'ppt/slides/slide6.xml': [
    { anyOf: [['8,263,196,000', '8,563,196,000']] },
    { anyOf: [['8,763,196,000', '9,063,196,000']] },
  ],
  'ppt/slides/slide7.xml': [
    { anyOf: [['8,2 billion', '8.5 billion'], ['8.2 billion', '8.5 billion']] },
    { anyOf: [['6.2 billion', '5.8 billion']] },
  ],
  'ppt/slides/slide3.xml': [
    { anyOf: [['1,026', '1.026']] },
    { anyOf: [['1,008', '1.008']] },
    { anyOf: [['163,3', '163.30']] },
  ],
}

function replaceOnce(xml, oldText, newText, label, counts) {
  if (!xml.includes(oldText)) {
    return { xml, count: 0 }
  }
  counts.push(`${label}: 1 x ${oldText}`)
  return { xml: xml.replace(oldText, newText), count: 1 }
}

function extractText(xml) {
  const out = []
  const regex = /<a:t>(.*?)<\/a:t>/g
  let match
  while ((match = regex.exec(xml)) !== null) {
    out.push(match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'"))
  }
  return out
}

async function main() {
  if (!fs.existsSync(deckPath)) {
    throw new Error(`Missing deck: ${deckPath}`)
  }
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(deckPath, backupPath)
  }

  const zip = await JSZip.loadAsync(fs.readFileSync(deckPath))
  const counts = []

  for (const [fileName, pairs] of Object.entries(replacements)) {
    const file = zip.file(fileName)
    if (!file) throw new Error(`Missing ${fileName}`)
    let xml = await file.async('string')
    for (const group of pairs) {
      let groupCount = 0
      for (const [oldText, newText] of group.anyOf) {
        const result = replaceOnce(xml, oldText, newText, fileName, counts)
        xml = result.xml
        groupCount += result.count
      }
      if (groupCount === 0) {
        const labels = group.anyOf.map(([oldText]) => oldText).join(' | ')
        counts.push(`${fileName}: 0 x ${labels}`)
      }
    }
    zip.file(fileName, xml)
  }

  const missing = counts.filter((line) => line.includes(': 0 x '))
  if (missing.length) {
    throw new Error(`Missing expected replacements:\n${missing.join('\n')}`)
  }

  const output = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  fs.writeFileSync(deckPath, output)

  const verifyZip = await JSZip.loadAsync(fs.readFileSync(deckPath))
  const slideNames = Object.keys(verifyZip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]))

  const verifyLines = []
  for (const slideName of slideNames) {
    const slideNo = slideName.match(/slide(\d+)/)[1]
    verifyLines.push(`--- Slide ${slideNo} ---`)
    const xml = await verifyZip.file(slideName).async('string')
    verifyLines.push(...extractText(xml).filter(Boolean))
  }

  fs.mkdirSync(path.dirname(verifyPath), { recursive: true })
  fs.writeFileSync(verifyPath, `${verifyLines.join('\n')}\n`, 'utf8')

  console.log('Deck corrections applied')
  console.log(`Backup: ${backupPath}`)
  console.log(`Verify: ${verifyPath}`)
  console.log(`Slides: ${slideNames.length}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
