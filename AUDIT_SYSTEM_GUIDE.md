# Sistema de Auditoría - GymMaster

## 📋 Descripción General

El sistema de auditoría implementado en GymMaster proporciona un registro completo y automático de todas las acciones críticas realizadas en el sistema, permitiendo trazabilidad, seguridad y cumplimiento normativo.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **AuditService** (`src/services/auditService.js`)
   - Servicio central de auditoría
   - Manejo de logs de auditoría
   - Consultas y estadísticas
   - Sanitización de datos sensibles

2. **AuditMiddleware** (`src/middlewares/audit.js`)
   - Middleware automático para requests HTTP
   - Auditoría de autenticación
   - Helpers para auditoría manual

3. **AuditController** (`src/modules/audit/auditController.js`)
   - Endpoints para consultar logs
   - Estadísticas de auditoría
   - Mantenimiento de logs

4. **AuditRoutes** (`src/modules/audit/auditRoutes.js`)
   - Rutas de API para auditoría
   - Control de acceso (solo ADMIN)

## 🚀 Funcionalidades

### 1. Auditoría Automática

El middleware de auditoría registra automáticamente:
- ✅ Creación de entidades (POST)
- ✅ Actualización de entidades (PUT/PATCH)
- ✅ Eliminación de entidades (DELETE)
- ✅ Eventos de autenticación (LOGIN/LOGOUT)
- ✅ Acciones especiales (CONFIRM, CANCEL, CHECK_IN, etc.)

### 2. Información Capturada

Cada log de auditoría incluye:
```javascript
{
  id: "uuid",
  userId: "uuid del usuario",
  action: "CREATE|UPDATE|DELETE|LOGIN|etc",
  entity: "User|Member|Payment|etc",
  entityId: "uuid de la entidad",
  oldValues: { /* valores anteriores */ },
  newValues: { /* valores nuevos */ },
  timestamp: "2025-11-26T10:30:00Z",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
}
```

### 3. Protección de Datos Sensibles

El sistema automáticamente oculta campos sensibles:
- Contraseñas
- Tokens de autenticación
- Secretos OTP
- Refresh tokens

## 📚 Guía de Uso

### Auditoría Automática (Recomendado)

La auditoría automática ya está activada para todos los endpoints. No requiere código adicional:

```javascript
// Ejemplo: El siguiente endpoint se audita automáticamente
router.post('/users', authenticateToken, createUser);

// Al crear un usuario, se registrará automáticamente:
// - Action: CREATE
// - Entity: User
// - NewValues: datos del usuario (sin password)
// - IP y UserAgent del cliente
```

### Auditoría Manual en Controladores

Para casos específicos donde necesites más control:

```javascript
const { audit } = require('../../middlewares/audit');

// En tu controlador
async createPayment(req, res) {
  try {
    const payment = await paymentService.create(req.body);
    
    // Auditar manualmente con detalles adicionales
    await audit.create(req, 'Payment', payment.id, {
      amount: payment.amount,
      method: payment.method,
      memberId: payment.memberId
    });
    
    res.json({ success: true, payment });
  } catch (error) {
    // ...
  }
}

// Auditar actualización con valores anteriores y nuevos
async updatePayment(req, res) {
  const oldPayment = await paymentService.getById(req.params.id);
  const updatedPayment = await paymentService.update(req.params.id, req.body);
  
  await audit.update(
    req,
    'Payment',
    req.params.id,
    oldPayment,
    updatedPayment
  );
}

// Auditar evento personalizado
async confirmPayment(req, res) {
  const payment = await paymentService.confirm(req.params.id);
  
  await audit.log(req, 'PAYMENT_CONFIRMED', 'Payment', {
    paymentId: payment.id,
    amount: payment.amount,
    confirmedBy: req.user.id
  });
}
```

### Auditoría de Autenticación

```javascript
const { auditAuth } = require('../../middlewares/audit');

// En rutas de autenticación
router.post('/login', 
  auditAuth('LOGIN'), // Middleware que audita el login
  authController.login
);

router.post('/logout',
  authenticateToken,
  auditAuth('LOGOUT'),
  authController.logout
);
```

## 🔍 Consultas de Auditoría

### Endpoints Disponibles

#### 1. Obtener Logs con Filtros
```http
GET /api/audit/logs?page=1&limit=50&userId=xxx&action=CREATE&entity=Payment
```

Parámetros de filtro:
- `page` - Número de página
- `limit` - Elementos por página
- `userId` - Filtrar por usuario
- `action` - Filtrar por acción (CREATE, UPDATE, DELETE, etc.)
- `entity` - Filtrar por entidad (User, Payment, Member, etc.)
- `entityId` - Filtrar por ID de entidad
- `startDate` - Fecha inicio (ISO 8601)
- `endDate` - Fecha fin (ISO 8601)

#### 2. Historial de una Entidad
```http
GET /api/audit/entity/Payment/uuid-del-pago
```

Obtiene todo el historial de cambios de un pago específico.

#### 3. Actividad de un Usuario
```http
GET /api/audit/user/uuid-del-usuario?page=1&limit=50
```

Obtiene todas las acciones realizadas por un usuario.

#### 4. Estadísticas de Auditoría
```http
GET /api/audit/stats?startDate=2025-01-01&endDate=2025-12-31
```

Respuesta:
```json
{
  "success": true,
  "stats": {
    "totalLogs": 15420,
    "actionBreakdown": [
      { "action": "CREATE", "count": 5234 },
      { "action": "UPDATE", "count": 8120 },
      { "action": "DELETE", "count": 856 },
      { "action": "LOGIN", "count": 1210 }
    ],
    "entityBreakdown": [
      { "entity": "Payment", "count": 4230 },
      { "entity": "Member", "count": 2150 },
      { "entity": "User", "count": 1890 }
    ],
    "topUsers": [
      { "userId": "uuid", "count": 523 }
    ]
  }
}
```

#### 5. Limpiar Logs Antiguos
```http
DELETE /api/audit/cleanup?days=90
```

Elimina logs más antiguos que 90 días (configurable).

## 🛡️ Seguridad y Permisos

### Control de Acceso

- **Consulta de logs**: Solo ADMIN
- **Estadísticas**: Solo ADMIN
- **Historial de entidad**: Solo ADMIN
- **Actividad de usuario**: ADMIN o el mismo usuario
- **Limpieza de logs**: Solo ADMIN

### Datos Protegidos

Campos que se ocultan automáticamente:
```javascript
{
  password: '[REDACTED]',
  otpSecret: '[REDACTED]',
  otpCode: '[REDACTED]',
  token: '[REDACTED]',
  refreshToken: '[REDACTED]',
  accessToken: '[REDACTED]'
}
```

## 📊 Casos de Uso Comunes

### 1. Investigar Cambios en un Pago
```javascript
// Obtener historial completo de un pago
GET /api/audit/entity/Payment/payment-uuid

// Ver quién modificó el pago y cuándo
// Comparar valores anteriores y nuevos
```

### 2. Auditar Actividad de un Usuario Sospechoso
```javascript
// Ver todas las acciones de un usuario
GET /api/audit/user/user-uuid?page=1&limit=100

// Filtrar por rango de fechas
GET /api/audit/user/user-uuid?startDate=2025-11-01&endDate=2025-11-26
```

### 3. Reportes de Cumplimiento
```javascript
// Estadísticas del último mes
GET /api/audit/stats?startDate=2025-11-01&endDate=2025-11-30

// Todos los pagos procesados
GET /api/audit/logs?entity=Payment&action=CREATE&startDate=2025-11-01
```

### 4. Análisis de Seguridad
```javascript
// Ver todos los intentos de login
GET /api/audit/logs?action=LOGIN&startDate=2025-11-26

// Detectar accesos desde IPs inusuales
// Revisar userAgent para detectar bots
```

## 🔧 Mantenimiento

### Limpieza Automática (Programada)

Se recomienda crear un cronjob para limpiar logs antiguos:

```javascript
// scripts/cleanupAuditLogs.js
const auditService = require('../src/services/auditService');

async function cleanup() {
  const result = await auditService.cleanOldLogs(90); // 90 días
  console.log(`Eliminados ${result.deleted} logs anteriores a ${result.cutoffDate}`);
}

cleanup();
```

Configurar en crontab (Linux):
```bash
# Limpiar logs cada domingo a las 2 AM
0 2 * * 0 node /path/to/scripts/cleanupAuditLogs.js
```

### Monitoreo de Crecimiento

```sql
-- Ver tamaño de la tabla de auditoría
SELECT 
  pg_size_pretty(pg_total_relation_size('audit_logs')) as size,
  COUNT(*) as total_logs
FROM audit_logs;

-- Logs por mes
SELECT 
  DATE_TRUNC('month', timestamp) as month,
  COUNT(*) as logs_count
FROM audit_logs
GROUP BY month
ORDER BY month DESC;
```

## 📈 Mejores Prácticas

### 1. Qué Auditar
✅ **SÍ auditar:**
- Cambios en datos financieros (pagos, membresías)
- Creación/modificación de usuarios
- Cambios en permisos y roles
- Acceso a información sensible
- Operaciones administrativas

❌ **NO auditar:**
- Consultas simples (GET)
- Operaciones de lectura
- Health checks
- Requests a documentación

### 2. Rendimiento
- El middleware usa `setImmediate()` para no bloquear respuestas
- Los logs se escriben de forma asíncrona
- No afecta la velocidad de respuesta al usuario

### 3. Almacenamiento
- Implementar rotación de logs (90-180 días recomendado)
- Considerar archivar logs antiguos en almacenamiento frío
- Monitorear crecimiento de la base de datos

### 4. Análisis
- Revisar logs periódicamente para detectar patrones
- Configurar alertas para acciones críticas
- Generar reportes mensuales de actividad

## 🎯 Acciones Auditadas Automáticamente

| Acción | Descripción | Entidad |
|--------|-------------|---------|
| CREATE | Creación de registro | Todas |
| UPDATE | Actualización de registro | Todas |
| DELETE | Eliminación de registro | Todas |
| LOGIN | Inicio de sesión | Auth |
| LOGOUT | Cierre de sesión | Auth |
| REGISTER | Registro de nuevo usuario | User |
| CHECK_IN | Ingreso al gimnasio | CheckIn |
| CHECK_OUT | Salida del gimnasio | CheckIn |
| PAYMENT_CONFIRMED | Confirmación de pago | Payment |
| CLASS_CANCELLED | Cancelación de clase | Class |
| RESERVATION_CONFIRMED | Confirmación de reserva | Reservation |

## 🔄 Integración con Otros Sistemas

### Exportar a SIEM (Security Information and Event Management)
```javascript
// Ejemplo: enviar logs críticos a un SIEM
const auditService = require('./auditService');

auditService.log = async function(data) {
  const log = await prisma.auditLog.create({ data });
  
  // Si es acción crítica, enviar a SIEM
  if (['DELETE', 'PAYMENT_CONFIRMED'].includes(data.action)) {
    await sendToSIEM(log);
  }
  
  return log;
};
```

### Webhooks para Notificaciones
```javascript
// Notificar administradores de acciones críticas
if (data.action === 'DELETE' && data.entity === 'Payment') {
  await notifyAdmins({
    message: `Pago ${data.entityId} eliminado por ${data.userId}`,
    severity: 'HIGH'
  });
}
```

## 📝 Ejemplo Completo de Uso

```javascript
// src/modules/payments/paymentController.js
const { audit } = require('../../middlewares/audit');
const paymentService = require('./paymentService');

const paymentController = {
  async confirmPayment(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener pago antes de confirmar
      const payment = await paymentService.getById(id);
      
      if (payment.status === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'El pago ya está confirmado'
        });
      }
      
      // Confirmar pago
      const confirmedPayment = await paymentService.confirm(id);
      
      // Auditar la confirmación
      await audit.log(req, 'PAYMENT_CONFIRMED', 'Payment', {
        paymentId: id,
        amount: confirmedPayment.amount,
        method: confirmedPayment.method,
        previousStatus: payment.status,
        newStatus: confirmedPayment.status,
        confirmedBy: req.user.id,
        confirmedAt: new Date()
      });
      
      res.json({
        success: true,
        message: 'Pago confirmado exitosamente',
        payment: confirmedPayment
      });
      
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error al confirmar pago'
      });
    }
  }
};
```

## 🎓 Conclusión

El sistema de auditoría está completamente integrado y funcionando automáticamente. Proporciona:

- ✅ Trazabilidad completa de acciones
- ✅ Cumplimiento normativo
- ✅ Seguridad mejorada
- ✅ Análisis de actividad
- ✅ Detección de anomalías
- ✅ Fácil integración y uso

**¡El sistema está listo para usar sin configuración adicional!**