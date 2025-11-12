# 🏋️‍♂️ GymMaster Backend – Sistema de Administración de Gimnasio

## 📘 Descripción del Proyecto

Este proyecto corresponde al **backend del sistema de administración de gimnasio GymMaster**, un sistema profesional diseñado para gestionar múltiples sucursales, miembros, entrenadores, planes de membresía y control de acceso mediante códigos QR.  
El backend proveerá servicios tanto para la aplicación de escritorio (administradores y empleados) desarrollada en **C# WPF**, como para la aplicación móvil de clientes desarrollada en **React Native (Expo)**.

---

## 🧩 Stack Tecnológico

| Área | Tecnologías |
|------|--------------|
| Lenguaje | JavaScript (Node.js) |
| Framework Backend | Express.js |
| ORM | Prisma (con PostgreSQL o MySQL) |
| Autenticación | JWT (JSON Web Token) |
| Validación de Datos | Zod |
| Documentación API | Swagger (via swagger-ui-express) |
| Entorno | Node.js + dotenv |

---

## 🏗️ Objetivo del Backend

El backend debe proveer una **API RESTful segura, modular y escalable** que permita:

- Gestionar **múltiples sucursales** del gimnasio.  
- Controlar **miembros** y sus **membresías** activas.  
- Registrar **check-ins mediante QR** válidos en cualquier sucursal.  
- Administrar **entrenadores**, **clases**, **horarios** y **reservas**.  
- Registrar **pagos en efectivo o mediante código QR** (sin integración de pasarelas).  
- Gestionar **roles y permisos** (administrador, empleado, entrenador, cliente).  
- Generar **reportes básicos** de uso y membresías.

---

## 📦 Módulos Principales

1. **Auth**
   - Registro e inicio de sesión (JWT).
   - Roles: `ADMIN`, `EMPLOYEE`, `TRAINER`, `MEMBER`.
   - Control de acceso basado en rol.
   - Recuperación de contraseña.

2. **Usuarios y Roles**
   - CRUD de usuarios.
   - Asignación de roles.
   - Perfil personal (datos, foto, contacto).

3. **Sucursales**
   - Registro y administración de sucursales.
   - Asociación de empleados y entrenadores.

4. **Miembros**
   - Registro de miembros y datos personales.
   - Asociación de membresías.
   - Historial de acceso y pagos.

5. **Membresías**
   - Tipos (mensual, anual, premium, etc.).
   - Fechas de inicio y expiración.
   - Renovación y suspensión.

6. **Check-In QR**
   - Generación de QR por miembro.
   - Validación del QR en cualquier sucursal.
   - Registro automático de fecha, hora y sucursal.

7. **Clases y Entrenadores**
   - Registro de clases.
   - Asignación de entrenadores y horarios.
   - Reservas de miembros.

8. **Pagos**
   - Registro de pagos **en efectivo o QR**.
   - Asociación con membresías.
   - Sin facturación electrónica ni integración de pasarelas.

9. **Reportes**
   - Listado de membresías activas/inactivas.
   - Reporte de asistencia.
   - Reporte de ingresos por sucursal.

---

## 🧱 Esquema de Base de Datos (Prisma)

Relaciones principales:

Sucursal (1) ────< Empleado >─── (1) Usuario
Sucursal (1) ────< CheckIn >─── (1) Miembro
Miembro (1) ────< Membresía >─── (1) TipoMembresía
Clase (1) ────< Reserva >─── (1) Miembro


Entidades clave:
- **Usuario**
- **Rol**
- **Sucursal**
- **Empleado**
- **Miembro**
- **TipoMembresía**
- **Membresía**
- **CheckIn**
- **Clase**
- **Entrenador**
- **Reserva**
- **Pago**

---

## ⚙️ Requisitos de Implementación

- Estructura modular (controllers, services, routes, middlewares, prisma).  
- Validación de entrada con **Zod**.  
- Documentación con **Swagger** (`/api-docs`).  
- Autenticación con **JWT** y middleware de roles.  
- Manejo centralizado de errores.  
- Variables de entorno con `.env`.  
- Hash de contraseñas con **bcrypt**.  

---

## 📂 Estructura de Carpetas Sugerida

gymmaster-backend/
├── prisma/
│ └── schema.prisma
├── src/
│ ├── app.js
│ ├── server.js
│ ├── config/
│ │ └── prisma.js
│ ├── middlewares/
│ │ └── auth.js
│ ├── modules/
│ │ ├── auth/
│ │ ├── users/
│ │ ├── branches/
│ │ ├── members/
│ │ ├── memberships/
│ │ ├── checkins/
│ │ ├── classes/
│ │ ├── payments/
│ │ └── reports/
│ ├── routes/
│ │ └── index.js
│ └── utils/
│ ├── jwt.js
│ └── zodSchemas.js
├── package.json
├── .env
└── README.md

---

## 🧰 Scripts NPM

```bash
npm run dev     # Modo desarrollo (con nodemon)
npm run start   # Producción
npx prisma db push   # Sincronizar esquema
npx prisma studio     # Ver la base de datos
