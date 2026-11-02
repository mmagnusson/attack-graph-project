// ─── CSV & file download helpers ─────────────────────────────────────────────

/** Prevent CSV formula injection by prefixing cells that a spreadsheet would evaluate */
export function sanitizeCSVCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) return "'" + value;
  return value;
}

/** One CSV row: strings are sanitized and quoted; numbers pass through */
export function csvRow(cells: (string | number)[]): string {
  return cells.map(c => typeof c === 'number' ? String(c) : '"' + sanitizeCSVCell(c).replace(/"/g, '""') + '"').join(',') + '\n';
}

export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const today = () => new Date().toISOString().split('T')[0];
