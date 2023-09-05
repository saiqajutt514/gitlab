export function calculatePercentage(value: number, total: number) {
  return roundupDecimals((value / total) * 100);
}
export function roundupDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
