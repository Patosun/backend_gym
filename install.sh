#!/bin/bash

# 🏋️‍♂️ GymMaster Backend - Script de Instalación Rápida
# Este script configura automáticamente el proyecto GymMaster

echo "🏋️‍♂️ ======================================"
echo "🏋️‍♂️  GymMaster Backend Setup"
echo "🏋️‍♂️ ======================================"

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js v18+ primero."
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Se requiere Node.js v18 o superior. Versión actual: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detectado"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas correctamente"

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "⚙️ Creando archivo .env..."
    cp .env.example .env
    echo "✅ Archivo .env creado. Por favor configura las variables necesarias."
    echo "📝 Especialmente: DATABASE_URL y JWT_SECRET"
else
    echo "✅ Archivo .env ya existe"
fi

# Verificar PostgreSQL
echo "🗄️ Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL encontrado"
else
    echo "⚠️ PostgreSQL no encontrado localmente."
    echo "💡 Puedes usar Docker: docker run --name gymmaster-postgres -e POSTGRES_DB=gymmaster_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password123 -p 5432:5432 -d postgres:14"
fi

# Generar cliente Prisma
echo "🔧 Generando cliente Prisma..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Error al generar cliente Prisma"
    echo "💡 Asegúrate de que DATABASE_URL esté configurado correctamente en .env"
    exit 1
fi

echo "✅ Cliente Prisma generado"

# Intentar sincronizar la base de datos
echo "🔄 Intentando sincronizar base de datos..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Base de datos sincronizada correctamente"
else
    echo "⚠️ No se pudo sincronizar la base de datos automáticamente"
    echo "💡 Verifica la configuración de DATABASE_URL en .env"
    echo "💡 Ejecuta manualmente: npm run db:push"
fi

echo ""
echo "🎉 ======================================"
echo "🎉  ¡Instalación Completada!"
echo "🎉 ======================================"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura DATABASE_URL en .env"
echo "2. Configura JWT_SECRET en .env"
echo "3. Ejecuta: npm run db:push"
echo "4. Inicia el servidor: npm run dev"
echo ""
echo "📚 URLs importantes:"
echo "   API: http://localhost:3000"
echo "   Docs: http://localhost:3000/api-docs"
echo "   Health: http://localhost:3000/health"
echo ""
echo "📖 Ver documentación completa en:"
echo "   - SETUP_INSTRUCTIONS.md"
echo "   - API_EXAMPLES.md"
echo ""
echo "🏋️‍♂️ ¡GymMaster está listo para usar!"