/**
 * =========================================================
 * SILOCAMP — DATABASE CLIENT
 * =========================================================
 *
 * Prisma 7 + Neon PostgreSQL
 *
 * Utilise :
 * @prisma/adapter-neon
 *
 * DATABASE_URL :
 * connexion poolée Neon utilisée par l'application.
 * =========================================================
 */

import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../generated/prisma/client";

/* =========================================================
   VALIDATION ENV
========================================================= */

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "[SiloCamp] DATABASE_URL est manquante dans le fichier .env.",
  );
}

/* =========================================================
   ADAPTER NEON
========================================================= */

const adapter = new PrismaNeon({
  connectionString: databaseUrl,
});

/* =========================================================
   SINGLETON PRISMA
========================================================= */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * En développement, Vite/tsx peut recharger
 * plusieurs fois les modules.
 *
 * On conserve donc une seule instance Prisma.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

/**
 * On conserve l'instance globale
 * uniquement en développement.
 */
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/* =========================================================
   TEST DE CONNEXION
========================================================= */

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return true;
  } catch (error) {
    console.error(
      "[SiloCamp] Connexion Neon impossible :",
      error,
    );

    return false;
  }
}

/* =========================================================
   FERMETURE
========================================================= */

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error(
      "[SiloCamp] Erreur lors de la fermeture de Prisma :",
      error,
    );
  }
}