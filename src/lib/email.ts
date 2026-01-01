import nodemailer from 'nodemailer';
import { logger } from './logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@encurtador.com';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: 'Recuperação de Senha',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Recuperação de Senha</h2>
          <p>Você solicitou a recuperação de senha da sua conta.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Redefinir Senha
          </a>
          <p style="color: #666; font-size: 14px;">Este link expira em 1 hora.</p>
          <p style="color: #666; font-size: 14px;">Se você não solicitou esta recuperação, ignore este email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: 'Bem-vindo ao Encurtador!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Bem-vindo, ${name}!</h2>
          <p>Sua conta foi criada com sucesso.</p>
          <p>Agora você pode começar a encurtar seus links e acompanhar as estatísticas.</p>
          <a href="${APP_URL}/dashboard" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Acessar Dashboard
          </a>
        </div>
      `,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
    return false;
  }
}
