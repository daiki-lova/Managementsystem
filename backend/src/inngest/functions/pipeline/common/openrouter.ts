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

// 最新の推奨モデル（2024年12月時点）
const DEFAULT_MODEL = "anthropic/claude-sonnet-4";
const DEFAULT_MAX_TOKENS = 4000;
const DEFAULT_TEMPERATURE = 0.7;

/**
 * AIの応答からJSONを抽出してパースする
 * - Markdownコードブロック内のJSON
 * - 純粋なJSONオブジェクト
 * - テキストに囲まれたJSONオブジェクト
 * - 配列でラップされたオブジェクト（最初の要素を取り出す）
 * を処理できる
 */
function extractAndParseJSON<T>(content: string): T {
  let cleanContent = content.trim();

  // 1. Markdownコードブロックを除去
  // ```json ... ``` または ``` ... ```
  const codeBlockMatch = cleanContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleanContent = codeBlockMatch[1].trim();
  }

  // 2. まずそのままパースを試みる
  try {
    const parsed = JSON.parse(cleanContent);
    return normalizeParseResult<T>(parsed);
  } catch {
    // パースに失敗した場合、JSONオブジェクトを抽出
  }

  // 3. 最初の { から最後の } までを抽出（ネストを考慮）
  const jsonMatch = extractJSONObject(cleanContent);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch);
      return normalizeParseResult<T>(parsed);
    } catch {
      // まだ失敗
    }
  }

  // 4. 最初の [ から最後の ] までを抽出（配列の場合）
  const arrayMatch = extractJSONArray(cleanContent);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch);
      return normalizeParseResult<T>(parsed);
    } catch {
      // まだ失敗
    }
  }

  // 5. すべて失敗した場合はエラー
  throw new Error(`Could not extract valid JSON from response. Content starts with: ${cleanContent.substring(0, 100)}`);
}

/**
 * パースされたデータを正規化する
 * - 配列が返された場合、最初の要素を取り出す
 * - 文字列が返された場合（二重エンコード）、再度パースを試みる
 */
function normalizeParseResult<T>(parsed: unknown): T {
  // 1. 文字列が返された場合（二重エンコードされたJSON）
  if (typeof parsed === "string") {
    try {
      const reparsed = JSON.parse(parsed);
      console.warn("AI returned double-encoded JSON string, re-parsing");
      return normalizeParseResult<T>(reparsed);
    } catch {
      // 再パースに失敗した場合はそのまま返す
      console.error("Received string that is not valid JSON:", parsed.substring(0, 200));
    }
  }

  // 2. 配列が返された場合、最初の要素を取り出す
  if (Array.isArray(parsed) && parsed.length > 0) {
    const first = parsed[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      console.warn("AI returned array instead of object, using first element");
      return first as T;
    }
  }

  // 3. デバッグ: パース結果の型を表示
  console.log("Parsed result type:", typeof parsed);
  if (parsed && typeof parsed === "object") {
    const keys = Object.keys(parsed);
    console.log("Parsed result keys (first 10):", keys.slice(0, 10));
    // オブジェクトの最初のキーと値をログ
    if (keys.length > 0) {
      const firstKey = keys[0];
      const firstValue = (parsed as Record<string, unknown>)[firstKey];
      console.log(`First key-value: ${firstKey} => ${typeof firstValue === "string" ? firstValue.substring(0, 100) : typeof firstValue}`);
    }
  }

  return parsed as T;
}

/**
 * 文字列から最初のJSONオブジェクトを抽出（ブレースのネストを考慮）
 */
function extractJSONObject(content: string): string | null {
  const startIdx = content.indexOf("{");
  if (startIdx === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < content.length; i++) {
    const char = content[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth++;
    if (char === "}") {
      depth--;
      if (depth === 0) {
        return content.substring(startIdx, i + 1);
      }
    }
  }

  return null;
}

/**
 * 文字列から最初のJSON配列を抽出（ブラケットのネストを考慮）
 */
function extractJSONArray(content: string): string | null {
  const startIdx = content.indexOf("[");
  if (startIdx === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < content.length; i++) {
    const char = content[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "[") depth++;
    if (char === "]") {
      depth--;
      if (depth === 0) {
        return content.substring(startIdx, i + 1);
      }
    }
  }

  return null;
}

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
    // 60秒のタイムアウトを設定
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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
      const parsed = extractAndParseJSON<T>(content);
      return {
        success: true,
        data: parsed,
        tokensUsed,
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content (first 1000 chars):", content.substring(0, 1000));
      console.error("Raw content (last 500 chars):", content.substring(content.length - 500));
      return {
        success: false,
        error: `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
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
 * OpenRouter APIを呼び出してテキスト形式（HTML等）のレスポンスを取得
 * JSONパースを行わず、生のテキストをそのまま返す
 */
export async function callOpenRouterText(
  systemPrompt: string,
  userPrompt: string,
  config: OpenRouterConfig
): Promise<OpenRouterResponse<string>> {
  const {
    apiKey,
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = config;

  try {
    // 120秒のタイムアウトを設定（記事生成は長文なので長めに）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

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
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

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

    return {
      success: true,
      data: content,
      tokensUsed,
    };
  } catch (error) {
    console.error("OpenRouter call error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * ステージごとの推奨モデル設定（3ステップパイプライン用）
 */
export const STAGE_MODEL_CONFIG = {
  // Stage 1: タイトル生成（精度重視）
  title_generation: {
    model: "anthropic/claude-sonnet-4",
    maxTokens: 1000,
    temperature: 0.5,
  },
  // Stage 2: 記事生成（創造性重視、長文出力）
  article_generation: {
    model: "anthropic/claude-sonnet-4",
    maxTokens: 16000, // 完全なHTML記事を生成するのに十分なトークン数
    temperature: 0.7,
  },
  // Stage 3: 画像生成（画像生成用モデル）
  image_generation: {
    model: "google/gemini-2.5-flash-preview-05-20",
    maxTokens: 1000,
    temperature: 0.7,
  },
} as const;
