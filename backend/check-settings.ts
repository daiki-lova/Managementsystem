import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Try updating the settings
    console.log('Attempting to update settings via Prisma...');
    await prisma.system_settings.upsert({
        where: { id: 'default' },
        update: {
            keywordPrompt: 'PERSISTENCE_TEST_VALUE',
            structurePrompt: 'STRUCTURE_TEST_VALUE',
        },
        create: {
            id: 'default',
            keywordPrompt: 'PERSISTENCE_TEST_VALUE',
        },
    });
    console.log('Update finished.');

    const settings = await prisma.system_settings.findUnique({
        where: { id: 'default' },
    });

    if (!settings) {
        console.log('No default settings found.');
    } else {
        console.log('Current System Settings:');
        console.log('------------------------');
        console.log(`keywordPrompt: ${settings.keywordPrompt ? settings.keywordPrompt.substring(0, 50) + '...' : 'null'}`);
        console.log(`structurePrompt: ${settings.structurePrompt ? settings.structurePrompt.substring(0, 50) + '...' : 'null'}`);
        console.log(`proofreadingPrompt: ${settings.proofreadingPrompt ? settings.proofreadingPrompt.substring(0, 50) + '...' : 'null'}`);
        console.log(`seoPrompt: ${settings.seoPrompt ? settings.seoPrompt.substring(0, 50) + '...' : 'null'}`);
        console.log(`imageModel: ${settings.imageModel}`);
        console.log(`articleModel: ${settings.articleModel}`);
        console.log(`analysisModel: ${settings.analysisModel}`);
        console.log('------------------------');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
