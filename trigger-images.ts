import { inngest } from "./src/inngest/client";

async function triggerImageGeneration() {
  const articleId = "232669eb-be50-4bee-ab36-d8a27aa8ab0a";

  console.log("Triggering image generation for article:", articleId);

  const result = await inngest.send({
    name: "article/generate-images",
    data: {
      articleId,
      jobId: "manual-test",
    },
  });

  console.log("Event sent:", result);
}

triggerImageGeneration()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
