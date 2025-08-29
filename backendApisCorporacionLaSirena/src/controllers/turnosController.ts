import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateTurnoDuration, validateTurnoOverlap } from '../utils/turnoValidations';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

/**
 * Obtener todos los turnos con paginación y filtros
 * @route GET /api/turnos
 */
export const getTurnos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 10,
      peliculaId,
      sala,
      fecha,
      estado = 'ACTIVO'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Validar parámetros de paginación
    if (take > 100) {
      throw createError(400, 'El límite máximo es 100 registros por página', 'LIMIT_EXCEEDED');
    }

    // Construir filtros
    const where: any = {
      eliminadoEn: null,
      estado: estado as string
    };

    if (peliculaId) {
      where.peliculaId = peliculaId as string;
    }

    if (sala) {
      where.sala = sala as string;
    }

    if (fecha) {
      const fechaInicio = new Date(fecha as string);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setDate(fechaFin.getDate() + 1);
      
      where.inicio = {
        gte: fechaInicio,
        lt: fechaFin
      };
    }

    const [turnos, total] = await Promise.all([
      prisma.turno.findMany({
        where,
        skip,
        take,
        include: {
          pelicula: {
            select: {
              id: true,
              titulo: true,
              duracionMin: true,
              clasificacion: true
            }
          }
        },
        orderBy: {
          inicio: 'asc'
        }
      }),
      prisma.turno.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    logger.info(`Turnos obtenidos: ${turnos.length} de ${total}`, {
      page,
      limit,
      filters: { peliculaId, sala, fecha, estado }
    });

    res.json({
      success: true,
      data: turnos,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    logger.error('Error al obtener turnos:', error);
    next(error);
  }
};

/**
 * Obtener turno por ID
 * @route GET /api/turnos/:id
 */
export const getTurnoById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const turno = await prisma.turno.findFirst({
      where: {
        id,
        eliminadoEn: null
      },
      include: {
        pelicula: true
      }
    });

    if (!turno) {
      throw createError(404, 'Turno no encontrado', 'TURNO_NOT_FOUND');
    }

    logger.info(`Turno obtenido: ${id}`);

    res.json({
      success: true,
      data: turno
    });
  } catch (error) {
    logger.error(`Error al obtener turno ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Crear nuevo turno
 * @route POST /api/turnos
 */
export const createTurno = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { peliculaId, sala, inicio, precio, idioma, formato, aforo, estado } = req.body;

    // Verificar que la película existe
    const pelicula = await prisma.pelicula.findFirst({
      where: {
        id: peliculaId,
        eliminadoEn: null
      }
    });

    if (!pelicula) {
      throw createError(404, 'Película no encontrada', 'PELICULA_NOT_FOUND');
    }

    const inicioDate = new Date(inicio);
    // Calcular fin automáticamente: duración de película + 15 minutos de buffer
    const finDate = new Date(inicioDate.getTime() + (pelicula.duracionMin + 15) * 60 * 1000);

    // Validar duración
    const duracionValidation = await validateTurnoDuration(inicioDate, finDate, pelicula.duracionMin);
    if (!duracionValidation.valido) {
      throw createError(400, duracionValidation.mensaje!, 'INVALID_DURATION');
    }

    // Validar solapamiento
    const overlapValidation = await validateTurnoOverlap(sala, inicioDate, finDate);
    if (!overlapValidation.valido) {
      throw createError(409, overlapValidation.mensaje!, 'SCHEDULE_CONFLICT');
    }

    const turno = await prisma.turno.create({
      data: {
        peliculaId,
        sala,
        inicio: inicioDate,
        fin: finDate,
        precio,
        idioma,
        formato,
        aforo,
        estado: estado || 'ACTIVO'
      },
      include: {
        pelicula: {
          select: {
            id: true,
            titulo: true,
            duracionMin: true
          }
        }
      }
    });

    logger.info(`Turno creado: ${turno.id}`, {
      peliculaId,
      sala,
      inicio: inicioDate,
      fin: finDate
    });

    res.status(201).json({
      success: true,
      data: turno,
      message: 'Turno creado exitosamente'
    });
  } catch (error) {
    // Map database constraint / conflict to a 409 response for clarity
    if ((error as any)?.code === 'P2002' || (error as any)?.message?.includes('turnos_no_overlap_exclusion')) {
      logger.warn('Conflict creating turno (DB constraint):', (error as any));
      return next(createError(409, 'Conflicto de horario: existe un turno solapado en la misma sala', 'SCHEDULE_CONFLICT'));
    }

    logger.error('Error al crear turno:', error);
    next(error);
  }
};

/**
 * Actualizar turno
 * @route PUT /api/turnos/:id
 */
export const updateTurno = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que el turno existe
    const turnoExistente = await prisma.turno.findFirst({
      where: {
        id,
        eliminadoEn: null
      },
      include: {
        pelicula: true
      }
    });

    if (!turnoExistente) {
      throw createError(404, 'Turno no encontrado', 'TURNO_NOT_FOUND');
    }

    // Si se actualiza horario, validar
    if (updateData.inicio || updateData.fin) {
      const inicioDate = updateData.inicio ? new Date(updateData.inicio) : turnoExistente.inicio;
      const finDate = updateData.fin ? new Date(updateData.fin) : turnoExistente.fin;

      // Validar duración
      const duracionValidation = await validateTurnoDuration(inicioDate, finDate, turnoExistente.pelicula.duracionMin);
      if (!duracionValidation.valido) {
        throw createError(400, duracionValidation.mensaje!, 'INVALID_DURATION');
      }

      // Validar solapamiento (excluyendo el turno actual)
      const sala = updateData.sala || turnoExistente.sala;
      const overlapValidation = await validateTurnoOverlap(sala, inicioDate, finDate, id);
      if (!overlapValidation.valido) {
        throw createError(409, overlapValidation.mensaje!, 'SCHEDULE_CONFLICT');
      }

      updateData.inicio = inicioDate;
      updateData.fin = finDate;
    }

    const turnoActualizado = await prisma.turno.update({
      where: { id },
      data: {
        ...updateData,
        actualizadoEn: new Date()
      },
      include: {
        pelicula: {
          select: {
            id: true,
            titulo: true,
            duracionMin: true
          }
        }
      }
    });

    logger.info(`Turno actualizado: ${id}`, updateData);

    res.json({
      success: true,
      data: turnoActualizado,
      message: 'Turno actualizado exitosamente'
    });
  } catch (error) {
    logger.error(`Error al actualizar turno ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Eliminar turno (soft delete)
 * @route DELETE /api/turnos/:id
 */
export const deleteTurno = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const turno = await prisma.turno.findFirst({
      where: {
        id,
        eliminadoEn: null
      }
    });

    if (!turno) {
      throw createError(404, 'Turno no encontrado', 'TURNO_NOT_FOUND');
    }

    await prisma.turno.update({
      where: { id },
      data: {
        eliminadoEn: new Date(),
        estado: 'CANCELADO'
      }
    });

    logger.info(`Turno eliminado: ${id}`);

    res.json({
      success: true,
      message: 'Turno eliminado exitosamente'
    });
  } catch (error) {
    logger.error(`Error al eliminar turno ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Crear múltiples turnos
 * @route POST /api/turnos/bulk
 */
export const createMultipleTurnos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { turnos } = req.body;

    if (!Array.isArray(turnos) || turnos.length === 0) {
      throw createError(400, 'Se requiere un array de turnos', 'INVALID_INPUT');
    }

    if (turnos.length > 50) {
      throw createError(400, 'Máximo 50 turnos por operación', 'LIMIT_EXCEEDED');
    }

    const turnosCreados: any[] = [];
    const errores: any[] = [];

    // Helper to process a single turno item. Extracted to reduce function cognitive complexity.
    const processTurnoItem = async (turnoData: any, index: number) => {
      // Validar película existe
      const pelicula = await prisma.pelicula.findFirst({
        where: { id: turnoData.peliculaId, eliminadoEn: null }
      });

      if (!pelicula) {
        return errores.push({ index, error: 'Película no encontrada', data: turnoData });
      }

      const inicioDate = new Date(turnoData.inicio);
      const finDate = new Date(turnoData.fin);

      // Validaciones
      const duracionValidation = await validateTurnoDuration(inicioDate, finDate, pelicula.duracionMin);
      if (!duracionValidation.valido) {
        return errores.push({ index, error: duracionValidation.mensaje, data: turnoData });
      }

      const overlapValidation = await validateTurnoOverlap(turnoData.sala, inicioDate, finDate);
      if (!overlapValidation.valido) {
        return errores.push({ index, error: overlapValidation.mensaje, data: turnoData });
      }

      try {
        const created = await prisma.turno.create({
          data: { ...turnoData, inicio: inicioDate, fin: finDate, estado: turnoData.estado || 'ACTIVO' },
          include: { pelicula: { select: { id: true, titulo: true } } }
        });

        turnosCreados.push(created);
      } catch (err) {
        if ((err as any)?.code === 'P2002' || (err as any)?.message?.includes('turnos_no_overlap_exclusion')) {
          return errores.push({ index, error: 'Conflicto de horario con otro turno existente (DB constraint)', data: turnoData });
        }

        return errores.push({ index, error: err instanceof Error ? err.message : 'Error desconocido', data: turnoData });
      }
    };

    for (let i = 0; i < turnos.length; i++) {
      // process sequentially to avoid hammering DB with many concurrent writes which
      // could trigger transient conflicts; adjust if you prefer parallelism with retry.
      // Sequential processing simplifies reasoning and keeps response concise.
      // eslint-disable-next-line no-await-in-loop
      await processTurnoItem(turnos[i], i);
    }

    logger.info(`Creación masiva de turnos: ${turnosCreados.length} exitosos, ${errores.length} errores`);

    res.status(201).json({
      success: true,
      data: {
        turnosCreados,
        errores,
        resumen: {
          total: turnos.length,
          exitosos: turnosCreados.length,
          fallidos: errores.length
        }
      },
      message: `${turnosCreados.length} turnos creados exitosamente`
    });
  } catch (error) {
    logger.error('Error en creación masiva de turnos:', error);
    next(error);
  }
};