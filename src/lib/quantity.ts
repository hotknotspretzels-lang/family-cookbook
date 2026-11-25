const SNAPS = [
  { n: 0, label: "" },
  { n: 0.125, label: "1/8" },
  { n: 0.25, label: "1/4" },
  { n: 1 / 3, label: "1/3" },
  { n: 0.5, label: "1/2" },
  { n: 2 / 3, label: "2/3" },
  { n: 0.75, label: "3/4" },
  { n: 1, label: "1" },
];

function trimNumber(value: number) {
  return String(Math.round(value * 100) / 100).replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1");
}

/** Friendly kitchen amounts: mixed numbers and common fractions, otherwise a short decimal. */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return value === 0 ? "0" : "";
  if (value >= 40) return String(Math.round(value));

  const whole = Math.floor(value + 1e-8);
  const frac = value - whole;
  let best = SNAPS[0];
  let dist = Infinity;
  for (const snap of SNAPS) {
    const d = Math.abs(frac - snap.n);
    if (d < dist) {
      dist = d;
      best = snap;
    }
  }

  if (dist > 0.04) {
    if (value >= 10) {
      const half = Math.round(value * 2) / 2;
      return Number.isInteger(half) ? String(half) : trimNumber(half);
    }
    return trimNumber(Math.round(value * 100) / 100);
  }

  let nextWhole = whole;
  let label = best.label;
  if (best.n === 1) {
    nextWhole += 1;
    label = "";
  }
  if (!label) {
    if (nextWhole === 0) return trimNumber(value);
    return String(nextWhole);
  }
  if (nextWhole === 0) return label;
  return `${nextWhole} ${label}`;
}

export function parseQuantity(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;
  const mixed = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const den = Number(mixed[3]);
    if (!den) return null;
    return Number(mixed[1]) + Number(mixed[2]) / den;
  }
  const fraction = text.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const den = Number(fraction[2]);
    if (!den) return null;
    return Number(fraction[1]) / den;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

const UNIT_FORMS: Record<string, { one: string; many: string }> = {
  cup: { one: "cup", many: "cups" },
  tbsp: { one: "tbsp", many: "tbsp" },
  tsp: { one: "tsp", many: "tsp" },
  oz: { one: "oz", many: "oz" },
  lb: { one: "lb", many: "lb" },
  g: { one: "g", many: "g" },
  kg: { one: "kg", many: "kg" },
  ml: { one: "ml", many: "ml" },
  l: { one: "l", many: "l" },
  pinch: { one: "pinch", many: "pinches" },
  clove: { one: "clove", many: "cloves" },
  can: { one: "can", many: "cans" },
  package: { one: "package", many: "packages" },
  bunch: { one: "bunch", many: "bunches" },
  slice: { one: "slice", many: "slices" },
  piece: { one: "piece", many: "pieces" },
  quart: { one: "quart", many: "quarts" },
  pint: { one: "pint", many: "pints" },
  gallon: { one: "gallon", many: "gallons" },
  dash: { one: "dash", many: "dashes" },
  handful: { one: "handful", many: "handfuls" },
  stick: { one: "stick", many: "sticks" },
  sprig: { one: "sprig", many: "sprigs" },
  head: { one: "head", many: "heads" },
  stalk: { one: "stalk", many: "stalks" },
  ear: { one: "ear", many: "ears" },
};

export function unitLabel(unit: string | null | undefined, quantity: number | null) {
  if (!unit) return null;
  const forms = UNIT_FORMS[unit];
  if (!forms) return unit;
  return quantity != null && quantity > 1 ? forms.many : forms.one;
}
