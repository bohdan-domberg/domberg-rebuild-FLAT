/**
 * Merges real PDF page content (not rasterized) from multiple sources into
 * one PDF, in order. Each source is either a File (from a file input — used
 * for the quote PDF the user just printed) or a stored attachment URL
 * (fetched here). Returns a Blob ready to download.
 *
 * pdf-lib is dynamically imported so it's only downloaded when someone
 * actually uses the merge feature, instead of bloating the main bundle.
 */
export async function mergePdfs(sources) {
  const { PDFDocument } = await import('pdf-lib');
  const merged = await PDFDocument.create();

  for (const source of sources) {
    const bytes = source instanceof File ? await source.arrayBuffer() : await (await fetch(source.url)).arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const mergedBytes = await merged.save();
  return new Blob([mergedBytes], { type: 'application/pdf' });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
