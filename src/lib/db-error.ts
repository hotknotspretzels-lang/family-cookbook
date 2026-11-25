const KNOWN = [
  "Add your name",
  "Add a title",
  "The title is too long",
  "Who it is from is too long",
  "The story is too long",
  "Servings has to be at least 1",
  "Prep time looks off",
  "Cook time looks off",
  "Pick a category",
  "That is a lot of ingredient lines",
  "That is a lot of steps",
  "Photo path looks wrong",
  "Add at least one ingredient",
  "Add at least one step",
  "Check the ingredient amounts",
  "Original recipe not found",
  "That recipe is in the bin. Restore it before adding a twist.",
  "A variation has to be on the original recipe",
  "This recipe already has variations",
  "A recipe cannot be a variation of itself",
  "Recipe not found",
  "That version could not be read",
  "That recipe has been in the bin more than 30 days",
];

export function friendlyDbError(message: string) {
  for (const item of KNOWN) {
    if (message.includes(item)) return item.endsWith(".") ? item : `${item}.`;
  }
  console.error(message);
  return "That did not save. Try again in a moment.";
}
