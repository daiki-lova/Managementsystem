import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

async function main() {
  const stages = await prisma.generation_stages.findMany({
    where: { jobId: "bb323118-c1a1-4eaf-a704-2a6f38a56f2f" },
    orderBy: { stage: "asc" }
  });

  console.log("=== 生成ステージ ===");
  for (const stage of stages) {
    console.log(`\nStage ${stage.stage}: ${stage.stageName}`);
    console.log("Status:", stage.status);
    console.log("Output:", JSON.stringify(stage.output, null, 2));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
