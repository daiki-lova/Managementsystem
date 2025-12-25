import prisma from "../src/lib/prisma";

async function main() {
  const jobId = "a3730336-a8c6-4acd-bb48-284ba1b79a2a";

  const job = await prisma.generation_jobs.findUnique({
    where: { id: jobId },
    include: {
      generation_stages: { orderBy: { stage: "asc" } },
    },
  });

  if (!job) {
    console.log("ジョブが見つかりません");
    return;
  }

  console.log("=== ジョブ詳細 ===");
  console.log("ステータス:", job.status);
  console.log("進捗:", job.progress + "%");
  console.log("メッセージ:", job.statusMessage);
  console.log("エラー:", job.errorMessage || "なし");
  console.log("stageOutputs:", JSON.stringify(job.stageOutputs, null, 2)?.substring(0, 500));

  console.log("\n=== ステージ詳細 ===");
  for (const stage of job.generation_stages) {
    console.log(`\nStage ${stage.stage} (${stage.stageName}):`);
    console.log("  ステータス:", stage.status);
    console.log("  エラー:", stage.errorMessage || "なし");
    console.log("  出力:", JSON.stringify(stage.output)?.substring(0, 200));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
