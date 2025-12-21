import prisma from "../src/lib/prisma";

async function main() {
  const job = await prisma.generation_jobs.findFirst({
    where: { keyword: "ヨガインストラクター 資格 費用" },
    orderBy: { createdAt: "desc" },
    include: {
      generation_stages: { orderBy: { stage: "asc" } },
    },
  });

  console.log("=== ジョブ最終状態 ===");
  console.log("ステータス:", job?.status);
  console.log("進捗:", job?.progress + "%");
  console.log("メッセージ:", job?.statusMessage);
  if (job?.errorMessage) {
    console.log("エラー:", job.errorMessage);
  }

  console.log("\n=== ステージ詳細 ===");
  for (const s of job?.generation_stages || []) {
    console.log(`Stage ${s.stage} (${s.stageName}): ${s.status}`);
    if (s.errorMessage) {
      console.log("  エラー:", s.errorMessage);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
