import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Captures a DOM element as an image and saves it into a PDF Blob.
 * 
 * @param elementId - The ID of the HTML element to capture.
 * @param fileName - The desired name of the file (without extension).
 * @returns A Promise that resolves to a Blob representing the PDF.
 */
export const generatePDFBlob = async (
  elementId: string,
  fileName: string,
): Promise<Blob> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID "${elementId}" not found.`);
  }

  // Use a higher scale for better quality
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    allowTaint: true,
  });

  const imgData = canvas.toDataURL("image/png");
  
  // Calculate dimensions to fit the PDF page
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  const pdf = new jsPDF("p", "mm", "a4");
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Add extra pages if the content is longer than one page
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf.output("blob");
};
