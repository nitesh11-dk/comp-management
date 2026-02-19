
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Fixing CycleTiming Data Inconsistency ---');

    // Since we can't reliably query for "null" on fields that Prisma now thinks are non-nullable 
    // without TypeScript complaining or runtime conversion errors, we'll use raw SQL 
    // or a more permissive query if possible.

    // Actually, getCycleTimings is failing at the mapping stage.
    // We'll use raw SQL to fix it directly in the DB.

    try {
        const updatedCount = await prisma.$executeRaw`
      UPDATE "CycleTiming" 
      SET "endDay" = 31, "span" = 'SAME_MONTH' 
      WHERE "endDay" IS NULL OR "span" IS NULL;
    `;

        console.log(`✅ Successfully updated ${updatedCount} records.`);
    } catch (error) {
        console.error('❌ Error updating records:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
