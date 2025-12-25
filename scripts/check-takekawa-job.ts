import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

async function checkJob() {
  const jobId = "7907b7d1-11c4-4d03-83b7-c3aac9c18815";

  const job = await prisma.generation_jobs.findUnique({
    where: { id: jobId },
    include: { articles: { select: { id: true, title: true, slug: true } } }
  });

  if (!job) {
    console.log("ジョブが見つかりません");
    await prisma.$disconnect();
    return;
  }

  console.log("ステータス:", job.status);
  console.log("進捗:", job.progress + "%");
  console.log("ステージ:", job.currentStage || "-");
  if (job.statusMessage) console.log("メッセージ:", job.statusMessage);
  if (job.errorMessage) console.log("エラー:", job.errorMessage);
  if (job.articles.length > 0) {
    console.log("\n記事:", job.articles[0].title);
    console.log("スラッグ:", job.articles[0].slug);
    console.log("ID:", job.articles[0].id);
  }

  await prisma.$disconnect();
}

checkJob();
