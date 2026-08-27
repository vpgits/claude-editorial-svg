---
name: editorial-svg
description: Generate editorial SVG illustrations — blog thumbnails, article artwork, post cover images, OG images — from a seeded primitive library (blob, gesture, arrow, node, panel, hand, cursor, cluster) in a restrained flat-field / paper / ink / accent visual system. Use this whenever the user wants a thumbnail, cover image, hero graphic, diagram-style artwork, or illustration for a post, page, or project, and whenever they ask to draw, illustrate, or hand-write an SVG — even if they never say "editorial" or name the library. Also use it before writing SVG paths directly, so output stays in the house style instead of drifting into generic clip-art.
---

# Editorial SVG illustrations

Build small, sparse, hand-feeling vector illustrations that carry an idea. The
output is a committed `.svg` generated from a committed `.ts` source, so it stays
deterministic, diffable, and editable in Figma or Illustrator afterwards.

## The one thing that matters

An illustration here is not a picture. It is **a tiny visual argument made from
3–8 vector marks.**

Almost all of the quality comes from a decision you make before touching any
code: *what are the fewest marks that make this idea obvious?* If you skip
straight to drawing, you get a competent picture of a noun and the piece says
nothing. Spend your effort on the abstraction, then let the primitives handle the
drawing.

## Workflow

**1. Find the argument.** Read the article, or ask what it claims. Extract: the
central claim, the strongest visual noun, and — most importantly — the
*relationship or transformation* the piece is really about.

**2. Abstract it.** Draw the mechanism, not the subject. This is the step that
separates good from generic:

| Article | Weak (literal noun) | Strong (mechanism) |
| --- | --- | --- |
| Agents coordinate badly | four robots at a laptop | a handoff chain that visibly weakens at each hop |
| AI art you can still edit | robot holding a paintbrush | a curve with its Bézier anchors and handles exposed |
| Rate limiting a form | a form with an error toast | a crowd meeting a funnel, one mark through |
| Draft previews | a screenshot of the CMS | a stack of versions, one being looked at |

**3. Pick a grammar.** One of: object, diagram, UI, code, data. Committing to one
keeps a set of thumbnails feeling related.

**4. Sketch in words first.** Literally write the sentence before the code:
*"Dusty green field. Torn ivory sheet. Four nodes descending left to right, each
smaller than the last, arrows thinning between them. Accent on the first."* If
you cannot write that sentence, the concept is not resolved and no amount of SVG
will save it.

**5. Implement** with the primitives (see below). First illustration in a
project, do [Setup](#setup) first.

**6. Render and look at it.** Non-negotiable — this system is tuned by eye:

```bash
node art/editorial-svg/build.ts art/thumbnails
open art/thumbnails/preview.html
```

The preview shows every illustration at full size, **160px and 64px**. Judge it
at 160. If it only works large, it is not a thumbnail yet.

**7. Cut.** Delete every mark that does not carry the idea. This almost always
improves the piece. Then commit both the `.ts` and the `.svg`.

## Constraints

Hold these unless there is a specific reason not to:

- **Max 7 major objects.** Past that it becomes an infographic.
- **Max 4 colours** — one field, one paper, one ink, one accent. No gradients.
- **The accent appears once or twice.** If everything is accented, nothing is.
- **No text.** The headline sits next to the thumbnail already; repeating it
  wastes the only marks you have.
- **2–3 stroke weights**, from `WEIGHT` (`primary` / `secondary` / `detail`). A
  new weight per object is the fastest way to break a set.
- **Asymmetry and negative space.** Do not auto-centre everything; slight offset
  reads as placed by hand, dead-centre reads as a template.
- **Must survive 160×160.**

Proportions that work: carrier 60–85% of the canvas, primary object 40–70% of the
usable area, accent under 10%, and a 60–90px safe margin.

## Setup

The library is dependency-free TypeScript that runs on `node` directly (22.18+,
where type stripping is unflagged). It lives **in the project**, not in `node_modules`
and not behind a skill install — so every committed illustration source still
builds for a collaborator, a CI job, or you in two years, whether or not this
skill is installed.

Once per project, from this skill's directory:

```bash
node scripts/vendor.ts art/editorial-svg
```

That copies the library and build script into `art/editorial-svg/` and creates
`art/thumbnails/` for the sources. Pick different paths if the project has its
own convention — pass the target as the argument. If the project already has an
`art/editorial-svg/` (or equivalent), it is already set up; skip this and use it.

## Writing an illustration

Each source file default-exports a function returning SVG. The build script finds
them, runs them, and writes the `.svg` beside them.

```ts
// art/thumbnails/agent-handoff.ts
import { createIllustration, onField } from '../editorial-svg/index.ts'

export default function build(): string {
  const s = createIllustration({ seed: 4821, palette: onField('sage') })

  s.blob({ x: 508, y: 512, width: 760, height: 700 })   // the carrier
  s.arrow({ from: [230, 348], to: [434, 452], bow: -46 })
  s.dot(230, 348, { radius: 46, fill: s.palette.accent })

  return s.toSVG()
}
```

`seed` fixes every random choice, so the same source always produces byte-identical
output. Change the seed to reroll the hand-drawn variation without touching the
composition — it is the cheapest way to explore. Keep the seed once you like it.

For a set of posts, `fieldForKey(slug)` and `seedFromKey(slug)` derive a stable
field colour and seed from a slug, so an archive page gets varied but consistent
artwork and regenerating never reshuffles it.

## The primitives

Composition verbs, not shapes. Full signatures and options in
`reference/primitives.md` — read it before reaching for `s.path()`.

| | |
| --- | --- |
| `field(color)` | flat colour across the canvas |
| `blob({x,y,width,height,form})` | the carrier sheet — `'sheet'` (default) or `'ellipse'` |
| `gesture({points})` | a smooth drawn line; the backbone of most linework |
| `polyline({points})` | straight-edged version, when stiffness is the point |
| `arrow({from,to,bow})` | curved shaft with a drawn head |
| `dot(x,y)` / `node(x,y,{ring})` | anchors, states, participants |
| `connector(a,b,{bow})` / `cluster({nodes,edges})` | relationships between them |
| `panel({x,y,width,height,bar})` | a window or card, reconstructed not screenshotted |
| `hand({x,y,angle,size})` | someone using the thing — supplies agency |
| `cursor(x,y)` / `codeMark(x,y)` | software and code, in a couple of strokes |
| `textLines(...)` / `scribble(...)` / `bracket(...)` | text stand-ins, activity, grouping |
| `path(d, opts)` / `raw(el)` | escape hatches |

Two that carry more weight than the rest:

- **`blob` is the carrier.** Default `form: 'sheet'` is a torn rounded rectangle,
  because the drawing should look like it sits *on* something. A true ellipse
  reads as a bubble and pulls the eye to the centre.
- **`hand` supplies agency.** A hand entering the frame turns an abstract object
  into something being used — the cheapest way to make a still composition feel
  active, which is why editorial illustration leans on it so hard.

## Palette

`editorial` is the default: dusty green field, ivory paper, near-black ink, warm
red accent. `onField(name)` swaps only the field — `sage`, `clay`, `sand`, `sky`,
`ochre`, `mist`, `rose`, `slate`, and `charcoal`.

Ink is never pure `#000`; pure black reads as printer output rather than drawing.

`charcoal` is dark, so near-black ink vanishes on it. Use it only deliberately,
and keep every mark on the paper carrier or swap ink and paper roles.

## Reference

- `reference/grammar.md` — the visual system in depth: canvas, carrier, stroke
  language, controlled imperfection, seeded irregularity, composition and safe area.
- `reference/primitives.md` — every primitive, its options, and what each is for.
- `reference/concepts.md` — the concept playbook, failure modes, and the quality bar.
- `examples/` — four worked illustrations, one per grammar. Each one's header
  comment explains the abstraction it chose and what it rejected. Read these
  before writing a new one; they are the fastest way into the house style.

## Quality bar

Before shipping, check the piece is: understandable without study, legible at
160px, sparse, conceptually tied to the article, composed on purpose rather than
centred by default, and free of any mark that communicates nothing.

If it needs 500 elements, the concept is too complicated. Go back to step 2.
