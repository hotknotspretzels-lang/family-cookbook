import { formatQuantity, parseQuantity } from "../src/lib/quantity.ts";

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

assertEqual(formatQuantity(0.5), "1/2", "half");
assertEqual(formatQuantity(0.25), "1/4", "quarter");
assertEqual(formatQuantity(1 / 3), "1/3", "third");
assertEqual(formatQuantity(2 / 3), "2/3", "two thirds");
assertEqual(formatQuantity(0.75), "3/4", "three quarters");
assertEqual(formatQuantity(0.125), "1/8", "eighth");
assertEqual(formatQuantity(1.5), "1 1/2", "one and a half");
assertEqual(formatQuantity(2), "2", "two");
assertEqual(formatQuantity(8), "8", "eight");
assertEqual(parseQuantity("1 1/2"), 1.5, "parse mixed");

console.log("quantity checks passed");
