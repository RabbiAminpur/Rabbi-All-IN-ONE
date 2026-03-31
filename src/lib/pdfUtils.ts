import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    element.scrollIntoView();
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(element, {
      scale: 2,
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

export function exportDataToPDF(title: string, columns: string[], data: any[][], filename: string) {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  // Add Title
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Primary color #4f46e5
  doc.text(title, 14, 22);

  // Add Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  // Add Table
  autoTable(doc, {
    startY: 35,
    head: [columns],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 10, cellPadding: 5 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`${filename.replace(/\s+/g, '_')}.pdf`);
}
