import { defineConfig } from 'vite'
import { execSync } from 'node:child_process'

function getBuildCommit() {
  try {
    return execSync('git rev-parse HEAD').toString().trim()
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
