import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

/**
 * Validar que la duración del turno sea suficiente para la película
 * @param inicio Fecha y hora de inicio del turno
 * @param fin Fecha y hora de fin del turno
 * @param duracionPeliculaMin Duración de la película en minutos
 * @returns Resultado de la validación
 */
export const validateTurnoDuration = async (
  inicio: Date,
  fin: Date,
  duracionPeliculaMin: number
): Promise<{ valido: boolean; mensaje?: string }> => {
  try {
    // Validar que las fechas sean válidas
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return {
        valido: false,
        mensaje: 'Fechas de inicio o fin inválidas'
      };
    }

    // Validar que fin > inicio
    if (fin <= inicio) {
      return {
        valido: false,
        mensaje: 'La fecha de fin debe ser posterior a la fecha de inicio'
      };
    }

    // Validar que el turno no sea en el pasado
    const ahora = new Date();
    if (inicio < ahora) {
      return {
        valido: false,
        mensaje: 'La fecha y hora de inicio no puede ser en el pasado'
      };
    }

    // Calcular duración del turno en minutos
    const duracionTurnoMin = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60));
    
    // Verificar que el turno tenga al menos la duración de la película + 15 minutos de buffer
    const duracionMinimaRequerida = duracionPeliculaMin + 15;
    
    if (duracionTurnoMin < duracionMinimaRequerida) {
      return {
        valido: false,
        mensaje: `La duración del turno (${duracionTurnoMin} min) debe ser al menos ${duracionMinimaRequerida} min (película: ${duracionPeliculaMin} min + 15 min de buffer)`
      };
    }

    // Validar que no sea excesivamente largo (máximo 4 horas)
    if (duracionTurnoMin > 240) {
      return {
        valido: false,
        mensaje: 'La duración del turno no puede exceder 4 horas'
      };
    }

    return { valido: true };
  } catch (error) {
    logger.error('Error al validar duración del turno:', error);
    return {
      valido: false,
      mensaje: 'Error interno al validar la duración del turno'
    };
  }
};

/**
 * Validar que no haya solapamiento de turnos en la misma sala
 * @param sala Identificador de la sala
 * @param inicio Fecha y hora de inicio del nuevo turno
 * @param fin Fecha y hora de fin del nuevo turno
 * @param turnoIdExcluir ID del turno a excluir (para actualizaciones)
 * @returns Resultado de la validación
 */
export const validateTurnoOverlap = async (
  sala: string,
  inicio: Date,
  fin: Date,
  turnoIdExcluir?: string
): Promise<{ valido: boolean; mensaje?: string }> => {
  try {
    // Buscar turnos que se solapen en la misma sala
    const where: any = {
      sala,
      estado: {
        in: ['ACTIVO', 'INACTIVO'] // No incluir CANCELADO
      },
      eliminadoEn: null,
      OR: [
        {
          // Caso 1: El nuevo turno comienza durante un turno existente
          AND: [
            { inicio: { lte: inicio } },
            { fin: { gt: inicio } }
          ]
        },
        {
          // Caso 2: El nuevo turno termina durante un turno existente
          AND: [
            { inicio: { lt: fin } },
            { fin: { gte: fin } }
          ]
        },
        {
          // Caso 3: El nuevo turno contiene completamente a un turno existente
          AND: [
            { inicio: { gte: inicio } },
            { fin: { lte: fin } }
          ]
        },
        {
          // Caso 4: Un turno existente contiene completamente al nuevo turno
          AND: [
            { inicio: { lte: inicio } },
            { fin: { gte: fin } }
          ]
        }
      ]
    };

    // Excluir el turno actual si se está actualizando
    if (turnoIdExcluir) {
      where.id = { not: turnoIdExcluir };
    }

    const turnosSolapados = await prisma.turno.findMany({
      where,
      select: {
        id: true,
        inicio: true,
        fin: true,
        pelicula: {
          select: {
            titulo: true
          }
        }
      }
    });

    if (turnosSolapados.length > 0) {
      const turnoConflicto = turnosSolapados[0];
      const inicioConflicto = turnoConflicto.inicio.toLocaleString('es-ES');
      const finConflicto = turnoConflicto.fin.toLocaleString('es-ES');
      
      return {
        valido: false,
        mensaje: `Conflicto de horario en sala ${sala}. Ya existe el turno "${turnoConflicto.pelicula.titulo}" de ${inicioConflicto} a ${finConflicto}`
      };
    }

    return { valido: true };
  } catch (error) {
    logger.error('Error al validar solapamiento de turnos:', error);
    return {
      valido: false,
      mensaje: 'Error interno al validar el solapamiento de turnos'
    };
  }
};

/**
 * Validar disponibilidad de sala en un rango de fechas
 * @param sala Identificador de la sala
 * @param fechaInicio Fecha de inicio del rango
 * @param fechaFin Fecha de fin del rango
 * @returns Lista de horarios disponibles
 */
export const getDisponibilidadSala = async (
  sala: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<{
  disponible: boolean;
  turnosExistentes: Array<{
    id: string;
    inicio: Date;
    fin: Date;
    pelicula: string;
  }>;
}> => {
  try {
    const turnosExistentes = await prisma.turno.findMany({
      where: {
        sala,
        estado: {
          in: ['ACTIVO', 'INACTIVO']
        },
        eliminadoEn: null,
        OR: [
          {
            AND: [
              { inicio: { gte: fechaInicio } },
              { inicio: { lt: fechaFin } }
            ]
          },
          {
            AND: [
              { fin: { gt: fechaInicio } },
              { fin: { lte: fechaFin } }
            ]
          },
          {
            AND: [
              { inicio: { lte: fechaInicio } },
              { fin: { gte: fechaFin } }
            ]
          }
        ]
      },
      select: {
        id: true,
        inicio: true,
        fin: true,
        pelicula: {
          select: {
            titulo: true
          }
        }
      },
      orderBy: {
        inicio: 'asc'
      }
    });

    return {
      disponible: turnosExistentes.length === 0,
      turnosExistentes: turnosExistentes.map((turno: any) => ({
        id: turno.id,
        inicio: turno.fechaHora,
        fin: new Date(turno.fechaHora.getTime() + turno.duracion * 60000),
        pelicula: turno.pelicula?.titulo || 'Sin título'
      }))
    };
  } catch (error) {
    logger.error('Error al obtener disponibilidad de sala:', error);
    throw error;
  }
};