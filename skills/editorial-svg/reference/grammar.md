# Visual grammar

The system in depth. Read this when a piece is technically fine but looks wrong,
or when you need to extend the vocabulary.

- [Canvas](#canvas)
- [The four layers](#the-four-layers)
- [Stroke language](#stroke-language)
- [Controlled imperfection](#controlled-imperfection)
- [Seeded irregularity](#seeded-irregularity)
- [Composition](#composition)
- [Safe area](#safe-area)
- [UI as graphic material](#ui-as-graphic-material)
- [Mechanics as subject](#mechanics-as-subject)

## Canvas

1000 × 1000, always via `viewBox`, never fixed pixel geometry:

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
```

A square works for thumbnails, cards and OG crops alike, and 1000 units gives
enough resolution to place things precisely while keeping coordinates readable in
a diff. Pass `width`/`height` to `createIllustration` for other ratios, but keep
the whole set consistent — mixed aspect ratios wreck an archive page.

## The four layers

Almost every illustration is built in this order, and the order matters because
each layer sits on the one before it.

**1. Field.** One flat colour edge to edge. Good families: dusty green, muted
terracotta, warm beige, pale blue, ochre, charcoal. Avoid gradients — they add
depth the rest of the system does not have, and the mismatch reads as a mistake.

**2. Carrier.** One irregular light shape acting like a sheet of paper, a sticker,
a cutout. This is what makes the drawing feel placed rather than floating. It
should be *almost* a rounded rectangle and not quite:

```ts
s.blob({ x: 500, y: 500, width: 780, height: 700, roughness: 0.05 })
```

`form: 'sheet'` (the default) builds a superellipse — flat sides, tight corners —
then displaces it with looping noise. `form: 'ellipse'` gives a soft round mass
for when the shape itself is the subject rather than the ground.

Not every piece needs a carrier. Skip it when the marks should sit directly on
the field, but know that you are giving up the easiest source of depth.

**3. Ink.** The linework. Near-black, never `#000`.

**4. Accent.** One colour, once or twice. Its scarcity is the entire mechanism —
it is what tells the eye where to land first.

## Stroke language

One stroke style carries most of the artwork:

```
stroke="#171715"
stroke-width="17"
stroke-linecap="round"
stroke-linejoin="round"
fill="none"
```

Round caps and joins are doing more work than they look like. They immediately
make geometric lines read as illustrated rather than technical — a square cap on
a hand-drawn line looks like a CAD export.

Three weights, and no more:

| Weight | px | For |
| --- | --- | --- |
| `primary` | 17 | the subject and anything that must survive 160px |
| `secondary` | 11 | connectors, text stand-ins, supporting structure |
| `detail` | 6 | small marks that would crowd the composition at full weight |

Numbers are allowed where a deliberate ramp is the point (a chain that thins as
it degrades), but resist inventing a weight per object.

Thin lines disappear at thumbnail size. When in doubt, go heavier — a piece built
mostly at `primary` reads at 64px, one built mostly at `detail` does not.

## Controlled imperfection

The goal is **hand-shaped, not broken.** The viewer should read a steady hand
that did not use a ruler, not a shaky one.

Vary: radius, control point positions, symmetry, baseline alignment, curve
tension, spacing between related objects.

Never vary: overall readability, composition balance, intended hierarchy.

A perfect circle is wrong for this system:

```html
<circle cx="500" cy="500" r="300"/>   <!-- sterile -->
```

An approximated one is right — which is what `blob` and `dot` generate for you,
so prefer them over raw `<circle>`.

Precision is still a tool. Use it selectively: a deliberately exact element among
irregular ones reads as machine-made, which is useful when that contrast is the
point.

### Why curves come out angular

The most common failure when extending this library: densifying a path by
interpolating along its straight chords and *then* fitting a curve. That pins the
curve to the polyline, so every direction change stays a visible corner and the
whole drawing looks angular no matter how smooth the fit is meant to be.

`sampleSpline` evaluates the spline itself, so the extra points already lie on the
curve and wobble can be applied without flattening it. `gesture` uses it.
`resample` (straight-line) is still correct where the corners *are* the point — a
UI frame, a bracket, a table.

## Seeded irregularity

Never `Math.random()`. Every illustration takes a `seed`, so the same source
always produces byte-identical SVG — which is what makes the generated file safe
to commit and diff.

Displacement ranges that work on a 1000×1000 canvas:

| Target | Range |
| --- | --- |
| tiny mark | ±1–3 px |
| control point | ±4–10 px |
| large blob | ±10–25 px |

`gesture`'s `wobble` is in the same units: 0 is mechanical, 3–6 reads as drawn,
past 10 reads as broken.

Changing the seed rerolls the hand-feel without touching the composition — the
cheapest way to explore. Keep it once you like it.

## Composition

Aim for 3–8 meaningful objects:

```
1 background
1 carrier
1 primary symbolic object
2–4 supporting marks
1 accent
```

Proportions:

| Element | Share |
| --- | --- |
| carrier | 60–85% of canvas |
| primary object | 40–70% of usable area |
| accent | under 10% |
| negative space | substantial |

Before writing paths, answer: what is the dominant object? Where is the empty
space? Where is the accent? What does the eye see first? What should disappear at
thumbnail size?

Avoid centring everything by reflex. Slight asymmetry reads as editorial; dead
centre reads as a template. Offsetting the carrier from the object it holds is a
reliable, cheap way to get that.

## Safe area

Keep 60–90px of margin. Objects may bleed past the carrier on purpose — that
often improves depth — but critical symbols stay inside the margin, because OG
crops and rounded card corners eat the edges.

## UI as graphic material

For software topics, do not paste a screenshot. Reconstruct only the meaningful
parts:

```
window
├── title bar
├── one highlighted setting
└── one floating control
```

`panel` draws the frame; add only what carries the idea. Reconstruction stays
editable, matches the house style, does not date, and — most usefully — forces
you to drop the ninety details that argue nothing.

## Mechanics as subject

When the topic is tooling, editability, or generated artifacts, the mechanics of
vector editing can *be* the illustration: an anchor with its handles and control
points exposed. Draw handles at `secondary` or lighter than the artwork so they
read as tooling rather than as more drawing, and make anchors hollow (paper fill,
ink ring) so they stay visible sitting on top of an ink curve.

This is one of the rare places where the literal mechanism is also the right
metaphor. It does not generalise — for most topics, literalism is the failure
mode, not the win.
