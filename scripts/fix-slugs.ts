import prisma from "../src/lib/prisma";

async function main() {
  const article = await prisma.articles.findUnique({
    where: { id: "1d8cde7a-c70f-4469-adfe-28410f8e5231" },
    select: { title: true, blocks: true }
  });

  if (!article) {
    console.log("Article not found");
    return;
  }

  console.log("Title:", article.title);
  const blocks = article.blocks as any[];
  console.log("First block:", JSON.stringify(blocks[0], null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
