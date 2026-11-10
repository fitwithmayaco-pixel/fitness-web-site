// ============================================================
//  PDF.js helpers – render pages to canvas / data-URL
// ============================================================
import * as pdfjsLib from "pdfjs-dist";

// Point PDF.js worker to the bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

/**
 * Load a PDF from an ArrayBuffer or a remote URL string.
 * Returns { pdf: PDFDocumentProxy, destroy: fn }
 * Call destroy() when done to free memory.
 */
export async function loadPDF(source) {
  let param;
  if (typeof source === "string") {
    param = { url: source };
  } else if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
    param = { data: source };
  } else {
    param = source;
  }
  const loadingTask = pdfjsLib.getDocument(param);
  const pdf = await loadingTask.promise;
  // Attach a safe cleanup helper so callers don't need to track the task
  pdf._destroy = () => loadingTask.destroy().catch(() => {});
  return pdf;
}

/**
 * Render one page of a PDFDocumentProxy to an offscreen canvas
 * and return a data-URL (PNG).
 * @param {pdfjsLib.PDFDocumentProxy} pdf
 * @param {number} pageNumber  1-based
 * @param {number} scale       default 1.5
 */
export async function renderPageToDataURL(pdf, pageNumber, scale = 1.5) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png");
}

/**
 * Render one page to a reusable offscreen canvas element.
 * Returns the canvas (do NOT call toDataURL on large PDFs in a loop).
 */
export async function renderPageToCanvas(pdf, pageNumber, scale = 1.5) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");

  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

/** Extract page count from an ArrayBuffer without keeping the doc in memory. */
export async function getPDFPageCount(arrayBuffer) {
  const pdf = await loadPDF(arrayBuffer);
  const count = pdf.numPages;
  pdf._destroy();
  return count;
}

/** Generate a cover thumbnail (data-URL) from page 1 of an ArrayBuffer. */
export async function generateCover(arrayBuffer, scale = 0.6) {
  const pdf = await loadPDF(arrayBuffer.slice(0));
  const dataURL = await renderPageToDataURL(pdf, 1, scale);
  pdf._destroy();
  return dataURL;
}
