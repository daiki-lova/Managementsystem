import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  generateArticle,
  generateArticlePipeline,
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
    generateImages,
    scheduledPublishCron,
    scheduledPublishEvent,
    autoDeleteCron,
    autoDeleteEvent,
  ],
});
