
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Conversions Data Fix...');

    // 1. Get available media for thumbnails
    const mediaAssets = await prisma.media_assets.findMany({ take: 10 });
    const imageUrls = mediaAssets.map(m => m.url);

    if (imageUrls.length === 0) {
        // Fallback if no media
        imageUrls.push('https://placehold.co/600x400/png');
    }

    const conversions = await prisma.conversions.findMany();

    for (const c of conversions) {
        // 1. Fix Status and Period
        // Make 80% of them ACTIVE and ending in the future
        const isOngoing = Math.random() > 0.2;
        const status = isOngoing ? 'ACTIVE' : 'INACTIVE';

        // Period end: if ongoing, set to 2026. If archived, set to 2024.
        const periodEnd = isOngoing
            ? new Date('2026-12-31')
            : new Date('2024-01-01');

        // 2. Fix Thumbnail
        // Assign a random image from available assets
        const thumbnailUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];

        // 3. Fix Content/Context
        const context = `
Campaign Details:
- Target Audience: RYT200 Students and Yoga Instructors
- Goal: Increase sign-ups for the ${c.name}
- Offer: Special discount verified for ${isOngoing ? 'current period' : 'past period'}
- Key Selling Points: Certified instructors, flexible schedule, online options.
`.trim();

        await prisma.conversions.update({
            where: { id: c.id },
            data: {
                status: status as any,
                periodEnd,
                thumbnailUrl,
                context
            }
        });

        console.log(`Updated Conversion ${c.name}: Status=${status}, End=${periodEnd.toISOString()}`);
    }

    console.log('Conversions Data Fix Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
