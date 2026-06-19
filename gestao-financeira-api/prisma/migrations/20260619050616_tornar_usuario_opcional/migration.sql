-- AlterTable
ALTER TABLE "metas" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "transacoes" ALTER COLUMN "userId" DROP NOT NULL;
