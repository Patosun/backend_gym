# 📊 Documentación de Base de Datos - GymMaster

## 🎯 Resumen General

La base de datos de GymMaster está diseñada para gestionar un sistema completo de administración de gimnasios con múltiples sucursales. Utiliza **PostgreSQL** como motor de base de datos y **Prisma** como ORM.

### 🔑 Características Principales
- ✅ Multi-sucursal
- ✅ Sistema de roles jerárquico  
- ✅ Check-in mediante QR
- ✅ Gestión de membresías flexible
- ✅ Pagos en efectivo y QR
- ✅ Sistema de clases y reservas
- ✅ Auditoría completa

---

## 📋 Índice de Contenidos
1. [Diagrama de Relaciones](#diagrama-de-relaciones)
2. [Enumeraciones (Enums)](#enumeraciones-enums)
3. [Entidades Principales](#entidades-principales)
4. [Relaciones entre Entidades](#relaciones-entre-entidades)
5. [Índices y Optimizaciones](#índices-y-optimizaciones)
6. [Casos de Uso Comunes](#casos-de-uso-comunes)

---

## 🔀 Diagrama de Relaciones

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │──────▶│   Branch    │◀─────▶│  Employee   │
│             │       │             │       │             │
└─────────────┘       └─────────────┘       └─────────────┘
       │                      │                     
       │                      │              ┌─────────────┐
       ▼                      └─────────────▶│   Trainer   │
┌─────────────┐                              │             │
│   Member    │                              └─────────────┘
│             │                                     │
└─────────────┘                                     │
       │                                            │
       │                ┌─────────────┐            │
       └───────────────▶│  CheckIn    │◀───────────┘
       │                │             │
       │                └─────────────┘
       │
       │                ┌─────────────┐       ┌─────────────┐
       └───────────────▶│ Membership  │──────▶│MembershipType│
       │                │             │       │             │
       │                └─────────────┘       └─────────────┘
       │
       │                ┌─────────────┐       ┌─────────────┐
       └───────────────▶│  Payment    │       │    Class    │
       │                │             │       │             │
       │                └─────────────┘       └─────────────┘
       │                                             │
       │                ┌─────────────┐              │
       └───────────────▶│ Reservation │◀─────────────┘
                        │             │
                        └─────────────┘
```

---

## 📊 Enumeraciones (Enums)

### 👤 UserRole
Define los roles de usuario en el sistema
```prisma
enum UserRole {
  ADMIN      // Administrador del sistema (acceso total)
  EMPLOYEE   // Empleado de sucursal (gestión operativa)
  TRAINER    // Entrenador (gestión de clases)
  MEMBER     // Miembro del gimnasio (acceso básico)
}
```

### 🎫 MembershipStatus
Estados posibles de una membresía
```prisma
enum MembershipStatus {
  ACTIVE     // Membresía activa y válida
  EXPIRED    // Membresía vencida
  SUSPENDED  // Membresía suspendida temporalmente
  CANCELLED  // Membresía cancelada permanentemente
}
```

### 💳 PaymentMethod
Métodos de pago aceptados
```prisma
enum PaymentMethod {
  CASH  // Pago en efectivo
  QR    // Pago mediante código QR
}
```

### 📋 PaymentStatus
Estados de procesamiento de pagos
```prisma
enum PaymentStatus {
  PENDING    // Pago pendiente
  COMPLETED  // Pago completado exitosamente
  CANCELLED  // Pago cancelado
}
```

### 🏃 ClassStatus
Estados de las clases
```prisma
enum ClassStatus {
  SCHEDULED    // Clase programada
  IN_PROGRESS  // Clase en progreso
  COMPLETED    // Clase completada
  CANCELLED    // Clase cancelada
}
```

### 📅 ReservationStatus
Estados de las reservas
```prisma
enum ReservationStatus {
  CONFIRMED  // Reserva confirmada
  CANCELLED  // Reserva cancelada
  COMPLETED  // Asistió a la clase
  NO_SHOW    // No se presentó
}
```

---

## 🗂️ Entidades Principales

### 👤 User (users)
**Propósito**: Entidad central que representa a todos los usuarios del sistema

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `email` | String | Email del usuario | Único, Requerido |
| `password` | String | Contraseña hasheada | Requerido |
| `firstName` | String | Nombre | Requerido |
| `lastName` | String | Apellido | Requerido |
| `phone` | String? | Teléfono | Opcional |
| `photo` | String? | URL de foto de perfil | Opcional |
| `role` | UserRole | Rol del usuario | Default: MEMBER |
| `isActive` | Boolean | Estado activo | Default: true |
| `emailVerified` | Boolean | Email verificado | Default: false |
| `lastLogin` | DateTime? | Último inicio de sesión | Opcional |
| `createdAt` | DateTime | Fecha de creación | Auto-generado |
| `updatedAt` | DateTime | Fecha de actualización | Auto-actualizado |

**Relaciones**:
- `employee`: Uno a uno con Employee (si es empleado)
- `trainer`: Uno a uno con Trainer (si es entrenador)
- `member`: Uno a uno con Member (si es miembro)
- `createdBranches`: Uno a muchos con Branch (sucursales creadas)

---

### 🏢 Branch (branches)
**Propósito**: Representa las sucursales del gimnasio

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `name` | String | Nombre de la sucursal | Requerido |
| `address` | String | Dirección completa | Requerido |
| `phone` | String? | Teléfono | Opcional |
| `email` | String? | Email de contacto | Opcional |
| `city` | String | Ciudad | Requerido |
| `state` | String | Estado/Provincia | Requerido |
| `zipCode` | String? | Código postal | Opcional |
| `isActive` | Boolean | Estado activo | Default: true |
| `openingTime` | String | Hora de apertura | Formato: "06:00" |
| `closingTime` | String | Hora de cierre | Formato: "23:00" |
| `createdById` | String | ID del creador | FK a User |

**Relaciones**:
- `createdBy`: Muchos a uno con User
- `employees`: Uno a muchos con Employee
- `trainers`: Uno a muchos con Trainer
- `checkIns`: Uno a muchos con CheckIn
- `classes`: Uno a muchos con Class
- `payments`: Uno a muchos con Payment

---

### 💼 Employee (employees)
**Propósito**: Información específica de empleados

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `userId` | String | Referencia al usuario | FK único a User |
| `branchId` | String | Sucursal asignada | FK a Branch |
| `position` | String | Cargo/Posición | Requerido |
| `salary` | Decimal? | Salario | Opcional |
| `hireDate` | DateTime | Fecha de contratación | Requerido |
| `isActive` | Boolean | Estado activo | Default: true |

---

### 🏋️ Trainer (trainers)
**Propósito**: Información específica de entrenadores

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `userId` | String | Referencia al usuario | FK único a User |
| `branchId` | String | Sucursal asignada | FK a Branch |
| `specialties` | String[] | Especialidades | Array de strings |
| `experience` | Int | Años de experiencia | Requerido |
| `certification` | String? | Certificaciones | Opcional |
| `hourlyRate` | Decimal? | Tarifa por hora | Opcional |
| `isActive` | Boolean | Estado activo | Default: true |
| `bio` | String? | Biografía | Opcional |

---

### 👥 Member (members)
**Propósito**: Información específica de miembros del gimnasio

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `userId` | String | Referencia al usuario | FK único a User |
| `membershipNumber` | String | Número de membresía | Único, Requerido |
| `dateOfBirth` | DateTime? | Fecha de nacimiento | Opcional |
| `emergencyContact` | String? | Contacto de emergencia | Opcional |
| `emergencyPhone` | String? | Teléfono de emergencia | Opcional |
| `medicalNotes` | String? | Notas médicas | Opcional |
| `qrCode` | String | Código QR para check-in | Único, Requerido |
| `qrCodeExpiry` | DateTime | Expiración del QR | Requerido |
| `isActive` | Boolean | Estado activo | Default: true |
| `joinDate` | DateTime | Fecha de registro | Default: now() |

**Relaciones**:
- `user`: Muchos a uno con User
- `memberships`: Uno a muchos con Membership
- `checkIns`: Uno a muchos con CheckIn
- `payments`: Uno a muchos con Payment
- `reservations`: Uno a muchos con Reservation

---

### 📋 MembershipType (membership_types)
**Propósito**: Define los tipos de membresía disponibles

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `name` | String | Nombre del tipo | Único, Requerido |
| `description` | String? | Descripción | Opcional |
| `durationDays` | Int | Duración en días | Requerido |
| `price` | Decimal | Precio | Requerido |
| `features` | String[] | Características incluidas | Array de strings |
| `isActive` | Boolean | Estado activo | Default: true |
| `maxClasses` | Int? | Máximo de clases por mes | null = ilimitado |

---

### 🎫 Membership (memberships)
**Propósito**: Membresías activas de los miembros

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `memberId` | String | Referencia al miembro | FK a Member |
| `membershipTypeId` | String | Tipo de membresía | FK a MembershipType |
| `startDate` | DateTime | Fecha de inicio | Requerido |
| `endDate` | DateTime | Fecha de vencimiento | Requerido |
| `status` | MembershipStatus | Estado | Default: ACTIVE |
| `autoRenew` | Boolean | Renovación automática | Default: false |
| `notes` | String? | Notas adicionales | Opcional |

---

### ✅ CheckIn (check_ins)
**Propósito**: Registro de entradas y salidas de miembros

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `memberId` | String | Referencia al miembro | FK a Member |
| `branchId` | String | Sucursal del check-in | FK a Branch |
| `checkInAt` | DateTime | Hora de entrada | Default: now() |
| `checkOutAt` | DateTime? | Hora de salida | Opcional |
| `notes` | String? | Notas | Opcional |

---

### 🏃 Class (classes)
**Propósito**: Clases grupales ofrecidas en las sucursales

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `name` | String | Nombre de la clase | Requerido |
| `description` | String? | Descripción | Opcional |
| `branchId` | String | Sucursal | FK a Branch |
| `trainerId` | String | Entrenador asignado | FK a Trainer |
| `capacity` | Int | Capacidad máxima | Requerido |
| `duration` | Int | Duración en minutos | Requerido |
| `startTime` | DateTime | Hora de inicio | Requerido |
| `endTime` | DateTime | Hora de fin | Requerido |
| `status` | ClassStatus | Estado | Default: SCHEDULED |
| `isRecurring` | Boolean | Clase recurrente | Default: false |
| `price` | Decimal? | Precio adicional | Opcional |

---

### 📅 Reservation (reservations)
**Propósito**: Reservas de miembros para clases

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `memberId` | String | Miembro que reserva | FK a Member |
| `classId` | String | Clase reservada | FK a Class |
| `trainerId` | String? | Entrenador (opcional) | FK a Trainer |
| `status` | ReservationStatus | Estado de la reserva | Default: CONFIRMED |
| `notes` | String? | Notas | Opcional |

**Restricciones**:
- `@@unique([memberId, classId])`: Un miembro no puede reservar la misma clase dos veces

---

### 💰 Payment (payments)
**Propósito**: Registro de todos los pagos del sistema

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `memberId` | String | Miembro que paga | FK a Member |
| `membershipId` | String? | Membresía relacionada | FK a Membership |
| `branchId` | String | Sucursal del pago | FK a Branch |
| `amount` | Decimal | Monto del pago | Requerido |
| `method` | PaymentMethod | Método de pago | CASH o QR |
| `status` | PaymentStatus | Estado del pago | Default: PENDING |
| `description` | String? | Descripción | Opcional |
| `reference` | String? | Referencia/Recibo | Opcional |
| `paymentDate` | DateTime | Fecha de pago | Default: now() |
| `dueDate` | DateTime? | Fecha de vencimiento | Opcional |
| `notes` | String? | Notas adicionales | Opcional |

---

### 📝 AuditLog (audit_logs)
**Propósito**: Registro de auditoría para trazabilidad

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único | PK, Auto-generado |
| `userId` | String? | Usuario que realizó la acción | Opcional |
| `action` | String | Acción realizada | Requerido |
| `entity` | String | Entidad afectada | Requerido |
| `entityId` | String? | ID de la entidad | Opcional |
| `oldValues` | Json? | Valores anteriores | Opcional |
| `newValues` | Json? | Valores nuevos | Opcional |
| `timestamp` | DateTime | Momento de la acción | Default: now() |
| `ipAddress` | String? | Dirección IP | Opcional |
| `userAgent` | String? | User Agent | Opcional |

---

## 🔗 Relaciones entre Entidades

### 🔄 Relaciones Principales

#### User → Employee/Trainer/Member
```
User (1) ←→ (0..1) Employee
User (1) ←→ (0..1) Trainer  
User (1) ←→ (0..1) Member
```
Un usuario puede tener uno de los roles específicos (Employee, Trainer, Member), pero no múltiples.

#### Branch → Users
```
Branch (1) ←→ (N) Employee
Branch (1) ←→ (N) Trainer
Branch (1) ←→ (N) CheckIn
```
Una sucursal puede tener múltiples empleados, entrenadores y check-ins.

#### Member → Memberships
```
Member (1) ←→ (N) Membership
MembershipType (1) ←→ (N) Membership
```
Un miembro puede tener múltiples membresías a lo largo del tiempo, pero típicamente solo una activa.

#### Member → CheckIn
```
Member (1) ←→ (N) CheckIn
Branch (1) ←→ (N) CheckIn
```
Un miembro puede hacer check-in en cualquier sucursal del sistema.

#### Class → Reservation
```
Class (1) ←→ (N) Reservation
Member (1) ←→ (N) Reservation
Trainer (1) ←→ (N) Reservation
```
Las clases pueden tener múltiples reservas, limitadas por la capacidad.

---

## 🚀 Índices y Optimizaciones

### Índices Automáticos (Prisma)
- **Primary Keys**: Todos los campos `id`
- **Unique Constraints**: 
  - `users.email`
  - `members.membershipNumber`
  - `members.qrCode`
  - `membership_types.name`
  - `reservations(memberId, classId)`

### Índices Recomendados para Producción
```sql
-- Optimizar consultas de check-in
CREATE INDEX idx_checkins_member_date ON check_ins(member_id, check_in_at);
CREATE INDEX idx_checkins_branch_date ON check_ins(branch_id, check_in_at);

-- Optimizar consultas de membresías
CREATE INDEX idx_memberships_status_dates ON memberships(status, start_date, end_date);
CREATE INDEX idx_memberships_member_status ON memberships(member_id, status);

-- Optimizar consultas de pagos
CREATE INDEX idx_payments_member_date ON payments(member_id, payment_date);
CREATE INDEX idx_payments_branch_date ON payments(branch_id, payment_date);
CREATE INDEX idx_payments_status_method ON payments(status, method);

-- Optimizar consultas de clases
CREATE INDEX idx_classes_branch_date ON classes(branch_id, start_time);
CREATE INDEX idx_classes_trainer_date ON classes(trainer_id, start_time);

-- Optimizar auditoría
CREATE INDEX idx_audit_entity_timestamp ON audit_logs(entity, timestamp);
CREATE INDEX idx_audit_user_timestamp ON audit_logs(user_id, timestamp);
```

---

## 💡 Casos de Uso Comunes

### 1. Check-in de Miembro
```sql
-- Buscar miembro por QR
SELECT m.*, u.first_name, u.last_name 
FROM members m 
JOIN users u ON m.user_id = u.id 
WHERE m.qr_code = ? AND m.qr_code_expiry > NOW();

-- Verificar membresía activa
SELECT * FROM memberships 
WHERE member_id = ? AND status = 'ACTIVE' 
AND start_date <= NOW() AND end_date >= NOW();

-- Crear check-in
INSERT INTO check_ins (member_id, branch_id, check_in_at) 
VALUES (?, ?, NOW());
```

### 2. Reporte de Asistencia Diaria
```sql
SELECT 
    b.name as branch_name,
    COUNT(c.id) as total_checkins,
    COUNT(DISTINCT c.member_id) as unique_members
FROM check_ins c
JOIN branches b ON c.branch_id = b.id
WHERE DATE(c.check_in_at) = CURRENT_DATE
GROUP BY b.id, b.name;
```

### 3. Membresías por Vencer
```sql
SELECT 
    u.first_name, u.last_name, u.email,
    m.membership_number,
    ms.end_date,
    mt.name as membership_type
FROM memberships ms
JOIN members m ON ms.member_id = m.id
JOIN users u ON m.user_id = u.id
JOIN membership_types mt ON ms.membership_type_id = mt.id
WHERE ms.status = 'ACTIVE' 
AND ms.end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
ORDER BY ms.end_date;
```

### 4. Ingresos por Sucursal
```sql
SELECT 
    b.name as branch_name,
    b.city,
    SUM(p.amount) as total_revenue,
    COUNT(p.id) as total_payments
FROM payments p
JOIN branches b ON p.branch_id = b.id
WHERE p.status = 'COMPLETED'
AND p.payment_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY b.id, b.name, b.city
ORDER BY total_revenue DESC;
```

### 5. Clases Más Populares
```sql
SELECT 
    cl.name as class_name,
    b.name as branch_name,
    COUNT(r.id) as reservations_count,
    cl.capacity,
    ROUND((COUNT(r.id)::float / cl.capacity) * 100, 2) as occupancy_rate
FROM classes cl
JOIN branches b ON cl.branch_id = b.id
LEFT JOIN reservations r ON cl.id = r.class_id 
WHERE r.status = 'CONFIRMED'
AND cl.start_time >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY cl.id, cl.name, b.name, cl.capacity
ORDER BY occupancy_rate DESC;
```

---

## 🔒 Consideraciones de Seguridad

### Datos Sensibles
- **Contraseñas**: Hasheadas con bcrypt (rounds: 12)
- **QR Codes**: UUID únicos con expiración
- **Información Personal**: Encriptada a nivel de aplicación si es necesario

### Auditoría
- Todas las operaciones críticas se registran en `audit_logs`
- Incluye: usuario, acción, entidad, valores anteriores/nuevos, timestamp, IP

### Soft Deletes
- Entidades principales usan `isActive` en lugar de eliminación física
- Preserva integridad referencial y auditoría

---

## 📈 Escalabilidad

### Particionamiento Recomendado
```sql
-- Particionar check_ins por fecha (mensual)
CREATE TABLE check_ins_y2024m01 PARTITION OF check_ins
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Particionar audit_logs por fecha (trimestral)
CREATE TABLE audit_logs_y2024q1 PARTITION OF audit_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
```

### Archivado de Datos
- Check-ins antiguos (>2 años) → Tabla de archivo
- Audit logs antiguos (>1 año) → Almacenamiento en frío
- Pagos completados (>5 años) → Archivo con retención legal

---

## 🛠️ Comandos Útiles de Prisma

```bash
# Generar cliente
npx prisma generate

# Sincronizar esquema
npx prisma db push

# Ver base de datos
npx prisma studio

# Crear migración
npx prisma migrate dev --name descripcion_cambio

# Resetear base de datos (CUIDADO)
npx prisma migrate reset
```

---

Esta documentación proporciona una visión completa de la estructura de la base de datos GymMaster, facilitando el desarrollo, mantenimiento y escalabilidad del sistema.