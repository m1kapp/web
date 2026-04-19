const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SLUG_OFFSET = 1000;

export function appHost(): string {
  return process.env.NEXT_PUBLIC_HOST || "m1k.app";
}

export function idToSlug(id: number): string {
  let n = id + SLUG_OFFSET;
  if (n === 0) return BASE62[0];
  let result = "";
  while (n > 0) {
    result = BASE62[n % 62] + result;
    n = Math.floor(n / 62);
  }
  return result;
}
