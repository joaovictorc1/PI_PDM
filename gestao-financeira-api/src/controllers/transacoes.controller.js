const { randomUUID }       = require('crypto');
const prisma               = require('../lib/prisma');
const { toDbCategoria, serializeTransacao } = require('../lib/helpers');

// GET /api/transacoes?userId=&filtro=todas|recentes
async function listar(req, res) {
  const { userId, filtro } = req.query;
  //if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });

  try {
    const where = userId ? { userId } : {};

    if (filtro === 'recentes') {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      where.data = { gte: seteDiasAtras };
    }

    const transacoes = await prisma.transacao.findMany({
      where,
      orderBy: { data: 'desc' },
    });

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
  // 1. Adicione um console.log para você ver no terminal exatamente o que o App enviou:
  console.log("Dados recebidos do App (Transações):", req.body);

  // 2. Filtro blindado para o userId:
  let idParaSalvar = null;
  if (userId && typeof userId === 'string' && userId.trim() !== '' && userId !== 'null' && userId !== 'undefined' && userId !== 'substituir-pelo-id-real-do-utilizador') {
      idParaSalvar = userId;
  }

  if (!descricao || valor == null || !data) { 
    return res.status(400).json({ error: 'descricao, valor e data são obrigatórios' }); 
  }

  try {
    const valorTotal  = parseFloat(valor);
    const categoriaDb = toDbCategoria(categoria ?? 'Outros');
    const dataBase    = new Date(data);

    let criadas;

    if (isParcelado && parseInt(numeroParcelas) > 1) {
      const qtd            = parseInt(numeroParcelas);
      const valorParcela   = valorTotal / qtd;
      const grupoId        = randomUUID();

      // Cria todas as parcelas numa única transação atómica no DB
      criadas = await prisma.$transaction(
        Array.from({ length: qtd }, (_, i) => {
          const dataParcela = new Date(dataBase);
          dataParcela.setMonth(dataParcela.getMonth() + i);

          return prisma.transacao.create({
            data: {
              grupoId,
              descricaoBase:      descricao,
              descricao:          `${descricao} (${i + 1}/${qtd})`,
              valor:              valorParcela,
              valorTotalDaCompra: valorTotal,
              data:               dataParcela,
              categoria:          categoriaDb,
              tags:               tags  ?? '',
              anexo:              anexo ?? null,
              userId:             idParaSalvar,
            },
          });
        })
      );
    } else {
      const t = await prisma.transacao.create({
        data: {
          descricao,
          valor:     valorTotal,
          data:      dataBase,
          categoria: categoriaDb,
          tags:      tags  ?? '',
          anexo:     anexo ?? null,
          userId:  idParaSalvar,
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