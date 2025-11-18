const { z } = require('zod');

// Common schemas
const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');
const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Número de teléfono inválido').optional();

// User schemas
const userCreateSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string()
    .min(1, 'Nombre requerido')
    .max(100, 'Nombre demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Nombre solo debe contener letras'),
  lastName: z.string()
    .min(1, 'Apellido requerido')
    .max(100, 'Apellido demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Apellido solo debe contener letras'),
  phone: z.string()
    .regex(/^\+?[\d\s-()]+$/, 'Número de teléfono inválido')
    .min(8, 'Teléfono muy corto')
    .max(8, 'Teléfono muy largo')
    .optional(),
  role: z.enum(['ADMIN', 'EMPLOYEE', 'TRAINER', 'MEMBER']).default('MEMBER'),
}).refine((data) => {
  // Validar que la contraseña no contenga el email o nombre
  const lowerPassword = data.password.toLowerCase();
  const lowerEmail = data.email.toLowerCase();
  const lowerFirstName = data.firstName.toLowerCase();
  
  if (lowerPassword.includes(lowerEmail.split('@')[0]) || 
      lowerPassword.includes(lowerFirstName)) {
    return false;
  }
  return true;
}, {
  message: 'La contraseña no puede contener el email o nombre',
  path: ['password']
});

const userUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: phoneSchema,
  photo: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
});

const checkEmailSchema = z.object({
  email: emailSchema,
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

// Branch schemas
const branchCreateSchema = z.object({
  name: z.string().min(1, 'Nombre de sucursal requerido'),
  address: z.string().min(1, 'Dirección requerida'),
  phone: phoneSchema,
  email: emailSchema.optional(),
  city: z.string().min(1, 'Ciudad requerida'),
  state: z.string().min(1, 'Estado requerido'),
  zipCode: z.string().optional(),
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)'),
});

const branchUpdateSchema = branchCreateSchema.partial();

// Member schemas
const memberCreateSchema = z.object({
  userId: z.string().uuid(),
  dateOfBirth: z.string().datetime().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: phoneSchema,
  medicalNotes: z.string().optional(),
});

const memberUpdateSchema = memberCreateSchema.partial().omit({ userId: true });

// Membership Type schemas
const membershipTypeCreateSchema = z.object({
  name: z.string().min(1, 'Nombre del tipo de membresía requerido'),
  description: z.string().optional(),
  durationDays: z.number().int().positive('Duración debe ser un número positivo'),
  price: z.number().positive('Precio debe ser positivo'),
  features: z.array(z.string()).optional(),
  maxClasses: z.number().int().positive().optional(),
});

const membershipTypeUpdateSchema = membershipTypeCreateSchema.partial();

// Membership schemas
const membershipCreateSchema = z.object({
  memberId: z.string().uuid(),
  membershipTypeId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  autoRenew: z.boolean().optional(),
  notes: z.string().optional(),
});

const membershipUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED']).optional(),
  autoRenew: z.boolean().optional(),
  notes: z.string().optional(),
});

// Check-in schemas
const checkInCreateSchema = z.object({
  qrCode: z.string().min(1, 'Código QR requerido'),
  branchId: z.string().uuid(),
});

const checkOutSchema = z.object({
  checkInId: z.string().uuid(),
  notes: z.string().optional(),
});

// Class schemas
const classCreateSchema = z.object({
  name: z.string().min(1, 'Nombre de clase requerido'),
  description: z.string().optional(),
  branchId: z.string().uuid(),
  trainerId: z.string().uuid(),
  capacity: z.number().int().positive('Capacidad debe ser positiva'),
  duration: z.number().int().positive('Duración debe ser positiva'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  isRecurring: z.boolean().optional(),
  price: z.number().positive().optional(),
});

const classUpdateSchema = classCreateSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

const classFiltersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  branchId: z.string().uuid().optional(),
  trainerId: z.string().uuid().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Reservation schemas
const createReservationSchema = z.object({
  memberId: z.string().uuid(),
  notes: z.string().optional(),
});

const updateReservationSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
});

const memberReservationFiltersSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']).optional(),
  upcoming: z.boolean().optional(),
});

// Payment schemas
const paymentCreateSchema = z.object({
  memberId: z.string().uuid(),
  membershipId: z.string().uuid().optional(),
  branchId: z.string().uuid(),
  amount: z.number().positive('Monto debe ser positivo'),
  method: z.enum(['CASH', 'CARD', 'QR']),
  description: z.string().optional(),
  reference: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const paymentUpdateSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

// Employee schemas
const employeeCreateSchema = z.object({
  userId: z.string().uuid(),
  branchId: z.string().uuid(),
  position: z.string().min(1, 'Posición requerida'),
  salary: z.number().positive().optional(),
  hireDate: z.string().datetime(),
});

const employeeUpdateSchema = employeeCreateSchema.partial().omit({ userId: true });

// Trainer schemas
const trainerCreateSchema = z.object({
  userId: z.string().uuid(),
  branchId: z.string().uuid(),
  specialties: z.array(z.string()).min(1, 'Al menos una especialidad requerida'),
  experience: z.number().int().min(0, 'Experiencia no puede ser negativa'),
  certification: z.string().optional(),
  hourlyRate: z.number().positive().optional(),
  bio: z.string().optional(),
});

const trainerUpdateSchema = trainerCreateSchema.partial().omit({ userId: true });

// Query schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ID parameter schema
const idParamSchema = z.object({
  id: z.string().uuid('ID debe ser un UUID válido'),
});

module.exports = {
  // User schemas
  userCreateSchema,
  userUpdateSchema,
  loginSchema,
  checkEmailSchema,
  refreshTokenSchema,
  
  // Branch schemas
  branchCreateSchema,
  branchUpdateSchema,
  
  // Member schemas
  memberCreateSchema,
  memberUpdateSchema,
  
  // Membership schemas
  membershipTypeCreateSchema,
  membershipTypeUpdateSchema,
  membershipCreateSchema,
  membershipUpdateSchema,
  
  // Check-in schemas
  checkInCreateSchema,
  checkOutSchema,
  
  // Class schemas
  classCreateSchema,
  classUpdateSchema,
  classFiltersSchema,
  
  // Reservation schemas
  createReservationSchema,
  updateReservationSchema,
  memberReservationFiltersSchema,
  
  // Payment schemas
  paymentCreateSchema,
  paymentUpdateSchema,
  
  // Employee schemas
  employeeCreateSchema,
  employeeUpdateSchema,
  
  // Trainer schemas
  trainerCreateSchema,
  trainerUpdateSchema,
  
  // Utility schemas
  paginationSchema,
  dateRangeSchema,
  idParamSchema,
};