-- DropIndex
DROP INDEX "orcamentos_userId_categoria_key";

-- AlterTable
ALTER TABLE "orcamentos" ALTER COLUMN "userId" DROP NOT NULL;
