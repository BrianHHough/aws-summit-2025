import { PDFDocument } from 'pdf-lib';

/**
 * Accurately gets the number of pages in a PDF using pdf-lib
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  return pdfDoc.getPageCount();
}
