# 📮 Colección de Postman para GymMaster API

Esta carpeta contiene la colección completa de APIs para el sistema GymMaster que puedes importar directamente en Postman.

## 📁 Archivos Incluidos

- **`GymMaster-API.postman_collection.json`** - Colección principal con todos los endpoints
- **`GymMaster-Environment.postman_environment.json`** - Variables de entorno para desarrollo y producción

## 🚀 Cómo Importar

### 1. Importar la Colección
1. Abre Postman
2. Click en "Import" en la esquina superior izquierda
3. Arrastra el archivo `GymMaster-API.postman_collection.json` o selecciónalo
4. Click en "Import"

### 2. Importar el Environment
1. En Postman, click en el ícono de configuración (⚙️) en la esquina superior derecha
2. Click en "Import"
3. Arrastra el archivo `GymMaster-Environment.postman_environment.json` o selecciónalo
4. Click en "Import"
5. Selecciona el environment "GymMaster Environment" en el dropdown

## 🔧 Configuración Inicial

### Variables de Entorno

Antes de usar la colección, configura estas variables en tu environment:

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `BASE_URL` | URL base del API | `http://localhost:3000` |
| `TOKEN` | JWT Token (se obtiene automáticamente) | `` |
| `USER_ID` | ID del usuario logueado | `` |
| `BRANCH_ID` | ID de sucursal para pruebas | `` |
| `MEMBER_ID` | ID de miembro para pruebas | `` |
| `CLASS_ID` | ID de clase para pruebas | `` |

### Para Producción
1. Duplica el environment
2. Cambia `BASE_URL` a tu URL de Vercel: `https://tu-app.vercel.app`
3. Renombra a "GymMaster Production"

## 🔐 Autenticación

### 1. Login
1. Ve a la carpeta "Authentication" → "Login"
2. Modifica el body con credenciales válidas:
   ```json
   {
     "email": "admin@gymmaster.com",
     "password": "tu_password"
   }
   ```
3. Ejecuta la petición
4. Copia el `token` de la respuesta
5. Ve a tu Environment y pega el token en la variable `TOKEN`

### 2. Uso Automático del Token
Todos los endpoints protegidos ya incluyen el header:
```
Authorization: Bearer {{TOKEN}}
```

## 📚 Estructura de la Colección

### 🔑 Authentication
- Login
- Register  
- Forgot Password
- Reset Password
- Change Password
- Enable/Disable 2FA (Admin)

### 👥 Users
- Get All Users
- Get User by ID
- Update User
- Delete User

### 🏢 Branches
- Get All Branches
- Create Branch
- Update Branch

### 👤 Members
- Get All Members
- Create Member
- Get Member Dashboard Stats

### 💳 Memberships
- Get Membership Types
- Create Membership Type
- Get Member Memberships

### 🏃 Classes
- Get All Classes
- Get Available Classes
- Create Class
- Get My Reservations
- Enroll in Class
- Cancel Enrollment

### 💰 Payments
- Get All Payments
- Create Payment

### ✅ Check-ins
- Get All Check-ins
- Create Check-in
- Generate QR Code

### 📊 Reports
- Dashboard Stats
- Revenue Report
- Membership Report
- Attendance Report

### ❤️ Health Check
- API Health
- API Root

## 🎯 Flujo de Pruebas Recomendado

### 1. Configuración Inicial
1. Importar colección y environment
2. Hacer login y obtener token
3. Crear una sucursal (si no existe)

### 2. Gestión de Usuarios
1. Registrar un nuevo miembro
2. Obtener lista de usuarios
3. Actualizar información de usuario

### 3. Gestión de Gimnasio
1. Crear tipos de membresía
2. Crear clases
3. Inscribir miembro a clase
4. Realizar check-in
5. Generar QR para check-in

### 4. Reportes
1. Ver estadísticas del dashboard
2. Generar reporte de ingresos
3. Ver reporte de membresías

## 📝 Notas Importantes

### Roles de Usuario
El sistema maneja estos roles:
- `ADMIN` - Acceso completo
- `EMPLOYEE` - Gestión operativa
- `TRAINER` - Gestión de clases
- `MEMBER` - Acceso limitado

### Códigos de Estado HTTP
- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Error en la petición
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `500` - Error del servidor

### Headers Requeridos
La mayoría de endpoints requieren:
```
Content-Type: application/json
Authorization: Bearer {{TOKEN}}
```

## 🔍 Troubleshooting

### Token Expirado
Si recibes error 401:
1. Ve a Authentication → Login
2. Ejecuta nuevamente el login
3. Actualiza la variable `TOKEN`

### URL Incorrecta
Verifica que `BASE_URL` en tu environment apunte a:
- **Desarrollo**: `http://localhost:3000`
- **Producción**: Tu URL de Vercel

### Errores de Validación
Revisa que los datos en el body cumplan con:
- Formatos de email válidos
- Passwords con mínimo 6 caracteres
- IDs en formato UUID
- Fechas en formato ISO

## 🆘 Soporte

Si encuentras problemas:
1. Verifica que el backend esté ejecutándose
2. Confirma que las variables de entorno estén configuradas
3. Revisa los logs del servidor para errores específicos
4. Asegúrate de que la base de datos esté conectada

---
**Desarrollado para GymMaster** 🏋️‍♂️