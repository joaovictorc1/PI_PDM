import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

// Configuração do pool de ligações nativo do Postgres
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Inicialização do cliente Prisma v7 (Adaptador obrigatório)
const prisma = new PrismaClient({ adapter });

export default prisma;