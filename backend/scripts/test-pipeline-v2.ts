// 8ステップパイプライン（v2）のテストスクリプト
import prisma from '../src/lib/prisma';
import { inngest } from '../src/inngest/client';
import { randomUUID } from 'crypto';

async function main() {
  console.log('=== 8ステップパイプライン（v2）テスト ===\n');

  // 古いジョブをFAILED状態にする
  await prisma.generation_jobs.updateMany({
    where: {
      keyword: 'ヨガ 初心者 始め方',
      status: { in: ['RUNNING', 'PENDING'] }
    },
    data: {
      status: 'FAILED',
      errorMessage: 'Manually cancelled for testing v2'
    }
  });
  console.log('古いジョブをFAILED状態に更新');

  // 必要なデータを取得
  const category = await prisma.categories.findFirst();
  const author = await prisma.authors.findFirst();
  const brand = await prisma.brands.findFirst({ where: { isDefault: true } });
  const user = await prisma.users.findFirst();
  const knowledgeItems = await prisma.knowledge_items.findMany({
    where: { authorId: author?.id },
    take: 5
  });

  if (!category || !author || !brand || !user) {
    console.error('必要なデータがありません:');
    console.error('  Category:', category ? 'OK' : 'なし');
    console.error('  Author:', author ? 'OK' : 'なし');
    console.error('  Brand:', brand ? 'OK' : 'なし');
    console.error('  User:', user ? 'OK' : 'なし');
    return;
  }

  console.log('\n生成設定:');
  console.log('  カテゴリ:', category.name);
  console.log('  監修者:', author.name);
  console.log('  ブランド:', brand.name);
  console.log('  情報バンク:', knowledgeItems.length, '件');

  // ジョブを作成
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

  console.log('\nジョブ作成完了:', job.id);

  // 8ステップパイプライン（v2）のイベントを送信
  await inngest.send({
    name: 'article/generate-pipeline-v2',
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

  console.log('Inngestイベント送信完了: article/generate-pipeline-v2');
  console.log('\n進捗はInngestダッシュボードまたは以下のコマンドで確認:');
  console.log(`  npx tsx scripts/check-job-detail.ts ${job.id}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
