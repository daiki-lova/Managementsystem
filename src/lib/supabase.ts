import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || "http://localhost:54321/placeholder-project";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "anon-placeholder";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "service-role-placeholder";

export const isSupabaseConfigured =
  Boolean(process.env.SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_ANON_KEY) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

let hasLoggedMissingSupabase = false;
function ensureSupabaseConfigured() {
  if (isSupabaseConfigured) return true;
  if (!hasLoggedMissingSupabase) {
    console.warn(
      "[supabase] SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY are not set. Falling back to placeholder client; operations will be limited."
    );
    hasLoggedMissingSupabase = true;
  }
  return false;
}

// Supabase Admin クライアント（サーバーサイド用）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Supabase クライアント（公開キー用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ストレージバケット名
export const STORAGE_BUCKETS = {
  MEDIA: "media", // メディアライブラリ用
  AVATARS: "avatars", // ユーザー・監修者プロフィール画像用
} as const;

// 画像アップロードユーティリティ（リトライ機能付き）
export async function uploadImage(
  bucket: keyof typeof STORAGE_BUCKETS,
  filePath: string,
  file: File | Buffer,
  contentType: string,
  maxRetries: number = 3
): Promise<{ url: string; path: string }> {
  if (!ensureSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured; image upload is unavailable in this environment."
    );
  }

  const bucketName = STORAGE_BUCKETS[bucket];

  // BufferをUint8Arrayに変換（Node.js fetch互換性向上）
  const uploadData = Buffer.isBuffer(file) ? new Uint8Array(file) : file;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, uploadData, {
          contentType,
          upsert: false,
        });

      if (error) {
        lastError = new Error(`画像アップロードに失敗しました: ${error.message}`);
        console.error(`Upload attempt ${attempt} failed:`, error.message);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw lastError;
      }

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from(bucketName).getPublicUrl(data.path);

      return {
        url: publicUrl,
        path: data.path,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`Upload attempt ${attempt} error:`, lastError.message);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
    }
  }

  throw lastError || new Error("画像アップロードに失敗しました");
}

// 画像削除ユーティリティ
export async function deleteImage(
  bucket: keyof typeof STORAGE_BUCKETS,
  filePath: string
): Promise<void> {
  if (!ensureSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured; image deletion is unavailable in this environment."
    );
  }

  const bucketName = STORAGE_BUCKETS[bucket];

  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .remove([filePath]);

  if (error) {
    throw new Error(`画像削除に失敗しました: ${error.message}`);
  }
}

// セッションからユーザーを取得
export async function getSessionUser(accessToken: string) {
  if (!ensureSupabaseConfigured()) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return user;
}
