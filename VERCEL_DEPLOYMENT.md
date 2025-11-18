# Despliegue en Vercel - GymMaster Backend

Esta guía te ayudará a desplegar el backend de GymMaster en Vercel.

## Prerrequisitos

1. **Cuenta en Vercel**: Asegúrate de tener una cuenta en [vercel.com](https://vercel.com)
2. **Base de datos en la nube**: Necesitarás una base de datos PostgreSQL en la nube. Recomendaciones:
   - [PlanetScale](https://planetscale.com) (gratis hasta cierto límite)
   - [Neon](https://neon.tech) (gratis hasta cierto límite)
   - [Railway](https://railway.app) (gratis hasta cierto límite)
   - [Supabase](https://supabase.com) (incluye PostgreSQL gratis)

## Pasos para el despliegue

### 1. Preparar la base de datos

Crea una base de datos PostgreSQL en tu proveedor elegido y obten la URL de conexión. Debe tener el formato:
```
postgresql://usuario:password@host:puerto/database?schema=public
```

### 2. Configurar variables de entorno en Vercel

En el dashboard de Vercel, ve a tu proyecto > Settings > Environment Variables y agrega:

#### Variables obligatorias:
```
DATABASE_URL=postgresql://usuario:password@host:puerto/database?schema=public
JWT_SECRET=tu-jwt-secret-super-seguro-para-produccion
NODE_ENV=production
```

#### Variables de email (opcional):
```
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
EMAIL_FROM=noreply@gymmaster.com
```

#### Variables de CORS:
```
CORS_ORIGIN=https://tu-frontend.vercel.app
```

#### Variables opcionales:
```
JWT_EXPIRES_IN=7d
API_PREFIX=/api
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Desplegar desde el dashboard de Vercel

1. Ve al dashboard de Vercel
2. Haz clic en "New Project"
3. Importa tu repositorio de GitHub
4. Selecciona la carpeta `Backend` como directorio raíz
5. Vercel detectará automáticamente que es un proyecto Node.js
6. Haz clic en "Deploy"

### 4. Desplegar desde la CLI (alternativa)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde la carpeta Backend
cd Backend
vercel

# Seguir las instrucciones interactivas
```

### 5. Configurar el dominio personalizado (opcional)

1. En el dashboard de Vercel, ve a tu proyecto
2. Ve a Settings > Domains
3. Agrega tu dominio personalizado

## Estructura de archivos importantes

```
Backend/
├── vercel.json          # Configuración de Vercel
├── api/
│   └── index.js        # Punto de entrada para Vercel
├── src/
│   ├── app.js          # Aplicación Express
│   └── server.js       # Servidor (solo para desarrollo local)
└── .env.production     # Ejemplo de variables de entorno
```

## Verificación del despliegue

Una vez desplegado, visita:
- `https://tu-backend.vercel.app/` - Página de bienvenida
- `https://tu-backend.vercel.app/health` - Health check
- `https://tu-backend.vercel.app/api-docs` - Documentación Swagger

## Problemas comunes

### Base de datos
- **Error de conexión**: Verifica que la DATABASE_URL sea correcta
- **Tablas no existen**: Asegúrate de ejecutar las migraciones en tu base de datos

### CORS
- **Error de CORS**: Agrega tu dominio frontend a CORS_ORIGIN
- En desarrollo: `http://localhost:3000,http://localhost:5173`
- En producción: `https://tu-frontend.vercel.app`

### Variables de entorno
- **JWT Error**: Verifica que JWT_SECRET esté configurado
- **Email Error**: Verifica las credenciales de email

## Comandos útiles

```bash
# Ver logs en tiempo real
vercel logs

# Ver información del proyecto
vercel

# Eliminar deployment
vercel remove
```

## Actualizaciones

Cada vez que hagas push a tu rama principal (main/master), Vercel automáticamente desplegará los cambios.

## Monitoreo

Vercel proporciona:
- Analytics de performance
- Logs de función en tiempo real
- Métricas de uso

Puedes acceder a estas funcionalidades desde el dashboard de tu proyecto.