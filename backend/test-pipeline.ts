// 6ステージパイプラインテストスクリプト
import { PrismaClient, GenerationJobStatus, PublishStrategy } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function testPipeline() {
  console.log("========================================");
  console.log("6ステージパイプライン テスト");
  console.log("========================================\n");

  try {
    // 必要なデータを取得
    const [category, author, brand, user, conversions, knowledgeItems] = await Promise.all([
      prisma.categories.findFirst(),
      prisma.authors.findFirst(),
      prisma.brands.findFirst(),
      prisma.users.findFirst(),
      prisma.conversions.findMany({ take: 2 }),
      prisma.knowledge_items.findMany({ take: 3 }),
    ]);

    if (!category || !author || !brand || !user) {
      console.error("必要なデータが見つかりません");
      return;
    }

    console.log("テストデータ:");
    console.log(`  カテゴリ: ${category.name}`);
    console.log(`  著者: ${author.name}`);
    console.log(`  ブランド: ${brand.name}`);
    console.log(`  コンバージョン: ${conversions.map(c => c.name).join(", ")}`);
    console.log(`  情報バンク: ${knowledgeItems.map(k => k.title).join(", ")}`);
    console.log("");

    // generation_jobを作成
    const jobId = randomUUID();
    const keyword = "ヨガ 初心者 始め方";

    console.log(`ジョブID: ${jobId}`);
    console.log(`キーワード: ${keyword}\n`);

    const job = await prisma.generation_jobs.create({
      data: {
        id: jobId,
        keyword,
        status: GenerationJobStatus.PENDING,
        progress: 0,
        currentStage: 0,
        categoryId: category.id,
        authorId: author.id,
        userId: user.id,
        publishStrategy: PublishStrategy.DRAFT,
        totalArticles: 1,
        generation_job_conversions: {
          create: conversions.map(c => ({
            conversionId: c.id,
          })),
        },
        generation_job_knowledge_items: {
          create: knowledgeItems.map(k => ({
            knowledgeItemId: k.id,
          })),
        },
      },
    });

    console.log("ジョブが作成されました:", job.id);
    console.log("");

    // Inngestイベントを発火（実際のテストでは）
    console.log("次のステップ:");
    console.log("1. バックエンドサーバーを起動: npm run dev");
    console.log("2. Inngest Dev Serverを起動: npx inngest-cli@latest dev");
    console.log("3. 以下のcurlコマンドでイベントを発火:");
    console.log("");
    console.log(`curl -X POST http://localhost:8288/e/article%2Fgenerate-pipeline \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "article/generate-pipeline",
    "data": {
      "jobId": "${jobId}",
      "keyword": "${keyword}",
      "categoryId": "${category.id}",
      "authorId": "${author.id}",
      "brandId": "${brand.id}",
      "conversionIds": ${JSON.stringify(conversions.map(c => c.id))},
      "knowledgeItemIds": ${JSON.stringify(knowledgeItems.map(k => k.id))},
      "userId": "${user.id}"
    }
  }'`);
    console.log("");

    // あるいは直接ステージ単体テスト
    console.log("========================================");
    console.log("または、ステージを直接テストする場合:");
    console.log("========================================");
    console.log("npx tsx test-stage-1.ts のようなスクリプトを実行");

  } catch (error) {
    console.error("エラー:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPipeline();
