require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

// STUDYカテゴリー用に3記事を異なる監修者で生成
async function createStudyJobs() {
  try {
    // 設定
    const studyCategoryId = 'fed5334f-25c1-4772-9646-8b44265bb3d1';
    const brandId = 'd23546a5-6bbb-40e6-80f3-18e60fbaca34';
    const userId = '684d65d7-baef-4538-938b-f58bc670ace2';

    // 異なる監修者3人
    const authors = [
      { id: '785ee7dd-3ba1-4b61-bd78-5a82819f7c93', name: '福田 舞' },
      { id: '5603b5ae-b0fe-4bee-911d-2438d248b42d', name: '猪子 眞由' },
      { id: 'b1329b28-1a2e-4f6e-9fd9-88a8065af5e2', name: '間宮 愛' },
    ];

    // 異なるナレッジアイテム3件
    const knowledgeItemIds = [
      '0109bb64-67e5-4280-af8b-5d6960964b28',
      '02023efc-b465-4dc7-9031-794c2478c451',
      '0491c68b-257c-4bfc-adca-dd4d0ffd232f',
    ];

    // 異なる画像スタイル
    const imageStyles = ['REALISTIC', 'SCENIC', 'HANDDRAWN'];

    console.log('=== STUDY カテゴリー用 3記事生成開始 ===\n');

    for (let i = 0; i < 3; i++) {
      const jobId = randomUUID();
      const author = authors[i];
      const knowledgeItemId = knowledgeItemIds[i];
      const imageStyle = imageStyles[i];

      // ジョブを作成
      const job = await prisma.generation_jobs.create({
        data: {
          id: jobId,
          keyword: `STUDYカテゴリー記事 ${i + 1}`,
          categoryId: studyCategoryId,
          authorId: author.id,
          brandId: brandId,
          userId: userId,
          status: 'PENDING',
          progress: 0,
          currentStage: 0,
          totalArticles: 1,
          publishStrategy: 'DRAFT',
          imageStyle: imageStyle,
          generation_job_knowledge_items: {
            create: [{ knowledgeItemId }],
          },
        },
      });

      console.log(`記事 ${i + 1}:`);
      console.log(`  ジョブID: ${job.id}`);
      console.log(`  監修者: ${author.name}`);
      console.log(`  画像スタイル: ${imageStyle}`);

      // Inngestイベントを発火
      const res = await fetch('http://localhost:8288/e/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'article/generate-pipeline-v6',
          data: {
            jobId: job.id,
            categoryId: studyCategoryId,
            authorId: author.id,
            brandId: brandId,
            knowledgeItemId: knowledgeItemId,
            userId: userId,
            conversionIds: [],
          },
        }),
      });

      const result = await res.json();
      console.log(`  Inngest: ${result.status || 'sent'}\n`);
    }

    console.log('=== 3記事の生成ジョブを開始しました ===');
    console.log('生成状況は Inngest DevServer (http://localhost:8288) で確認できます');

  } finally {
    await prisma.$disconnect();
  }
}

createStudyJobs().catch(console.error);
