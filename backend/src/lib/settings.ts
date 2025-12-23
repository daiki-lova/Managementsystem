import prisma from "./prisma";
import { secrets } from "./encryption";

// 設定の型定義
export interface SystemSettings {
  id: string;
  gaApiKey: string | null;
  gaPropertyId: string | null;
  searchConsoleApiKey: string | null;
  searchConsoleSiteUrl: string | null;
  searchVolumeApiKey: string | null;
  dataforSeoApiKey: string | null;
  openRouterApiKey: string | null;
  openaiApiKey: string | null;
  geminiApiKey: string | null;  // Google AI Studio API Key (Nano Banana用)
  aiModel: string | null;
  imageModel: string | null;
  articleModel: string | null;
  analysisModel: string | null;
  // プロンプト
  titlePrompt: string | null;          // タイトル生成
  keywordPrompt: string | null;        // キーワード分析（未使用）
  keywordSuggestPrompt: string | null; // キーワード提案
  imagePrompt: string | null;          // 画像生成
  systemPrompt: string | null;         // 記事生成
  // V4パイプライン専用
  whiteDataPrompt: string | null;      // ホワイトデータ検索
  llmoPrompt: string | null;           // LLMo最適化
  minSearchVolume: number;
  maxSearchVolume: number;
  volumeZones: unknown;
  createdAt: Date;
  updatedAt: Date;
}

// 復号済み設定の型
export interface DecryptedSettings extends Omit<SystemSettings,
  "gaApiKey" | "searchConsoleApiKey" | "searchVolumeApiKey" | "dataforSeoApiKey" | "openRouterApiKey" | "openaiApiKey" | "geminiApiKey"
> {
  gaApiKey: string | null;
  searchConsoleApiKey: string | null;
  searchVolumeApiKey: string | null;
  dataforSeoApiKey: string | null;
  openRouterApiKey: string | null;
  openaiApiKey: string | null;
  geminiApiKey: string | null;
}

/**
 * システム設定を取得し、暗号化されたAPIキーを復号する
 */
export async function getDecryptedSettings(): Promise<DecryptedSettings | null> {
  const settings = await prisma.system_settings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    return null;
  }

  // APIキーを復号
  return {
    ...settings,
    gaApiKey: settings.gaApiKey ? safeDecrypt(settings.gaApiKey) : null,
    searchConsoleApiKey: settings.searchConsoleApiKey
      ? safeDecrypt(settings.searchConsoleApiKey)
      : null,
    searchVolumeApiKey: settings.searchVolumeApiKey
      ? safeDecrypt(settings.searchVolumeApiKey)
      : null,
    dataforSeoApiKey: settings.dataforSeoApiKey
      ? safeDecrypt(settings.dataforSeoApiKey)
      : null,
    openRouterApiKey: settings.openRouterApiKey
      ? safeDecrypt(settings.openRouterApiKey)
      : null,
    openaiApiKey: settings.openaiApiKey
      ? safeDecrypt(settings.openaiApiKey)
      : null,
    geminiApiKey: (settings as { geminiApiKey?: string }).geminiApiKey
      ? safeDecrypt((settings as { geminiApiKey: string }).geminiApiKey)
      : null,
  };
}

/**
 * 特定のAPIキーのみを取得（復号済み）
 */
export async function getApiKey(
  keyName: "gaApiKey" | "searchConsoleApiKey" | "searchVolumeApiKey" | "dataforSeoApiKey" | "openRouterApiKey" | "openaiApiKey" | "geminiApiKey"
): Promise<string | null> {
  const settings = await prisma.system_settings.findUnique({
    where: { id: "default" },
    select: { [keyName]: true },
  });

  if (!settings) {
    return null;
  }

  const encryptedKey = settings[keyName] as string | null;
  if (!encryptedKey) {
    return null;
  }

  return safeDecrypt(encryptedKey);
}

/**
 * 安全に復号を試みる
 * 暗号化されていない古いデータの場合はそのまま返す（後方互換性）
 */
function safeDecrypt(value: string): string {
  // APIキーのパターン（sk-で始まる）は平文として扱う
  if (value.startsWith('sk-') || value.startsWith('AIza')) {
    return value;
  }

  // 暗号化されているかチェック
  if (secrets.isEncrypted(value)) {
    try {
      const decrypted = secrets.decrypt(value);
      return decrypted;
    } catch (error) {
      console.error("safeDecrypt: Failed to decrypt value:", error);
      // 復号失敗時は空文字を返す（無効なキーを使わないように）
      return "";
    }
  }
  // 暗号化されていない古いデータ
  return value;
}
