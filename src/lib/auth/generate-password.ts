const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*?";

function randomChar(alphabet: string): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return alphabet[values[0]! % alphabet.length]!;
}

function shuffle(chars: string[]): string {
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const j = values[0]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

/** Generates a password with upper, lower, digit, and symbol characters. */
export function generatePassword(length = 12): string {
  const size = Math.max(length, 8);
  const required = [
    randomChar(LOWER),
    randomChar(UPPER),
    randomChar(DIGITS),
    randomChar(SYMBOLS),
  ];
  const alphabet = LOWER + UPPER + DIGITS + SYMBOLS;
  const rest = Array.from({ length: size - required.length }, () =>
    randomChar(alphabet),
  );
  return shuffle([...required, ...rest]);
}
