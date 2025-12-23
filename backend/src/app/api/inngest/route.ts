import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  generateArticle,
  generateArticlePipeline,
  generateArticlePipelineV5,
  generateImages,
  scheduledPublishCron,
  scheduledPublishEvent,
  autoDeleteCron,
  autoDeleteEvent,
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateArticle,
    generateArticlePipeline,
    generateArticlePipelineV5,
    generateImages,
    scheduledPublishCron,
    scheduledPublishEvent,
    autoDeleteCron,
    autoDeleteEvent,
  ],
});
