/**
 * Configuración principal de Swagger
 * Este archivo centraliza toda la documentación de la API
 */

const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GymMaster API',
    version: '1.0.0',
    description: 'API completa para el sistema de administración de gimnasio GymMaster',
    contact: {
      name: 'GymMaster Team',
      email: 'support@gymmaster.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.gymmaster.com' 
        : `http://localhost:${process.env.PORT || 3000}`,
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtenido del endpoint /api/auth/login'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Endpoints de autenticación y autorización'
    },
    {
      name: 'Users',
      description: 'Gestión de usuarios del sistema'
    },
    {
      name: 'Members',
      description: 'Gestión de miembros del gimnasio'
    },
    {
      name: 'Branches',
      description: 'Gestión de sucursales'
    },
    {
      name: 'Memberships',
      description: 'Gestión de tipos de membresías'
    },
    {
      name: 'Member Memberships',
      description: 'Gestión de membresías de miembros'
    },
    {
      name: 'Payments',
      description: 'Gestión de pagos'
    },
    {
      name: 'Classes',
      description: 'Gestión de clases y entrenadores'
    },
    {
      name: 'Reservations',
      description: 'Gestión de reservas de clases'
    },
    {
      name: 'Check-ins',
      description: 'Gestión de entrada y salida del gimnasio'
    },
    {
      name: 'Reports',
      description: 'Reportes y estadísticas del sistema'
    }
  ]
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './src/docs/swagger/schemas/*.js',
    './src/docs/swagger/responses/*.js',
    './src/docs/swagger/paths/*.js',
    './src/modules/*/routes.js', 
    './src/modules/*/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = {
  swaggerDefinition,
  swaggerOptions,
  swaggerSpec
};