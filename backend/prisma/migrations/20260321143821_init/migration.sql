-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('SENSEI', 'KARATECA');

-- CreateEnum
CREATE TYPE "CategoriaInventario" AS ENUM ('PROTECCION', 'INSTRUMENTO');

-- CreateEnum
CREATE TYPE "EstadoInventario" AS ENUM ('BUENO', 'REGULAR', 'MALO');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "telefono" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Karateca" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "kyuActual" TEXT NOT NULL DEFAULT '8kyu',
    "dan" INTEGER,
    "preExamenAprobado" BOOLEAN NOT NULL DEFAULT false,
    "fechaUltimoAscenso" TIMESTAMP(3),

    CONSTRAINT "Karateca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" SERIAL NOT NULL,
    "karatecaId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "presente" BOOLEAN NOT NULL,
    "registradoPorId" INTEGER NOT NULL,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensualidad" (
    "id" SERIAL NOT NULL,
    "karatecaId" INTEGER NOT NULL,
    "mes" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),

    CONSTRAINT "Mensualidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poliza" (
    "id" SERIAL NOT NULL,
    "karatecaId" INTEGER NOT NULL,
    "aseguradora" TEXT NOT NULL,
    "numeroPoliza" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poliza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaInventario" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "estado" "EstadoInventario" NOT NULL,
    "notas" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Karateca_userId_key" ON "Karateca"("userId");

-- AddForeignKey
ALTER TABLE "Karateca" ADD CONSTRAINT "Karateca_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_karatecaId_fkey" FOREIGN KEY ("karatecaId") REFERENCES "Karateca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensualidad" ADD CONSTRAINT "Mensualidad_karatecaId_fkey" FOREIGN KEY ("karatecaId") REFERENCES "Karateca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poliza" ADD CONSTRAINT "Poliza_karatecaId_fkey" FOREIGN KEY ("karatecaId") REFERENCES "Karateca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
