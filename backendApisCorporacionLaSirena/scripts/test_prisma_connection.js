const dotenv = require('dotenv');
dotenv.config();

async function run() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('Prisma connected');
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Prisma connect error:', err.message || err);
    process.exit(1);
  }
}

run();
