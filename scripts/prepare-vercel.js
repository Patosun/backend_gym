#!/usr/bin/env node

/**
 * Script para preparar el proyecto para despliegue en Vercel
 * Verifica dependencias y estructura de archivos
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Preparando proyecto para Vercel...');

// Verificar archivos esenciales
const requiredFiles = [
  'src/app.js',
  'api/index.js',
  'package.json',
  'vercel.json',
  'prisma/schema.prisma'
];

console.log('📁 Verificando archivos esenciales...');
for (const file of requiredFiles) {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Archivo faltante: ${file}`);
    process.exit(1);
  } else {
    console.log(`✅ ${file}`);
  }
}

// Verificar que api/index.js tenga la ruta correcta
const apiIndexPath = path.join(__dirname, '..', 'api', 'index.js');
const apiIndexContent = fs.readFileSync(apiIndexPath, 'utf8');

if (!apiIndexContent.includes('../src/app')) {
  console.error('❌ api/index.js no tiene la ruta correcta a ../src/app');
  process.exit(1);
}

console.log('✅ api/index.js tiene la ruta correcta');

// Verificar variables de entorno esenciales
console.log('🔑 Verificando variables de entorno necesarias...');
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn('⚠️  Variables de entorno faltantes (asegúrate de configurarlas en Vercel):');
  missingVars.forEach(varName => console.warn(`   - ${varName}`));
}

// Verificar que Prisma esté configurado
try {
  require('../prisma/schema.prisma');
  console.log('✅ Schema de Prisma encontrado');
} catch (error) {
  console.error('❌ Error con schema de Prisma:', error.message);
}

console.log('\n🎉 Verificación completada!');
console.log('\n📋 Pasos para desplegar en Vercel:');
console.log('1. Conecta tu repositorio a Vercel');
console.log('2. Configura las variables de entorno en Vercel Dashboard');
console.log('3. Asegúrate de que NODE_ENV=production');
console.log('4. Vercel ejecutará automáticamente: npm install && npx prisma generate');
console.log('\n🔗 Variables de entorno necesarias en Vercel:');
console.log('   - DATABASE_URL');
console.log('   - JWT_SECRET');
console.log('   - NODE_ENV=production');
console.log('   - EMAIL_USER (si usas email)');
console.log('   - EMAIL_PASS (si usas email)');