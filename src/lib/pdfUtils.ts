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

export async function exportDataToPDF(title: string, columns: string[], data: any[][], filename: string, lang: 'bn' | 'en' = 'en') {
  // Create a temporary container for A4 export
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '210mm'; // A4 width
  container.style.padding = '20mm';
  container.style.zIndex = '-1000';
  container.style.opacity = '0';
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.fontFamily = lang === 'bn' ? '"Hind Siliguri", sans-serif' : 'sans-serif';
  container.style.lineHeight = '1.5';

  // Add Title
  const titleEl = document.createElement('h1');
  titleEl.innerText = title;
  titleEl.style.color = '#4f46e5';
  titleEl.style.fontSize = '24px';
  titleEl.style.marginBottom = '10px';
  titleEl.style.textAlign = 'center';
  container.appendChild(titleEl);

  // Add Date
  const dateEl = document.createElement('p');
  dateEl.innerText = `${lang === 'bn' ? 'তারিখ:' : 'Date:'} ${new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}`;
  dateEl.style.color = '#666';
  dateEl.style.fontSize = '12px';
  dateEl.style.marginBottom = '20px';
  dateEl.style.textAlign = 'center';
  container.appendChild(dateEl);

  // Add Table
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.marginTop = '20px';

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.backgroundColor = '#4f46e5';
  headerRow.style.color = 'white';
  
  columns.forEach(col => {
    const th = document.createElement('th');
    th.innerText = col;
    th.style.padding = '12px';
    th.style.textAlign = 'left';
    th.style.border = '1px solid #e2e8f0';
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    
    row.forEach(cell => {
      const td = document.createElement('td');
      td.innerText = cell;
      td.style.padding = '10px';
      td.style.border = '1px solid #e2e8f0';
      td.style.fontSize = '12px';
      td.style.whiteSpace = 'pre-wrap';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  document.body.appendChild(container);
  
  try {
    // Wait for fonts to be ready
    await document.fonts.ready;
    // Small delay to ensure rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
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
  } catch (error) {
    console.error('PDF Export Error:', error);
  } finally {
    document.body.removeChild(container);
  }
}
