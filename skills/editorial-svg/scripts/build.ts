/**
 * Build every thumbnail source in a directory into an SVG, plus a preview page.
 *
 *   node scripts/build.ts <srcDir> [outDir]
 *
 * Each source file default-exports a function returning an SVG string:
 *
 *   import { createIllustration } from '../lib/index.ts'
 *   export default function build(): string {
 *     const s = createIllustration({ seed: 4821 })
 *     ...
 *     return s.toSVG()
 *   }
 *
 * The preview page renders each result at full size, 160px and 64px, because an
 * illustration that only works when zoomed in is not a thumbnail. Checking the
 * small sizes is the fastest way to catch a composition with too much in it.
 */

import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve, basename } from 'node:path'
import { pathToFileURL } from 'node:url'

const srcDir = resolve(process.argv[2] ?? 'art/thumbnails')
const outDir = resolve(process.argv[3] ?? srcDir)

if (!existsSync(srcDir)) {
  console.error(`No such directory: ${srcDir}`)
  process.exit(1)
}
mkdirSync(outDir, { recursive: true })

const sources = readdirSync(srcDir)
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.d.ts'))
  .sort()

if (sources.length === 0) {
  console.error(`No .ts thumbnail sources found in ${srcDir}`)
  process.exit(1)
}

const built: Array<{ name: string; svg: string }> = []

for (const file of sources) {
  const name = basename(file, '.ts')
  const mod = await import(pathToFileURL(join(srcDir, file)).href)
  const fn = mod.default
  if (typeof fn !== 'function') {
    console.warn(`  skip ${file} — no default-exported function`)
    continue
  }
  const svg = await fn()
  if (typeof svg !== 'string' || !svg.includes('<svg')) {
    console.warn(`  skip ${file} — default export did not return SVG markup`)
    continue
  }
  writeFileSync(join(outDir, `${name}.svg`), svg)
  built.push({ name, svg })
  console.log(`  ${name}.svg  ${(svg.length / 1024).toFixed(1)}kb`)
}

const cards = built
  .map(
    ({ name, svg }) => `
  <figure>
    <div class="big">${svg}</div>
    <div class="row">
      <div class="s160">${svg}</div>
      <div class="s64">${svg}</div>
      <figcaption>${name}<br><span>160px &nbsp; 64px</span></figcaption>
    </div>
  </figure>`,
  )
  .join('\n')

const html = `<!doctype html>
<meta charset="utf-8">
<title>editorial-svg preview</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; padding: 32px;
    background: #1d1d1b; color: #e8e6df;
    font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
    display: grid; gap: 32px;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
  figure { margin: 0; }
  .big svg { width: 100%; height: auto; display: block; border-radius: 4px; }
  .row { display: flex; align-items: flex-end; gap: 14px; margin-top: 12px; }
  .s160 svg { width: 160px; height: 160px; display: block; border-radius: 3px; }
  .s64 svg  { width: 64px;  height: 64px;  display: block; border-radius: 2px; }
  figcaption { color: #9b998f; }
  figcaption span { color: #6b6a64; }
</style>
${cards}
`

writeFileSync(join(outDir, 'preview.html'), html)
console.log(`\n${built.length} built → ${outDir}`)
console.log(`preview: ${join(outDir, 'preview.html')}`)
