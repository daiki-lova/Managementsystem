require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function main() {
  // スタックしたジョブをFAILEDにする
  const updated = await prisma.generation_jobs.updateMany({
    where: { 
      status: 'PENDING',
      progress: { gt: 0 }
    },
    data: { 
      status: 'FAILED',
      errorMessage: 'Reset: stuck job'
    }
  });
  console.log('Reset stuck jobs:', updated.count);
  
  // 新しいジョブを作成
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
  console.log('Created job:', job.id);
  
  // Inngestイベント送信
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
  console.log('Event status:', res.status);
  
  await prisma.$disconnect();
}
main().catch(console.error);
