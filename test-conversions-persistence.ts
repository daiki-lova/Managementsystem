
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Conversions Persistence Check...');

    // 1. Create
    console.log('1. Testing Create...');
    const conversionId = randomUUID();
    const created = await prisma.conversions.create({
        data: {
            id: conversionId,
            name: 'TEST_CONVERSION_PERSISTENCE',
            type: 'BANNER',
            status: 'ACTIVE',
            url: 'https://example.com/test',
            context: 'Test context',
            thumbnailUrl: null,
        },
    });
    console.log('Created conversion:', created.id, created.name);

    // 2. Read
    console.log('2. Testing Read...');
    const read = await prisma.conversions.findUnique({
        where: { id: conversionId },
    });
    if (!read || read.name !== 'TEST_CONVERSION_PERSISTENCE') {
        throw new Error('Read failed or data mismatch');
    }
    console.log('Read verification successful');

    // 3. Update
    console.log('3. Testing Update...');
    const updated = await prisma.conversions.update({
        where: { id: conversionId },
        data: {
            name: 'TEST_CONVERSION_UPDATED',
            status: 'INACTIVE',
            context: 'Updated context',
        },
    });

    if (updated.name !== 'TEST_CONVERSION_UPDATED' || updated.status !== 'INACTIVE') {
        throw new Error('Update failed or data mismatch');
    }

    // Verify update persistence with fresh read
    const readUpdated = await prisma.conversions.findUnique({
        where: { id: conversionId },
    });
    if (readUpdated?.name !== 'TEST_CONVERSION_UPDATED') {
        throw new Error('Update persistence failed');
    }
    console.log('Update verification successful');

    // 4. Delete
    console.log('4. Testing Delete...');
    await prisma.conversions.delete({
        where: { id: conversionId },
    });

    const readDeleted = await prisma.conversions.findUnique({
        where: { id: conversionId },
    });
    if (readDeleted) {
        throw new Error('Delete failed');
    }
    console.log('Delete verification successful');

    console.log('ALL CONVERSION PERSISTENCE CHECKS PASSED');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
