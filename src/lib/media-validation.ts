// 許可されるMIMEタイプ
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

// 許可される拡張子
export const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
] as const;

// 最大ファイルサイズ（10MB）
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 画像の最大サイズ（幅x高さ）
export const MAX_IMAGE_DIMENSIONS = {
  width: 4096,
  height: 4096,
};

// MIMEタイプとマジックバイトのマッピング
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/gif": [0x47, 0x49, 0x46, 0x38], // GIF87a or GIF89a
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header (WebP)
};

// ファイル拡張子からMIMEタイプを推測
export function getMimeTypeFromExtension(filename: string): string | null {
  const ext = filename.toLowerCase().split(".").pop();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return ext ? mimeMap[ext] || null : null;
}

// マジックバイトを検証してMIMEタイプを確認
export function validateMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  const expectedBytes = MAGIC_BYTES[declaredMimeType];

  // SVGはテキストベースなのでマジックバイト検証をスキップ
  if (declaredMimeType === "image/svg+xml") {
    const content = buffer.toString("utf-8", 0, 1000).toLowerCase();
    return content.includes("<svg") || content.includes("<?xml");
  }

  if (!expectedBytes) {
    return false;
  }

  for (let i = 0; i < expectedBytes.length; i++) {
    if (buffer[i] !== expectedBytes[i]) {
      // WebPの特殊ケース: RIFFヘッダーの後に"WEBP"がある
      if (declaredMimeType === "image/webp" && i === 4) {
        const webpSignature = buffer.toString("ascii", 8, 12);
        return webpSignature === "WEBP";
      }
      return false;
    }
  }

  return true;
}

// ファイルバリデーション結果
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  fileSize?: number;
}

// ファイルをバリデート
export function validateUploadedFile(
  buffer: Buffer,
  filename: string,
  declaredMimeType?: string
): FileValidationResult {
  // 1. ファイルサイズチェック
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `ファイルサイズが上限(${MAX_FILE_SIZE / 1024 / 1024}MB)を超えています`,
    };
  }

  if (buffer.length === 0) {
    return {
      valid: false,
      error: "ファイルが空です",
    };
  }

  // 2. 拡張子チェック
  const ext = "." + filename.toLowerCase().split(".").pop();
  if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    return {
      valid: false,
      error: `許可されていない拡張子です。許可: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  // 3. MIMEタイプ推測と検証
  const inferredMimeType = getMimeTypeFromExtension(filename);
  const mimeType = declaredMimeType || inferredMimeType;

  if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    return {
      valid: false,
      error: `許可されていないファイル形式です。許可: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  // 4. マジックバイト検証（ファイル内容とMIMEタイプの整合性）
  if (!validateMagicBytes(buffer, mimeType)) {
    return {
      valid: false,
      error: "ファイルの内容が宣言されたMIMEタイプと一致しません",
    };
  }

  // 5. SVGの場合、危険なコンテンツをチェック
  if (mimeType === "image/svg+xml") {
    const svgValidation = validateSvgContent(buffer.toString("utf-8"));
    if (!svgValidation.valid) {
      return svgValidation;
    }
  }

  return {
    valid: true,
    mimeType,
    fileSize: buffer.length,
  };
}

// SVGコンテンツの安全性チェック
function validateSvgContent(content: string): FileValidationResult {
  const lowerContent = content.toLowerCase();

  // 危険なタグやイベントハンドラをチェック
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onload など
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /data:/i, // data URIスキーム
    /<foreignobject/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(lowerContent)) {
      return {
        valid: false,
        error: "SVGファイルに危険なコンテンツが含まれています",
      };
    }
  }

  return { valid: true };
}

// ファイル名のサニタイズ
export function sanitizeFilename(filename: string): string {
  // パス区切り文字を削除
  let sanitized = filename.replace(/[\/\\]/g, "");

  // 危険な文字を削除
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, "");

  // 先頭のドットを削除（隠しファイル防止）
  sanitized = sanitized.replace(/^\.+/, "");

  // 空白を置換
  sanitized = sanitized.replace(/\s+/g, "-");

  // 長すぎる場合は切り詰め
  if (sanitized.length > 200) {
    const ext = sanitized.split(".").pop() || "";
    const name = sanitized.slice(0, 200 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }

  return sanitized || "unnamed";
}
