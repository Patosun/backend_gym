// Servicio de email temporal para desarrollo sin SMTP real
class MockEmailService {
  constructor() {
    this.otpCodes = new Map(); // Simular almacenamiento temporal de códigos
    console.log('📧 Mock Email Service iniciado (modo desarrollo)');
  }

  /**
   * Simular envío de OTP por email (solo log en consola)
   * @param {string} email - Email del destinatario
   * @param {string} otpCode - Código OTP de 6 dígitos
   * @returns {Promise<boolean>}
   */
  async sendOTP(email, otpCode) {
    try {
      console.log('📧 ===========================================');
      console.log('📧 SIMULANDO ENVÍO DE EMAIL OTP');
      console.log('📧 ===========================================');
      console.log(`📧 Para: ${email}`);
      console.log(`📧 Código OTP: ${otpCode}`);
      console.log('📧 ===========================================');
      
      // Guardar código para debugging
      this.otpCodes.set(email, otpCode);
      
      return true;
    } catch (error) {
      console.error('❌ Error simulando envío de email:', error);
      return false;
    }
  }

  /**
   * Generar código OTP de 6 dígitos
   * @returns {string}
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Obtener último código OTP para un email (solo para debugging)
   * @param {string} email 
   * @returns {string|null}
   */
  getLastOTP(email) {
    return this.otpCodes.get(email) || null;
  }

  /**
   * Verificar conexión (siempre exitosa en modo mock)
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    console.log('📧 Mock Email Service: Conexión verificada ✅');
    return true;
  }
}

module.exports = new MockEmailService();