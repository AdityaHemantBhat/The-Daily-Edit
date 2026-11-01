export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: n >= 10_000 ? 'compact' : 'standard' }).format(n);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function readingTimeLabel(minutes: number): string {
  return minutes === 1 ? '1 min read' : `${minutes} min read`;
}

export function excerpt(text: string | null | undefined, length = 160): string {
  if (!text) return '';
  const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length).trimEnd()}…` : clean;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
