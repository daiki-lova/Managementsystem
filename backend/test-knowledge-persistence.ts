
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Testing Knowledge Bank Persistence ---');

    // 1. Create
    console.log('Creating new item...');
    const newItem = await prisma.knowledge_items.create({
        data: {
            id: 'test-knowledge-item',
            title: 'Test Title',
            type: 'STUDENT_VOICE',
            content: 'Test Content Persisted',
            sourceUrl: 'https://example.com',
        },
    });
    console.log('Created:', newItem.id);

    // 2. Read
    const fetchedItem = await prisma.knowledge_items.findUnique({
        where: { id: 'test-knowledge-item' },
    });
    if (!fetchedItem || fetchedItem.content !== 'Test Content Persisted') {
        throw new Error('Persistence Failed: Item not found or content mismatch');
    }
    console.log('Read verified.');

    // 3. Update (Simulate PATCH)
    console.log('Updating item...');
    const updatedItem = await prisma.knowledge_items.update({
        where: { id: 'test-knowledge-item' },
        data: {
            content: 'Updated Content Persisted',
        },
    });
    if (updatedItem.content !== 'Updated Content Persisted') {
        throw new Error('Update Failed');
    }
    console.log('Update verified.');

    // 4. Delete
    console.log('Deleting item...');
    await prisma.knowledge_items.delete({
        where: { id: 'test-knowledge-item' },
    });
    const deletedItem = await prisma.knowledge_items.findUnique({
        where: { id: 'test-knowledge-item' },
    });
    if (deletedItem) {
        throw new Error('Delete Failed: Item still exists');
    }
    console.log('Delete verified.');
    console.log('--- Success ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
