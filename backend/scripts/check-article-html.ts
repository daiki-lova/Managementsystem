import prisma from "../src/lib/prisma";

async function main() {
  // 最新の記事を取得
  const article = await prisma.articles.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      blocks: true,
      createdAt: true,
    },
  });

  if (!article) {
    console.log("記事が見つかりません");
    return;
  }

  console.log("=== 生成記事 ===");
  console.log("タイトル:", article.title);
  console.log("作成日:", article.createdAt);

  const blocks = article.blocks as any[];
  if (blocks && blocks.length > 0) {
    const htmlBlock = blocks.find((b: any) => b.type === "html");
    if (htmlBlock) {
      const html = htmlBlock.content as string;
      console.log("\nHTMLの長さ:", html.length, "文字");
      
      // インラインスタイルの確認
      const hasArticleStyle = html.includes('<article style=');
      const hasH2Style = html.includes('<h2 style=');
      const hasPStyle = html.includes('<p style=');
      
      console.log("\n=== スタイル確認 ===");
      console.log("  <article style=\"...\">:", hasArticleStyle ? "✓" : "✗");
      console.log("  <h2 style=\"...\">:", hasH2Style ? "✓" : "✗");
      console.log("  <p style=\"...\">:", hasPStyle ? "✓" : "✗");
      
      // 画像プレースホルダーの確認
      const placeholderCount = (html.match(/<!-- IMAGE_PLACEHOLDER:/g) || []).length;
      console.log("  IMAGE_PLACEHOLDER:", placeholderCount, "箇所");
      
      console.log("\n--- 最初の3000文字 ---");
      console.log(html.substring(0, 3000));
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
