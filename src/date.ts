/** Format an ISO date (YYYY-MM-DD) as a short human-readable label. */
export function formatDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
