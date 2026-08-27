export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Email templates
export const emailTemplates = {
  welcome: (name: string): EmailOptions => ({
    to: '',
    subject: 'Bienvenido a JurisNexa.ai',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 32px; }
          .logo { font-size: 24px; font-weight: bold; }
          .logo span { color: #10b981; }
          .content { background: #18181b; border-radius: 12px; padding: 32px; border: 1px solid #27272a; }
          .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 16px 0; }
          .footer { text-align: center; margin-top: 32px; color: #71717a; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Juris<span>Nexa</span>.ai</div>
          </div>
          <div class="content">
            <h1 style="margin:0 0 16px;font-size:24px;">¡Bienvenido, ${name}! 👋</h1>
            <p style="color:#a1a1aa;margin:0 0 16px;">
              Gracias por registrarte en JurisNexa.ai. Ya puedes comenzar a hacer consultas legales
              inteligentes sobre legislación de Perú y Chile.
            </p>
            <p style="color:#a1a1aa;margin:0 0 16px;">
              <strong style="color:#fff;">Tu plan Free incluye:</strong>
            </p>
            <ul style="color:#a1a1aa;margin:0 0 24px;padding-left:20px;">
              <li>10 consultas mensuales</li>
              <li>Acceso a legislación básica</li>
              <li>Soporte por email</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://jurisnexa.ai'}" class="btn">
              Comenzar a Consultar
            </a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} JurisNexa.ai</p>
            <p>La información proporcionada es de carácter general y no sustituye el asesoramiento de un abogado.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Bienvenido a JurisNexa.ai. Ya puedes comenzar a hacer consultas legales.`,
  }),

  passwordReset: (resetLink: string): EmailOptions => ({
    to: '',
    subject: 'Restablecer contraseña - JurisNexa.ai',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .content { background: #18181b; border-radius: 12px; padding: 32px; border: 1px solid #27272a; }
          .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 16px 0; }
          .footer { text-align: center; margin-top: 32px; color: #71717a; font-size: 12px; }
          .warning { background: #451a03; border: 1px solid #92400e; border-radius: 8px; padding: 16px; margin: 16px 0; color: #fbbf24; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1 style="margin:0 0 16px;font-size:24px;">Restablecer contraseña</h1>
            <p style="color:#a1a1aa;margin:0 0 16px;">
              Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo:
            </p>
            <a href="${resetLink}" class="btn">Restablecer Contraseña</a>
            <div class="warning">
              ⚠️ Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este email.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} JurisNexa.ai</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Para restablecer tu contraseña, visita: ${resetLink}`,
  }),

  queryLimit: (currentPlan: string, limit: number): EmailOptions => ({
    to: '',
    subject: 'Límite de consultas alcanzado - JurisNexa.ai',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; }
          .content { background: #18181b; border-radius: 12px; padding: 32px; border: 1px solid #27272a; }
          .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 16px 0; }
          .footer { text-align: center; margin-top: 32px; color: #71717a; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1 style="margin:0 0 16px;font-size:24px;">Has alcanzado tu límite</h1>
            <p style="color:#a1a1aa;margin:0 0 16px;">
              Has utilizado las ${limit} consultas incluidas en tu plan <strong style="color:#fff;">${currentPlan}</strong>.
            </p>
            <p style="color:#a1a1aa;margin:0 0 16px;">
              Para continuar consultando, actualiza a un plan superior:
            </p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://jurisnexa.ai'}/precios" class=" Ver Planes</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} JurisNexa.ai</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Has alcanzado tu límite de consultas. Visita /precios para ver planes.`,
  }),
};

// Send email function (placeholder - integrate with Resend, SendGrid, etc.)
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In production, integrate with an email service:
  // - Resend (recommended for Next.js): https://resend.com
  // - SendGrid: https://sendgrid.com
  // - AWS SES: https://aws.amazon.com/ses/

  console.log('📧 Email sent:', {
    to: options.to,
    subject: options.subject,
  });

  // Simulate sending
  return true;
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const template = emailTemplates.welcome(name);
  return sendEmail({ ...template, to });
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://jurisnexa.ai'}/reset-password?token=${resetToken}`;
  const template = emailTemplates.passwordReset(resetLink);
  return sendEmail({ ...template, to });
}

export async function sendQueryLimitEmail(to: string, plan: string, limit: number): Promise<boolean> {
  const template = emailTemplates.queryLimit(plan, limit);
  return sendEmail({ ...template, to });
}
