import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea una fecha ISO al estilo "19 de febrero 2026 · 15h49"
 * Usa locale es-EC (Ecuador). Acepta string ISO o Date.
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  const month = d.toLocaleDateString('es-EC', { month: 'long' });
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} de ${month} ${year} · ${hours}h${minutes}`;
}

/**
 * Formatea solo la fecha sin hora: "19 de febrero 2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  const month = d.toLocaleDateString('es-EC', { month: 'long' });
  const year = d.getFullYear();
  return `${day} de ${month} ${year}`;
}
