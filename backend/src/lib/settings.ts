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
  openRouterApiKey: string | null;
  aiModel: string | null;
  minSearchVolume: number;
  maxSearchVolume: number;
  volumeZones: unknown;
  createdAt: Date;
  updatedAt: Date;
}

// 復号済み設定の型
export interface DecryptedSettings extends Omit<SystemSettings,
  "gaApiKey" | "searchConsoleApiKey" | "searchVolumeApiKey" | "openRouterApiKey"
> {
  gaApiKey: string | null;
  searchConsoleApiKey: string | null;
  searchVolumeApiKey: string | null;
  openRouterApiKey: string | null;
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
    openRouterApiKey: settings.openRouterApiKey
      ? safeDecrypt(settings.openRouterApiKey)
      : null,
  };
}

/**
 * 特定のAPIキーのみを取得（復号済み）
 */
export async function getApiKey(
  keyName: "gaApiKey" | "searchConsoleApiKey" | "searchVolumeApiKey" | "openRouterApiKey"
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
      return secrets.decrypt(value);
    } catch (error) {
      console.error("Failed to decrypt value, returning as-is:", error);
      return value;
    }
  }
  // 暗号化されていない古いデータ
  return value;
}
