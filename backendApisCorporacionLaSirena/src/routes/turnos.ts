import { Router } from 'express';
import {
  getTurnos,
  getTurnoById,
  createTurno,
  updateTurno,
  deleteTurno,
  createMultipleTurnos
} from '../controllers/turnosController';
import { validateTurno, validateTurnoUpdate } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/turnos:
 *   get:
 *     summary: Obtener lista de turnos
 *     description: Obtiene todos los turnos con filtros opcionales y paginación
 *     tags: [Turnos]
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
 *         name: peliculaId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de película
 *       - in: query
 *         name: sala
 *         schema:
 *           type: integer
 *         description: Filtrar por número de sala
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha (YYYY-MM-DD)
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de turnos obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Turno'
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
 */
router.get('/', getTurnos);

/**
 * @swagger
 * /api/turnos/{id}:
 *   get:
 *     summary: Obtener turno por ID
 *     description: Obtiene un turno específico por su ID
 *     tags: [Turnos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del turno
 *     responses:
 *       200:
 *         description: Turno encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Turno'
 *       404:
 *         description: Turno no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getTurnoById);

/**
 * @swagger
 * /api/turnos:
 *   post:
 *     summary: Crear nuevo turno
 *     description: Crea un nuevo turno con validaciones de negocio
 *     tags: [Turnos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - peliculaId
 *               - sala
 *               - fechaHora
 *             properties:
 *               peliculaId:
 *                 type: integer
 *                 example: 1
 *               sala:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               fechaHora:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T20:00:00Z"
 *               precio:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 example: 12.50
 *     responses:
 *       201:
 *         description: Turno creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Turno'
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflicto de horarios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validateTurno, createTurno);

/**
 * @swagger
 * /api/turnos/bulk:
 *   post:
 *     summary: Crear múltiples turnos
 *     description: Crea múltiples turnos de una vez con validaciones individuales
 *     tags: [Turnos]
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
 *                     - peliculaId
 *                     - sala
 *                     - fechaHora
 *                   properties:
 *                     peliculaId:
 *                       type: integer
 *                       example: 1
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
 *         description: Turnos procesados
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
 */
router.post('/bulk', createMultipleTurnos);

/**
 * @swagger
 * /api/turnos/{id}:
 *   put:
 *     summary: Actualizar turno
 *     description: Actualiza un turno existente
 *     tags: [Turnos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del turno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               peliculaId:
 *                 type: integer
 *               sala:
 *                 type: integer
 *                 minimum: 1
 *               fechaHora:
 *                 type: string
 *                 format: date-time
 *               precio:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Turno actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Turno'
 *       404:
 *         description: Turno no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', validateTurnoUpdate, updateTurno);

/**
 * @swagger
 * /api/turnos/{id}:
 *   delete:
 *     summary: Eliminar turno
 *     description: Elimina un turno (soft delete)
 *     tags: [Turnos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del turno
 *     responses:
 *       200:
 *         description: Turno eliminado exitosamente
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
 *                   example: "Turno eliminado exitosamente"
 *       404:
 *         description: Turno no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteTurno);

export default router;