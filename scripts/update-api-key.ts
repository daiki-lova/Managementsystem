import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  try {
    // まず現在の値を確認
    const current = await prisma.system_settings.findUnique({
      where: { id: "default" },
      select: { openRouterApiKey: true }
    });
    console.log("Current value:", current?.openRouterApiKey);

    // APIキーを更新
    const updated = await prisma.system_settings.update({
      where: { id: "default" },
      data: {
        openRouterApiKey: "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"
      },
    });
    console.log("Updated openRouterApiKey:", updated.openRouterApiKey);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
