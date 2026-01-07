
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Data Backfill...');

    // 1. Authors: Ensure explicit categories, tags, and systemPrompt
    const authors = await prisma.authors.findMany();
    for (const author of authors) {
        const updates: any = {};
        if (!author.categories) updates.categories = ['General'];
        if (!author.tags) updates.tags = ['Expert'];
        if (!author.systemPrompt || author.systemPrompt === '') updates.systemPrompt = 'You are an expert in your field. Write with authority and clarity.';

        if (Object.keys(updates).length > 0) {
            await prisma.authors.update({
                where: { id: author.id },
                data: updates,
            });
            console.log(`Updated Author ${author.name}`);
        }
    }

    // 2. Conversions: Ensure context
    const conversions = await prisma.conversions.findMany();
    for (const c of conversions) {
        if (!c.context || c.context === '') {
            await prisma.conversions.update({
                where: { id: c.id },
                data: { context: `Context for ${c.name}. This offer is about...` },
            });
            console.log(`Updated Conversion ${c.name}`);
        }
    }

    // 3. Articles: Ensure thumbnails
    // Find a media asset to use as default if needed
    const media = await prisma.media_assets.findFirst();
    const articles = await prisma.articles.findMany({ where: { thumbnailId: null } });

    if (media && articles.length > 0) {
        console.log(`Found ${articles.length} articles without thumbnails. Using media ${media.id}`);
        await prisma.articles.updateMany({
            where: { thumbnailId: null },
            data: { thumbnailId: media.id },
        });
        console.log('Updated Article thumbnails');
    }

    // 4. Knowledge Bank: Ensure author linkage if missing
    // Link unlinked items to the first author
    const firstAuthor = authors[0];
    if (firstAuthor) {
        const items = await prisma.knowledge_items.findMany({ where: { authorId: null } });
        if (items.length > 0) {
            await prisma.knowledge_items.updateMany({
                where: { authorId: null },
                data: { authorId: firstAuthor.id }
            });
            console.log(`Updated ${items.length} Knowledge Items with default author`);
        }
    }

    console.log('Data Backfill Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
