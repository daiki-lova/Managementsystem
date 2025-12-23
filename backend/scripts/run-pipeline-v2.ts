// 8ステップパイプラインV2のテスト実行
import prisma from "../src/lib/prisma";
import { inngest } from "../src/inngest/client";
import { randomUUID } from "crypto";
import { GenerationJobStatus } from "@prisma/client";

async function main() {
  const jobId = randomUUID();
  const keyword = "ヨガインストラクター 資格 費用";

  // テストデータ
  const data = {
    authorId: "80896468-d673-43d3-9ff7-edf97584256c", // 武川 未央
    categoryId: "73ff9540-1d04-41f2-b3df-84534208adf9", // YOGA
    brandId: "d23546a5-6bbb-40e6-80f3-18e60fbaca34", // RADIANCE
    userId: "684d65d7-baef-4538-938b-f58bc670ace2", // admin
    conversionIds: ["cv-trial"],
  };

  console.log("=== 8ステップパイプライン V2 テスト ===");
  console.log(`Job ID: ${jobId}`);
  console.log(`Keyword: ${keyword}`);
  console.log(`Author: 武川 未央`);
  console.log("");

  // 1. ジョブを作成
  const job = await prisma.generation_jobs.create({
    data: {
      id: jobId,
      keyword,
      status: GenerationJobStatus.PENDING,
      progress: 0,
      categoryId: data.categoryId,
      authorId: data.authorId,
      brandId: data.brandId,
      userId: data.userId,
    },
  });
  console.log(`Job created: ${job.id}`);

  // 2. Inngestイベントを発火
  console.log("Sending Inngest event: article/generate-pipeline-v2");

  await inngest.send({
    name: "article/generate-pipeline-v2",
    data: {
      jobId,
      keyword,
      categoryId: data.categoryId,
      authorId: data.authorId,
      brandId: data.brandId,
      conversionIds: data.conversionIds,
      userId: data.userId,
    },
  });

  console.log("");
  console.log("Event sent! パイプラインが開始されました。");
  console.log("");
  console.log("進捗確認:");
  console.log(`  SELECT status, progress, "currentStage", "statusMessage" FROM generation_jobs WHERE id = '${jobId}';`);
  console.log("");
  console.log("ステージ確認:");
  console.log(`  SELECT stage, "stageName", status, "tokensUsed" FROM generation_stages WHERE "jobId" = '${jobId}' ORDER BY stage;`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
