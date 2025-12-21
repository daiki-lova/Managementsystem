import prisma from "../src/lib/prisma";

async function main() {
  // 最新の記事を直接取得
  const article = await prisma.articles.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!article) {
    console.log("記事が見つかりません");
    return;
  }

  console.log("=== 生成記事 ===");
  console.log("タイトル:", article.title);
  console.log("スラッグ:", article.slug);
  console.log("ステータス:", article.status);
  console.log("作成日時:", article.createdAt);

  const blocks = article.blocks as { id: string; type: string; content: string }[];
  if (blocks?.length) {
    console.log("\n=== ブロック構成 ===");
    for (const b of blocks) {
      console.log("- type:", b.type, ", id:", b.id);
    }

    console.log("\n=== HTMLブロック内容 ===");
    const htmlBlock = blocks.find((b) => b.type === "html");
    if (htmlBlock) {
      // HTMLの最初と最後を表示
      const content = htmlBlock.content;
      console.log("HTMLの長さ:", content.length, "文字");
      console.log("\n--- 最初の2000文字 ---");
      console.log(content.substring(0, 2000));
      console.log("\n--- ... 中略 ... ---");
      console.log("\n--- 最後の500文字 ---");
      console.log(content.substring(content.length - 500));
    }
  }
  await prisma.$disconnect();
}

main().catch(console.error);
