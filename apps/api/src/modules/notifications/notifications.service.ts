import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { EnvConfig } from '@/config';
import { generateTicketPdf, TicketData } from './pdf/ticket-generator';

export interface ReservationEmailData {
  userName: string;
  userEmail: string;
  seatNumber: number;
  bookingId: string;
  transactionNo: string;
  amount: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;
  private emailTemplate: string;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get('SMTP_PORT'),
      secure: this.config.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });

    this.emailTemplate = fs.readFileSync(
      path.join(__dirname, 'templates', 'reservation-confirmed.html'),
      'utf-8',
    );
  }

  async sendReservationConfirmation(data: ReservationEmailData): Promise<void> {
    try {
      const confirmedAt = new Date().toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      // Render HTML template
      const html = this.renderTemplate({
        ...data,
        confirmedAt,
        amount: Number(data.amount).toLocaleString(),
      });

      // Generate PDF ticket in-memory
      const ticketData: TicketData = {
        ...data,
        confirmedAt,
      };
      const pdfBuffer = await generateTicketPdf(ticketData);

      // Send email with attachment
      const fromName = this.config.get('SMTP_FROM_NAME');
      const fromEmail = this.config.get('SMTP_FROM_EMAIL');

      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: data.userEmail,
        subject: `Reservation Confirmed — Seat #${data.seatNumber}`,
        html,
        attachments: [
          {
            filename: `ticket-seat-${data.seatNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      this.logger.log(
        `Confirmation email sent to ${data.userEmail} for booking ${data.bookingId}`,
      );
    } catch (error) {
      // Non-blocking: log the error but don't throw
      this.logger.error(
        `Failed to send confirmation email to ${data.userEmail}: ${error.message}`,
        error.stack,
      );
    }
  }

  private renderTemplate(vars: Record<string, string | number>): string {
    let html = this.emailTemplate;
    for (const [key, value] of Object.entries(vars)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return html;
  }
}
