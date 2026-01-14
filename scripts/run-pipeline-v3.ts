/**
 * V3パイプラインテストスクリプト
 * 受講生の声#52を使用して記事生成をテスト
 */
import prisma from "../src/lib/prisma";
import { inngest } from "../src/inngest/client";
import { randomUUID } from "crypto";

async function main() {
  // 受講生の声 #52
  const knowledgeItemId = "f928b0c2-112c-4d84-af9a-1e464bf7b41b";

  // 武川 未央
  const authorId = "80896468-d673-43d3-9ff7-edf97584256c";

  // YOGA カテゴリ
  const categoryId = "73ff9540-1d04-41f2-b3df-84534208adf9";

  // ALIGN ブランド
  const brandId = "d23546a5-6bbb-40e6-80f3-18e60fbaca34";

  // 管理者ユーザーID
  const userId = "684d65d7-baef-4538-938b-f58bc670ace2";

  // コンバージョン（資料請求）
  const conversionIds = ["a9999042-4ef9-4ffe-b61b-3249e2c2f7b4"];

  // まず受講生の声の内容を確認
  const knowledgeItem = await prisma.knowledge_items.findUnique({
    where: { id: knowledgeItemId },
  });

  if (!knowledgeItem) {
    console.error("受講生の声が見つかりません");
    process.exit(1);
  }

  console.log("========================================");
  console.log("受講生の声 #52 の内容:");
  console.log("========================================");
  console.log(knowledgeItem.content);
  console.log("========================================");
  console.log(`文字数: ${knowledgeItem.content.length}`);
  console.log("========================================\n");

  // ジョブを作成
  const jobId = randomUUID();
  const job = await prisma.generation_jobs.create({
    data: {
      id: jobId,
      keyword: "V3パイプラインテスト",
      categoryId,
      authorId,
      brandId,
      userId,
      publishStrategy: "DRAFT",
    },
  });

  console.log(`ジョブ作成完了: ${job.id}`);
  console.log("V3パイプラインを開始します...\n");

  // Inngestイベントを発行
  await inngest.send({
    name: "article/generate-pipeline-v3",
    data: {
      jobId: job.id,
      knowledgeItemId,
      categoryId,
      authorId,
      brandId,
      conversionIds,
      userId,
    },
  });

  console.log("イベント発行完了。Inngestダッシュボードで進捗を確認してください。");
  console.log(`ジョブID: ${job.id}`);
  console.log("\nInngestダッシュボード: http://localhost:8288");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
