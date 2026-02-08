/**
 * Human-readable room name generator
 * Converts UUIDs to memorable adjective-noun-number combinations
 *
 * Example: "85b04f95-973e-492d-a106-3017ba51a5ab" → "swift-falcon-42"
 */

const adjectives = [
  "swift", "brave", "calm", "bright", "clever",
  "cosmic", "cyber", "digital", "epic", "fast",
  "golden", "happy", "iron", "jade", "keen",
  "lunar", "magic", "noble", "polar", "quantum",
  "rapid", "royal", "silver", "solar", "stellar",
  "super", "thunder", "turbo", "ultra", "vivid",
  "wild", "zen", "alpha", "beta", "gamma",
];

const nouns = [
  "falcon", "tiger", "phoenix", "dragon", "wolf",
  "eagle", "panther", "hawk", "lion", "bear",
  "fox", "raven", "cobra", "shark", "puma",
  "viper", "lynx", "jaguar", "raptor", "storm",
  "blaze", "frost", "spark", "wave", "cloud",
  "comet", "nova", "pulse", "surge", "flash",
  "bolt", "cipher", "nexus", "prism", "vertex",
];

/**
 * Convert UUID to human-readable room name
 * Uses first 8 chars of UUID as seed for deterministic output
 */
export function generateRoomName(uuid: string): string {
  // Use first segment of UUID as seed
  const seed = parseInt(uuid.slice(0, 8), 16);

  const adjIndex = seed % adjectives.length;
  const nounIndex = Math.floor(seed / adjectives.length) % nouns.length;
  const number = (seed % 99) + 1; // 1-99

  return `${adjectives[adjIndex]}-${nouns[nounIndex]}-${number}`;
}

/**
 * Get short display version of room ID
 * Shows human-readable name with truncated UUID for reference
 */
export function formatRoomId(uuid: string): { name: string; shortId: string } {
  return {
    name: generateRoomName(uuid),
    shortId: uuid.slice(0, 8),
  };
}
