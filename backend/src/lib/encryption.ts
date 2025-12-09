import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// 暗号化アルゴリズム
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

// 暗号化キーを環境変数から取得
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  // キーが32バイトでない場合、scryptでキー派生
  if (Buffer.byteLength(key, "utf8") !== KEY_LENGTH) {
    const salt = process.env.ENCRYPTION_SALT || "default-salt-change-me";
    return scryptSync(key, salt, KEY_LENGTH);
  }
  return Buffer.from(key, "utf8");
}

/**
 * 文字列を暗号化する
 * 出力形式: base64(salt + iv + authTag + encryptedData)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // IV + AuthTag + 暗号化データを結合してBase64エンコード
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ]);

  return combined.toString("base64");
}

/**
 * 暗号化された文字列を復号する
 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, "base64");

  // IV, AuthTag, 暗号化データを分離
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encryptedData = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * APIキーなどの秘密情報を安全に保存するためのユーティリティ
 */
export const secrets = {
  /**
   * 秘密情報を暗号化して保存用の文字列に変換
   */
  encrypt: (value: string): string => {
    if (!value) return "";
    return encrypt(value);
  },

  /**
   * 暗号化された秘密情報を復号
   */
  decrypt: (encryptedValue: string): string => {
    if (!encryptedValue) return "";
    try {
      return decrypt(encryptedValue);
    } catch (error) {
      console.error("Failed to decrypt secret:", error);
      throw new Error("秘密情報の復号に失敗しました");
    }
  },

  /**
   * 秘密情報をマスキング（表示用）
   * 例: "sk-1234567890abcdef" -> "sk-****cdef"
   */
  mask: (value: string, visibleChars: number = 4): string => {
    if (!value) return "";
    if (value.length <= visibleChars * 2) {
      return "*".repeat(value.length);
    }
    const prefix = value.slice(0, visibleChars);
    const suffix = value.slice(-visibleChars);
    const masked = "*".repeat(Math.min(value.length - visibleChars * 2, 8));
    return `${prefix}${masked}${suffix}`;
  },

  /**
   * 秘密情報が暗号化済みかどうかをチェック
   * 暗号化済みの場合はBase64エンコードされた特定のフォーマット
   */
  isEncrypted: (value: string): boolean => {
    if (!value) return false;
    try {
      const decoded = Buffer.from(value, "base64");
      // 最小長: IV(16) + AuthTag(16) + 最小暗号化データ(1)
      return decoded.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
    } catch {
      return false;
    }
  },
};
