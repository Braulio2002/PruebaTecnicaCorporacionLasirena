import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Opcional: ajusta si tienes enum de Prisma
type UserRole = 'ADMIN' | 'USER';

// Schemas de validación
const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['ADMIN', 'USER']).default('USER'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

// Tipos de ayuda
interface AccessPayload {
  id: string;
  email: string;
  role: string;
}
interface RefreshPayload {
  id: string;
  type: 'refresh';
}
interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Generar tokens JWT con jsonwebtoken
const generateTokens = (userId: string, email: string, role: string): TokenPair => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

  if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error('JWT secrets not configured');
  }

  const accessPayload: AccessPayload = { id: userId, email, role };
  const refreshPayload: RefreshPayload = { id: userId, type: 'refresh' };

  const expiresIn = process.env.JWT_EXPIRES_IN ?? '1h';
  const accessToken = jwt.sign(
    accessPayload,
    JWT_SECRET as jwt.Secret,
    { expiresIn: expiresIn as any }
  );

  const refreshToken = jwt.sign(
    refreshPayload,
    JWT_REFRESH_SECRET as jwt.Secret,
    { expiresIn: '7d' } // 7 días
  );

  return { accessToken, refreshToken };
};

/**
 * Iniciar sesión
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar datos de entrada
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario?.activo) {
      throw createError(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, usuario.password);
    if (!isValidPassword) {
      throw createError(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');
    }

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(
      usuario.id,
      usuario.email,
      usuario.role
    );

    // Guardar refresh token en la base de datos
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        usuarioId: usuario.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    });

    logger.info(`Usuario ${email} inició sesión exitosamente`);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          role: usuario.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar nuevo usuario
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validar datos de entrada
    const validatedData = registerSchema.parse(req.body);
    const { email, password, nombre, role } = validatedData;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError(409, 'El email ya está registrado', 'EMAIL_EXISTS');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        role,
      },
    });

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(
      usuario.id,
      usuario.email,
      usuario.role
    );

    // Guardar refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        usuarioId: usuario.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    logger.info(`Nuevo usuario registrado: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          role: usuario.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Renovar token de acceso
 * @route POST /api/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = refreshSchema.parse(req.body);
    const { refreshToken: token } = validatedData;

    // Buscar refresh token en la base de datos
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { usuario: true },
    });

    if (!storedToken || storedToken.revocado || storedToken.expiresAt < new Date()) {
      throw createError(401, 'Refresh token inválido o expirado', 'INVALID_REFRESH_TOKEN');
    }

    // Verificar el refresh token
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
    if (!JWT_REFRESH_SECRET) {
      throw new Error('JWT refresh secret not configured');
    }

    try {
      jwt.verify(token, JWT_REFRESH_SECRET as jwt.Secret);
    } catch {
      throw createError(401, 'Refresh token inválido', 'INVALID_REFRESH_TOKEN');
    }

    // Generar nuevos tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      storedToken.usuario.id,
      storedToken.usuario.email,
      storedToken.usuario.role
    );

    // Revocar el refresh token anterior
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revocado: true },
    });

    // Crear nuevo refresh token
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        usuarioId: storedToken.usuario.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      message: 'Token renovado exitosamente',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cerrar sesión
 * @route POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (refreshToken) {
      // Revocar el refresh token
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revocado: true },
      });
    }

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};