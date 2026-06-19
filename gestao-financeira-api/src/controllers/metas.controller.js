const prisma = require('../lib/prisma');
// 1. Importar o sanitizeUserId junto com o serializeMeta
const { serializeMeta, sanitizeUserId } = require('../lib/helpers');

// GET /api/metas?userId=
async function listar(req, res) {
  // 2. Usar a função para limpar o ID
  const userId = sanitizeUserId(req.query.userId);

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

  // 3. Limpar o ID antes de verificar e salvar
  const idParaSalvar = sanitizeUserId(userId);

  // 4. REMOVIDO O !userId DESTA VALIDAÇÃO
  if (!nome || valorAlvo == null || depositoMensal == null || !previsaoData || meses == null) {
    return res.status(400).json({ error: 'Campos obrigatórios em falta' });
  }

  try {
    const meta = await prisma.meta.create({
      data: {
        nome,
        valorAlvo: parseFloat(valorAlvo),
        depositoMensal: parseFloat(depositoMensal),
        taxaJuros: taxaJuros ? parseFloat(taxaJuros) : 0,
        previsaoData,
        meses: parseInt(meses),
        userId: idParaSalvar, // 5. Usando o ID limpo
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