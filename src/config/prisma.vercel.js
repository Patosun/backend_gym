// Configuración específica para Vercel
const { PrismaClient } = require('@prisma/client');

// En Vercel, necesitamos manejar las conexiones de manera diferente
let prisma;

if (process.env.NODE_ENV === 'production') {
  // En producción (Vercel), usar una instancia global
  prisma = globalThis.prisma || new PrismaClient();
  if (process.env.NODE_ENV === 'production') globalThis.prisma = prisma;
} else {
  // En desarrollo, crear nueva instancia cada vez
  prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
}

module.exports = prisma;