import * as PDFDocument from 'pdfkit';

export interface TicketData {
  userName: string;
  userEmail: string;
  seatNumber: number;
  bookingId: string;
  transactionNo: string;
  amount: string;
  confirmedAt: string;
}

export function generateTicketPdf(data: TicketData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [400, 600],
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = 400;
    const contentWidth = pageWidth - 80;

    // --- Header ---
    doc
      .rect(0, 0, pageWidth, 100)
      .fill('#2563eb');

    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('RESERVATION TICKET', 40, 38, { width: contentWidth, align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#bfdbfe')
      .text('Seat Reservation System', 40, 66, { width: contentWidth, align: 'center' });

    // --- Seat Number (large, prominent) ---
    doc
      .fillColor('#1e293b')
      .fontSize(12)
      .font('Helvetica')
      .text('SEAT', 40, 120, { width: contentWidth, align: 'center' });

    doc
      .fontSize(48)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text(`#${data.seatNumber}`, 40, 138, { width: contentWidth, align: 'center' });

    // --- Divider ---
    const dividerY = 200;
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(40, dividerY)
      .lineTo(pageWidth - 40, dividerY)
      .dash(4, { space: 4 })
      .stroke()
      .undash();

    // --- Details ---
    const detailsStartY = 220;
    const lineHeight = 32;
    const labels = [
      ['Passenger', data.userName],
      ['Email', data.userEmail],
      ['Booking ID', data.bookingId.slice(0, 8).toUpperCase()],
      ['Transaction', data.transactionNo],
      ['Amount', `${Number(data.amount).toLocaleString()} VND`],
      ['Date', data.confirmedAt],
    ];

    labels.forEach(([label, value], i) => {
      const y = detailsStartY + i * lineHeight;
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(label, 40, y);
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text(value, 40, y + 12, { width: contentWidth });
    });

    // --- Footer divider ---
    const footerDividerY = detailsStartY + labels.length * lineHeight + 20;
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(40, footerDividerY)
      .lineTo(pageWidth - 40, footerDividerY)
      .stroke();

    // --- Footer note ---
    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor('#6b7280')
      .text(
        'Present this ticket at the venue. This ticket is non-transferable.',
        40,
        footerDividerY + 16,
        { width: contentWidth, align: 'center' },
      );

    // --- Border ---
    doc
      .strokeColor('#2563eb')
      .lineWidth(2)
      .roundedRect(10, 10, pageWidth - 20, 580, 8)
      .stroke();

    doc.end();
  });
}
