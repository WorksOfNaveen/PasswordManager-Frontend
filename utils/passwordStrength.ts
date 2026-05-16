/** Returns 0–1 from length and character-class variety (no network). */
export function passwordStrength01(pw: string): number {
  if (pw.length === 0) {
    return 0;
  }
  let score = 0;
  const len = pw.length;
  score += Math.min(len / 14, 1) * 0.35;
  const classes = [
    /[a-z]/.test(pw),
    /[A-Z]/.test(pw),
    /\d/.test(pw),
    /[^a-zA-Z0-9]/.test(pw),
  ].filter(Boolean).length;
  score += (classes / 4) * 0.45;
  if (len >= 8) {
    score += 0.1;
  }
  if (len >= 12) {
    score += 0.1;
  }
  return Math.min(1, score);
}
