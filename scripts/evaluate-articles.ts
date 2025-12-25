import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";
import { checkContentQuality } from "../src/inngest/functions/pipeline/common/text-utils";

async function evaluateArticles() {
  const articles = await prisma.articles.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      blocks: true,
      createdAt: true,
    }
  });

  console.log("=== 最新10記事の厳しめ採点 ===\n");

  const results: { title: string; score: number; issues: string[] }[] = [];

  for (const article of articles) {
    const blocks = article.blocks as any[];
    const htmlBlock = blocks?.find(b => b.type === "html");

    if (htmlBlock?.content) {
      const result = checkContentQuality(htmlBlock.content);
      results.push({
        title: article.title,
        score: result.score,
        issues: result.issues,
      });
    }
  }

  // スコア順にソート
  results.sort((a, b) => b.score - a.score);

  // 結果表示
  console.log("┌────┬───────────────────────────────────────────────────────┬───────┐");
  console.log("│ # │ タイトル                                             │ 点数  │");
  console.log("├────┼───────────────────────────────────────────────────────┼───────┤");

  results.forEach((r, i) => {
    const shortTitle = r.title.length > 45 ? r.title.substring(0, 42) + "..." : r.title.padEnd(45);
    const scoreStr = r.score.toString().padStart(3);
    const rank = (i + 1).toString().padStart(2);
    console.log(`│ ${rank} │ ${shortTitle} │ ${scoreStr}点 │`);
  });

  console.log("└────┴───────────────────────────────────────────────────────┴───────┘");

  // 平均スコア
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  console.log(`\n📊 平均スコア: ${avgScore.toFixed(1)}点\n`);

  // 詳細な問題点
  console.log("=== 各記事の問題点 ===\n");

  for (const r of results) {
    const emoji = r.score >= 95 ? "🏆" : r.score >= 90 ? "✅" : r.score >= 80 ? "⚠️" : "❌";
    console.log(`${emoji} ${r.title.substring(0, 50)}`);
    console.log(`   スコア: ${r.score}点`);
    if (r.issues.length > 0) {
      r.issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log("   - 問題なし");
    }
    console.log("");
  }

  await prisma.$disconnect();
}

evaluateArticles().catch(console.error);
