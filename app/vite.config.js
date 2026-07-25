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

export default defineConfig({
  plugins: [buildCommitPlugin()],
  test: {
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
  build: {
    chunkSizeWarningLimit: 300,
  },
})
