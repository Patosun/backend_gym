# Análisis de Normalización de Base de Datos - GymMaster

## Esquema Actual de la Base de Datos

### Tablas Principales:
1. **User** - Usuarios del sistema
2. **RefreshToken** - Tokens de autenticación
3. **Branch** - Sucursales del gimnasio
4. **Employee** - Empleados
5. **Trainer** - Entrenadores
6. **Member** - Miembros
7. **MembershipType** - Tipos de membresía
8. **Membership** - Membresías individuales
9. **CheckIn** - Registros de ingreso
10. **Class** - Clases del gimnasio
11. **Reservation** - Reservas de clases
12. **Payment** - Pagos
13. **AuditLog** - Registro de auditoría

---

## Análisis del Nivel de Normalización Actual

### **Estado Actual: 3FN (Tercera Forma Normal) ✅**

El esquema actual **YA ESTÁ NORMALIZADO** en Tercera Forma Normal. Aquí está el análisis:

#### ✅ **Primera Forma Normal (1FN) - CUMPLE**
- ✅ Cada campo contiene valores atómicos
- ✅ No hay grupos repetitivos
- ✅ Cada registro es único con clave primaria UUID
- ⚠️ **Excepción controlada**: `specialties` y `features` como arrays (PostgreSQL nativo)

#### ✅ **Segunda Forma Normal (2FN) - CUMPLE**  
- ✅ Está en 1FN
- ✅ No hay dependencias parciales de clave primaria
- ✅ Todas las tablas tienen clave primaria simple (UUID)

#### ✅ **Tercera Forma Normal (3FN) - CUMPLE**
- ✅ Está en 2FN  
- ✅ No hay dependencias transitivas
- ✅ Los atributos no clave dependen únicamente de la clave primaria

---

## Proceso Hipotético de Normalización

### **Simulación: De Estructura Desnormalizada a 3FN**

#### **Estructura Inicial Desnormalizada (0FN)**
```sql
-- Hipotética tabla desnormalizada inicial
GymData (
  user_id,
  user_email,
  user_name,
  user_phone,
  user_role,
  branch_name,
  branch_address,
  branch_phone,
  membership_type,
  membership_price,
  membership_duration,
  membership_features, -- "feature1,feature2,feature3"
  trainer_specialties, -- "yoga,pilates,crossfit"
  class_name,
  class_time,
  class_capacity,
  payment_amount,
  payment_method,
  payment_date
)
```

### **Paso 1: Alcanzar Primera Forma Normal (1FN)**

**Problemas identificados:**
- Campos multi-valor: `membership_features`, `trainer_specialties`
- Grupos repetitivos en una sola tabla

**Solución 1FN:**
```sql
-- Separar en tablas base
Users (id, email, name, phone, role)
Branches (id, name, address, phone)  
MembershipTypes (id, type, price, duration)
Classes (id, name, time, capacity)
Payments (id, amount, method, date, user_id)

-- Normalizar campos multi-valor
MembershipFeatures (membership_type_id, feature)
TrainerSpecialties (trainer_id, specialty)
```

### **Paso 2: Alcanzar Segunda Forma Normal (2FN)**

**Análisis de dependencias:**
- Eliminar dependencias parciales de claves compuestas

**Restructuración 2FN:**
```sql
-- Separar entidades con relaciones más específicas
Users (id, email, firstName, lastName, phone, role)
Members (id, userId, membershipNumber, dateOfBirth) 
Employees (id, userId, branchId, position, salary)
Trainers (id, userId, branchId, experience, hourlyRate)

-- Resolver dependencias parciales
MembershipTypes (id, name, description, durationDays, price)
Memberships (id, memberId, membershipTypeId, startDate, endDate)
```

### **Paso 3: Alcanzar Tercera Forma Normal (3FN)**

**Eliminar dependencias transitivas:**
- Separar atributos que dependen de otros atributos no clave

**Estructura Final 3FN (Estado Actual):**

#### **Tablas Principales**
```sql
-- Tabla base de usuarios
User (
  id UUID PK,
  email VARCHAR UNIQUE,
  password VARCHAR,
  firstName VARCHAR,
  lastName VARCHAR,
  phone VARCHAR,
  photo VARCHAR,
  role UserRole,
  isActive BOOLEAN,
  createdAt TIMESTAMP
)

-- Especialización por rol
Member (
  id UUID PK,
  userId UUID FK -> User.id,
  membershipNumber VARCHAR UNIQUE,
  dateOfBirth TIMESTAMP,
  emergencyContact VARCHAR,
  qrCode VARCHAR UNIQUE
)

Employee (
  id UUID PK,
  userId UUID FK -> User.id,
  branchId UUID FK -> Branch.id,
  position VARCHAR,
  salary DECIMAL,
  hireDate TIMESTAMP
)

Trainer (
  id UUID PK,
  userId UUID FK -> User.id,
  branchId UUID FK -> Branch.id,
  specialties VARCHAR[],
  experience INTEGER,
  certification VARCHAR
)

-- Entidades independientes
Branch (
  id UUID PK,
  name VARCHAR,
  address VARCHAR,
  city VARCHAR,
  state VARCHAR,
  openingTime VARCHAR,
  closingTime VARCHAR,
  createdById UUID FK -> User.id
)

MembershipType (
  id UUID PK,
  name VARCHAR UNIQUE,
  description VARCHAR,
  durationDays INTEGER,
  price DECIMAL,
  features VARCHAR[],
  maxClasses INTEGER
)

-- Relaciones
Membership (
  id UUID PK,
  memberId UUID FK -> Member.id,
  membershipTypeId UUID FK -> MembershipType.id,
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  status MembershipStatus,
  autoRenew BOOLEAN
)

Class (
  id UUID PK,
  name VARCHAR,
  branchId UUID FK -> Branch.id,
  trainerId UUID FK -> Trainer.id,
  capacity INTEGER,
  duration INTEGER,
  startTime TIMESTAMP,
  endTime TIMESTAMP,
  status ClassStatus
)

Reservation (
  id UUID PK,
  memberId UUID FK -> Member.id,
  classId UUID FK -> Class.id,
  trainerId UUID FK -> Trainer.id,
  status ReservationStatus,
  UNIQUE(memberId, classId)
)

Payment (
  id UUID PK,
  memberId UUID FK -> Member.id,
  membershipId UUID FK -> Membership.id,
  branchId UUID FK -> Branch.id,
  amount DECIMAL,
  method PaymentMethod,
  status PaymentStatus,
  paymentDate TIMESTAMP
)

CheckIn (
  id UUID PK,
  memberId UUID FK -> Member.id,
  branchId UUID FK -> Branch.id,
  checkInAt TIMESTAMP,
  checkOutAt TIMESTAMP
)
```

---

## **Diseño Final Normalizado**

### **Claves Primarias (PKs)**
- Todas las tablas usan **UUID** como clave primaria
- Garantiza unicidad global y mejor distribución

### **Claves Foráneas (FKs) y Relaciones**

#### **Relaciones 1:1**
- `User` ↔ `Member` (userId)
- `User` ↔ `Employee` (userId)  
- `User` ↔ `Trainer` (userId)

#### **Relaciones 1:N**
- `User` → `Branch` (createdBy)
- `Branch` → `Employee` (branchId)
- `Branch` → `Trainer` (branchId)
- `Branch` → `CheckIn` (branchId)
- `Branch` → `Class` (branchId)
- `Member` → `Membership` (memberId)
- `Member` → `CheckIn` (memberId)
- `Member` → `Payment` (memberId)
- `Member` → `Reservation` (memberId)
- `MembershipType` → `Membership` (membershipTypeId)
- `Trainer` → `Class` (trainerId)
- `Class` → `Reservation` (classId)

#### **Relaciones N:N**
- `Member` ↔ `Class` (a través de `Reservation`)

### **Índices de Rendimiento**
```sql
-- Índices únicos
UNIQUE INDEX users_email_idx ON users(email)
UNIQUE INDEX members_membership_number_idx ON members(membershipNumber)
UNIQUE INDEX members_qr_code_idx ON members(qrCode)

-- Índices compuestos
INDEX reservations_member_class_idx ON reservations(memberId, classId)
INDEX payments_member_date_idx ON payments(memberId, paymentDate)
INDEX checkins_member_branch_idx ON checkins(memberId, branchId)
```

### **Restricciones de Integridad**
```sql
-- Restricciones CHECK
CHECK (User.email LIKE '%@%')
CHECK (MembershipType.price >= 0)
CHECK (Class.capacity > 0)
CHECK (Class.endTime > Class.startTime)

-- Restricciones de eliminación
ON DELETE CASCADE: User -> Member/Employee/Trainer
ON DELETE CASCADE: Member -> Membership/CheckIn/Payment/Reservation
```

---

## **Conclusiones**

### ✅ **Fortalezas del Diseño Actual**
1. **Completamente normalizado** hasta 3FN
2. **Separación clara** de responsabilidades
3. **Integridad referencial** bien definida
4. **Flexibilidad** para diferentes tipos de usuario
5. **Auditoría** integrada para trazabilidad
6. **Escalabilidad** con UUID y estructura modular

### 🎯 **Beneficios de la Normalización Aplicada**
1. **Eliminación de redundancia** de datos
2. **Consistencia** en la información
3. **Facilidad de mantenimiento**
4. **Integridad** de datos garantizada
5. **Flexibilidad** para modificaciones futuras

### 📈 **Optimizaciones Implementadas**
- **Arrays nativos** de PostgreSQL para `specialties` y `features`
- **Enum types** para estados y tipos
- **Timestamps** automáticos para auditoría
- **Soft deletes** con campo `isActive`
- **UUIDs** para mejor distribución y seguridad

**El esquema actual representa un diseño óptimo en 3FN, balanceando normalización, performance y funcionalidad.**