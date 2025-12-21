import prisma from "../src/lib/prisma";
import { cleanGeneratedHtml } from "../src/inngest/functions/pipeline/common/prompts";

async function main() {
  // 最新の記事を取得
  const article = await prisma.articles.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!article) {
    console.log("記事が見つかりません");
    return;
  }

  console.log("記事を修正:", article.title);

  const blocks = article.blocks as any[];
  if (blocks && blocks.length > 0) {
    const htmlBlock = blocks.find((b: any) => b.type === "html");
    if (htmlBlock) {
      const originalHtml = htmlBlock.content as string;
      console.log("元のHTMLの長さ:", originalHtml.length);
      
      // cleanGeneratedHtmlを再適用してスタイルを注入
      const styledHtml = cleanGeneratedHtml(originalHtml);
      console.log("スタイル適用後のHTMLの長さ:", styledHtml.length);
      
      // インラインスタイルの確認
      const hasArticleStyle = styledHtml.includes('<article style=');
      const hasH2Style = styledHtml.includes('<h2 style=');
      const hasPStyle = styledHtml.includes('<p style=');
      
      console.log("\n=== スタイル確認 ===");
      console.log("  <article style=\"...\">:", hasArticleStyle ? "✓" : "✗");
      console.log("  <h2 style=\"...\">:", hasH2Style ? "✓" : "✗");
      console.log("  <p style=\"...\">:", hasPStyle ? "✓" : "✗");
      
      console.log("\n--- 最初の2000文字 ---");
      console.log(styledHtml.substring(0, 2000));
      
      // 記事を更新
      htmlBlock.content = styledHtml;
      await prisma.articles.update({
        where: { id: article.id },
        data: { blocks },
      });
      console.log("\n✓ 記事を更新しました");
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
