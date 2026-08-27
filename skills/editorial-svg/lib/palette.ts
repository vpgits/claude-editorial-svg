/**
 * Palettes.
 *
 * Four roles, no more. The discipline is the point: one field, one paper, one
 * ink, one accent. When every element carries its own colour the composition
 * stops having a subject.
 */

export type Palette = {
  /** Flat colour filling the whole canvas. */
  bg: string
  /** The carrier — the sheet the drawing sits on. Near-white, slightly warm. */
  paper: string
  /** Linework. Near-black, never pure #000 — pure black reads as printer output. */
  ink: string
  /** Used once or twice per illustration. Its scarcity is what makes it register. */
  accent: string
}

/** The default editorial system: dusty green field, ivory paper, warm red accent. */
export const editorial: Palette = {
  bg: '#B8C9C2',
  paper: '#FAF9F5',
  ink: '#171715',
  accent: '#E06E52',
}

/**
 * Field colours that all sit correctly under ivory paper and near-black ink.
 * Swapping only `bg` across a run of posts gives a series that feels related
 * without any two thumbnails looking like duplicates.
 */
export const fields = {
  sage: '#B8C9C2',
  clay: '#CE9B84',
  sand: '#E2D6BE',
  sky: '#AFC2D1',
  ochre: '#D9B872',
  mist: '#CFCFC6',
  rose: '#D9B3AC',
  slate: '#9FA8A3',
  /**
   * Dark field. Near-black ink disappears on it, so put every mark on the paper
   * carrier, or build the palette with ink and paper swapped.
   */
  charcoal: '#3A3A36',
} as const

export type FieldName = keyof typeof fields

/** Build a palette on a named field, keeping the rest of the system fixed. */
export function onField(name: FieldName, base: Palette = editorial): Palette {
  return { ...base, bg: fields[name] }
}

/**
 * Rotate through fields deterministically from any string (a post slug).
 *
 * A series of posts then gets varied but stable backgrounds: the same slug always
 * produces the same field, so regenerating never reshuffles the archive page.
 */
export function fieldForKey(key: string): FieldName {
  const names = Object.keys(fields) as FieldName[];
  // Exclude charcoal from automatic selection — it needs a deliberately
  // different ink strategy, so it should only ever be chosen on purpose.
  const usable = names.filter((n) => n !== 'charcoal')
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return usable[Math.abs(h) % usable.length]
}

/** Derive a numeric seed from a string, so a slug can drive the whole drawing. */
export function seedFromKey(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) >>> 0
}
