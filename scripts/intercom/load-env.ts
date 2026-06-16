import { readFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export async function loadEnvFile(fileName = '.env'): Promise<void> {
  const envPath = path.join(ROOT, fileName)
  try {
    await access(envPath, constants.F_OK)
  } catch {
    return
  }

  const content = await readFile(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim()
    if (!key || process.env[key] !== undefined) continue

    process.env[key] = value
  }
}
