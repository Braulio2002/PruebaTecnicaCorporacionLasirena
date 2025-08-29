import request from 'supertest';
import { app } from '../index'; // assuming app is exported for tests
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals';
import dotenv from 'dotenv';

let prisma: any; // will be initialized in beforeAll after dotenv is loaded

describe('Turnos e2e - solapamiento', () => {
  beforeAll(async () => {
  // Load env and create Prisma client
  dotenv.config();
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();

  // Ensure DB is clean for test run
  await prisma.turno.deleteMany();
  await prisma.pelicula.deleteMany();

  // Create a pelicula
  await prisma.pelicula.create({
      data: {
        titulo: 'E2E Test Movie',
        duracionMin: 60,
        clasificacion: 'PG',
        generos: ['Test'],
        fechaEstreno: new Date(),
        creadoPor: 'test'
      }
    });
  });

  afterAll(async () => {
    await prisma.turno.deleteMany();
    await prisma.pelicula.deleteMany();
    await prisma.$disconnect();
  });

  test('Crear turno válido y luego intentar crear uno solapado debe fallar con 409', async () => {
    const pelicula = await prisma.pelicula.findFirst({ where: { titulo: 'E2E Test Movie' } });
    expect(pelicula).toBeDefined();

    const inicio = new Date();
    inicio.setHours(10, 0, 0, 0);
  // fin not used in assertions — duration/fin is handled server-side

    const payload = {
      peliculaId: pelicula!.id,
      sala: 'Sala E2E',
      inicio: inicio.toISOString(),
      precio: 9.5,
      idioma: 'DOBLADO',
      formato: 'DOS_D',
      aforo: 100
    };

    const res1 = await request(app).post('/api/turnos').send(payload);
    expect(res1.status).toBe(201);

    // Overlapping start
    const payload2 = { ...payload, inicio: new Date(inicio.getTime() + 10 * 60 * 1000).toISOString() };
    const res2 = await request(app).post('/api/turnos').send(payload2);

    // Expect conflict (409) due to overlap
    expect(res2.status).toBe(409);
  });
});
