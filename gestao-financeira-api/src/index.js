require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const prisma  = require('./lib/prisma');

const app  = express();
const PORT = process.env.PORT || 3333;

// ── Middlewares ────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Margem para uploads de recibos em base64
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ── Rotas ──────────────────────────────────────────────────
app.use('/api/transacoes', require('./routes/transacoes.routes'));
app.use('/api/metas',      require('./routes/metas.routes'));
app.use('/api/orcamentos', require('./routes/orcamentos.routes'));

// ── Handler de rotas inexistentes ─────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// ── Handler de erros global ────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Bootstrap ──────────────────────────────────────────────
async function bootstrap() {
  await prisma.$connect();
  console.log('✅  Database connected via Prisma');

  app.listen(PORT, () => {
    console.log(`🚀  Server running → http://localhost:${PORT}`);
    console.log(`📋  Health check   → http://localhost:${PORT}/health`);
  });
}

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('\n🔌  Prisma disconnected. Bye!');
  process.exit(0);
});

bootstrap().catch(async (err) => {
  console.error('❌  Failed to start:', err);
  await prisma.$disconnect();
  process.exit(1);
});