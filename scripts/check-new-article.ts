import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

interface Block {
  id: string;
  type: string;
  content: string;
  metadata?: Record<string, unknown>;
}

async function main() {
  // 最新のV3で生成された記事を取得
  const article = await prisma.articles.findUnique({
    where: { id: "129aab63-117d-4c30-80ed-33e2b7049ff7" },
    include: {
      authors: { select: { name: true } },
      categories: { select: { name: true } },
      media_assets: true
    }
  });

  if (!article) {
    console.log("記事が見つかりません");
    await prisma.$disconnect();
    return;
  }

  console.log("==========================================");
  console.log("V3パイプラインで生成された記事");
  console.log("==========================================");
  console.log("タイトル:", article.title);
  console.log("スラッグ:", article.slug);
  console.log("メタタイトル:", article.metaTitle);
  console.log("メタディスクリプション:", article.metaDescription);
  console.log("カテゴリー:", article.categories?.name);
  console.log("監修者:", article.authors?.name);
  console.log("ステータス:", article.status);
  console.log("==========================================");

  // ブロック情報
  const blocks = article.blocks as Block[] | null;
  console.log("本文ブロック数:", blocks?.length || 0);

  // HTMLブロックを表示
  if (blocks) {
    const htmlBlock = blocks.find(b => b.type === "html");
    if (htmlBlock) {
      console.log("==========================================");
      console.log("記事HTML (最初の5000文字):");
      console.log("==========================================");
      console.log(htmlBlock.content.substring(0, 5000));
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
