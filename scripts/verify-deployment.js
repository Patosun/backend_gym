#!/usr/bin/env node

/**
 * Script de verificación pre-despliegue para Vercel
 * Ejecuta: node scripts/verify-deployment.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración para despliegue en Vercel...\n');

const checks = [
  {
    name: 'Archivo vercel.json existe',
    check: () => fs.existsSync(path.join(__dirname, '..', 'vercel.json')),
    fix: 'Crear archivo vercel.json en la raíz del proyecto'
  },
  {
    name: 'Archivo api/index.js existe',
    check: () => fs.existsSync(path.join(__dirname, '..', 'api', 'index.js')),
    fix: 'Crear archivo api/index.js'
  },
  {
    name: 'package.json tiene script vercel-build',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
      return pkg.scripts && pkg.scripts['vercel-build'];
    },
    fix: 'Agregar script "vercel-build" al package.json'
  },
  {
    name: 'Prisma schema existe',
    check: () => fs.existsSync(path.join(__dirname, '..', 'prisma', 'schema.prisma')),
    fix: 'Verificar que existe el archivo prisma/schema.prisma'
  },
  {
    name: 'Documentación de despliegue existe',
    check: () => fs.existsSync(path.join(__dirname, '..', 'VERCEL_DEPLOYMENT.md')),
    fix: 'El archivo VERCEL_DEPLOYMENT.md contiene las instrucciones'
  }
];

let allPassed = true;

checks.forEach(({ name, check, fix }) => {
  const passed = check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  
  if (!passed) {
    console.log(`   💡 ${fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('✅ ¡Todas las verificaciones pasaron!');
  console.log('🚀 Tu proyecto está listo para desplegar en Vercel');
  console.log('\nPróximos pasos:');
  console.log('1. Configura tu base de datos en la nube');
  console.log('2. Configura las variables de entorno en Vercel');
  console.log('3. Despliega usando: vercel --prod');
} else {
  console.log('❌ Algunas verificaciones fallaron');
  console.log('🔧 Corrige los problemas listados arriba antes de desplegar');
  process.exit(1);
}

console.log('\n📚 Lee VERCEL_DEPLOYMENT.md para instrucciones detalladas');