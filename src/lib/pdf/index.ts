import { jsPDF } from 'jspdf';

export function generateDocumentPDF(content: string, filename: string): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 5;

  let y = margin;
  let currentPage = 1;

  const lines = content.split('\n');

  function checkNewPage(neededHeight: number = lineHeight) {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      currentPage++;
      y = margin;
    }
  }

  for (const line of lines) {
    // Check for section headers (### or **)
    const isMainHeader = line.startsWith('### ') || line.startsWith('## ');
    const isBold = line.startsWith('**') && line.endsWith('**');
    const isSubHeader = line.startsWith('#### ');
    const isEmptyLine = line.trim() === '';
    const isDivider = line.startsWith('---') || line.startsWith('===') || line.startsWith('***');

    if (isDivider) {
      checkNewPage(10);
      y += 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
      continue;
    }

    if (isEmptyLine) {
      y += 3;
      checkNewPage();
      continue;
    }

    if (isMainHeader) {
      checkNewPage(12);
      y += 4;
      const headerText = line.replace(/^#{1,3}\s*/, '').replace(/\*\*/g, '');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      const splitText = doc.splitTextToSize(headerText, maxWidth);
      doc.text(splitText, margin, y);
      y += splitText.length * 6 + 3;
      continue;
    }

    if (isSubHeader) {
      checkNewPage(10);
      y += 2;
      const headerText = line.replace(/^#{1,4}\s*/, '').replace(/\*\*/g, '');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      const splitText = doc.splitTextToSize(headerText, maxWidth);
      doc.text(splitText, margin, y);
      y += splitText.length * 5 + 2;
      continue;
    }

    if (isBold) {
      checkNewPage(8);
      const boldText = line.replace(/\*\*/g, '');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      const splitText = doc.splitTextToSize(boldText, maxWidth);
      doc.text(splitText, margin, y);
      y += splitText.length * 5;
      continue;
    }

    // Regular text
    const cleanLine = line
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/^[-*]\s+/, '• ')
      .replace(/^\d+\.\s+/, (match) => match);

    if (cleanLine.trim()) {
      checkNewPage();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);

      const splitText = doc.splitTextToSize(cleanLine, maxWidth);
      for (const textLine of splitText) {
        checkNewPage();
        doc.text(textLine, margin, y);
        y += lineHeight;
      }
    } else {
      y += 2;
    }
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages} — Generado por JurisNexa.ai`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

export function downloadPDF(content: string, filename: string) {
  const blob = generateDocumentPDF(content, filename);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
