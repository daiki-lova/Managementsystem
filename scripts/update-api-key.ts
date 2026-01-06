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
        openRouterApiKey: "your-openrouter-api-key"
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
