/**
 * Utility function to get the page count from a PDF file
 */
export async function getPdfPageCount(file: File): Promise<number> {
  return new Promise((resolve) => {
    // Create a FileReader to read the PDF file
    const reader = new FileReader();
    
    reader.onload = function(event) {
      if (!event.target?.result) {
        resolve(0);
        return;
      }
      
      const data = new Uint8Array(event.target.result as ArrayBuffer);
      
      // PDF format: Check for the header and trailer to estimate pages
      // This is a simplified approach that looks for "/Page" objects
      // which typically correspond to pages in a PDF
      const content = new TextDecoder().decode(data.slice(0, Math.min(data.length, 5000)));
      
      // Count occurrences of "/Type /Page" which typically indicates a page in the PDF
      const pageMatches = content.match(/\/Type\s*\/Page/g);
      const pageCount = pageMatches ? pageMatches.length : 1;
      
      resolve(Math.max(1, pageCount)); // Ensure at least 1 page
    };
    
    reader.onerror = function() {
      console.error("Error reading PDF file");
      resolve(1); // Default to 1 page on error
    };
    
    // Read the file as an ArrayBuffer
    reader.readAsArrayBuffer(file);
  });
}