import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { isAppError } from "@/lib/errors";
import { uploadImage } from "@/lib/supabase";
import { MediaSource } from "@prisma/client";
import { randomUUID } from "crypto";
import { getDecryptedSettings } from "@/lib/settings";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";

// AI画像生成
export async function POST(request: NextRequest) {
  try {
    // レート制限チェック（生成: 10リクエスト/分）
    const rateLimitResult = checkRateLimit(
      request,
      { windowMs: 60000, maxRequests: 10 },
      "ai-generate"
    );
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 1000
      );
      return errorResponse(
        "RATE_LIMITED",
        `生成制限に達しました。${retryAfter}秒後に再試行してください`,
        429
      );
    }

    return await withAuth(request, async (user) => {
      const body = await request.json();
      const { prompt } = body;

      if (!prompt || typeof prompt !== "string") {
        return ApiErrors.badRequest("プロンプトが指定されていません");
      }

      if (prompt.length > 1000) {
        return ApiErrors.badRequest("プロンプトは1000文字以内で指定してください");
      }

      // システム設定を取得
      const settings = await getDecryptedSettings();

      if (!settings?.openRouterApiKey) {
        return ApiErrors.badRequest("OpenRouter APIキーが設定されていません");
      }

      // システムプロンプトとユーザープロンプトを結合
      const systemPrompt = settings.imagePrompt || "";
      const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\nUser request: ${prompt}`
        : prompt;

      // 画像生成
      const imageUrl = await generateImage({
        prompt: fullPrompt,
        apiKey: settings.openRouterApiKey,
        model: settings.imageModel || "google/gemini-3-pro-image-preview",
      });

      if (!imageUrl) {
        return errorResponse("GENERATION_FAILED", "画像生成に失敗しました", 500);
      }

      // DB に保存
      const media = await prisma.media_assets.create({
        data: {
          id: randomUUID(),
          url: imageUrl,
          fileName: `ai-generated-${Date.now()}.png`,
          altText: prompt.substring(0, 100),
          source: MediaSource.AI_GENERATED,
          showInLibrary: true,
        },
        select: {
          id: true,
          url: true,
          fileName: true,
          altText: true,
          source: true,
          createdAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "MEDIA_AI_GENERATE",
        user.id,
        "media",
        media.id,
        { prompt: prompt.substring(0, 200) }
      );

      return successResponse(media, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Generate image error:", error);
    return ApiErrors.internalError();
  }
}

// 画像生成関数
interface GenerateImageParams {
  prompt: string;
  apiKey: string;
  model: string;
}

async function generateImage(params: GenerateImageParams): Promise<string | null> {
  const { prompt, apiKey, model } = params;

  try {
    // OpenRouter経由で画像生成
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      },
      body: JSON.stringify({
        model: model || "google/gemini-3-pro-image-preview",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: `Generate an image: ${prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation API failed:", errorText);
      return null;
    }

    const data = await response.json();
    console.log("Image API response:", JSON.stringify(data, null, 2));

    // OpenRouterのレスポンス形式に対応
    const imageData = data.choices?.[0]?.message?.images?.[0];

    if (!imageData) {
      console.error("No image data in response:", JSON.stringify(data));
      return null;
    }

    let imageBuffer: Buffer;

    // 複数の形式に対応
    if (typeof imageData === "object" && imageData.b64_json) {
      imageBuffer = Buffer.from(imageData.b64_json, "base64");
    } else if (typeof imageData === "object" && imageData.image_url?.url) {
      const dataUrl = imageData.image_url.url;
      const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        imageBuffer = Buffer.from(base64Match[1], "base64");
      } else if (dataUrl.startsWith("http")) {
        const imageResponse = await fetch(dataUrl);
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      } else {
        console.error("Unknown image_url format:", dataUrl.substring(0, 100));
        return null;
      }
    } else if (typeof imageData === "object" && imageData.url) {
      const imageResponse = await fetch(imageData.url);
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    } else if (typeof imageData === "string") {
      const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        imageBuffer = Buffer.from(base64Match[1], "base64");
      } else {
        imageBuffer = Buffer.from(imageData, "base64");
      }
    } else {
      console.error("Unknown image data format:", typeof imageData);
      return null;
    }

    // Supabase Storageにアップロード
    const filePath = `generated/${Date.now()}-${randomUUID()}.png`;
    const { url } = await uploadImage(
      "MEDIA",
      filePath,
      imageBuffer,
      "image/png"
    );

    return url;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}
