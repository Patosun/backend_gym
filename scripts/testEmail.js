const dotenv = require('dotenv');
const emailService = require('../src/services/emailService');

// Cargar variables de entorno
dotenv.config();

async function testEmailService() {
  try {
    console.log('🔍 Iniciando prueba del servicio de email...');
    
    // Verificar variables de entorno
    console.log('📋 Variables de entorno:');
    console.log(`EMAIL_HOST: ${process.env.EMAIL_HOST}`);
    console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT}`);
    console.log(`EMAIL_SECURE: ${process.env.EMAIL_SECURE}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '***configurada***' : 'NO CONFIGURADA'}`);
    
    // Verificar conexión SMTP
    console.log('🔗 Verificando conexión SMTP...');
    const isConnected = await emailService.verifyConnection();
    
    if (!isConnected) {
      console.log('❌ No se pudo conectar al servidor SMTP');
      return;
    }
    
    console.log('✅ Conexión SMTP exitosa');
    
    // Enviar email de prueba
    const testEmail = 'patomagick777@gmail.com';
    const testOTP = '123456';
    
    console.log(`📧 Enviando email de prueba a: ${testEmail}`);
    console.log(`🔑 Código OTP de prueba: ${testOTP}`);
    
    const result = await emailService.sendOTP(testEmail, testOTP);
    
    if (result) {
      console.log('✅ Email enviado exitosamente');
      console.log('📬 Revisa tu bandeja de entrada (y spam) en:', testEmail);
    } else {
      console.log('❌ Error enviando email');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('💡 Sugerencia: Necesitas configurar una "contraseña de aplicación" en Gmail');
      console.log('💡 Ve a: https://myaccount.google.com/ → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones');
    }
  }
}

testEmailService();