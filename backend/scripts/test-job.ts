import prisma from '../src/lib/prisma';
import { inngest } from '../src/inngest/client';
import { randomUUID } from 'crypto';

async function main() {
  // Mark old job as failed
  await prisma.generation_jobs.updateMany({
    where: {
      keyword: 'ヨガ 初心者 始め方',
      status: { in: ['RUNNING', 'PENDING'] }
    },
    data: {
      status: 'FAILED',
      errorMessage: 'Manually cancelled for testing'
    }
  });
  console.log('Old jobs marked as failed');

  // Get required data
  const category = await prisma.categories.findFirst();
  const author = await prisma.authors.findFirst();
  const brand = await prisma.brands.findFirst({ where: { isDefault: true } });
  const user = await prisma.users.findFirst();
  const knowledgeItems = await prisma.knowledge_items.findMany({ take: 3 });

  if (!category || !author || !brand || !user) {
    console.error('Missing required data');
    return;
  }

  console.log('Creating job with:');
  console.log('  Category:', category.name);
  console.log('  Author:', author.name);
  console.log('  Brand:', brand.name);
  console.log('  Knowledge items:', knowledgeItems.length);

  // Create job
  const jobId = randomUUID();
  const job = await prisma.generation_jobs.create({
    data: {
      id: jobId,
      keyword: 'ヨガ 初心者 始め方',
      searchVolume: 1200,
      categoryId: category.id,
      authorId: author.id,
      brandId: brand.id,
      userId: user.id,
      publishStrategy: 'DRAFT',
      generation_job_knowledge_items: {
        create: knowledgeItems.map(k => ({
          knowledgeItemId: k.id
        }))
      }
    }
  });

  console.log('Job created:', job.id);

  // Send Inngest event - 新しいパイプラインを使用（HTML生成）
  await inngest.send({
    name: 'article/generate-pipeline',
    data: {
      jobId: job.id,
      keyword: 'ヨガ 初心者 始め方',
      categoryId: category.id,
      authorId: author.id,
      brandId: brand.id,
      conversionIds: [],
      userId: user.id,
    }
  });

  console.log('Inngest event sent');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
