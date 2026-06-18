const prisma = require('../lib/prisma');
const { toDbCategoria, toFrontendCategoria } = require('../lib/helpers');

// GET /api/orcamentos?userId=
// Retorna: { "Alimentação": 1000, "Lazer": 500 }  ← mesmo formato de @orcamentos_wisecash
async function listar(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

  try {
    const orcamentos = await prisma.orcamento.findMany({ where: { userId } });

    // Transforma array → objeto flat que o frontend já sabe consumir
    const resultado = orcamentos.reduce((acc, o) => {
      acc[toFrontendCategoria(o.categoria)] = Number(o.limite);
      return acc;
    }, {});

    res.json(resultado);
  } catch (err) {
    console.error('[orcamentos.listar]', err);
    res.status(500).json({ error: 'Erro ao carregar orçamentos' });
  }
}

// PUT /api/orcamentos  — cria ou atualiza o limite de uma categoria (upsert)
// Body: { userId, categoria: "Lazer", limite: 500 }
async function upsert(req, res) {
  const { userId, categoria, limite } = req.body;

  if (!userId || !categoria || limite == null) {
    return res.status(400).json({ error: 'userId, categoria e limite são obrigatórios' });
  }

  const limiteFloat = parseFloat(limite);
  if (isNaN(limiteFloat) || limiteFloat <= 0) {
    return res.status(400).json({ error: 'Limite deve ser maior que zero' });
  }

  try {
    const categoriaDb = toDbCategoria(categoria);

    const orcamento = await prisma.orcamento.upsert({
      where:  { userId_categoria: { userId, categoria: categoriaDb } },
      update: { limite: limiteFloat },
      create: { userId, categoria: categoriaDb, limite: limiteFloat },
    });

    res.json({
      categoria: toFrontendCategoria(orcamento.categoria),
      limite:    Number(orcamento.limite),
    });
  } catch (err) {
    console.error('[orcamentos.upsert]', err);
    res.status(500).json({ error: 'Erro ao guardar orçamento' });
  }
}

// DELETE /api/orcamentos/:categoria?userId=
async function eliminar(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

  try {
    const categoriaDb = toDbCategoria(decodeURIComponent(req.params.categoria));

    await prisma.orcamento.delete({
      where: { userId_categoria: { userId, categoria: categoriaDb } },
    });

    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Orçamento não encontrado' });
    res.status(500).json({ error: 'Erro ao eliminar orçamento' });
  }
}

module.exports = { listar, upsert, eliminar };