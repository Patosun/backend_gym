const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // En desarrollo, usar una instancia global para evitar múltiples conexiones
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.prisma;
}

// Manejo de cierre de conexión
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;