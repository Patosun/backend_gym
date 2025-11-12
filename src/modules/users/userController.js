const userService = require('./userService');
const { z } = require('zod');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - firstName
 *         - lastName
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único del usuario
 *         email:
 *           type: string
 *           format: email
 *           description: Email del usuario
 *         firstName:
 *           type: string
 *           description: Nombre del usuario
 *         lastName:
 *           type: string
 *           description: Apellido del usuario
 *         phone:
 *           type: string
 *           description: Teléfono del usuario
 *         photo:
 *           type: string
 *           description: URL de la foto del usuario
 *         role:
 *           type: string
 *           enum: [ADMIN, EMPLOYEE, TRAINER, MEMBER]
 *           description: Rol del usuario en el sistema
 *         isActive:
 *           type: boolean
 *           description: Estado del usuario
 *         emailVerified:
 *           type: boolean
 *           description: Si el email está verificado
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Último inicio de sesión
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de actualización
 *     UserUpdate:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         photo:
 *           type: string
 *         isActive:
 *           type: boolean
 *     ChangePassword:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           description: Contraseña actual
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           description: Nueva contraseña
 */

// Esquemas de validación
const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  photo: z.string().optional(),
  isActive: z.boolean().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100)
});

const userController = {
  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Obtener todos los usuarios
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [ADMIN, EMPLOYEE, TRAINER, MEMBER]
   *         description: Filtrar por rol
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Elementos por página
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Buscar por nombre o email
   *     responses:
   *       200:
   *         description: Lista de usuarios
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 users:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/User'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     totalPages:
   *                       type: integer
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Sin permisos
   */
  async getAllUsers(req, res) {
    try {
      const { role, isActive, page = 1, limit = 10, search } = req.query;
      
      const filters = {};
      if (role) filters.role = role;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (search) {
        filters.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const result = await userService.getAllUsers(filters, parseInt(page), parseInt(limit));
      res.json(result);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Obtener usuario por ID
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID del usuario
   *     responses:
   *       200:
   *         description: Datos del usuario
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       404:
   *         description: Usuario no encontrado
   *       401:
   *         description: No autorizado
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Actualizar usuario
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID del usuario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserUpdate'
   *     responses:
   *       200:
   *         description: Usuario actualizado correctamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Usuario no encontrado
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Sin permisos
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const validatedData = updateUserSchema.parse(req.body);

      // Verificar permisos: solo admin o el mismo usuario puede actualizar
      if (req.user.role !== 'ADMIN' && req.user.id !== id) {
        return res.status(403).json({ error: 'Sin permisos para actualizar este usuario' });
      }

      const user = await userService.updateUser(id, validatedData);
      res.json(user);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message === 'Usuario no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/users/{id}/deactivate:
   *   patch:
   *     summary: Desactivar usuario
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID del usuario
   *     responses:
   *       200:
   *         description: Usuario desactivado correctamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       404:
   *         description: Usuario no encontrado
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Sin permisos (solo ADMIN)
   */
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;

      // Solo admin puede desactivar usuarios
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Solo administradores pueden desactivar usuarios' });
      }

      const user = await userService.updateUser(id, { isActive: false });
      res.json({ 
        message: 'Usuario desactivado correctamente',
        user 
      });
    } catch (error) {
      if (error.message === 'Usuario no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error deactivating user:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/users/{id}/activate:
   *   patch:
   *     summary: Activar usuario
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID del usuario
   *     responses:
   *       200:
   *         description: Usuario activado correctamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       404:
   *         description: Usuario no encontrado
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Sin permisos (solo ADMIN)
   */
  async activateUser(req, res) {
    try {
      const { id } = req.params;

      // Solo admin puede activar usuarios
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Solo administradores pueden activar usuarios' });
      }

      const user = await userService.updateUser(id, { isActive: true });
      res.json({ 
        message: 'Usuario activado correctamente',
        user 
      });
    } catch (error) {
      if (error.message === 'Usuario no encontrado') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error activating user:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/users/{id}/change-password:
   *   patch:
   *     summary: Cambiar contraseña del usuario
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID del usuario
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ChangePassword'
   *     responses:
   *       200:
   *         description: Contraseña cambiada correctamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Datos inválidos o contraseña incorrecta
   *       404:
   *         description: Usuario no encontrado
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Sin permisos
   */
  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const validatedData = changePasswordSchema.parse(req.body);

      // Verificar permisos: solo admin o el mismo usuario puede cambiar contraseña
      if (req.user.role !== 'ADMIN' && req.user.id !== id) {
        return res.status(403).json({ error: 'Sin permisos para cambiar contraseña de este usuario' });
      }

      await userService.changePassword(id, validatedData.currentPassword, validatedData.newPassword);
      res.json({ message: 'Contraseña cambiada correctamente' });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          error: 'Datos inválidos', 
          details: error.errors 
        });
      }
      if (error.message === 'Usuario no encontrado' || error.message === 'Contraseña actual incorrecta') {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * @swagger
   * /api/users/stats:
   *   get:
   *     summary: Estadísticas de usuarios
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Estadísticas de usuarios
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 total:
   *                   type: integer
   *                 active:
   *                   type: integer
   *                 inactive:
   *                   type: integer
   *                 byRole:
   *                   type: object
   *                   properties:
   *                     ADMIN:
   *                       type: integer
   *                     EMPLOYEE:
   *                       type: integer
   *                     TRAINER:
   *                       type: integer
   *                     MEMBER:
   *                       type: integer
   *                 recentRegistrations:
   *                   type: integer
   *                   description: Registros en los últimos 30 días
   *       401:
   *         description: No autorizado
   *       403:
   *         description: Sin permisos (solo ADMIN y EMPLOYEE)
   */
  async getUserStats(req, res) {
    try {
      // Solo admin y empleados pueden ver estadísticas
      if (!['ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Sin permisos para ver estadísticas' });
      }

      const stats = await userService.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = userController;