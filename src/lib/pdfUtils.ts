import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    // Ensure the element is visible and scrolled into view for better capture
    element.scrollIntoView();
    
    // Small delay to ensure any transitions or font rendering are complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = imgProps.width / imgProps.height;
    const renderWidth = pdfWidth;
    const renderHeight = renderWidth / ratio;
    
    // If content is longer than one page, add more pages
    let heightLeft = renderHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, renderWidth, renderHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - renderHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, renderWidth, renderHeight);
      heightLeft -= pdfHeight;
    }
    
    pdf.save(`${filename.replace(/\s+/g, '_')}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    alert('PDF তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    return false;
  }
}
