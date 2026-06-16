#!/usr/bin/env node
import { readFile, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const PARTIAL_DIR = path.join(ROOT, 'data/intercom/raw-partials')
const OUT = path.join(ROOT, 'data/intercom/raw-export.json')

const files = (await readdir(PARTIAL_DIR)).filter((f) => f.endsWith('.json')).sort()
const all = []
for (const file of files) {
  const chunk = JSON.parse(await readFile(path.join(PARTIAL_DIR, file), 'utf8'))
  all.push(...chunk)
}
await writeFile(OUT, `${JSON.stringify(all, null, 2)}\n`)
console.log(`Merged ${all.length} conversations from ${files.length} partial files`)
