-- ========================================
-- 📊 VISTAS ÚTILES PARA GYMMASTER
-- ========================================

-- Vista: Información completa de miembros activos
CREATE OR REPLACE VIEW active_members_view AS
SELECT 
    m.id as member_id,
    m.membership_number,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    m.join_date,
    m.qr_code,
    m.qr_code_expiry,
    -- Membresía activa
    ms.id as membership_id,
    ms.status as membership_status,
    ms.start_date,
    ms.end_date,
    ms.auto_renew,
    -- Tipo de membresía
    mt.name as membership_type,
    mt.price as membership_price,
    mt.duration_days,
    -- Días restantes
    CASE 
        WHEN ms.end_date > CURRENT_DATE 
        THEN EXTRACT(DAYS FROM ms.end_date - CURRENT_DATE)
        ELSE 0 
    END as days_remaining
FROM members m
JOIN users u ON m.user_id = u.id
LEFT JOIN memberships ms ON m.id = ms.member_id 
    AND ms.status = 'ACTIVE'
    AND ms.start_date <= CURRENT_DATE 
    AND ms.end_date >= CURRENT_DATE
LEFT JOIN membership_types mt ON ms.membership_type_id = mt.id
WHERE m.is_active = true AND u.is_active = true;

-- Vista: Check-ins con información detallada
CREATE OR REPLACE VIEW checkins_detailed_view AS
SELECT 
    c.id as checkin_id,
    c.check_in_at,
    c.check_out_at,
    CASE 
        WHEN c.check_out_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (c.check_out_at - c.check_in_at))/3600 
        ELSE NULL 
    END as duration_hours,
    c.notes,
    -- Información del miembro
    m.membership_number,
    u.first_name,
    u.last_name,
    u.email,
    -- Información de la sucursal
    b.name as branch_name,
    b.city as branch_city,
    b.address as branch_address,
    -- Estado
    CASE 
        WHEN c.check_out_at IS NULL THEN 'ACTIVE'
        ELSE 'COMPLETED'
    END as status
FROM check_ins c
JOIN members m ON c.member_id = m.id
JOIN users u ON m.user_id = u.id
JOIN branches b ON c.branch_id = b.id
ORDER BY c.check_in_at DESC;

-- Vista: Estadísticas diarias por sucursal
CREATE OR REPLACE VIEW daily_branch_stats AS
SELECT 
    b.id as branch_id,
    b.name as branch_name,
    b.city,
    DATE(c.check_in_at) as date,
    COUNT(c.id) as total_checkins,
    COUNT(DISTINCT c.member_id) as unique_members,
    COUNT(CASE WHEN c.check_out_at IS NULL THEN 1 END) as active_checkins,
    AVG(CASE 
        WHEN c.check_out_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (c.check_out_at - c.check_in_at))/3600 
    END) as avg_duration_hours
FROM branches b
LEFT JOIN check_ins c ON b.id = c.branch_id
WHERE b.is_active = true
GROUP BY b.id, b.name, b.city, DATE(c.check_in_at)
ORDER BY date DESC, branch_name;

-- Vista: Ingresos mensuales por sucursal
CREATE OR REPLACE VIEW monthly_revenue_view AS
SELECT 
    b.id as branch_id,
    b.name as branch_name,
    b.city,
    DATE_TRUNC('month', p.payment_date) as month,
    COUNT(p.id) as total_payments,
    SUM(p.amount) as total_revenue,
    SUM(CASE WHEN p.method = 'CASH' THEN p.amount ELSE 0 END) as cash_revenue,
    SUM(CASE WHEN p.method = 'QR' THEN p.amount ELSE 0 END) as qr_revenue,
    AVG(p.amount) as avg_payment
FROM branches b
LEFT JOIN payments p ON b.id = p.branch_id AND p.status = 'COMPLETED'
WHERE b.is_active = true
GROUP BY b.id, b.name, b.city, DATE_TRUNC('month', p.payment_date)
ORDER BY month DESC, branch_name;

-- Vista: Clases con información completa
CREATE OR REPLACE VIEW classes_detailed_view AS
SELECT 
    cl.id as class_id,
    cl.name as class_name,
    cl.description,
    cl.start_time,
    cl.end_time,
    cl.duration,
    cl.capacity,
    cl.status,
    cl.price,
    -- Información del entrenador
    u.first_name as trainer_first_name,
    u.last_name as trainer_last_name,
    t.specialties,
    t.experience,
    -- Información de la sucursal
    b.name as branch_name,
    b.city as branch_city,
    -- Estadísticas de reservas
    COUNT(r.id) as total_reservations,
    COUNT(CASE WHEN r.status = 'CONFIRMED' THEN 1 END) as confirmed_reservations,
    COUNT(CASE WHEN r.status = 'COMPLETED' THEN 1 END) as completed_reservations,
    ROUND((COUNT(r.id)::float / cl.capacity) * 100, 2) as occupancy_rate
FROM classes cl
JOIN trainers t ON cl.trainer_id = t.id
JOIN users u ON t.user_id = u.id
JOIN branches b ON cl.branch_id = b.id
LEFT JOIN reservations r ON cl.id = r.class_id
GROUP BY cl.id, cl.name, cl.description, cl.start_time, cl.end_time, 
         cl.duration, cl.capacity, cl.status, cl.price,
         u.first_name, u.last_name, t.specialties, t.experience,
         b.name, b.city;

-- Vista: Membresías por expirar
CREATE OR REPLACE VIEW expiring_memberships_view AS
SELECT 
    m.membership_number,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    ms.end_date,
    mt.name as membership_type,
    mt.price,
    EXTRACT(DAYS FROM ms.end_date - CURRENT_DATE) as days_remaining,
    CASE 
        WHEN EXTRACT(DAYS FROM ms.end_date - CURRENT_DATE) <= 7 THEN 'URGENT'
        WHEN EXTRACT(DAYS FROM ms.end_date - CURRENT_DATE) <= 30 THEN 'WARNING'
        ELSE 'NORMAL'
    END as priority
FROM memberships ms
JOIN members m ON ms.member_id = m.id
JOIN users u ON m.user_id = u.id
JOIN membership_types mt ON ms.membership_type_id = mt.id
WHERE ms.status = 'ACTIVE'
    AND ms.end_date >= CURRENT_DATE
    AND ms.end_date <= (CURRENT_DATE + INTERVAL '90 days')
ORDER BY ms.end_date ASC;

-- ========================================
-- 🗂️ DATOS DE EJEMPLO PARA DESARROLLO
-- ========================================

-- Insertar tipos de membresía
INSERT INTO membership_types (id, name, description, duration_days, price, features, max_classes) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Básica Mensual', 'Acceso básico al gimnasio', 30, 50.00, ARRAY['Acceso al área de pesas', 'Vestidores'], 10),
('550e8400-e29b-41d4-a716-446655440002', 'Premium Mensual', 'Acceso completo con clases', 30, 80.00, ARRAY['Acceso completo', 'Clases grupales', 'Vestidores', 'Sauna'], NULL),
('550e8400-e29b-41d4-a716-446655440003', 'Premium Anual', 'Membresía anual con descuento', 365, 800.00, ARRAY['Acceso completo', 'Clases grupales', 'Vestidores', 'Sauna', 'Nutricionista'], NULL),
('550e8400-e29b-41d4-a716-446655440004', 'Estudiante', 'Descuento especial para estudiantes', 30, 35.00, ARRAY['Acceso al área de pesas', 'Vestidores'], 5);

-- Insertar usuario administrador
INSERT INTO users (id, email, password, first_name, last_name, phone, role, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'admin@gymmaster.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/O5ZGTzi', 'Administrador', 'Principal', '+1234567890', 'ADMIN', true);

-- Insertar sucursales de ejemplo
INSERT INTO branches (id, name, address, phone, email, city, state, zip_code, opening_time, closing_time, created_by_id) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'GymMaster Centro', 'Av. Principal 123, Centro', '+1234567891', 'centro@gymmaster.com', 'Ciudad Principal', 'Estado Principal', '12345', '06:00', '23:00', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440021', 'GymMaster Norte', 'Calle Norte 456, Zona Norte', '+1234567892', 'norte@gymmaster.com', 'Ciudad Principal', 'Estado Principal', '12346', '05:30', '22:30', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440022', 'GymMaster Sur', 'Av. Sur 789, Zona Sur', '+1234567893', 'sur@gymmaster.com', 'Ciudad Secundaria', 'Estado Principal', '12347', '06:30', '23:30', '550e8400-e29b-41d4-a716-446655440010');

-- Insertar usuarios empleados
INSERT INTO users (id, email, password, first_name, last_name, phone, role, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440030', 'empleado1@gymmaster.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/O5ZGTzi', 'María', 'González', '+1234567894', 'EMPLOYEE', true),
('550e8400-e29b-41d4-a716-446655440031', 'empleado2@gymmaster.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/O5ZGTzi', 'Carlos', 'Ramírez', '+1234567895', 'EMPLOYEE', true);

-- Insertar empleados
INSERT INTO employees (id, user_id, branch_id, position, salary, hire_date) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 'Gerente de Sucursal', 2500.00, '2024-01-15'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', 'Recepcionista', 1800.00, '2024-02-01');

-- Insertar usuarios entrenadores
INSERT INTO users (id, email, password, first_name, last_name, phone, role, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440050', 'trainer1@gymmaster.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/O5ZGTzi', 'Ana', 'Fitness', '+1234567896', 'TRAINER', true),
('550e8400-e29b-41d4-a716-446655440051', 'trainer2@gymmaster.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/O5ZGTzi', 'Pedro', 'Strong', '+1234567897', 'TRAINER', true);

-- Insertar entrenadores
INSERT INTO trainers (id, user_id, branch_id, specialties, experience, certification, hourly_rate, bio) VALUES
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440020', ARRAY['Yoga', 'Pilates', 'Aeróbicos'], 5, 'Certificación Nacional de Yoga', 25.00, 'Especialista en clases de bajo impacto y flexibilidad'),
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440020', ARRAY['Musculación', 'CrossFit', 'Funcional'], 8, 'Certificación ACSM', 30.00, 'Experto en entrenamiento de fuerza y acondicionamiento');

-- Insertar usuarios miembros de ejemplo
INSERT INTO users (id, email, password, first_name, last_name, phone, role, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440070', 'miembro1@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/O5ZGTzi', 'Juan', 'Pérez', '+1234567898', 'MEMBER', true),
('550e8400-e29b-41d4-a716-446655440071', 'miembro2@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/O5ZGTzi', 'Laura', 'Martínez', '+1234567899', 'MEMBER', true),
('550e8400-e29b-41d4-a716-446655440072', 'miembro3@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/O5ZGTzi', 'Roberto', 'Silva', '+1234567800', 'MEMBER', true);

-- Insertar miembros
INSERT INTO members (id, user_id, membership_number, date_of_birth, emergency_contact, emergency_phone, qr_code, qr_code_expiry, join_date) VALUES
('550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440070', 'MEM-20241001-001', '1990-05-15', 'María Pérez', '+1234567801', '550e8400-e29b-41d4-a716-446655440100', (CURRENT_TIMESTAMP + INTERVAL '24 hours'), '2024-01-01'),
('550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440071', 'MEM-20241001-002', '1985-08-22', 'Carlos Martínez', '+1234567802', '550e8400-e29b-41d4-a716-446655440101', (CURRENT_TIMESTAMP + INTERVAL '24 hours'), '2024-01-15'),
('550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440072', 'MEM-20241001-003', '1992-12-03', 'Ana Silva', '+1234567803', '550e8400-e29b-41d4-a716-446655440102', (CURRENT_TIMESTAMP + INTERVAL '24 hours'), '2024-02-01');

-- Insertar membresías
INSERT INTO memberships (id, member_id, membership_type_id, start_date, end_date, status, auto_renew) VALUES
('550e8400-e29b-41d4-a716-446655440090', '550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440003', '2024-01-01', '2024-12-31', 'ACTIVE', true),
('550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440002', '2024-01-15', '2024-02-14', 'ACTIVE', false),
('550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440001', '2024-02-01', '2024-03-02', 'ACTIVE', true);

-- Insertar clases de ejemplo
INSERT INTO classes (id, name, description, branch_id, trainer_id, capacity, duration, start_time, end_time, status, price) VALUES
('550e8400-e29b-41d4-a716-446655440110', 'Yoga Matutino', 'Clase de yoga para comenzar el día', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440060', 20, 60, '2024-10-09 07:00:00', '2024-10-09 08:00:00', 'SCHEDULED', 15.00),
('550e8400-e29b-41d4-a716-446655440111', 'CrossFit Intenso', 'Entrenamiento funcional de alta intensidad', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440061', 15, 45, '2024-10-09 18:00:00', '2024-10-09 18:45:00', 'SCHEDULED', 20.00),
('550e8400-e29b-41d4-a716-446655440112', 'Pilates Vespertino', 'Fortalecimiento del core y flexibilidad', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440060', 25, 50, '2024-10-09 19:00:00', '2024-10-09 19:50:00', 'SCHEDULED', 12.00);

-- Insertar check-ins de ejemplo
INSERT INTO check_ins (id, member_id, branch_id, check_in_at, check_out_at, notes) VALUES
('550e8400-e29b-41d4-a716-446655440120', '550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440020', '2024-10-08 08:00:00', '2024-10-08 09:30:00', 'Entrenamiento de rutina'),
('550e8400-e29b-41d4-a716-446655440121', '550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440020', '2024-10-08 18:00:00', NULL, 'Check-in activo'),
('550e8400-e29b-41d4-a716-446655440122', '550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440021', '2024-10-08 07:30:00', '2024-10-08 08:45:00', 'Cardio matutino');

-- Insertar pagos de ejemplo
INSERT INTO payments (id, member_id, membership_id, branch_id, amount, method, status, description, payment_date) VALUES
('550e8400-e29b-41d4-a716-446655440130', '550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440090', '550e8400-e29b-41d4-a716-446655440020', 800.00, 'QR', 'COMPLETED', 'Pago membresía anual', '2024-01-01'),
('550e8400-e29b-41d4-a716-446655440131', '550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440091', '550e8400-e29b-41d4-a716-446655440020', 80.00, 'CASH', 'COMPLETED', 'Pago membresía mensual', '2024-01-15'),
('550e8400-e29b-41d4-a716-446655440132', '550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440092', '550e8400-e29b-41d4-a716-446655440021', 50.00, 'CASH', 'COMPLETED', 'Pago membresía básica', '2024-02-01');

-- Insertar reservas de ejemplo
INSERT INTO reservations (id, member_id, class_id, trainer_id, status, notes) VALUES
('550e8400-e29b-41d4-a716-446655440140', '550e8400-e29b-41d4-a716-446655440080', '550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440060', 'CONFIRMED', 'Primera clase de yoga'),
('550e8400-e29b-41d4-a716-446655440141', '550e8400-e29b-41d4-a716-446655440081', '550e8400-e29b-41d4-a716-446655440111', '550e8400-e29b-41d4-a716-446655440061', 'CONFIRMED', 'Entrenamiento intenso'),
('550e8400-e29b-41d4-a716-446655440142', '550e8400-e29b-41d4-a716-446655440082', '550e8400-e29b-41d4-a716-446655440112', '550e8400-e29b-41d4-a716-446655440060', 'CONFIRMED', 'Clase de pilates');

-- ========================================
-- 🔍 CONSULTAS ÚTILES PARA ADMINISTRACIÓN
-- ========================================

-- Ver todas las vistas creadas
SELECT viewname FROM pg_views WHERE schemaname = 'public';

-- Estadísticas rápidas del sistema
SELECT 
    'Usuarios totales' as metric, COUNT(*) as value FROM users
UNION ALL
SELECT 'Miembros activos', COUNT(*) FROM members WHERE is_active = true
UNION ALL
SELECT 'Sucursales activas', COUNT(*) FROM branches WHERE is_active = true
UNION ALL
SELECT 'Membresías activas', COUNT(*) FROM memberships WHERE status = 'ACTIVE'
UNION ALL
SELECT 'Check-ins hoy', COUNT(*) FROM check_ins WHERE DATE(check_in_at) = CURRENT_DATE
UNION ALL
SELECT 'Pagos completados', COUNT(*) FROM payments WHERE status = 'COMPLETED';

-- Comentarios en las tablas para documentación
COMMENT ON TABLE users IS 'Usuarios del sistema con roles diferenciados';
COMMENT ON TABLE branches IS 'Sucursales del gimnasio';
COMMENT ON TABLE members IS 'Miembros registrados con códigos QR';
COMMENT ON TABLE memberships IS 'Membresías activas e históricas';
COMMENT ON TABLE check_ins IS 'Registro de entradas y salidas';
COMMENT ON TABLE payments IS 'Historial de pagos y transacciones';
COMMENT ON TABLE classes IS 'Clases grupales programadas';
COMMENT ON TABLE reservations IS 'Reservas de miembros para clases';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría del sistema';

-- Índices adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_checkins_member_date ON check_ins(member_id, check_in_at);
CREATE INDEX IF NOT EXISTS idx_checkins_branch_date ON check_ins(branch_id, check_in_at);
CREATE INDEX IF NOT EXISTS idx_memberships_status_dates ON memberships(status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payments_member_date ON payments(member_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status_method ON payments(status, method);
CREATE INDEX IF NOT EXISTS idx_classes_branch_date ON classes(branch_id, start_time);
CREATE INDEX IF NOT EXISTS idx_audit_entity_timestamp ON audit_logs(entity, timestamp);

-- ========================================
-- 💡 NOTAS DE USO
-- ========================================

/*
1. Para usar estos datos de ejemplo, ejecutar este script después de migrar el esquema.

2. Contraseñas de ejemplo (todas usan 'password123'):
   - admin@gymmaster.com: password123
   - empleado1@gymmaster.com: password123
   - miembro1@example.com: password123

3. Las vistas proporcionan consultas optimizadas para casos comunes.

4. Los índices mejoran el rendimiento de consultas frecuentes.

5. Los UUIDs están pre-generados para facilitar referencias entre tablas.

6. Para generar nuevos QR codes en desarrollo:
   UPDATE members SET qr_code = gen_random_uuid(), 
   qr_code_expiry = NOW() + INTERVAL '24 hours' 
   WHERE id = 'member-id';
*/