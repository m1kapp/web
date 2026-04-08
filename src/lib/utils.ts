import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
export function nanoid(size: number = 8): string {
  const bytes = randomBytes(size);
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join("");
}
