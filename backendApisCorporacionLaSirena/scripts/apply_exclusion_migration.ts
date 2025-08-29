import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function run() {
  const file = path.resolve(__dirname, '..', 'prisma', 'migrations', '20250829_add_exclusion_constraint', 'migration.sql');
  if (!fs.existsSync(file)) {
    console.error('migration.sql not found at', file);
    process.exit(1);
  }

  const sql = fs.readFileSync(file, 'utf8');
  // Remove SQL comments and split by semicolon safely
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      console.log('Executing:', stmt.split('\n')[0].slice(0, 200));
      // Use executeRawUnsafe because statements can contain DDL
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      // @ts-ignore
      const res = await prisma.$executeRawUnsafe(stmt);
      console.log('Result:', res);
    } catch (err: any) {
      console.error('Error executing statement:', err.message || err);
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  await prisma.$disconnect();
  console.log('Migration applied (or statements executed).');
}

run();
