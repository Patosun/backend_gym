# 🏋️‍♂️ GymMaster Backend - Script de Instalación para Windows
# Este script configura automáticamente el proyecto GymMaster en PowerShell

Write-Host "🏋️‍♂️ ======================================" -ForegroundColor Green
Write-Host "🏋️‍♂️  GymMaster Backend Setup" -ForegroundColor Green
Write-Host "🏋️‍♂️ ======================================" -ForegroundColor Green

# Verificar que Node.js esté instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detectado" -ForegroundColor Green
    
    # Verificar versión
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 18) {
        Write-Host "❌ Se requiere Node.js v18 o superior. Versión actual: $nodeVersion" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Node.js no está instalado. Por favor instala Node.js v18+ primero." -ForegroundColor Red
    Write-Host "💡 Descarga desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Blue
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencias instaladas correctamente" -ForegroundColor Green

# Crear archivo .env si no existe
if (!(Test-Path ".env")) {
    Write-Host "⚙️ Creando archivo .env..." -ForegroundColor Blue
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Archivo .env creado. Por favor configura las variables necesarias." -ForegroundColor Green
    Write-Host "📝 Especialmente: DATABASE_URL y JWT_SECRET" -ForegroundColor Yellow
} else {
    Write-Host "✅ Archivo .env ya existe" -ForegroundColor Green
}

# Verificar PostgreSQL
Write-Host "🗄️ Verificando PostgreSQL..." -ForegroundColor Blue
try {
    psql --version | Out-Null
    Write-Host "✅ PostgreSQL encontrado" -ForegroundColor Green
} catch {
    Write-Host "⚠️ PostgreSQL no encontrado localmente." -ForegroundColor Yellow
    Write-Host "💡 Opciones:" -ForegroundColor Yellow
    Write-Host "   1. Instalar PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "   2. Usar Docker: docker run --name gymmaster-postgres -e POSTGRES_DB=gymmaster_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password123 -p 5432:5432 -d postgres:14" -ForegroundColor Cyan
}

# Generar cliente Prisma
Write-Host "🔧 Generando cliente Prisma..." -ForegroundColor Blue
npm run db:generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al generar cliente Prisma" -ForegroundColor Red
    Write-Host "💡 Asegúrate de que DATABASE_URL esté configurado correctamente en .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Cliente Prisma generado" -ForegroundColor Green

# Intentar sincronizar la base de datos
Write-Host "🔄 Intentando sincronizar base de datos..." -ForegroundColor Blue
npm run db:push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base de datos sincronizada correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠️ No se pudo sincronizar la base de datos automáticamente" -ForegroundColor Yellow
    Write-Host "💡 Verifica la configuración de DATABASE_URL en .env" -ForegroundColor Yellow
    Write-Host "💡 Ejecuta manualmente: npm run db:push" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 ======================================" -ForegroundColor Green
Write-Host "🎉  ¡Instalación Completada!" -ForegroundColor Green
Write-Host "🎉 ======================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Configura DATABASE_URL en .env" -ForegroundColor White
Write-Host "2. Configura JWT_SECRET en .env" -ForegroundColor White
Write-Host "3. Ejecuta: npm run db:push" -ForegroundColor White
Write-Host "4. Inicia el servidor: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 URLs importantes:" -ForegroundColor Yellow
Write-Host "   API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Docs: http://localhost:3000/api-docs" -ForegroundColor Cyan
Write-Host "   Health: http://localhost:3000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Ver documentación completa en:" -ForegroundColor Yellow
Write-Host "   - SETUP_INSTRUCTIONS.md" -ForegroundColor Cyan
Write-Host "   - API_EXAMPLES.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🏋️‍♂️ ¡GymMaster está listo para usar!" -ForegroundColor Green