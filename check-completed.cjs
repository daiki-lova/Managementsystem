require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const job = await prisma.generation_jobs.findFirst({
    where: { id: '79c104e8-5b8f-4ebb-b68e-a900e602f54d' },
    include: {
      articles: {
        include: {
          media_assets: true
        }
      }
    }
  });
  
  console.log('=== Completed Job Details ===\n');
  console.log('Keyword:', job.keyword);
  console.log('Status:', job.status);
  console.log('Progress:', job.progress + '%');
  
  if (job.articles.length > 0) {
    const a = job.articles[0];
    console.log('\n=== Article ===');
    console.log('Title:', a.title);
    console.log('Slug:', a.slug);
    console.log('\n=== Images ===');
    console.log('Thumbnail ID:', a.thumbnailId);
    console.log('Thumbnail URL:', a.media_assets?.url || 'N/A');
    console.log('OGP URL:', a.ogpImageUrl || 'NO OGP');
  }
  
  await prisma.$disconnect();
}
check().catch(console.error);
