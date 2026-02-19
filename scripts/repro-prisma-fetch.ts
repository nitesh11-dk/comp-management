
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Testing CycleTiming Fetch ---');
    try {
        const cycles = await prisma.cycleTiming.findMany();
        console.log('✅ Success! Fetched cycles:', JSON.stringify(cycles, null, 2));
    } catch (error: any) {
        console.error('❌ Fetch failed:', error.message);
        if (error.meta) {
            console.error('Error Meta:', JSON.stringify(error.meta, null, 2));
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
