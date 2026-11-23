// Split on figures, keeping them: a capture group in split puts each figure at an odd index.
const FIGURES = /(\$?\d+(?:,\d{3})*(?:\.\d+)?%?)/;

// DESIGN.md's Mono Means Measured rule for a finished text: its figures in Plex Mono, its words in the surrounding font.
// A text can mark its figures instead, when digits in its words (a date, a year's name) must stay in the sans.
export function Measured({ text, figures = FIGURES }: { text: string; figures?: RegExp }) {
  return text.split(figures).map((part, i) => (i % 2 ? <span key={i} className="font-mono">{part}</span> : part || null));
}
