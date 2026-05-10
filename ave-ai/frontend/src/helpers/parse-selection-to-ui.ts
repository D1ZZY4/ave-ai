/**
 * parse-selection-to-ui — converts a raw list selection (index or label string)
 * back to a structured payload for displaying the user's choice in the chat.
 */

export interface SelectionPayload {
  selectedIndex: number;
  selectedLabel: string;
  raw: string;
}

/**
 * Parse a user selection (either a number like "2" or a label string)
 * against a list of available options to produce a SelectionPayload.
 */
export function parseSelectionToUi(
  raw: string,
  options: { index: number; label: string }[]
): SelectionPayload | null {
  const trimmed = raw.trim();
  if (!trimmed || options.length === 0) return null;

  const asNumber = parseInt(trimmed, 10);
  if (!isNaN(asNumber)) {
    const match = options.find((o) => o.index === asNumber);
    if (match) {
      return { selectedIndex: match.index, selectedLabel: match.label, raw };
    }
  }

  const lowerRaw = trimmed.toLowerCase();
  const labelMatch = options.find((o) =>
    o.label.toLowerCase().startsWith(lowerRaw) ||
    lowerRaw.startsWith(o.label.toLowerCase())
  );
  if (labelMatch) {
    return { selectedIndex: labelMatch.index, selectedLabel: labelMatch.label, raw };
  }

  return null;
}
