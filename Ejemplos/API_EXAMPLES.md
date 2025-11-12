# 📋 Ejemplos de Uso de la API GymMaster

## 🔐 Autenticación

### 1. Registrar Usuario Admin
```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@gymmaster.com",
  "password": "admin123",
  "firstName": "Administrador",
  "lastName": "Principal",
  "phone": "+1234567890",
  "role": "ADMIN"
}
```

### 2. Registrar Miembro
```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "miembro@example.com",
  "password": "miembro123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "phone": "+1234567891",
  "role": "MEMBER"
}
```

### 3. Iniciar Sesión
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@gymmaster.com",
  "password": "admin123"
}

// Respuesta:
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@gymmaster.com",
      "firstName": "Administrador",
      "lastName": "Principal",
      "role": "ADMIN"
    },
    "token": "jwt-token-here"
  }
}
```

---

## 🏢 Gestión de Sucursales

### 4. Crear Sucursal
```json
POST /api/branches
Authorization: Bearer jwt-token-here
Content-Type: application/json

{
  "name": "GymMaster Centro",
  "address": "Av. Principal 123, Centro",
  "phone": "+1234567890",
  "email": "centro@gymmaster.com",
  "city": "Ciudad Principal",
  "state": "Estado",
  "zipCode": "12345",
  "openingTime": "06:00",
  "closingTime": "23:00"
}
```

### 5. Listar Sucursales
```json
GET /api/branches?page=1&limit=10&isActive=true
Authorization: Bearer jwt-token-here

// Respuesta:
{
  "success": true,
  "data": {
    "branches": [
      {
        "id": "branch-uuid",
        "name": "GymMaster Centro",
        "address": "Av. Principal 123, Centro",
        "city": "Ciudad Principal",
        "state": "Estado",
        "isActive": true,
        "openingTime": "06:00",
        "closingTime": "23:00",
        "_count": {
          "employees": 5,
          "trainers": 3,
          "checkIns": 150
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

## ✅ Check-ins con QR

### 6. Generar Nuevo QR (Miembro)
```json
POST /api/auth/generate-qr
Authorization: Bearer member-jwt-token
Content-Type: application/json

// Respuesta:
{
  "success": true,
  "message": "Código QR generado exitosamente",
  "data": {
    "qrCode": "new-uuid-qr-code",
    "qrCodeExpiry": "2024-01-15T10:30:00.000Z"
  }
}
```

### 7. Realizar Check-in
```json
POST /api/checkins
Content-Type: application/json

{
  "qrCode": "member-qr-code-uuid",
  "branchId": "branch-uuid"
}

// Respuesta:
{
  "success": true,
  "message": "¡Bienvenido Juan!",
  "data": {
    "id": "checkin-uuid",
    "memberId": "member-uuid",
    "branchId": "branch-uuid",
    "checkInAt": "2024-01-15T08:30:00.000Z",
    "checkOutAt": null,
    "member": {
      "user": {
        "firstName": "Juan",
        "lastName": "Pérez",
        "email": "miembro@example.com"
      }
    },
    "branch": {
      "name": "GymMaster Centro",
      "address": "Av. Principal 123, Centro"
    }
  }
}
```

### 8. Realizar Check-out
```json
PUT /api/checkins/{checkin-uuid}/checkout
Authorization: Bearer jwt-token
Content-Type: application/json

{
  "notes": "Entrenamiento completado"
}
```

### 9. Ver Check-ins Activos
```json
GET /api/checkins/active?branchId=branch-uuid
Authorization: Bearer jwt-token

// Respuesta:
{
  "success": true,
  "data": [
    {
      "id": "checkin-uuid",
      "checkInAt": "2024-01-15T08:30:00.000Z",
      "member": {
        "user": {
          "firstName": "Juan",
          "lastName": "Pérez"
        }
      },
      "branch": {
        "name": "GymMaster Centro"
      }
    }
  ]
}
```

---

## 📊 Reportes y Estadísticas

### 10. Dashboard General
```json
GET /api/reports/dashboard?branchId=branch-uuid
Authorization: Bearer jwt-token

// Respuesta:
{
  "success": true,
  "data": {
    "checkIns": {
      "today": 25,
      "week": 180,
      "month": 720,
      "active": 8
    },
    "memberships": {
      "active": 150,
      "expiring": 12
    },
    "revenue": {
      "today": 450.00,
      "month": 18500.00
    }
  }
}
```

### 11. Reporte de Asistencia
```json
GET /api/reports/attendance?startDate=2024-01-01&endDate=2024-01-31&branchId=branch-uuid
Authorization: Bearer jwt-token

// Respuesta:
{
  "success": true,
  "data": {
    "summary": {
      "totalCheckIns": 720,
      "uniqueMembers": 150,
      "averageVisitsPerMember": 4.8
    },
    "peakHours": [
      { "hour": 18, "count": 85 },
      { "hour": 7, "count": 78 },
      { "hour": 19, "count": 72 }
    ],
    "dailyTrend": [
      { "date": "2024-01-01", "count": 23 },
      { "date": "2024-01-02", "count": 28 }
    ]
  }
}
```

### 12. Reporte de Ingresos
```json
GET /api/reports/revenue?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer jwt-token

// Respuesta:
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 18500.00,
      "totalPayments": 87,
      "averagePayment": 212.64
    },
    "byMethod": [
      {
        "method": "CASH",
        "_sum": { "amount": 12500.00 },
        "_count": { "id": 62 }
      },
      {
        "method": "QR",
        "_sum": { "amount": 6000.00 },
        "_count": { "id": 25 }
      }
    ]
  }
}
```

---

## 👤 Gestión de Perfil

### 13. Ver Perfil
```json
GET /api/auth/profile
Authorization: Bearer jwt-token

// Respuesta para miembro:
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "miembro@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "phone": "+1234567891",
    "role": "MEMBER",
    "member": {
      "id": "member-uuid",
      "membershipNumber": "MEM-1234567890-ABCD",
      "qrCode": "qr-uuid",
      "qrCodeExpiry": "2024-01-16T08:30:00.000Z",
      "memberships": [
        {
          "id": "membership-uuid",
          "status": "ACTIVE",
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2024-12-31T23:59:59.000Z",
          "membershipType": {
            "name": "Premium Anual",
            "price": 1200.00,
            "durationDays": 365
          }
        }
      ]
    }
  }
}
```

### 14. Actualizar Perfil
```json
PUT /api/auth/profile
Authorization: Bearer jwt-token
Content-Type: application/json

{
  "firstName": "Juan Carlos",
  "lastName": "Pérez González",
  "phone": "+1234567892"
}
```

### 15. Cambiar Contraseña
```json
PUT /api/auth/change-password
Authorization: Bearer jwt-token
Content-Type: application/json

{
  "currentPassword": "miembro123",
  "newPassword": "nuevaPassword456"
}
```

---

## 🔍 Búsquedas y Filtros

### 16. Buscar Sucursales Cercanas
```json
GET /api/branches/nearby?city=Ciudad Principal&state=Estado

// Respuesta (sin autenticación requerida):
{
  "success": true,
  "data": [
    {
      "id": "branch-uuid",
      "name": "GymMaster Centro",
      "address": "Av. Principal 123, Centro",
      "city": "Ciudad Principal",
      "state": "Estado",
      "phone": "+1234567890",
      "openingTime": "06:00",
      "closingTime": "23:00"
    }
  ]
}
```

### 17. Historial de Check-ins (Miembro)
```json
GET /api/checkins?page=1&limit=10
Authorization: Bearer member-jwt-token

// Respuesta:
{
  "success": true,
  "data": {
    "checkIns": [
      {
        "id": "checkin-uuid",
        "checkInAt": "2024-01-15T08:30:00.000Z",
        "checkOutAt": "2024-01-15T10:15:00.000Z",
        "branch": {
          "name": "GymMaster Centro",
          "address": "Av. Principal 123, Centro",
          "city": "Ciudad Principal"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

## ⚠️ Manejo de Errores

### Errores Comunes

#### 401 - No autorizado
```json
{
  "success": false,
  "message": "Token de acceso requerido"
}
```

#### 403 - Sin permisos
```json
{
  "success": false,
  "message": "No tienes permisos para realizar esta acción"
}
```

#### 400 - Datos inválidos
```json
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido",
      "code": "invalid_string"
    }
  ]
}
```

#### 404 - No encontrado
```json
{
  "success": false,
  "message": "Registro no encontrado"
}
```

---

## 🔗 Headers Requeridos

### Autenticación
```
Authorization: Bearer jwt-token-aqui
```

### Content-Type
```
Content-Type: application/json
```

### CORS (desde frontend)
```
Origin: http://localhost:3001
```

---

## 📝 Notas Importantes

1. **Tokens JWT**: Expiran en 7 días por defecto
2. **QR Codes**: Expiran en 24 horas por defecto
3. **Rate Limiting**: 100 requests por 15 minutos por IP
4. **Paginación**: Por defecto page=1, limit=10, máximo limit=100
5. **Fechas**: Formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
6. **UUIDs**: Todos los IDs son UUID v4

### Roles y Permisos
- **ADMIN**: Acceso completo a todo
- **EMPLOYEE**: Gestión de sucursales, miembros y reportes
- **TRAINER**: Gestión de clases y miembros
- **MEMBER**: Solo su perfil, check-ins y historial