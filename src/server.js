const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos establecida');

    // Iniciar el servidor
    const server = app.listen(PORT, () => {
      console.log('🏋️‍♂️ ======================================');
      console.log('🏋️‍♂️  GymMaster Backend Server');
      console.log('🏋️‍♂️ ======================================');
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${NODE_ENV}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log('🏋️‍♂️ ======================================');
    });

    // Manejo de cierre graceful
    const gracefulShutdown = async (signal) => {
      console.log(`\n🔄 Recibida señal ${signal}. Cerrando servidor...`);
      
      server.close(async () => {
        console.log('🔒 Servidor HTTP cerrado');
        
        try {
          await prisma.$disconnect();
          console.log('🔒 Conexión a la base de datos cerrada');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error al cerrar la conexión a la base de datos:', error);
          process.exit(1);
        }
      });

      // Si no se cierra en 10 segundos, forzar cierre
      setTimeout(() => {
        console.error('⏰ Tiempo de espera agotado. Forzando cierre...');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de cierre
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Error no capturado:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada en:', promise, 'razón:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor solo si este archivo es ejecutado directamente
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };