require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Check recent jobs
  const jobs = await prisma.generation_jobs.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
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
  
  console.log('=== Recent Jobs ===\n');
  for (const job of jobs) {
    console.log('ID:', job.id.substring(0, 8) + '...');
    console.log('Keyword:', job.keyword);
    console.log('Status:', job.status, '|', job.progress + '%', '| Stage', job.currentStage);
    if (job.articles.length > 0) {
      const a = job.articles[0];
      console.log('Article:', a.title?.substring(0, 40) + '...');
      console.log('  Thumbnail:', a.thumbnailId ? 'YES' : 'NO');
      console.log('  OGP:', a.ogpImageUrl ? 'YES' : 'NO');
    } else {
      console.log('Article: none');
    }
    console.log('---');
  }
  
  await prisma.$disconnect();
}
check().catch(console.error);
