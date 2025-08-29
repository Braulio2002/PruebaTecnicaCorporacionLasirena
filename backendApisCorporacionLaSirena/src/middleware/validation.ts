import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Helpers
const isValidUrl = (str: unknown): boolean => {
  if (typeof str !== 'string') return false;
  try {
    // URL constructor will throw for invalid urls
    // allow relative urls? here we require absolute URLs
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

// Esquema para película (alineado con Prisma)
const peliculaSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(255, 'El título es muy largo'),
  sinopsis: z.string().optional(),
  duracionMin: z.number().int().min(1, 'La duración debe ser mayor a 0'),
  clasificacion: z.string().min(1, 'La clasificación es requerida'),
  generos: z.array(z.string()).min(1, 'Debe tener al menos un género'),
  fechaEstreno: z.string().transform((str) => new Date(str)),
  imagen: z.string().optional().refine((val) => val === undefined || isValidUrl(val), { message: 'Must be a valid URL' }),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional().default('ACTIVO')
});

// Esquema para actualizar película
const peliculaUpdateSchema = peliculaSchema.partial();

// Esquema para turno (alineado con Prisma)
const turnoSchema = z.object({
  peliculaId: z.string().min(1, 'ID de película requerido'),
  sala: z.string().min(1, 'La sala es requerida'),
  inicio: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha de inicio inválida' }).transform((str) => new Date(str)),
  precio: z.number().positive('El precio debe ser mayor a 0'),
  idioma: z.enum(['DOBLADO', 'SUBTITULADO']),
  formato: z.enum(['DOS_D', 'TRES_D', 'IMAX']),
  aforo: z.number().int().min(1, 'El aforo debe ser mayor a 0'),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'CANCELADO']).optional().default('ACTIVO')
});

// Esquema para actualizar turno
const turnoUpdateSchema = z.object({
  peliculaId: z.string().optional().refine((val) => !val || /^c[a-zA-Z0-9]{24}$/.test(val), {
    message: 'ID de película inválido'
  }),
  sala: z.string().min(1, 'La sala es requerida').optional(),
  inicio: z.string().transform((str) => new Date(str)).optional(),
  fin: z.string().transform((str) => new Date(str)).optional(),
  precio: z.number().positive('El precio debe ser mayor a 0').optional(),
  idioma: z.enum(['DOBLADO', 'SUBTITULADO']).optional(),
  formato: z.enum(['DOS_D', 'TRES_D', 'IMAX']).optional(),
  aforo: z.number().int().min(1, 'El aforo debe ser mayor a 0').optional(),
  estado: z.enum(['ACTIVO', 'INACTIVO', 'CANCELADO']).optional()
}).refine((data) => {
  if (data.inicio && data.fin) {
    const inicio = new Date(data.inicio);
    const fin = new Date(data.fin);
    return fin > inicio;
  }
  return true;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fin']
});

// Middleware de validación genérico mejorado
const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de entrada inválidos',
            details: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            })),
            timestamp: new Date().toISOString()
          }
        });
      }
      next(error);
    }
  };
};

// Validación de parámetros ID
export const validateId = (req: Request, res: Response, next: NextFunction): Response | void => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'ID inválido o faltante',
        timestamp: new Date().toISOString()
      }
    });
  }
  next();
};

// Exportar middlewares específicos
export const validatePelicula = validate(peliculaSchema);
export const validatePeliculaUpdate = validate(peliculaUpdateSchema);
export const validateTurno = validate(turnoSchema);
export const validateTurnoUpdate = validate(turnoUpdateSchema);