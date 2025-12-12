// OpenRouter API呼び出しユーティリティ

export interface OpenRouterConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface OpenRouterResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed?: number;
}

const DEFAULT_MODEL = "openai/gpt-4o";
const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_TEMPERATURE = 0.7;

/**
 * OpenRouter APIを呼び出してJSON形式のレスポンスを取得
 */
export async function callOpenRouter<T>(
  systemPrompt: string,
  userPrompt: string,
  config: OpenRouterConfig
): Promise<OpenRouterResponse<T>> {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = config;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3001",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
        // response_format is only supported by OpenAI models
        // For other models, we rely on the system prompt to enforce JSON output
        ...(model.startsWith("openai/") ? { response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", errorText);
      return {
        success: false,
        error: `OpenRouter API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens;

    if (!content) {
      return {
        success: false,
        error: "No content in response",
      };
    }

    try {
      // Markdownコードブロックを除去（```json ... ``` や ``` ... ```）
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      const parsed = JSON.parse(cleanContent) as T;
      return {
        success: true,
        data: parsed,
        tokensUsed,
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content:", content.substring(0, 500));
      return {
        success: false,
        error: "Failed to parse JSON response",
      };
    }
  } catch (error) {
    console.error("OpenRouter call error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * ステージごとの推奨モデル設定
 */
export const STAGE_MODEL_CONFIG = {
  // Stage 1: キーワード分析（分析能力重視）
  keyword_analysis: {
    model: "openai/gpt-4o",
    maxTokens: 2000,
    temperature: 0.5,
  },
  // Stage 2: 構成設計（構造化能力重視）
  structure: {
    model: "openai/gpt-4o",
    maxTokens: 3000,
    temperature: 0.5,
  },
  // Stage 3: 記事執筆（創造性重視）
  draft: {
    model: "openai/gpt-4o",
    maxTokens: 6000,
    temperature: 0.7,
  },
  // Stage 4: SEO最適化（精度重視）
  seo: {
    model: "openai/gpt-4o",
    maxTokens: 5000,
    temperature: 0.3,
  },
  // Stage 5: 監修・校正（厳密性重視）
  proofreading: {
    model: "openai/gpt-4o",
    maxTokens: 3000,
    temperature: 0.2,
  },
} as const;
