
// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Authors Persistence Check...');

    // 1. Create
    console.log('1. Testing Create...');
    const authorId = randomUUID();
    const created = await prisma.authors.create({
        data: {
            id: authorId,
            name: 'TEST_AUTHOR_PERSISTENCE',
            slug: 'test-author-' + Date.now(),
            role: 'Test Role',
            categories: ['Yoga', 'Health'],
            tags: ['Beginner', 'Advanced'],
            qualifications: [],
            systemPrompt: 'You are a test author.',
            bio: 'Test bio',
        },
    });
    console.log('Created author:', created.id, created.name);

    // 2. Read
    console.log('2. Testing Read...');
    const read = await prisma.authors.findUnique({
        where: { id: authorId },
    });
    if (!read) throw new Error('Read failed');

    // Verify JSON fields
    const categories = read.categories as string[];
    const tags = read.tags as string[];

    if (!categories.includes('Yoga') || !tags.includes('Beginner')) {
        console.error('Read categories:', categories);
        console.error('Read tags:', tags);
        throw new Error('JSON field persistence failed on Create');
    }
    if (read.systemPrompt !== 'You are a test author.') {
        throw new Error('System Prompt persistence failed');
    }
    console.log('Read verification successful');

    // 3. Update
    console.log('3. Testing Update...');
    const updated = await prisma.authors.update({
        where: { id: authorId },
        data: {
            name: 'TEST_AUTHOR_UPDATED',
            categories: ['Meditation', 'Mindfulness'], // Changing categories
            tags: ['Expert'],
            systemPrompt: 'You are an updated test author.',
        } as any,
    });

    // Verify update persistence with fresh read
    const readUpdated = await prisma.authors.findUnique({
        where: { id: authorId },
    });

    const updatedCategories = readUpdated?.categories as string[];

    if (readUpdated?.name !== 'TEST_AUTHOR_UPDATED') {
        throw new Error('Update name persistence failed');
    }
    if (!updatedCategories.includes('Meditation') || updatedCategories.includes('Yoga')) {
        console.error('Updated categories:', updatedCategories);
        throw new Error('Update categories persistence failed');
    }
    if (readUpdated.systemPrompt !== 'You are an updated test author.') {
        throw new Error('Update systemPrompt persistence failed');
    }

    console.log('Update verification successful');

    // 4. Delete
    console.log('4. Testing Delete...');
    await prisma.authors.delete({
        where: { id: authorId },
    });

    const readDeleted = await prisma.authors.findUnique({
        where: { id: authorId },
    });
    if (readDeleted) {
        throw new Error('Delete failed');
    }
    console.log('Delete verification successful');

    console.log('ALL AUTHORS PERSISTENCE CHECKS PASSED');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
