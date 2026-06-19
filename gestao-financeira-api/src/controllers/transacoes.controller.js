const { randomUUID }       = require('crypto');
const prisma               = require('../lib/prisma');
const { toDbCategoria, serializeTransacao } = require('../lib/helpers');

// GET /api/transacoes?userId=&filtro=todas|recentes
const { sanitizeUserId } = require('../lib/helpers');

async function listar(req, res) {
  const userId = sanitizeUserId(req.query.userId);
  const { filtro } = req.query;
  try {
    const where = userId ? { userId } : {};
    if (filtro === 'recentes') {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      where.data = { gte: seteDiasAtras };
    }
    const transacoes = await prisma.transacao.findMany({ where, orderBy: { data: 'desc' } });
    res.json(transacoes.map(serializeTransacao));
  } catch (err) {
    console.error('[transacoes.listar]', err);
    res.status(500).json({ error: 'Erro ao carregar transações' });
  }
}

// POST /api/transacoes
// Cria transação simples OU grupo de parcelas (isParcelado + numeroParcelas)
async function criar(req, res) {
  const { userId, descricao, valor, data, categoria, tags, anexo, isParcelado, numeroParcelas } = req.body;
  const idParaSalvar = sanitizeUserId(userId);

  if (!descricao || typeof descricao !== 'string' || !descricao.trim() || descricao.length > 120) {
    return res.status(400).json({ error: 'descricao inválida' });
  }

  const valorTotal = parseFloat(valor);
  if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
    return res.status(400).json({ error: 'valor deve ser um número positivo' });
  }

  const dataBase = new Date(data);
  if (!data || isNaN(dataBase.getTime())) {
    return res.status(400).json({ error: 'data inválida' });
  }

  try {
    const categoriaDb = toDbCategoria(categoria ?? 'Outros');
    let criadas;

    if (isParcelado && parseInt(numeroParcelas, 10) > 1) {
      const qtd = Math.min(parseInt(numeroParcelas, 10), 60); // limite defensivo
      const valorParcela = valorTotal / qtd;
      const grupoId = randomUUID();

      criadas = await prisma.$transaction(
        Array.from({ length: qtd }, (_, i) => {
          const dataParcela = new Date(dataBase);
          dataParcela.setMonth(dataParcela.getMonth() + i);
          return prisma.transacao.create({
            data: {
              grupoId,
              descricaoBase: descricao,
              descricao: `${descricao} (${i + 1}/${qtd})`,
              valor: valorParcela,
              valorTotalDaCompra: valorTotal,
              data: dataParcela,
              categoria: categoriaDb,
              tags: typeof tags === 'string' ? tags.slice(0, 200) : '',
              anexo: anexo ?? null,
              userId: idParaSalvar,
            },
          });
        })
      );
    } else {
      const t = await prisma.transacao.create({
        data: {
          descricao,
          valor: valorTotal,
          data: dataBase,
          categoria: categoriaDb,
          tags: typeof tags === 'string' ? tags.slice(0, 200) : '',
          anexo: anexo ?? null,
          userId: idParaSalvar,
        },
      });
      criadas = [t];
    }

    res.status(201).json(criadas.map(serializeTransacao));
  } catch (err) {
    console.error('[transacoes.criar]', err);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
}


// PUT /api/transacoes/:id
async function atualizar(req, res) {
  const { id }    = req.params;
  const { descricao, valor, data, categoria, tags, anexo } = req.body;

  try {
    const atualizada = await prisma.transacao.update({
      where: { id },
      data: {
        ...(descricao  != null && { descricao }),
        ...(valor      != null && { valor: parseFloat(valor) }),
        ...(data       != null && { data: new Date(data) }),
        ...(categoria  != null && { categoria: toDbCategoria(categoria) }),
        ...(tags       != null && { tags }),
        ...(anexo      != null && { anexo }),
      },
    });

    res.json(serializeTransacao(atualizada));
  } catch (err) {
    console.error('[transacoes.atualizar]', err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Transação não encontrada' });
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
}

// DELETE /api/transacoes/:id  — transação individual
async function eliminar(req, res) {
  try {
    await prisma.transacao.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Transação não encontrada' });
    res.status(500).json({ error: 'Erro ao eliminar transação' });
  }
}

// DELETE /api/transacoes/grupo/:grupoId  — todas as parcelas do grupo
async function eliminarGrupo(req, res) {
  try {
    const { count } = await prisma.transacao.deleteMany({
      where: { grupoId: req.params.grupoId },
    });

    if (count === 0) return res.status(404).json({ error: 'Grupo não encontrado' });
    res.status(204).send();
  } catch (err) {
    console.error('[transacoes.eliminarGrupo]', err);
    res.status(500).json({ error: 'Erro ao eliminar grupo' });
  }
}

module.exports = { listar, criar, atualizar, eliminar, eliminarGrupo };