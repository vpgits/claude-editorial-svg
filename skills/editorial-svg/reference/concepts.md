# Concepts, failure modes, and the quality bar

The drawing is the easy part. This file is about the decision that happens first.

- [The mental model](#the-mental-model)
- [Finding the abstraction](#finding-the-abstraction)
- [Grammars](#grammars)
- [A vocabulary of transformations](#a-vocabulary-of-transformations)
- [Failure modes](#failure-modes)
- [The quality bar](#the-quality-bar)
- [When not to use this system](#when-not-to-use-this-system)

## The mental model

```
article → concept → visual metaphor → composition → primitives → SVG paths
```

Never start from *"make a cool image"*. The strength comes from reducing the
article to a small visual system before drawing anything.

## Finding the abstraction

Pull four things out of the piece:

1. the central claim
2. the strongest visual noun
3. the relationship between things
4. the transformation happening to them

Then draw **3 or 4**, not 2. Nouns are where illustration goes to die: an article
about AI agents is not about robots, it is about coordination, so the drawing
should be a handoff chain. Prefer relationships, transformations, and mechanisms.

A useful test: could this same image sit on top of a different article in the
same field? If yes, it is illustrating the topic rather than the argument, and it
will read as stock art.

## Grammars

Pick one and commit. Mixing grammars in a single piece is a reliable way to make
it feel cluttered.

| Grammar | Use when | Reaches for |
| --- | --- | --- |
| **object** | the piece is about a thing or a process | `blob`, `hand`, `panel`, `arrow` |
| **diagram** | the piece is about structure or flow | `cluster`, `connector`, `arrow`, `node` |
| **UI** | the piece is about software behaviour | `panel`, `cursor`, `textLines` |
| **code** | the piece is about authoring or tooling | `codeMark`, `bracket`, exposed handles |
| **data** | the piece is about a measurement or trend | `gesture`, `dot`, `bracket` |

## A vocabulary of transformations

When stuck, reach for one of these shapes — most editorial arguments are one of
them wearing a costume:

| Shape | Reads as | Drawn with |
| --- | --- | --- |
| chain that weakens | loss, decay, telephone | shrinking nodes, thinning arrows |
| crowd meeting a constriction | limits, throttling, selection | many dots, a funnel, one through |
| stack with one lifted | versions, drafts, choice | offset panels, one foregrounded |
| two things converging | merge, agreement, sync | two gestures meeting at a node |
| one thing splitting | fan-out, forking, broadcast | one gesture, several arrows |
| a loop that returns | iteration, feedback, retry | a closed gesture with one arrow |
| exposed internals | editability, transparency | anchors and handles on a curve |
| something held | agency, use, control | `hand` plus the object |

These compose. "Retry with backoff" is a loop that returns, with each pass thinner
than the last.

## Failure modes

**Too literal.** Robot for AI, lightbulb for ideas, handshake for partnership. If
the first image that arrives is a noun from the headline, discard it and ask what
*happens* in the article.

**Too many elements.** If it reads as an infographic, cut until it does not. The
constraint is 7 major objects, and most good pieces use 4.

**Perfect geometry everywhere.** Exact circles, equal spacing, and true rectangles
make the work sterile. Use `blob` and `dot` rather than `<circle>`, and let
precision be a deliberate contrast rather than the default.

**Fake randomness.** Jittering every coordinate is not the same as drawing by
hand. Imperfection should be smooth and low-frequency — a hand drifts and
corrects slowly. Per-point noise reads as damage.

**Too many colours.** One field, one paper, one ink, one accent. A second accent
is almost always a sign the composition is not resolved.

**Text dependency.** The title already sits next to the thumbnail. An image that
needs a word to work is not working.

**Decorative noise.** Marks that do not communicate still cost attention and still
have to survive at 64px. Delete them.

**Thin-line drift.** A composition tuned at full size and built at `detail` weight
disappears at 160px. Check small before you commit to a weight.

## The quality bar

A finished illustration should be all of these:

- understandable without detailed inspection
- recognisable at 160×160, and still a shape at 64×64
- editable as plain SVG in Figma or Illustrator
- deterministic — same seed, same bytes
- visually sparse
- conceptually tied to the article, not the topic
- no more detailed than necessary
- composed on purpose rather than centred by default
- original, not a copy of a reference style

If a piece fails one of these, it is usually the concept, not the code.

## When not to use this system

This is a flat vector system. It is the right choice for deterministic output,
clean vector editing, browser-native assets, git diffs, geometric compositions,
UI diagrams, and symbolic illustration.

It is the wrong choice when the visual language genuinely depends on texture —
pencil grain, dry brush, ink bleed, dense hatching, scatter, painterly marks,
procedural fields. Those want a raster or brush-based tool, and faking them with
SVG filters fights everything else here.

Most blog thumbnails belong on the vector branch.
