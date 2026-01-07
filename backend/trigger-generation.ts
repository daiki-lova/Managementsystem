import prisma from "./src/lib/prisma";
import { inngest } from "./src/inngest/client";
import { randomUUID } from "crypto";

async function triggerGeneration() {
  const jobId = randomUUID();
  const keyword = "朝ヨガの効果と初心者向けポーズ";
  const categoryId = "91f8e2bd-3703-4868-be4b-9a238de5734c"; // PILATES
  const authorId = "b1329b28-1a2e-4f6e-9fd9-88a8065af5e2"; // 佐藤 健一
  const brandId = "d23546a5-6bbb-40e6-80f3-18e60fbaca34"; // RADIANCE
  const userId = "684d65d7-baef-4538-938b-f58bc670ace2"; // admin@radiance.jp
  const conversionIds = ["2058a8b1-a6e8-4584-8784-9da6bc2a92d2"];
  const knowledgeItemIds = ["d09615a5-201d-4933-bf83-ff0b00711bc4"];

  console.log("Creating generation job...");
  console.log("Job ID:", jobId);

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
      generation_job_conversions: {
        create: conversionIds.map((conversionId) => ({
          conversionId,
        })),
      },
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
      conversionIds,
      knowledgeItemIds,
      userId,
    },
  });

  console.log("Inngest event sent:", result);
  console.log("\n=== Job Started ===");
  console.log("Job ID:", jobId);
  console.log("Keyword:", keyword);
  console.log("Check progress at: http://localhost:8288");
  console.log("\nTo monitor job status:");
  console.log(`SELECT status, progress, "currentStage", "statusMessage" FROM generation_jobs WHERE id = '${jobId}';`);
}

triggerGeneration()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
