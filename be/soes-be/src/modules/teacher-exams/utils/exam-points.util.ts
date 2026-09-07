export function toPointCents(points: number): number {
  return Math.round((Number.isFinite(points) ? points : 0) * 100);
}

export function fromPointCents(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

export function normalizePoint(points: number): number {
  return fromPointCents(Math.max(0, toPointCents(points)));
}

export function sumPointCents(points: number[]): number {
  return points.reduce((sum, point) => sum + toPointCents(point), 0);
}

export function arePointTotalsEqual(left: number, right: number): boolean {
  return toPointCents(left) === toPointCents(right);
}

export function hasAtMostTwoDecimalPlaces(points: number): boolean {
  return Number.isFinite(points) && Math.abs(points * 100 - Math.round(points * 100)) < 1e-9;
}
