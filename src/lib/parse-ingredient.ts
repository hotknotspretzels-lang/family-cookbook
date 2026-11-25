import { parseQuantity } from "./quantity";

const UNICODE_FRACTIONS: Record<string, string> = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

const UNIT_ALIASES: Record<string, string> = {
  cup: "cup",
  cups: "cup",
  c: "cup",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tbsp: "tbsp",
  tbs: "tbsp",
  tbsps: "tbsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tsp: "tsp",
  tsps: "tsp",
  ounce: "oz",
  ounces: "oz",
  oz: "oz",
  pound: "lb",
  pounds: "lb",
  lb: "lb",
  lbs: "lb",
  gram: "g",
  grams: "g",
  g: "g",
  kilogram: "kg",
  kilograms: "kg",
  kg: "kg",
  milliliter: "ml",
  milliliters: "ml",
  ml: "ml",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  l: "l",
  pinch: "pinch",
  pinches: "pinch",
  clove: "clove",
  cloves: "clove",
  can: "can",
  cans: "can",
  package: "package",
  packages: "package",
  pkg: "package",
  bunch: "bunch",
  bunches: "bunch",
  slice: "slice",
  slices: "slice",
  piece: "piece",
  pieces: "piece",
  quart: "quart",
  quarts: "quart",
  pint: "pint",
  pints: "pint",
  gallon: "gallon",
  gallons: "gallon",
  dash: "dash",
  dashes: "dash",
  handful: "handful",
  handfuls: "handful",
  stick: "stick",
  sticks: "stick",
  sprig: "sprig",
  sprigs: "sprig",
  head: "head",
  heads: "head",
  stalk: "stalk",
  stalks: "stalk",
  ear: "ear",
  ears: "ear",
};

export type ParsedIngredient = {
  quantity: number | null;
  unit: string | null;
  item: string;
};

function normalizeLine(line: string) {
  let text = line.trim().replace(/\s+/g, " ");
  for (const [symbol, ascii] of Object.entries(UNICODE_FRACTIONS)) {
    text = text.replaceAll(symbol, ` ${ascii} `);
  }
  return text.replace(/\s+/g, " ").trim();
}

/** Turn a line like "1 1/2 cups flour" into quantity, unit, and item. */
export function parseIngredientLine(line: string): ParsedIngredient {
  const text = normalizeLine(line);
  if (!text) return { quantity: null, unit: null, item: "" };

  let quantity: number | null = null;
  let rest = text;

  const mixed = text.match(/^(\d+)\s+(\d+\s*\/\s*\d+)\s+(.*)$/);
  const fraction = text.match(/^(\d+\s*\/\s*\d+)\s+(.*)$/);
  const decimal = text.match(/^(\d+(?:\.\d+)?)\s+(.*)$/);

  if (mixed?.[3]) {
    quantity = parseQuantity(`${mixed[1]} ${mixed[2]}`);
    rest = mixed[3];
  } else if (fraction?.[2]) {
    quantity = parseQuantity(fraction[1]);
    rest = fraction[2];
  } else if (decimal?.[2]) {
    quantity = parseQuantity(decimal[1]);
    rest = decimal[2];
  }

  if (quantity == null) {
    return { quantity: null, unit: null, item: text };
  }

  const parts = rest.split(" ");
  const alias = UNIT_ALIASES[parts[0]?.toLowerCase() ?? ""];
  if (alias && parts.length > 1) {
    return { quantity, unit: alias, item: parts.slice(1).join(" ") };
  }
  return { quantity, unit: null, item: rest };
}
