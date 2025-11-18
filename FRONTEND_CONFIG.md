# Configuración Frontend para Producción

## Variables de entorno para el Frontend

Cuando despliegues el frontend, necesitarás configurar estas variables de entorno:

### En Vercel (para el Frontend):
```
VITE_API_BASE_URL=https://tu-backend.vercel.app/api
VITE_APP_NAME=GymMaster
VITE_NODE_ENV=production
```

### En desarrollo local:
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=GymMaster
VITE_NODE_ENV=development
```

## Pasos para actualizar el Frontend:

1. **Crear archivo `.env.production` en la carpeta Frontend:**
```
VITE_API_BASE_URL=https://tu-backend.vercel.app/api
VITE_APP_NAME=GymMaster
VITE_NODE_ENV=production
```

2. **Verificar que el archivo de configuración de API use las variables de entorno:**

En `Frontend/src/services/authAPI.ts` o similar, asegúrate de que la baseURL use:
```typescript
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
```

3. **Desplegar el Frontend en Vercel:**
- Importar el repositorio
- Seleccionar la carpeta `Frontend`
- Configurar las variables de entorno en Vercel
- Desplegar

## URLs importantes después del despliegue:

- **Backend**: `https://tu-backend.vercel.app`
- **Frontend**: `https://tu-frontend.vercel.app`
- **API Docs**: `https://tu-backend.vercel.app/api-docs`
- **Health Check**: `https://tu-backend.vercel.app/health`