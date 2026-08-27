# Primitives

Every primitive returns the scene, so calls chain. Marks paint in call order —
draw what goes underneath first.

All of them accept the shared stroke options where relevant:

| Option | Default | Notes |
| --- | --- | --- |
| `stroke` | `palette.ink` | |
| `weight` | `'primary'` | `'primary'` \| `'secondary'` \| `'detail'` \| a number |
| `wobble` | `4` | sideways drift in px; 0 mechanical, 3–6 drawn, >10 broken |
| `fill` | `'none'` | |
| `dash` | — | `stroke-dasharray` |
| `opacity` | — | use sparingly; this system gets depth from layering, not alpha |

- [Setup](#setup)
- [Ground](#ground)
- [Line](#line)
- [Relationship](#relationship)
- [Structure](#structure)
- [Figure and interface](#figure-and-interface)
- [Escape hatches](#escape-hatches)
- [Geometry helpers](#geometry-helpers)

## Setup

```ts
createIllustration({
  width?: number       // 1000
  height?: number      // 1000
  seed?: number        // 1 — fixes every random choice
  palette?: Palette    // editorial
  background?: string | false   // false for a transparent canvas
})
```

Returns a scene exposing `width`, `height`, `palette`, `rng`, the primitives, and
`toSVG()`.

Palette helpers: `editorial`, `fields`, `onField(name)`, `fieldForKey(slug)`,
`seedFromKey(slug)`.

## Ground

### `field(color?)`
Flat colour across the whole canvas. Called automatically unless
`background: false`.

### `blob({ x, y, width, height, ... })`
The carrier sheet, or any organic mass.

| Option | Default | Notes |
| --- | --- | --- |
| `form` | `'sheet'` | `'sheet'` = torn rounded rect; `'ellipse'` = soft round mass |
| `roughness` | `.05` sheet / `.08` ellipse | fraction of radius; `.12` clearly torn, `>.25` falls apart |
| `squareness` | `4.2` sheet / `2` ellipse | 2 is a true ellipse; higher flattens sides |
| `samples` | `22` sheet / `14` ellipse | more samples keeps corners from rounding away |
| `fill` | `palette.paper` | |
| `stroke` | none | add one to outline the sheet |

## Line

### `gesture({ points, ... })`
A smooth drawn line through every point you give it. The backbone primitive —
most linework in an editorial illustration is one confident gesture.

```ts
s.gesture({ points: [[214, 616], [368, 402], [604, 622], [788, 398]] })
```

Points are passed through, not approximated: what you write is where the line
goes. Set `closed: true` for a closed loop.

### `polyline({ points, ... })`
Straight segments with light jitter, for anything that should read as built
rather than grown.

### `scribble({ x, y, width, cycles?, amplitude? })`
A short controlled squiggle. For marks of activity — never as filler, because a
mark that says nothing still costs attention.

### `textLines({ x, y, width, lines?, gap? })`
Lines standing in for text, with a ragged right edge like a real paragraph.

### `bracket({ x, y, height, facing?, armLength? })`
Grouping, scope, "everything in here". `facing` is `'left'` (default) or `'right'`.

## Relationship

### `dot(x, y, { radius?, fill? })`
A filled mark, slightly irregular because a drawn dot never is. Default radius 14.

### `node(x, y, { radius?, fill?, ring?, ringGap?, ... })`
A dot, optionally ringed — an anchor, a state, a participant.

Hollow anchor (stays visible on top of an ink curve):

```ts
s.node(x, y, { radius: 15, fill: s.palette.paper, ring: true, ringGap: 3, weight: 'secondary' })
```

### `connector(from, to, { bow?, ... })`
A line between two anchors. A little `bow` keeps a diagram from feeling plotted.

### `arrow({ from, to, bow?, headSize?, ... })`
Curved shaft with a hand-built head. `bow` defaults to 40; negative bends the
other way. The head is drawn as two strokes swept back from the tip, angled off
the direction of *arrival* — SVG markers scale with stroke width and always look
mechanical.

### `cluster({ nodes, edges?, radius?, fill?, bow?, ring?, ... })`
Nodes joined by connectors. `edges` are index pairs. Edges draw first so the dots
sit on top and read as terminals rather than crossings.

```ts
s.cluster({
  nodes: [[280, 620], [460, 400], [660, 560]],
  edges: [[0, 1], [1, 2]],
  radius: 20, bow: 30, ring: [2],
})
```

## Structure

### `panel({ x, y, width, height, bar?, barHeight?, slop?, ... })`
A window or card. `bar: true` adds a title bar divider. `slop` (default 5) is how
far the corners wander.

Reconstruct rather than screenshot — see `grammar.md#ui-as-graphic-material`.

## Figure and interface

### `hand({ x, y, angle?, size?, fingers?, flip?, ... })`
A wrist and a run of looping fingers, ending with the fingertips at `(x, y)`.
`angle` is radians, 0 pointing right. `flip` mirrors it.

A hand entering the frame turns an abstract object into something being used. It
is the cheapest way to add agency to a still composition.

Three details do the work, if you ever need to rebuild it: fingertips are sampled
arcs (four corner points smooth into a square wave, which looks like a comb), the
fingers vary in length, and they fan a few degrees around a pivot below the palm.

### `cursor(x, y, { size?, angle?, fill?, ... })`
A pointer. Reads instantly as software without drawing a whole interface.

### `codeMark(x, y, { size?, ... })`
The `</>` mark. Says "code" in two strokes and a slash.

## Escape hatches

### `path(d, opts?)`
Your own path data with the standard stroke handling.

### `raw(element)`
An arbitrary SVG element string.

Reach for these last. If you find yourself using `path` repeatedly for the same
shape, add a primitive instead — the vocabulary is the point.

## Geometry helpers

Exported for building new primitives:

| | |
| --- | --- |
| `curveThrough(points, closed?, tension?)` | fit a smooth curve through every point → `d` |
| `lineThrough(points, closed?)` | straight polyline → `d` |
| `sampleSpline(points, closed?, perSegment?)` | densify *along the curve* — use before wobbling |
| `resample(points, perSegment?)` | densify along straight chords — only where corners must stay |
| `wobble(points, rng, amount)` | perpendicular drift, tapered so endpoints stay put |
| `blobPoints(cx, cy, w, h, rng, roughness?, samples?, squareness?)` | irregular closed shape |
| `roughRectPoints(x, y, w, h, rng, slop?)` | hand-drawn rectangle |
| `rotate` / `lerp` / `dist` / `direction` | vector maths |
| `createRng(seed)` | `next`, `range`, `jitter`, `pick`, `chance` |
| `createNoise(rng, harmonics?)` | smooth 1D drift |
| `createLoopNoise(rng, harmonics?)` | smooth drift that wraps seamlessly — for closed shapes |

Use `createLoopNoise` for anything closed. Non-wrapping noise leaves a visible
seam where the outline meets itself.
