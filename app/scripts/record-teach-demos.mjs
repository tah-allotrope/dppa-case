// PHASE-02 (October readiness hardening plan): records the six ?teach=1
// presenter demos as MP4s via Playwright + ffmpeg-static, so the deck's
// hidden fallback slides embed a real recording instead of placeholder text.
// Run: npm run record:demos (from app/). Regenerate whenever teach-steps.js
// or the underlying scenario numbers change.
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync, existsSync, statSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ffmpegPath from 'ffmpeg-static'
import { teachSteps } from '../src/data/teach-steps.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const APP_ROOT = join(__dirname, '..')
const OUT_DIR = join(APP_ROOT, '..', 'assets', 'teaching', 'fallback')
const TMP_DIR = join(APP_ROOT, '.tmp-teach-recordings')
const PORT = 4174
const BASE_URL = `http://127.0.0.1:${PORT}`
const MIN_BYTES = 20 * 1024

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))))
    child.on('error', reject)
  })
}

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url)
        if (res.ok) return resolve()
      } catch {
        // server not up yet
      }
      if (Date.now() - start > timeoutMs) return reject(new Error(`Server at ${url} did not respond within ${timeoutMs}ms`))
      setTimeout(attempt, 300)
    }
    attempt()
  })
}

export function convertToMp4(webmPath, mp4Path, posterPath) {
  return new Promise((resolve, reject) => {
    const transcodeArgs = ['-y', '-i', webmPath, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30', '-an', mp4Path]
    const transcode = spawn(ffmpegPath, transcodeArgs)
    let transcodeErr = ''
    transcode.stderr.on('data', (chunk) => (transcodeErr += chunk))
    transcode.on('error', reject)
    transcode.on('exit', (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg transcode failed (${code}): ${transcodeErr}`))
      // Seek 2s from end-of-file rather than grabbing frame 0: the first
      // frame of every clip is captured mid-navigation/scroll and renders
      // near-blank, producing tiny, visually useless posters.
      const posterArgs = ['-y', '-sseof', '-2', '-i', mp4Path, '-update', '1', '-frames:v', '1', posterPath]
      const poster = spawn(ffmpegPath, posterArgs)
      let posterErr = ''
      poster.stderr.on('data', (chunk) => (posterErr += chunk))
      poster.on('error', reject)
      poster.on('exit', (posterCode) =>
        posterCode === 0 ? resolve() : reject(new Error(`ffmpeg poster extraction failed (${posterCode}): ${posterErr}`)),
      )
    })
  })
}

async function setControlValue(page, id, value) {
  await page.locator(`#${id}`).evaluate((el, v) => {
    el.value = String(v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

async function recordStep(browser, stepIndex, outDir) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
  })
  const page = await context.newPage()
  await page.goto(`${BASE_URL}/?teach=1&present=1`)
  await page.waitForSelector('#teachBanner')

  for (let i = 0; i < stepIndex; i += 1) {
    await page.locator('#teachNext').click()
  }
  await page.waitForTimeout(1500)

  // M3 (index 2): drag the market-price slider up through the strike live,
  // to show the CfD line flip sign, per the plan's TASK-02-02.
  if (stepIndex === 2) {
    for (const value of [1200, 1300, 1350]) {
      await setControlValue(page, 'marketPrice', value)
      await page.waitForTimeout(800)
    }
  }

  // M6 (index 5): animate the strike lever down to the step's target value
  // so the recording shows visible motion, not a static jump-cut.
  if (stepIndex === 5) {
    for (const value of [1250, 1200, 1150, 1100]) {
      await setControlValue(page, 'strikePrice', value)
      await page.waitForTimeout(800)
    }
  }

  await page.waitForTimeout(4000)

  const video = page.video()
  await context.close()
  return video.path()
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(TMP_DIR, { recursive: true })

  console.log('Building app...')
  await run('npm', ['run', 'build'], { cwd: APP_ROOT })

  console.log(`Starting preview server on port ${PORT}...`)
  const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: APP_ROOT,
    shell: process.platform === 'win32',
  })
  preview.stdout.on('data', () => {})
  preview.stderr.on('data', () => {})

  try {
    await waitForServer(BASE_URL)

    const browser = await chromium.launch()
    try {
      for (let stepIndex = 0; stepIndex < teachSteps.length; stepIndex += 1) {
        const moduleNum = stepIndex + 1
        console.log(`Recording step ${moduleNum}/${teachSteps.length}: ${teachSteps[stepIndex].title}`)
        const webmPath = await recordStep(browser, stepIndex, TMP_DIR)
        const mp4Path = join(OUT_DIR, `teach-m${moduleNum}.mp4`)
        const posterPath = join(OUT_DIR, `teach-m${moduleNum}-poster.png`)
        await convertToMp4(webmPath, mp4Path, posterPath)
        rmSync(webmPath, { force: true })
        console.log('Wrote', mp4Path, 'and', posterPath)
      }
    } finally {
      await browser.close()
    }
  } finally {
    preview.kill()
  }

  rmSync(TMP_DIR, { recursive: true, force: true })

  const missing = []
  for (let moduleNum = 1; moduleNum <= teachSteps.length; moduleNum += 1) {
    for (const name of [`teach-m${moduleNum}.mp4`, `teach-m${moduleNum}-poster.png`]) {
      const path = join(OUT_DIR, name)
      if (!existsSync(path) || statSync(path).size < MIN_BYTES) missing.push(path)
    }
  }
  if (missing.length) {
    console.error('Missing or undersized outputs:', missing)
    process.exit(1)
  }
  console.log(`All ${teachSteps.length * 2} recordings verified in ${OUT_DIR}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
