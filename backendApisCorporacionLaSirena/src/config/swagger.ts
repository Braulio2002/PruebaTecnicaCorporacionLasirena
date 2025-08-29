import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cinema Management API',
      version: '1.0.0',
      description: 'API REST para gestión de películas y turnos de cine',
      contact: {
        name: 'Cinema Management Team',
        email: 'support@cinema.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-url.com'
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      schemas: {
        Pelicula: {
          type: 'object',
          required: ['titulo', 'genero', 'duracion', 'fechaEstreno'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la película'
            },
            titulo: {
              type: 'string',
              description: 'Título de la película',
              example: 'Avatar: El Camino del Agua'
            },
            genero: {
              type: 'string',
              description: 'Género de la película',
              example: 'Ciencia Ficción'
            },
            duracion: {
              type: 'integer',
              description: 'Duración en minutos',
              example: 192
            },
            fechaEstreno: {
              type: 'string',
              format: 'date',
              description: 'Fecha de estreno',
              example: '2022-12-16'
            },
            descripcion: {
              type: 'string',
              description: 'Descripción de la película',
              example: 'Continuación de la saga Avatar'
            },
            activo: {
              type: 'boolean',
              description: 'Estado de la película',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        },
        Turno: {
          type: 'object',
          required: ['peliculaId', 'sala', 'fechaHora'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del turno'
            },
            peliculaId: {
              type: 'integer',
              description: 'ID de la película',
              example: 1
            },
            sala: {
              type: 'integer',
              description: 'Número de sala',
              example: 1
            },
            fechaHora: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora del turno',
              example: '2024-01-15T20:00:00Z'
            },
            precio: {
              type: 'number',
              format: 'float',
              description: 'Precio del turno',
              example: 12.50
            },
            activo: {
              type: 'boolean',
              description: 'Estado del turno',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            },
            pelicula: {
              $ref: '#/components/schemas/Pelicula'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Error de validación'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time'
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [
    process.env.NODE_ENV === 'production' 
      ? './dist/routes/*.js'
      : './src/routes/*.ts',
    process.env.NODE_ENV === 'production'
      ? './dist/controllers/*.js' 
      : './src/controllers/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };