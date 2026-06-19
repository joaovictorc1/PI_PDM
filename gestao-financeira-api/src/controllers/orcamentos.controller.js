const prisma = require('../lib/prisma');
const { toDbCategoria, toFrontendCategoria, sanitizeUserId } = require('../lib/helpers');

async function listar(req, res) {
  const userId = sanitizeUserId(req.query.userId);
  try {
    const orcamentos = await prisma.orcamento.findMany({ where: { userId } });
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

async function upsert(req, res) {
  const userId = sanitizeUserId(req.body.userId);
  const { categoria, limite } = req.body;

  if (!categoria || limite == null) {
    return res.status(400).json({ error: 'categoria e limite são obrigatórios' });
  }
  const limiteFloat = parseFloat(limite);
  if (!Number.isFinite(limiteFloat) || limiteFloat <= 0) {
    return res.status(400).json({ error: 'Limite deve ser maior que zero' });
  }

  try {
    const categoriaDb = toDbCategoria(categoria);
    const existente = await prisma.orcamento.findFirst({ where: { userId, categoria: categoriaDb } });

    const orcamento = existente
      ? await prisma.orcamento.update({ where: { id: existente.id }, data: { limite: limiteFloat } })
      : await prisma.orcamento.create({ data: { userId, categoria: categoriaDb, limite: limiteFloat } });

    res.json({ categoria: toFrontendCategoria(orcamento.categoria), limite: Number(orcamento.limite) });
  } catch (err) {
    console.error('[orcamentos.upsert]', err);
    res.status(500).json({ error: 'Erro ao guardar orçamento' });
  }
}

async function eliminar(req, res) {
  const userId = sanitizeUserId(req.query.userId);
  try {
    const categoriaDb = toDbCategoria(decodeURIComponent(req.params.categoria));
    const existente = await prisma.orcamento.findFirst({ where: { userId, categoria: categoriaDb } });
    if (!existente) return res.status(404).json({ error: 'Orçamento não encontrado' });

    await prisma.orcamento.delete({ where: { id: existente.id } });
    res.status(204).send();
  } catch (err) {
    console.error('[orcamentos.eliminar]', err);
    res.status(500).json({ error: 'Erro ao eliminar orçamento' });
  }
}

module.exports = { listar, upsert, eliminar };