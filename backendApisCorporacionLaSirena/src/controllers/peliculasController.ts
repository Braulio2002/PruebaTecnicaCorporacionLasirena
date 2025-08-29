import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// GET /api/peliculas
export const getPeliculas = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      search = '',
      genero = '',
      estado = '',
      page = '1',
      pageSize = '10'
    } = req.query;

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const skip = (pageNum - 1) * pageSizeNum;

    // Construir filtros
    const where: any = {
      eliminadoEn: null // Solo películas no eliminadas
    };

    if (search) {
      where.titulo = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    if (genero) {
      where.generos = {
        has: genero as string
      };
    }

    if (estado) {
      where.estado = estado as string;
    }

    // Obtener películas y total
    const [peliculas, total] = await Promise.all([
      prisma.pelicula.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { creadoEn: 'desc' },
        include: {
          _count: {
            select: { turnos: true }
          }
        }
      }),
      prisma.pelicula.count({ where })
    ]);

    const totalPages = Math.ceil(total / pageSizeNum);

    res.json({
      success: true,
      data: peliculas,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

    logger.info(`Películas listadas: ${peliculas.length} de ${total}`);
  } catch (error) {
    next(error);
  }
};

// POST /api/peliculas
export const createPelicula = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const peliculaData = req.body;

    // Verificar que el título no exista
    const existingPelicula = await prisma.pelicula.findUnique({
      where: { titulo: peliculaData.titulo }
    });

    if (existingPelicula) {
      throw createError(400, 'Ya existe una película con este título', 'DUPLICATE_TITLE');
    }

    const pelicula = await prisma.pelicula.create({
      data: {
        ...peliculaData,
        creadoPor: (req as any).user?.id || 'system'
      }
    });

    res.status(201).json({
      success: true,
      data: pelicula,
      message: 'Película creada exitosamente'
    });

    logger.info(`Película creada: ${pelicula.titulo} (ID: ${pelicula.id})`);
  } catch (error) {
    next(error);
  }
};

// GET /api/peliculas/:id
export const getPeliculaById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const pelicula = await prisma.pelicula.findFirst({
      where: {
        id,
        eliminadoEn: null
      },
      include: {
        turnos: {
          where: { eliminadoEn: null },
          orderBy: { inicio: 'asc' }
        }
      }
    });

    if (!pelicula) {
      throw createError(404, 'Película no encontrada', 'MOVIE_NOT_FOUND');
    }

    res.json({
      success: true,
      data: pelicula
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/peliculas/:id
export const updatePelicula = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que la película existe
    const existingPelicula = await prisma.pelicula.findFirst({
      where: { id, eliminadoEn: null }
    });

    if (!existingPelicula) {
      throw createError(404, 'Película no encontrada', 'MOVIE_NOT_FOUND');
    }

    // Si se está actualizando el título, verificar que no exista otro con el mismo
    if (updateData.titulo && updateData.titulo !== existingPelicula.titulo) {
      const duplicatePelicula = await prisma.pelicula.findUnique({
        where: { titulo: updateData.titulo }
      });

      if (duplicatePelicula) {
        throw createError(400, 'Ya existe una película con este título', 'DUPLICATE_TITLE');
      }
    }

    const pelicula = await prisma.pelicula.update({
      where: { id },
      data: {
        ...updateData,
        actualizadoPor: (req as any).user?.id || 'system'
      }
    });

    res.json({
      success: true,
      data: pelicula,
      message: 'Película actualizada exitosamente'
    });

    logger.info(`Película actualizada: ${pelicula.titulo} (ID: ${pelicula.id})`);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/peliculas/:id
export const deletePelicula = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verificar que la película existe
    const existingPelicula = await prisma.pelicula.findFirst({
      where: { id, eliminadoEn: null },
      include: {
        _count: {
          select: { turnos: { where: { eliminadoEn: null } } }
        }
      }
    });

    if (!existingPelicula) {
      throw createError(404, 'Película no encontrada', 'MOVIE_NOT_FOUND');
    }

    // Verificar si tiene turnos activos
    if (existingPelicula._count.turnos > 0) {
      throw createError(409, 'No se puede eliminar la película porque tiene turnos asociados', 'HAS_ACTIVE_SCHEDULES');
    }

    // Soft delete
    const pelicula = await prisma.pelicula.update({
      where: { id },
      data: {
        eliminadoEn: new Date(),
        actualizadoPor: (req as any).user?.id || 'system'
      }
    });

    res.json({
      success: true,
      message: 'Película eliminada exitosamente'
    });

    logger.info(`Película eliminada: ${pelicula.titulo} (ID: ${pelicula.id})`);
  } catch (error) {
    next(error);
  }
};

// POST /api/peliculas/:id/turnos:bulkCreate
export const bulkCreateTurnos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { turnos } = req.body;

    // Verificar que la película existe
    const pelicula = await prisma.pelicula.findFirst({
      where: { id, eliminadoEn: null }
    });

    if (!pelicula) {
      throw createError(404, 'Película no encontrada', 'MOVIE_NOT_FOUND');
    }

    // Crear turnos en lote
    const turnosCreados = await prisma.turno.createMany({
      data: turnos.map((turno: any) => ({
        ...turno,
        peliculaId: id,
        creadoPor: 'system'
      }))
    });

    res.status(201).json({
      success: true,
      data: { count: turnosCreados.count },
      message: `${turnosCreados.count} turnos creados exitosamente`
    });

    logger.info(`Turnos creados en lote para película ${pelicula.titulo}: ${turnosCreados.count}`);
  } catch (error) {
    next(error);
  }
};