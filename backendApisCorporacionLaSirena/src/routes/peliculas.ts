import { Router } from 'express';
import * as peliculasController from '../controllers/peliculasController';
import { validatePelicula, validatePeliculaUpdate } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/peliculas:
 *   get:
 *     summary: Obtener lista de películas
 *     description: Obtiene todas las películas con filtros opcionales y paginación
 *     tags: [Películas]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Cantidad de elementos por página
 *       - in: query
 *         name: genero
 *         schema:
 *           type: string
 *         description: Filtrar por género
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de películas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pelicula'
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
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', peliculasController.getPeliculas);

/**
 * @swagger
 * /api/peliculas:
 *   post:
 *     summary: Crear nueva película
 *     description: Crea una nueva película en el sistema
 *     tags: [Películas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - genero
 *               - duracion
 *               - fechaEstreno
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: "Avatar: El Camino del Agua"
 *               genero:
 *                 type: string
 *                 example: "Ciencia Ficción"
 *               duracion:
 *                 type: integer
 *                 minimum: 1
 *                 example: 192
 *               fechaEstreno:
 *                 type: string
 *                 format: date
 *                 example: "2022-12-16"
 *               descripcion:
 *                 type: string
 *                 example: "Continuación de la saga Avatar"
 *     responses:
 *       201:
 *         description: Película creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Pelicula'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Película ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validatePelicula, peliculasController.createPelicula);

/**
 * @swagger
 * /api/peliculas/{id}:
 *   get:
 *     summary: Obtener película por ID
 *     description: Obtiene una película específica por su ID
 *     tags: [Películas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la película
 *     responses:
 *       200:
 *         description: Película encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Pelicula'
 *       404:
 *         description: Película no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', peliculasController.getPeliculaById);

/**
 * @swagger
 * /api/peliculas/{id}:
 *   put:
 *     summary: Actualizar película
 *     description: Actualiza una película existente
 *     tags: [Películas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la película
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               genero:
 *                 type: string
 *               duracion:
 *                 type: integer
 *                 minimum: 1
 *               fechaEstreno:
 *                 type: string
 *                 format: date
 *               descripcion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Película actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Pelicula'
 *       404:
 *         description: Película no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', validatePeliculaUpdate, peliculasController.updatePelicula);

/**
 * @swagger
 * /api/peliculas/{id}:
 *   delete:
 *     summary: Eliminar película
 *     description: Elimina una película (soft delete)
 *     tags: [Películas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la película
 *     responses:
 *       200:
 *         description: Película eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Película eliminada exitosamente"
 *       404:
 *         description: Película no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', peliculasController.deletePelicula);

/**
 * @swagger
 * /api/peliculas/{id}/turnos:bulkCreate:
 *   post:
 *     summary: Crear turnos masivamente
 *     description: Crea múltiples turnos para una película
 *     tags: [Películas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la película
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - turnos
 *             properties:
 *               turnos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - sala
 *                     - fechaHora
 *                   properties:
 *                     sala:
 *                       type: integer
 *                       example: 1
 *                     fechaHora:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T20:00:00Z"
 *                     precio:
 *                       type: number
 *                       format: float
 *                       example: 12.50
 *     responses:
 *       201:
 *         description: Turnos creados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Turno'
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Película no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/turnos:bulkCreate', peliculasController.bulkCreateTurnos);

export default router;