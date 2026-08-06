/**
 * Utility function to trigger CSV file download with UTF-8 Byte Order Mark (\uFEFF)
 * to ensure Microsoft Excel and all spreadsheet software render Vietnamese characters correctly.
 */
export function downloadCsv(filename: string, csvContent: string) {
  // \uFEFF is the UTF-8 Byte Order Mark (BOM)
  const bomPrefix = '\uFEFF';
  const blob = new Blob([bomPrefix + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Escape one CSV field according to RFC 4180. */
export function csvField(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

/** Build a CSV row without corrupting commas, quotes or line breaks. */
export function csvRow(values: unknown[]): string {
  return values.map(csvField).join(',');
}
