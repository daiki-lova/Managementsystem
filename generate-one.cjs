const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

async function createJob() {
  const prisma = new PrismaClient();

  try {
    // カテゴリ、著者、ブランドを取得
    const category = await prisma.categories.findFirst();
    const author = await prisma.authors.findFirst();
    const brand = await prisma.brands.findFirst();
    const user = await prisma.users.findFirst();

    if (!category || !author || !brand || !user) {
      console.log('必要なデータが見つかりません');
      console.log('category:', !!category, 'author:', !!author, 'brand:', !!brand, 'user:', !!user);
      return;
    }

    // ナレッジアイテムを取得
    const knowledge = await prisma.knowledge_items.findFirst();

    const jobId = randomUUID();

    // ジョブを作成
    const job = await prisma.generation_jobs.create({
      data: {
        id: jobId,
        keyword: 'ヨガ資格 働きながら 主婦',
        categoryId: category.id,
        authorId: author.id,
        brandId: brand.id,
        userId: user.id,
        status: 'PENDING',
        progress: 0,
        currentStage: 0,
        totalArticles: 1,
        publishStrategy: 'DRAFT',
        imageStyle: 'REALISTIC',
      }
    });

    console.log('ジョブ作成完了:', job.id);
    console.log('キーワード:', job.keyword);
    console.log('カテゴリ:', category.name);
    console.log('著者:', author.name);

    // Inngestイベントを発火
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
          knowledgeItemId: knowledge ? knowledge.id : null,
          userId: user.id,
          conversionIds: []
        }
      })
    });

    const result = await res.json();
    console.log('Inngestイベント発火:', result.status || 'sent');
    console.log('');
    console.log('生成状況は Inngest DevServer (http://localhost:8288) で確認できます');

  } finally {
    await prisma.$disconnect();
  }
}

createJob().catch(console.error);
