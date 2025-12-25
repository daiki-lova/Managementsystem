import prisma from "../src/lib/prisma";

async function main() {
  // 最近のジョブを取得
  const jobs = await prisma.generation_jobs.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      articles: true,
    },
  });

  console.log("=== 最近のジョブ ===");
  for (const job of jobs) {
    console.log(`\nジョブID: ${job.id}`);
    console.log(`  キーワード: ${job.keyword}`);
    console.log(`  ステータス: ${job.status}`);
    console.log(`  進捗: ${job.progress}%`);
    console.log(`  メッセージ: ${job.statusMessage}`);
    console.log(`  作成日時: ${job.createdAt}`);
    if (job.articles.length > 0) {
      console.log(`  記事: ${job.articles[0].title}`);
    } else {
      console.log(`  記事: なし`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
