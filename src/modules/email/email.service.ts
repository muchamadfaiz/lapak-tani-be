import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly enabled: boolean;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('email.enabled', false);
    this.from = this.configService.get<string>('email.from', 'noreply@app.com');

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('email.host'),
        port: this.configService.get<number>('email.port'),
        secure: this.configService.get<number>('email.port') === 465,
        auth: {
          user: this.configService.get<string>('email.user'),
          pass: this.configService.get<string>('email.password'),
        },
      });
    }
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    if (!this.enabled) {
      this.logger.warn(
        `[EMAIL DISABLED] Reset URL for ${to}: ${resetUrl}`,
      );
      return;
    }

    await this.transporter!.sendMail({
      from: this.from,
      to,
      subject: 'Reset Password',
      html: `
        <h2>Reset Password</h2>
        <p>Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>
        <p>Klik link berikut untuk reset password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Link ini berlaku selama <strong>30 menit</strong>.</p>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
      `,
    });
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    if (!this.enabled) {
      this.logger.warn(
        `[EMAIL DISABLED] Verification URL for ${to}: ${verificationUrl}`,
      );
      return;
    }

    await this.transporter!.sendMail({
      from: this.from,
      to,
      subject: 'Verify Your Email',
      html: `
        <h2>Email Verification</h2>
        <p>Terima kasih telah mendaftar. Silakan verifikasi email Anda dengan mengklik link berikut:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Link ini berlaku selama <strong>24 jam</strong>.</p>
        <p>Jika Anda tidak mendaftar, abaikan email ini.</p>
      `,
    });
  }
}
