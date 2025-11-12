# 🚀 Instrucciones para Ejecutar el Proyecto GymMaster Backend

## 📋 Requisitos Previos

### Software Necesario
- **Node.js**: v18.0.0 o superior
- **npm**: v8.0.0 o superior  
- **PostgreSQL**: v12.0 o superior (o Docker)
- **Git**: Para clonar el repositorio

### Verificar Instalaciones
```bash
node --version
npm --version
psql --version
```

---

## 🛠️ Configuración del Proyecto

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
```

### Variables de Entorno Requeridas
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gymmaster_db?schema=public"

# JWT Secret (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Otros configurables (ver .env.example)
```

### 3. Configurar Base de Datos

#### Opción A: PostgreSQL Local
```bash
# Crear base de datos
createdb gymmaster_db

# O usando psql
psql -U postgres
CREATE DATABASE gymmaster_db;
\q
```

#### Opción B: PostgreSQL con Docker
```bash
# Ejecutar PostgreSQL en contenedor
docker run --name gymmaster-postgres \
  -e POSTGRES_DB=gymmaster_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password123 \
  -p 5432:5432 \
  -d postgres:14

# Actualizar DATABASE_URL en .env
DATABASE_URL="postgresql://postgres:password123@localhost:5432/gymmaster_db?schema=public"
```

### 4. Configurar Prisma
```bash
# Generar cliente de Prisma
npm run db:generate

# Sincronizar esquema con la base de datos
npm run db:push

# (Opcional) Abrir Prisma Studio para ver la DB
npm run db:studio
```

---

## 🚀 Ejecutar el Proyecto

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

### Verificar que Funciona
- **API**: http://localhost:3000
- **Documentación**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

---

## 📚 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil
- `POST /api/auth/generate-qr` - Generar QR (miembros)

### Sucursales
- `GET /api/branches` - Listar sucursales
- `POST /api/branches` - Crear sucursal
- `GET /api/branches/:id` - Obtener sucursal
- `GET /api/branches/nearby` - Sucursales cercanas

### Check-ins
- `POST /api/checkins` - Check-in con QR
- `PUT /api/checkins/:id/checkout` - Check-out
- `GET /api/checkins` - Historial
- `GET /api/checkins/active` - Check-ins activos

### Reportes
- `GET /api/reports/dashboard` - Dashboard general
- `GET /api/reports/memberships` - Reporte membresías
- `GET /api/reports/attendance` - Reporte asistencia
- `GET /api/reports/revenue` - Reporte ingresos

---

## 🧪 Probar la API

### 1. Registrar Usuario Admin
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gymmaster.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "GymMaster",
    "role": "ADMIN"
  }'
```

### 2. Iniciar Sesión
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gymmaster.com",
    "password": "admin123"
  }'
```

### 3. Crear Sucursal (usar token del login)
```bash
curl -X POST http://localhost:3000/api/branches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Sucursal Centro",
    "address": "Av. Principal 123",
    "city": "Ciudad",
    "state": "Estado",
    "openingTime": "06:00",
    "closingTime": "23:00"
  }'
```

---

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos
```bash
# Verificar que PostgreSQL esté ejecutándose
sudo systemctl status postgresql

# O para Docker
docker ps | grep postgres

# Verificar URL de conexión en .env
echo $DATABASE_URL
```

### Error de Prisma
```bash
# Regenerar cliente
npm run db:generate

# Resetear base de datos (CUIDADO: elimina datos)
npx prisma db push --force-reset
```

### Errores de Dependencias
```bash
# Limpiar caché e instalar
rm -rf node_modules package-lock.json
npm install
```

### Puerto en Uso
```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso en puerto 3000
npx kill-port 3000
```

---

## 🔒 Seguridad en Producción

### Variables de Entorno Críticas
- Cambiar `JWT_SECRET` por uno seguro
- Usar conexión SSL para la base de datos
- Configurar `CORS_ORIGIN` apropiadamente
- Ajustar límites de rate limiting

### Ejemplo .env Producción
```env
NODE_ENV=production
JWT_SECRET=super-secret-256-bit-key
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## 📖 Documentación Adicional

### Swagger/OpenAPI
- Accede a http://localhost:3000/api-docs
- Documenta todos los endpoints automáticamente
- Permite probar la API directamente

### Base de Datos
- Esquema completo en `prisma/schema.prisma`
- Relaciones entre entidades documentadas
- Usa `npm run db:studio` para explorar datos

### Arquitectura
- Estructura modular por funcionalidad
- Middleware para autenticación y validación
- Manejo centralizado de errores
- Logging y monitoreo incluidos

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs del servidor
2. Verifica la configuración de .env
3. Consulta la documentación de Swagger
4. Revisa este archivo de instrucciones

### Logs Útiles
```bash
# Ver logs en tiempo real
npm run dev

# Para debugging adicional
DEBUG=* npm run dev
```