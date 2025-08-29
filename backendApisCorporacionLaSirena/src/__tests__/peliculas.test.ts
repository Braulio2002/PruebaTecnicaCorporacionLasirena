/// <reference types="jest" />
import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Películas API', () => {
  beforeEach(async () => {
    await prisma.turno.deleteMany();
    await prisma.pelicula.deleteMany();
  });

  describe('POST /api/peliculas', () => {
    it('debería crear una película válida', async () => {
      const peliculaData = {
        titulo: 'Test Movie',
        sinopsis: 'Test synopsis',
        duracionMin: 120,
        clasificacion: 'PG-13',
        generos: ['Acción'],
        fechaEstreno: '2024-12-25T00:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/peliculas')
        .send(peliculaData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.titulo).toBe('Test Movie');
    });

    it('debería rechazar película con título duplicado', async () => {
      // Test de validación de unicidad
    });
  });

  describe('Validaciones de Turnos', () => {
    it('debería rechazar turnos solapados', async () => {
      // Test de solapamiento
    });

    it('debería validar duración mínima', async () => {
      // Test de duración
    });
  });
});