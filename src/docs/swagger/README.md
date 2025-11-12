# Documentación Swagger - GymMaster API

Esta carpeta contiene toda la documentación de Swagger organizada de manera modular para facilitar el mantenimiento y la legibilidad.

## 📁 Estructura

```
docs/swagger/
├── config.js              # Configuración principal de Swagger
├── README.md              # Este archivo
├── schemas/               # Definiciones de esquemas
│   ├── index.js          # Índice que carga todos los esquemas
│   ├── common.js         # Esquemas comunes (errores, paginación)
│   ├── auth.js           # Esquemas de autenticación
│   ├── user.js           # Esquemas de usuarios
│   ├── member.js         # Esquemas de miembros
│   └── branch.js         # Esquemas de sucursales
├── responses/            # Definiciones de respuestas HTTP
│   └── common.js         # Respuestas estándar (400, 401, 404, etc.)
└── paths/                # Definiciones de endpoints (futuro)
    └── (por implementar)
```

## 🚀 Uso

### Configuración Principal

El archivo `config.js` contiene la configuración completa de Swagger y exporta el spec listo para usar:

```javascript
const { swaggerSpec } = require('./docs/swagger/config');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### Esquemas

Cada archivo de esquema define las estructuras de datos para una entidad específica:

- **auth.js**: LoginRequest, RegisterRequest, AuthResponse
- **user.js**: User, CreateUser, UpdateUser, ChangePassword
- **member.js**: Member, CreateMember, UpdateMember
- **branch.js**: Branch, CreateBranch, UpdateBranch
- **common.js**: Error, Pagination, SuccessResponse

### Respuestas

Las respuestas HTTP estándar están definidas en `responses/common.js` y se pueden reutilizar en cualquier endpoint:

- BadRequest (400)
- Unauthorized (401)
- Forbidden (403)
- NotFound (404)
- Conflict (409)
- InternalServerError (500)

## 📝 Agregar Nueva Documentación

### 1. Nuevo Esquema

Para agregar un nuevo esquema (ej. `payment.js`):

1. Crear el archivo en `schemas/payment.js`
2. Definir los esquemas usando JSDoc + Swagger
3. Importar en `schemas/index.js`

### 2. Nuevo Endpoint

Para documentar un nuevo endpoint:

1. Agregar la documentación JSDoc en el controlador correspondiente
2. O crear un archivo específico en `paths/` (recomendado para APIs grandes)

### 3. Nuevas Respuestas

Para agregar nuevas respuestas estándar, editar `responses/common.js`

## 🔧 Mantenimiento

### Ventajas de esta Estructura

1. **Modularidad**: Cada entidad tiene su propio archivo
2. **Mantenibilidad**: Fácil de encontrar y actualizar documentación específica
3. **Reutilización**: Esquemas y respuestas se pueden reutilizar
4. **Organización**: Clara separación entre esquemas, respuestas y configuración
5. **Escalabilidad**: Fácil agregar nuevas entidades sin tocar archivos existentes

### Convenciones

1. **Nombres de archivos**: En minúsculas, singular (ej. `user.js`, no `users.js`)
2. **Esquemas**: Usar PascalCase (ej. `CreateUser`, `UpdateBranch`)
3. **Ejemplos**: Incluir ejemplos realistas en todos los esquemas
4. **Descripciones**: Documentar cada campo con descripción clara

## 📊 Endpoints Documentados

La documentación se puede ver en: `http://localhost:3000/api-docs`

### Módulos Actuales

- ✅ Authentication (`/api/auth`)
- ✅ Users (`/api/users`)
- ✅ Members (`/api/members`)
- ✅ Branches (`/api/branches`)
- ⏳ Memberships (`/api/memberships`)
- ⏳ Payments (`/api/payments`)
- ⏳ Classes (`/api/classes`)
- ⏳ Check-ins (`/api/checkins`)
- ⏳ Reports (`/api/reports`)

## 🔄 Migración desde swaggerSchemas.js

El archivo original `swaggerSchemas.js` contenía todos los esquemas en un solo archivo. Esta nueva estructura:

1. **Mantiene la misma funcionalidad** - No se pierde documentación
2. **Mejora la organización** - Cada entidad en su propio archivo  
3. **Facilita el mantenimiento** - Cambios más localizados
4. **Permite escalabilidad** - Fácil agregar nuevos módulos

El archivo original se puede mantener como respaldo hasta confirmar que todo funciona correctamente.