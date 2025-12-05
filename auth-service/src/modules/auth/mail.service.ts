import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get<number>('SMTP_PORT', 2525)),
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const from = this.config.get<string>('EMAIL_FROM')!;
    try {
      const info = await this.transporter.sendMail({ from, to, subject, html });
      console.log(`📨 Email sent to ${to}. messageId=${info.messageId}`);
    } catch (err) {
      console.error('Failed to send email:', err);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}