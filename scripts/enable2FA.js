const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient();

async function enable2FAForUser(email) {
  try {
    console.log(`🔍 Buscando usuario con email: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`📱 2FA actual: ${user.is2FAEnabled ? 'Habilitado' : 'Deshabilitado'}`);

    // Habilitar 2FA
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        is2FAEnabled: true 
      }
    });

    console.log('🔐 2FA habilitado exitosamente para el usuario');
    console.log(`📧 Email: ${updatedUser.email}`);
    console.log(`👤 Nombre: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`🔑 2FA: ${updatedUser.is2FAEnabled ? 'Habilitado' : 'Deshabilitado'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function listUsers() {
  try {
    console.log('📋 Lista de usuarios disponibles:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        is2FAEnabled: true
      }
    });

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role} - 2FA: ${user.is2FAEnabled ? 'ON' : 'OFF'}`);
    });

    return users;
  } catch (error) {
    console.error('❌ Error listando usuarios:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Uso del script:');
    console.log('node scripts/enable2FA.js <email>  - Habilitar 2FA para un usuario específico');
    console.log('node scripts/enable2FA.js list     - Listar todos los usuarios');
    console.log('');
    await listUsers();
    return;
  }

  if (args[0] === 'list') {
    await listUsers();
    return;
  }

  const email = args[0];
  await enable2FAForUser(email);
}

main().catch(console.error);