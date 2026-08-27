/**
 * Copy the builder into a project so its artwork builds without this skill.
 *
 *   node scripts/vendor.ts [targetDir]     # default: art/editorial-svg
 *
 * The library is ~35kb of dependency-free TypeScript with no build step, so the
 * honest way to use it is the shadcn way: it lives in your repo, not in your
 * node_modules and not behind a skill install. That keeps every committed
 * illustration source buildable by anyone who clones the project — including a
 * CI job, a collaborator, and you in two years — whether or not the skill that
 * wrote it is still installed.
 *
 * Run once per project. Re-run to pull in a newer version of the library.
 */

import { readdirSync, copyFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve, dirname, relative, isAbsolute, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/** An import specifier is always posix-separated and always explicitly relative. */
const specifier = (from: string, to: string): string => {
  const rel = relative(from, to).split(sep).join('/')
  return rel.startsWith('.') ? rel : `./${rel}`
}

/** Paths read better relative to the project, unless that means climbing out of it. */
const show = (p: string): string => {
  const rel = relative(process.cwd(), p)
  return rel && !rel.startsWith('..') && !isAbsolute(rel) ? rel : p
}

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = resolve(process.argv[2] ?? 'art/editorial-svg')

if (target === join(skillDir, 'lib')) {
  console.error('Refusing to vendor the library over itself.')
  process.exit(1)
}

mkdirSync(target, { recursive: true })

const libFiles = readdirSync(join(skillDir, 'lib')).filter((f) => f.endsWith('.ts'))
for (const file of libFiles) {
  copyFileSync(join(skillDir, 'lib', file), join(target, file))
  console.log(`  ${show(join(target, file))}`)
}

copyFileSync(join(skillDir, 'scripts', 'build.ts'), join(target, 'build.ts'))
console.log(`  ${show(join(target, 'build.ts'))}`)

const sourceDir = resolve(dirname(target), 'thumbnails')
const sourceRel = show(sourceDir)
const targetRel = show(target)
const importRel = specifier(sourceDir, join(target, 'index.ts'))

if (!existsSync(sourceDir)) mkdirSync(sourceDir, { recursive: true })

console.log(`
Vendored into ${targetRel}/

Write illustration sources in ${sourceRel}/, importing:

  import { createIllustration, onField } from '${importRel}'

Then render them:

  node ${targetRel}/build.ts ${sourceRel}
  open ${sourceRel}/preview.html
`)
