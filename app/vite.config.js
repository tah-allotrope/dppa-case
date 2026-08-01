import { defineConfig } from 'vite'
import { execSync } from 'node:child_process'

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

export default defineConfig({
  plugins: [buildCommitPlugin(), swManifestPlugin()],
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
  build: {
    chunkSizeWarningLimit: 300,
  },
})
