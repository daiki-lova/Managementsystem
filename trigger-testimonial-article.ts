import prisma from "./src/lib/prisma";
import { inngest } from "./src/inngest/client";
import { randomUUID } from "crypto";

async function triggerTestimonialArticle() {
  const jobId = randomUUID();

  // お客様の声を活用したヨガ記事
  const keyword = "ヨガ 効果 体験談 初心者";
  const categoryId = "73ff9540-1d04-41f2-b3df-84534208adf9"; // YOGA
  const authorId = "b1329b28-1a2e-4f6e-9fd9-88a8065af5e2"; // 佐藤 健一
  const brandId = "d23546a5-6bbb-40e6-80f3-18e60fbaca34"; // RADIANCE
  const userId = "684d65d7-baef-4538-938b-f58bc670ace2"; // admin@radiance.jp

  // お客様の声（体験談）3件
  const knowledgeItemIds = [
    "e7be1b8c-a503-4cbf-892d-1b6a895b9de2", // 30代女性・デスクワーク
    "28f641bc-bbf6-426e-bcd0-27e116ff996a", // 50代女性・主婦
    "d62d5afc-7ce4-4ed2-8b38-5d680b9b7d5e", // 産後ママ
  ];

  console.log("=== お客様の声を活用した記事生成 ===");
  console.log("Job ID:", jobId);
  console.log("Keyword:", keyword);
  console.log("Knowledge Items:", knowledgeItemIds.length, "件");

  // DBにジョブを作成
  const job = await prisma.generation_jobs.create({
    data: {
      id: jobId,
      keyword,
      categoryId,
      authorId,
      userId,
      status: "PENDING",
      progress: 0,
      currentStage: 0,
      statusMessage: "ジョブ作成完了",
      generation_job_knowledge_items: {
        create: knowledgeItemIds.map((knowledgeItemId) => ({
          knowledgeItemId,
        })),
      },
    },
  });

  console.log("Job created:", job.id);

  // Inngestイベントを発火
  console.log("Sending Inngest event...");
  const result = await inngest.send({
    name: "article/generate-pipeline",
    data: {
      jobId: job.id,
      keyword,
      categoryId,
      authorId,
      brandId,
      conversionIds: [],
      knowledgeItemIds,
      userId,
    },
  });

  console.log("Inngest event sent:", result);
  console.log("\n=== Job Started ===");
  console.log("Job ID:", jobId);
  console.log("Keyword:", keyword);
  console.log("Check Inngest dashboard: http://localhost:8288");
  console.log("\nTo monitor job status:");
  console.log(`SELECT status, progress, "currentStage", "statusMessage" FROM generation_jobs WHERE id = '${jobId}';`);
}

triggerTestimonialArticle()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
