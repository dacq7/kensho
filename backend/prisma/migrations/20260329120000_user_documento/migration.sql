-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tipoDocumento" TEXT,
ADD COLUMN     "numeroDocumento" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_numeroDocumento_key" ON "User"("numeroDocumento");
