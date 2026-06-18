// src/lib/helpers.js
const CATEGORIA_TO_DB = {
  'Alimentação': 'ALIMENTACAO',
  'Transporte':  'TRANSPORTE',
  'Lazer':       'LAZER',
  'Saúde':       'SAUDE',
  'Educação':    'EDUCACAO',
  'Outros':      'OUTROS',
};

// Inverte o mapa para DB → Frontend
const CATEGORIA_TO_FRONTEND = Object.fromEntries(
  Object.entries(CATEGORIA_TO_DB).map(([k, v]) => [v, k])
);

const toDbCategoria       = (cat) => CATEGORIA_TO_DB[cat]       ?? 'OUTROS';
const toFrontendCategoria = (cat) => CATEGORIA_TO_FRONTEND[cat] ?? 'Outros';

// Converte Decimal do Prisma → number nativo e padroniza campos opcionais
function serializeTransacao(t) {
  return {
    id:                 t.id,
    grupoId:            t.grupoId            ?? null,
    descricaoBase:      t.descricaoBase      ?? null,
    descricao:          t.descricao,
    valor:              Number(t.valor),
    valorTotalDaCompra: t.valorTotalDaCompra ? Number(t.valorTotalDaCompra) : null,
    data:               t.data.toISOString(),
    categoria:          toFrontendCategoria(t.categoria),
    tags:               t.tags    ?? '',
    anexo:              t.anexo   ?? null,
  };
}

function serializeMeta(m) {
  return {
    id:             m.id,
    nome:           m.nome,
    valorAlvo:      Number(m.valorAlvo),
    depositoMensal: Number(m.depositoMensal),
    taxaJuros:      Number(m.taxaJuros),
    previsaoData:   m.previsaoData,
    meses:          m.meses,
  };
}

module.exports = { toDbCategoria, toFrontendCategoria, serializeTransacao, serializeMeta };