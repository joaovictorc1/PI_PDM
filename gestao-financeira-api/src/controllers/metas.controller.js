const prisma              = require('../lib/prisma');
const { serializeMeta }   = require('../lib/helpers');

// GET /api/metas?userId=
async function listar(req, res) {
  const { userId } = req.query;
  //if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

  try {
    const metas = await prisma.meta.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json(metas.map(serializeMeta));
  } catch (err) {
    console.error('[metas.listar]', err);
    res.status(500).json({ error: 'Erro ao carregar metas' });
  }
}

// POST /api/metas
async function criar(req, res) {
  const { userId, nome, valorAlvo, depositoMensal, taxaJuros, previsaoData, meses } = req.body;

  console.log("Dados recebidos do App (Metas):", req.body);

  let idParaSalvar = null;
  if (userId && typeof userId === 'string' && userId.trim() !== '' && userId !== 'null' && userId !== 'undefined' && userId !== 'substituir-pelo-id-real-do-utilizador') {
      idParaSalvar = userId;
  }

  if (!userId || !nome || valorAlvo == null || depositoMensal == null || !previsaoData || meses == null) {
    return res.status(400).json({ error: 'Campos obrigatórios em falta' });
  }

  try {
    const meta = await prisma.meta.create({
      data: {
        nome,
        valorAlvo:      parseFloat(valorAlvo),
        depositoMensal: parseFloat(depositoMensal),
        taxaJuros:      taxaJuros ? parseFloat(taxaJuros) : 0,
        previsaoData,
        meses:          parseInt(meses),
        userId:       idParaSalvar,
      },
    });
    res.status(201).json(serializeMeta(meta));
  } catch (err) {
    console.error('[metas.criar]', err);
    res.status(500).json({ error: 'Erro ao criar meta' });
  }
}

// DELETE /api/metas/:id
async function eliminar(req, res) {
  try {
    await prisma.meta.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Meta não encontrada' });
    res.status(500).json({ error: 'Erro ao eliminar meta' });
  }
}

module.exports = { listar, criar, eliminar };