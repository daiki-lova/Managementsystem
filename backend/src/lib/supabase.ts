import { createClient } from "@supabase/supabase-js";

// Supabase Admin クライアント（サーバーサイド用）
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Supabase クライアント（公開キー用）
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// ストレージバケット名
export const STORAGE_BUCKETS = {
  MEDIA: "media", // メディアライブラリ用
  AVATARS: "avatars", // ユーザー・監修者プロフィール画像用
} as const;

// 画像アップロードユーティリティ
export async function uploadImage(
  bucket: keyof typeof STORAGE_BUCKETS,
  filePath: string,
  file: File | Buffer,
  contentType: string
): Promise<{ url: string; path: string }> {
  const bucketName = STORAGE_BUCKETS[bucket];

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`画像アップロードに失敗しました: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(bucketName).getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

// 画像削除ユーティリティ
export async function deleteImage(
  bucket: keyof typeof STORAGE_BUCKETS,
  filePath: string
): Promise<void> {
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
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return user;
}
