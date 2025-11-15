const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Usar servicio predefinido de Gmail
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Para evitar problemas de certificados en desarrollo
      }
    });
  }

  /**
   * Enviar código OTP por email
   */
  async sendOTP(email, otpCode, userName) {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: email,
        subject: 'Código de verificación - SmartGym',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Código de Verificación</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px; }
              .otp-code { 
                font-size: 32px; 
                font-weight: bold; 
                color: #2563eb; 
                text-align: center; 
                margin: 20px 0;
                padding: 15px;
                border: 2px solid #2563eb;
                border-radius: 8px;
                background-color: #f8fafc;
                letter-spacing: 5px;
              }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; }
              .warning { color: #dc2626; font-weight: bold; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏋️‍♂️ SmartGym</h1>
                <p>Código de Verificación</p>
              </div>
              <div class="content">
                <h2>¡Hola ${userName}!</h2>
                <p>Has solicitado iniciar sesión en SmartGym. Para completar el proceso, utiliza el siguiente código de verificación:</p>
                
                <div class="otp-code">
                  ${otpCode}
                </div>
                
                <p>Este código es válido por <strong>${process.env.OTP_EXPIRATION_MINUTES || 10} minutos</strong>.</p>
                
                <div class="warning">
                  ⚠️ Si no has sido tú quien solicitó este código, ignora este mensaje y considera cambiar tu contraseña.
                </div>
                
                <p>Gracias por usar SmartGym.</p>
              </div>
              <div class="footer">
                <p>Este es un mensaje automático, no respondas a este email.</p>
                <p>&copy; 2025 SmartGym. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado exitosamente:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw new Error(`Error enviando email: ${error.message}`);
    }
  }

  /**
   * Generar código OTP de 6 dígitos
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Verificar configuración del email
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Conexión SMTP verificada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error en la configuración SMTP:', error);
      throw new Error(`Error en configuración SMTP: ${error.message}`);
    }
  }

  /**
   * Enviar email de bienvenida al activar 2FA
   */
  async send2FAWelcomeEmail(email, userName) {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: email,
        subject: 'Autenticación de dos factores activada - SmartGym',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>2FA Activado</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; }
              .content { padding: 30px; }
              .success-icon { font-size: 64px; text-align: center; margin: 20px 0; }
              .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏋️‍♂️ SmartGym</h1>
                <p>2FA Activado</p>
              </div>
              <div class="content">
                <div class="success-icon">🔐✅</div>
                <h2>¡Hola ${userName}!</h2>
                <p>La autenticación de dos factores (2FA) ha sido <strong>activada exitosamente</strong> en tu cuenta de SmartGym.</p>
                
                <h3>¿Qué significa esto?</h3>
                <ul>
                  <li>Tu cuenta ahora tiene una capa adicional de seguridad</li>
                  <li>Cada vez que inicies sesión, recibirás un código por email</li>
                  <li>Solo tú podrás acceder a tu cuenta, incluso si alguien conoce tu contraseña</li>
                </ul>
                
                <h3>Próximos pasos:</h3>
                <p>A partir de ahora, cuando inicies sesión:</p>
                <ol>
                  <li>Ingresa tu email y contraseña como siempre</li>
                  <li>Recibirás un código de 6 dígitos en este email</li>
                  <li>Introduce el código para completar el inicio de sesión</li>
                </ol>
                
                <p>Si necesitas desactivar 2FA, puedes hacerlo desde la configuración de tu perfil.</p>
                
                <p>Gracias por mantener tu cuenta segura.</p>
              </div>
              <div class="footer">
                <p>Este es un mensaje automático, no respondas a este email.</p>
                <p>&copy; 2025 SmartGym. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de bienvenida 2FA enviado:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error enviando email de bienvenida 2FA:', error);
      throw new Error(`Error enviando email de bienvenida: ${error.message}`);
    }
  }
}

module.exports = new EmailService();