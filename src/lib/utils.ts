import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate un nombre avec des séparateurs de milliers de façon déterministe
 * (espace insécable), identique côté serveur et client.
 * Évite les erreurs d'hydratation de `Number.toLocaleString()` (locale variable).
 */
export function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
