// Minimal ESM loader so plain `node` can run the Vite app's extensionless
// relative imports (e.g. `./profiles`) outside of Vite's own resolver.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) {
    try {
      return await nextResolve(specifier, context)
    } catch (err) {
      if (err.code === 'ERR_MODULE_NOT_FOUND') {
        for (const ext of ['.js', '.mjs']) {
          try {
            return await nextResolve(specifier + ext, context)
          } catch {
            // try next extension
          }
        }
      }
      throw err
    }
  }
  return nextResolve(specifier, context)
}
