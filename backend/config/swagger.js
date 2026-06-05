const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'i-SOFTZONE Employee Management & Leave System API',
      version: '1.0.0',
      description: 'API Documentation for Full Stack EMS with advanced role workflows, audit logs, and SQL transactions.',
      contact: {
        name: 'Internship Cell, i-SOFTZONE'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js'] // Scan for docs in route/controller files
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
