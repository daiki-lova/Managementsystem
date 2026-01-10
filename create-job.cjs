require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function create() {
  const category = await prisma.categories.findFirst();
  const author = await prisma.authors.findFirst();
  const brand = await prisma.brands.findFirst();
  const user = await prisma.users.findFirst();
  
  const jobId = randomUUID();
  const job = await prisma.generation_jobs.create({
    data: {
      id: jobId,
      keyword: '肩こり解消ヨガ',
      categoryId: category.id,
      authorId: author.id,
      brandId: brand.id,
      userId: user.id,
      status: 'PENDING',
      progress: 0,
      currentStage: 0,
      totalArticles: 1,
      publishStrategy: 'DRAFT',
      imageStyle: 'REALISTIC'
    }
  });
  console.log('Job ID:', job.id);
  
  const res = await fetch('http://localhost:8288/e/key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'article/generate-pipeline-v6',
      data: {
        jobId: job.id,
        categoryId: category.id,
        authorId: author.id,
        brandId: brand.id,
        userId: user.id,
        conversionIds: []
      }
    })
  });
  console.log('Event status:', (await res.json()).status);
  await prisma.$disconnect();
}
create().catch(console.error);
