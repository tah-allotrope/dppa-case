import { defineConfig } from 'vite'
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function getBuildCommit() {
  try {
    const commit = execSync('git rev-parse HEAD').toString().trim()
    const dirty = execSync('git status --porcelain').toString().trim().length > 0
    return dirty ? `${commit}-dirty` : commit
  } catch {
    return 'unknown'
  }
}

function buildCommitPlugin() {
  const commit = getBuildCommit()
  return {
    name: 'inject-build-commit',
    transformIndexHtml(html) {
      return html.replace('</head>', `  <meta name="build-commit" content="${commit}">\n  </head>`)
    },
  }
}

// PHASE-04: app/public/** is copied verbatim by Vite (no hashing), so sw.js
// cannot hard-code the emitted /assets/* filenames. This plugin writes a
// manifest at generateBundle time that sw.js fetches during install.
function swManifestPlugin() {
  const commit = getBuildCommit()
  return {
    name: 'emit-sw-manifest',
    generateBundle(_options, bundle) {
      const assets = Object.values(bundle)
        .filter((entry) => entry.fileName && !entry.fileName.endsWith('.map'))
        .map((entry) => `/${entry.fileName}`)
      this.emitFile({
        type: 'asset',
        fileName: 'sw-manifest.json',
        source: JSON.stringify({ version: commit, assets }, null, 2),
      })
    },
  }
}

// PHASE-06 (plans/2026-09-05-gate-model-and-october-readiness-plan.md): public/sw.js
// is copied verbatim, so the cache version cannot be imported. This plugin rewrites
// the __SW_VERSION__ token in the emitted dist/sw.js after the bundle is written.
function swVersionPlugin() {
  const commit = getBuildCommit()
  return {
    name: 'inject-sw-version',
    writeBundle(options) {
      if (!options.dir) return
      const swPath = join(options.dir, 'sw.js')
      if (!existsSync(swPath)) return
      writeFileSync(swPath, readFileSync(swPath, 'utf-8').replaceAll('__SW_VERSION__', commit))
    },
  }
}

export default defineConfig({
  plugins: [buildCommitPlugin(), swManifestPlugin(), swVersionPlugin()],
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      all: true,
      include: ['src/**/*.js'],
      exclude: ['e2e/**', 'scripts/**', '**/*.test.js', 'dist/**'],
      // PHASE-05: thresholds are a ratchet set from a real measurement
      // (rounded down), not an aspirational target — raise deliberately,
      // never lower silently. See deployment.md's Quality commands section.
      // `all: true` + explicit `include` (2026-08-23) makes the denominator the
      // whole src/ tree, not just the files some test happens to import — chart.js
      // and main.js were previously invisible to this ratio entirely, which is why
      // this re-baseline (49/49/51/49) reads lower than the pre-2026-08-23 ratchet
      // (78/71/79/77): the earlier number described 13 of the ~15 source files.
      thresholds: {
        lines: 49,
        branches: 49,
        functions: 51,
        statements: 49,
        'src/modules/settlement.js': {
          lines: 92,
          branches: 75,
          functions: 85,
          statements: 91,
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 300,
  },
})
