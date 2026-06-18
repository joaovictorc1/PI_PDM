-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('ALIMENTACAO', 'TRANSPORTE', 'LAZER', 'SAUDE', 'EDUCACAO', 'OUTROS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ocupacao" TEXT,
    "foto" TEXT,
    "senha" TEXT,
    "biometria" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT,
    "descricaoBase" TEXT,
    "valorTotalDaCompra" DECIMAL(12,2),
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" TIMESTAMPTZ NOT NULL,
    "categoria" "Categoria" NOT NULL DEFAULT 'OUTROS',
    "tags" TEXT,
    "anexo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorAlvo" DECIMAL(12,2) NOT NULL,
    "depositoMensal" DECIMAL(12,2) NOT NULL,
    "taxaJuros" DECIMAL(6,4) NOT NULL,
    "previsaoData" TEXT NOT NULL,
    "meses" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "metas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamentos" (
    "id" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "limite" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "transacoes_userId_idx" ON "transacoes"("userId");

-- CreateIndex
CREATE INDEX "transacoes_grupoId_idx" ON "transacoes"("grupoId");

-- CreateIndex
CREATE INDEX "transacoes_userId_data_idx" ON "transacoes"("userId", "data");

-- CreateIndex
CREATE INDEX "transacoes_userId_categoria_idx" ON "transacoes"("userId", "categoria");

-- CreateIndex
CREATE INDEX "metas_userId_idx" ON "metas"("userId");

-- CreateIndex
CREATE INDEX "orcamentos_userId_idx" ON "orcamentos"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "orcamentos_userId_categoria_key" ON "orcamentos"("userId", "categoria");

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas" ADD CONSTRAINT "metas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
