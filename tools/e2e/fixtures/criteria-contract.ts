export function cardAtDepth(hashes: string): string {
  return [
    "---",
    "id: T-900",
    "title: A fixture card",
    "---",
    "",
    "The summary paragraph.",
    "",
    `${hashes} Acceptance criteria`,
    "",
    "- WHEN a card is read THE reader SHALL find this criterion.",
    "- WHEN it is read again THE reader SHALL find the second one too.",
    "",
    "## Implementation notes",
    "",
    "- this bullet is below the section and belongs to neither reader",
    "",
  ].join("\n");
}
