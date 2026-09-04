import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Blokir karakter non-numerik pada input uang/angka.
// type="number" di Chromium masih mengizinkan e/E/+/- (notasi eksponen).
const NON_NUMERIC_KEYS = ['e', 'E', '+', '-'];
export function blockNonNumericKey(e: React.KeyboardEvent<HTMLInputElement>) {
  if (NON_NUMERIC_KEYS.includes(e.key)) e.preventDefault();
}

// Saring tempelan (paste) agar hanya angka desimal valid yang masuk.
export function sanitizeNumericPaste(e: React.ClipboardEvent<HTMLInputElement>) {
  const text = e.clipboardData.getData('text');
  if (!/^\d*\.?\d*$/.test(text)) e.preventDefault();
}
