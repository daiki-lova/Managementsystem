require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const job = await prisma.generation_jobs.findFirst({
    where: { id: 'd4085794-ab67-4b2a-950e-1c5132ddb393' },
    include: {
      articles: {
        select: {
          id: true,
          title: true,
          thumbnailId: true,
          ogpImageUrl: true
        }
      }
    }
  });
  
  if (!job) {
    console.log('Job not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log('Status:', job.status);
  console.log('Progress:', job.progress + '%');
  console.log('Stage:', job.currentStage);
  if (job.errorMessage) console.log('Error:', job.errorMessage);
  
  if (job.articles.length > 0) {
    console.log('\n=== Article ===');
    const a = job.articles[0];
    console.log('Title:', a.title);
    console.log('Thumbnail:', a.thumbnailId ? 'YES' : 'NO');
    console.log('OGP:', a.ogpImageUrl ? 'YES' : 'NO');
  }
  
  await prisma.$disconnect();
}
check().catch(console.error);
